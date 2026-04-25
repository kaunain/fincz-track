package com.fincz.market.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fincz.market.entity.StockPrice;
import com.fincz.market.entity.StockPriceHistory;
import com.fincz.market.repository.StockPriceHistoryRepository;
import com.fincz.market.repository.StockPriceRepository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.scheduling.annotation.Scheduled;
import com.fincz.market.dto.StockPriceResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.retry.Retry;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class MarketDataService {

    private final WebClient stockClient;
    private final WebClient mfClient;
    private final WebClient portfolioClient;
    private final String apiKey;
    private final StockPriceRepository stockPriceRepository;
    private final StockPriceHistoryRepository stockPriceHistoryRepository;

    public MarketDataService(WebClient.Builder webClientBuilder,
                             @Value("${market.api.stock-base-url:https://www.alphavantage.co}") String stockBaseUrl,
                             @Value("${market.api.mf-base-url:https://api.mfapi.in}") String mfBaseUrl,
                             @Value("${market.api.key:${MARKET_API_KEY:}}") String apiKey,
                             @Value("${app.services.portfolio-url:http://localhost:8083}") String portfolioUrl,
                             StockPriceRepository stockPriceRepository,
                             StockPriceHistoryRepository stockPriceHistoryRepository) {
        this.stockClient = webClientBuilder.baseUrl(stockBaseUrl).build();
        this.mfClient = webClientBuilder.baseUrl(mfBaseUrl).build();
        this.portfolioClient = webClientBuilder.baseUrl(portfolioUrl).build();
        this.apiKey = apiKey;
        this.stockPriceRepository = stockPriceRepository;
        this.stockPriceHistoryRepository = stockPriceHistoryRepository;
    }

    /**
     * Scheduled task to refresh prices once per day.
     * Fetches symbols from the portfolio service, updates current prices in the DB,
     * and keeps local market service calls from re-querying the external API.
     */
    @Scheduled(cron = "${market.schedule.refresh-cron:0 0 1 * * *}")
    public void refreshMarketPrices() {
        log.info("Starting daily market price refresh...");

        fetchTrackedSymbols()
                .flatMapMany(Flux::fromIterable)
                .concatMap(symbol -> processSymbolUpdate(symbol).delayElement(Duration.ofSeconds(12))) // Rate limit: 5 calls/min (12s gap)
                .subscribe(
                        v -> log.debug("Updated symbol successfully"),
                        error -> log.error("Error in refresh cycle: {}", error.getMessage()),
                        () -> log.info("Market price refresh cycle completed.")
                );
    }

    private Mono<List<String>> fetchTrackedSymbols() {
        return portfolioClient.get()
                .uri("/portfolio/internal/symbols")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<String>>() {});
    }

    private Mono<Void> processSymbolUpdate(String symbol) {
        return (isMutualFundSymbol(symbol) ? fetchMutualFundFullData(symbol) : fetchFullStockData(symbol))
                .flatMap(response -> Mono.fromRunnable(() -> {
                            saveToLocalDb(response);
                            saveToHistory(response);
                        })
                        .subscribeOn(Schedulers.boundedElastic())
                        .then(updatePortfolioService(symbol, response.getPrice())))
                .onErrorResume(e -> {
                    log.error("Failed to update {}: {}", symbol, e.getMessage());
                    return Mono.empty();
                });
    }

    private void saveToLocalDb(StockPriceResponse response) {
        StockPrice entity = stockPriceRepository.findBySymbol(response.getSymbol())
                .orElse(new StockPrice());
        
        entity.setSymbol(response.getSymbol());
        entity.setPrice(response.getPrice());
        entity.setOpen(response.getOpen());
        entity.setHigh(response.getHigh());
        entity.setLow(response.getLow());
        entity.setLastUpdated(LocalDateTime.now());
        
        stockPriceRepository.save(entity);
    }

    private void saveToHistory(StockPriceResponse response) {
        LocalDate today = LocalDate.now();
        // एक ही दिन में एक प्रतीक के लिए दो प्रविष्टियों से बचें
        if (stockPriceHistoryRepository.findBySymbolAndPriceDate(response.getSymbol(), today).isEmpty()) {
            StockPriceHistory history = StockPriceHistory.builder()
                    .symbol(response.getSymbol())
                    .price(response.getPrice())
                    .open(response.getOpen())
                    .high(response.getHigh())
                    .low(response.getLow())
                    .priceDate(today)
                    .build();
            stockPriceHistoryRepository.save(history);
            log.debug("Saved EOD historical price for symbol: {} for date: {}", response.getSymbol(), today);
        }
    }

    private Mono<StockPriceResponse> fetchFullStockData(String symbol) {
        return stockClient.get()
                .uri(uri -> uri.path("/query")
                        .queryParam("function", "GLOBAL_QUOTE")
                        .queryParam("symbol", symbol)
                        .queryParam("apikey", apiKey)
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(node -> {
                    JsonNode q = node.path("Global Quote");
                    return new StockPriceResponse(
                            symbol,
                            symbol,
                            new BigDecimal(q.path("05. price").asText("0")),
                            new BigDecimal(q.path("02. open").asText("0")),
                            new BigDecimal(q.path("03. high").asText("0")),
                            new BigDecimal(q.path("04. low").asText("0")),
                            LocalDateTime.now()
                    );
                });
    }

    private Mono<StockPriceResponse> fetchMutualFundFullData(String symbol) {
        String schemeCode = extractMutualFundCode(symbol);
        return mfClient.get()
                .uri(uri -> uri.path("/mf/{schemeCode}").build(schemeCode))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(node -> {
                    JsonNode data = node.path("data");
                    if (!data.isArray() || data.isEmpty()) {
                        throw new IllegalStateException("Unable to parse mutual fund NAV for " + symbol);
                    }
                    String nav = data.get(0).path("nav").asText(null);
                    if (nav == null || nav.isBlank()) {
                        throw new IllegalStateException("Missing NAV value for " + symbol);
                    }
                    BigDecimal price = new BigDecimal(nav.trim());
                    
                    return new StockPriceResponse(
                            symbol,
                            symbol,
                            price,
                            BigDecimal.ZERO,
                            BigDecimal.ZERO,
                            BigDecimal.ZERO,
                            LocalDateTime.now()
                    );
                });
    }

    private boolean isMutualFundSymbol(String symbol) {
        return symbol != null && symbol.toUpperCase().startsWith("MF-");
    }

    private String extractMutualFundCode(String symbol) {
        return symbol.replaceFirst("(?i)^MF[-:]", "");
    }

    private Mono<Void> updatePortfolioService(String symbol, BigDecimal price) {
        return portfolioClient.put()
                .uri("/portfolio/internal/prices/{symbol}?price={price}", symbol, price)
                .retrieve()
                .toBodilessEntity()
                .then();
    }

    public Mono<StockPriceResponse> getStockPrice(String symbol) {
        log.info("Fetching cached price for symbol: {}", symbol);

        return Mono.fromCallable(() -> stockPriceRepository.findBySymbol(symbol))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(localData -> {
                    if (localData.isPresent()) {
                        StockPrice sp = localData.get();
                        return Mono.just(new StockPriceResponse(sp.getSymbol(), sp.getSymbol(), sp.getPrice(), sp.getOpen(), sp.getHigh(), sp.getLow(), sp.getLastUpdated()));
                    }

                    // अगर DB में नहीं है तो Portfolio Service और external API का सहारा लें
                    return portfolioClient.get()
                            .uri("/portfolio/internal/prices/{symbol}", symbol)
                            .retrieve()
                            .onStatus(status -> !status.is2xxSuccessful(), response -> Mono.empty())
                            .bodyToMono(BigDecimal.class)
                            .map(price -> new StockPriceResponse(symbol, symbol, price, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, LocalDateTime.now()))
                            .switchIfEmpty(Mono.defer(() -> fetchFullStockData(symbol)))
                            .onErrorResume(e -> {
                                log.error("Error fetching live price for {}: {}", symbol, e.getMessage());
                                return Mono.just(new StockPriceResponse(symbol, symbol, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, LocalDateTime.now()));
                            });
                });
    }

    /**
     * Returns historical price data for the last 30 days for a specific symbol.
     */
    public Flux<StockPriceHistory> getPriceHistory(String symbol) {
        log.info("Fetching 30-day price history for symbol: {}", symbol);
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        return Flux.fromIterable(
            stockPriceHistoryRepository.findBySymbolAndPriceDateAfterOrderByPriceDateDesc(symbol, thirtyDaysAgo));
    }
}