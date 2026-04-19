package com.fincz.market.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import com.fincz.market.dto.StockPriceResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class MarketDataService {

    private final WebClient stockClient;
    private final WebClient mfClient;
    private final WebClient portfolioClient;
    private final String apiKey;

    public MarketDataService(WebClient.Builder webClientBuilder,
                             @Value("${market.api.stock-base-url:https://www.alphavantage.co}") String stockBaseUrl,
                             @Value("${market.api.mf-base-url:https://api.mfapi.in}") String mfBaseUrl,
                             @Value("${market.api.key:${MARKET_API_KEY:}}") String apiKey,
                             @Value("${app.services.portfolio-url:http://localhost:8083}") String portfolioUrl) {
        this.stockClient = webClientBuilder.baseUrl(stockBaseUrl).build();
        this.mfClient = webClientBuilder.baseUrl(mfBaseUrl).build();
        this.portfolioClient = webClientBuilder.baseUrl(portfolioUrl).build();
        this.apiKey = apiKey;
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
                .flatMap(this::processSymbolUpdate)
                .subscribe(
                        null,
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
        return fetchLatestPrice(symbol)
                .flatMap(price -> updatePortfolioService(symbol, price))
                .onErrorResume(e -> {
                    log.error("Failed to update {}: {}", symbol, e.getMessage());
                    return Mono.empty();
                });
    }

    private Mono<BigDecimal> fetchLatestPrice(String symbol) {
        if (isMutualFundSymbol(symbol)) {
            return fetchMutualFundPrice(symbol);
        }
        return fetchStockPrice(symbol);
    }

    private Mono<BigDecimal> fetchStockPrice(String symbol) {
        return stockClient.get()
                .uri(uri -> uri.path("/query")
                        .queryParam("function", "GLOBAL_QUOTE")
                        .queryParam("symbol", symbol)
                        .queryParam("apikey", apiKey)
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(node -> {
                    JsonNode quote = node.path("Global Quote");
                    String priceText = quote.path("05. price").asText(null);
                    if (priceText == null || priceText.isBlank()) {
                        throw new IllegalStateException("Unable to parse stock price for " + symbol);
                    }
                    return new BigDecimal(priceText.trim());
                })
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(2)));
    }

    private Mono<BigDecimal> fetchMutualFundPrice(String symbol) {
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
                    return new BigDecimal(nav.trim());
                })
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(2)));
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

    public StockPriceResponse getStockPrice(String symbol) {
        log.info("Fetching cached price for symbol: {}", symbol);
        BigDecimal cachedPrice = portfolioClient.get()
                .uri("/portfolio/internal/prices/{symbol}", symbol)
                .exchangeToMono(response -> {
                    if (response.statusCode().equals(HttpStatus.OK)) {
                        return response.bodyToMono(BigDecimal.class);
                    }
                    return Mono.empty();
                })
                .block();

        BigDecimal price = cachedPrice != null ? cachedPrice : fetchLatestPrice(symbol)
                .onErrorResume(e -> {
                    log.error("Error fetching live price for {}: {}", symbol, e.getMessage());
                    return Mono.just(BigDecimal.ZERO);
                })
                .block();

        return new StockPriceResponse(
                symbol,
                symbol,
                price != null ? price : BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                LocalDateTime.now()
        );
    }
}