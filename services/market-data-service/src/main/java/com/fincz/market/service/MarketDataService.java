package com.fincz.market.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fincz.market.entity.StockPrice;
import com.fincz.market.entity.StockPriceHistory;
import com.fincz.market.entity.SyncStatus;
import com.fincz.market.repository.StockPriceHistoryRepository;
import com.fincz.market.repository.StockPriceRepository;
import com.fincz.market.repository.SyncStatusRepository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import com.fincz.market.dto.StockPriceResponse;
import com.fincz.market.dto.SyncSummary;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class MarketDataService {

    private final WebClient stockClient;
    private final WebClient mfClient;
    private final WebClient portfolioClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final StockPriceRepository stockPriceRepository;
    private final StockPriceHistoryRepository stockPriceHistoryRepository;
    private final SyncStatusRepository syncStatusRepository;
    private final int refreshIntervalHours;

    public MarketDataService(WebClient.Builder webClientBuilder,
                             @Value("${market.api.stock-base-url:https://www.alphavantage.co}") String stockBaseUrl,
                             @Value("${market.api.mf-base-url:https://api.mfapi.in}") String mfBaseUrl,
                             @Value("${market.api.key:${MARKET_API_KEY:}}") String apiKey,
                             @Value("${app.services.portfolio-url:http://localhost:8083}") String portfolioUrl,
                             @Value("${market.api.refresh-interval-hours:24}") int refreshIntervalHours,
                             ObjectMapper objectMapper,
                             StockPriceRepository stockPriceRepository,
                             StockPriceHistoryRepository stockPriceHistoryRepository,
                             SyncStatusRepository syncStatusRepository) {
        this.stockClient = webClientBuilder.baseUrl(stockBaseUrl).build();
        this.mfClient = webClientBuilder.baseUrl(mfBaseUrl).build();
        this.portfolioClient = webClientBuilder.baseUrl(portfolioUrl).build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.stockPriceRepository = stockPriceRepository;
        this.stockPriceHistoryRepository = stockPriceHistoryRepository;
        this.syncStatusRepository = syncStatusRepository;
        this.refreshIntervalHours = refreshIntervalHours;

        if (apiKey == null || apiKey.isBlank() || "your_market_api_key".equals(apiKey)) {
            log.error("CRITICAL: Alpha Vantage API Key is NOT configured correctly. Stock price updates will fail.");
            log.error("Ensure MARKET_API_KEY is set in your .env file and exported to the service environment.");
        } else {
            log.info("Market Data Service initialized with API Key (length: {})", apiKey.length());
        }
    }

    /**
     * Manually triggers price synchronization for all tracked symbols.
     * Includes a cooldown check to prevent multiple API calls within the configured interval.
     */
    public Mono<SyncSummary> syncPrices(boolean force, String token) {
        return fetchTrackedSymbols(token)
                .flatMap(symbols -> {
                    if (symbols.isEmpty()) {
                        return Mono.<ProcessingMetadata>error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "No symbols found in portfolio to sync."));
                    }

                    return Mono.fromCallable(() -> {
                        LocalDateTime now = LocalDateTime.now();
                        LocalDateTime threshold = now.minusHours(refreshIntervalHours);

                        List<StockPrice> currentPrices = symbols.stream()
                                .map(s -> stockPriceRepository.findBySymbol(s).orElse(null))
                                .filter(p -> p != null)
                                .collect(Collectors.toList());

                        List<String> symbolsToUpdate = force ? symbols : symbols.stream()
                                .filter(s -> {
                                    var p = currentPrices.stream().filter(cp -> cp.getSymbol().equals(s)).findFirst();
                                    return p.isEmpty() || p.get().getLastUpdated() == null || p.get().getLastUpdated().isBefore(threshold);
                                }).collect(Collectors.toList());

                        int total = symbols.size();
                        int skipped = total - symbolsToUpdate.size();

                        if (!force && symbolsToUpdate.isEmpty()) {
                            LocalDateTime earliestUpdate = currentPrices.stream()
                                    .map(StockPrice::getLastUpdated)
                                    .filter(t -> t != null)
                                    .min(LocalDateTime::compareTo)
                                    .orElse(now);

                            Duration remaining = Duration.between(now, earliestUpdate.plusHours(refreshIntervalHours));
                            String waitTime = String.format("%dh %dm", remaining.toHours(), remaining.toMinutesPart());

                            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, 
                                "Daily sync limit reached. You can sync again in " + waitTime + ".");
                        }
                        return new ProcessingMetadata(symbolsToUpdate, total, skipped);
                    }).subscribeOn(Schedulers.boundedElastic());
                })
                .map(meta -> {
                    // Fire-and-forget: Start the background process without blocking the HTTP response
                    Flux.fromIterable(meta.staleSymbols)
                            .doOnSubscribe(s -> log.info("Background sync started for {} symbols...", meta.staleSymbols.size()))
                            .concatMap(symbol -> Mono.delay(Duration.ofSeconds(13))
                                    .then(processSymbolUpdate(symbol, force, token))
                                    .onErrorResume(e -> {
                                        log.error("Skipping sync for symbol {}: {}. Ensure Indian stocks have .NS suffix.", symbol, e.getMessage());
                                        return Mono.empty();
                                    })
                                    .then(Mono.fromRunnable(() -> {
                                        syncStatusRepository.findById("GLOBAL_SYNC").ifPresent(s -> {
                                            s.setProcessedSymbols(s.getProcessedSymbols() + 1);
                                            syncStatusRepository.save(s);
                                        });
                                    }).subscribeOn(Schedulers.boundedElastic()))
                                    .thenReturn(symbol))
                            .doFinally(signal -> {
                                log.info("Background market data sync finished with signal: {}", signal);
                                // Release lock
                                syncStatusRepository.findById("GLOBAL_SYNC").ifPresent(s -> {
                                    s.setInProgress(false);
                                    syncStatusRepository.save(s);
                                });
                            })
                            .subscribe(); // Detach from the main response pipeline

                    // Return immediate summary to avoid frontend timeout
                    return new SyncSummary(meta.total, meta.staleSymbols.size(), meta.skipped, meta.staleSymbols);
                });
    }

    /**
     * Fetches the current global synchronization status.
     */
    public Mono<SyncStatus> getSyncStatus() {
        return Mono.fromCallable(() -> syncStatusRepository.findById("GLOBAL_SYNC")
                .orElse(SyncStatus.builder().id("GLOBAL_SYNC").inProgress(false).build()))
                .subscribeOn(Schedulers.boundedElastic());
    }

    private record ProcessingMetadata(List<String> staleSymbols, int total, int skipped) {}

    private Mono<List<String>> fetchTrackedSymbols(String token) {
        return portfolioClient.get()
                .uri("/portfolio/internal/symbols")
                .headers(h -> {
                    if (token != null) {
                        h.set("Authorization", token);
                    }
                })
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<String>>() {});
    }

    private Mono<Void> processSymbolUpdate(String symbol, boolean force, String token) {
        return Mono.fromCallable(() -> stockPriceRepository.findBySymbol(symbol))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(existingPrice -> {
                    if (!force && existingPrice.isPresent()) {
                        LocalDateTime lastUpdate = existingPrice.get().getLastUpdated();
                        // Property based cooldown check
                        if (lastUpdate != null && lastUpdate.isAfter(LocalDateTime.now().minusHours(refreshIntervalHours))) {
                            log.info("Skipping API fetch for {} - last updated at {} (Interval: {}h)", 
                                symbol, lastUpdate, refreshIntervalHours);
                            return Mono.<Void>empty();
                        }
                    }
                    return fetchLiveAndPersist(symbol)
                            .flatMap(response -> updatePortfolioService(symbol, response.getPrice(), response.getResolvedSymbol(), token));
                })
                .onErrorResume(e -> {
                    log.error("Failed to update {}: {}", symbol, e.getMessage());
                    return Mono.<Void>empty();
                });
    }

    private Mono<StockPriceResponse> fetchLiveAndPersist(String symbol) {
        return (isMutualFundSymbol(symbol) ? fetchMutualFundFullData(symbol) : fetchFullStockData(symbol))
                .flatMap(response -> Mono.fromCallable(() -> {
                    saveToLocalDb(response);
                    saveToHistory(response);
                    return response;
                }).subscribeOn(Schedulers.boundedElastic()));
    }

    @Transactional
    private void saveToLocalDb(StockPriceResponse response) {
        StockPrice entity = stockPriceRepository.findBySymbol(response.getSymbol())
                .orElse(new StockPrice());
        
        entity.setSymbol(response.getSymbol());
        entity.setResolvedSymbol(response.getResolvedSymbol());
        entity.setPrice(response.getPrice());
        entity.setOpen(response.getOpen());
        entity.setHigh(response.getHigh());
        entity.setLow(response.getLow());
        entity.setLastUpdated(LocalDateTime.now());
        
        stockPriceRepository.save(entity);
    }

    @Transactional
    private void saveToHistory(StockPriceResponse response) {
        LocalDate today = LocalDate.now();
        // एक ही दिन में एक प्रतीक के लिए दो प्रविष्टियों से बचें
        if (stockPriceHistoryRepository.findBySymbolAndPriceDate(response.getSymbol(), today).isEmpty()) {
            StockPriceHistory history = StockPriceHistory.builder()
                    .symbol(response.getSymbol())
                    .resolvedSymbol(response.getResolvedSymbol())
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
        return fetchFullStockDataFromApi(symbol)
                .onErrorResume(e -> {
                    // Resilience Fallback: If fetch fails and no suffix is present, try appending .NS (NSE)
                    if (!symbol.contains(".")) {
                        log.info("No data for '{}', attempting fallback with '.NS' suffix...", symbol);
                        return fetchFullStockDataFromApi(symbol + ".NS")
                                .map(response -> {
                                    // Revert to original symbol so it matches DB and Portfolio records
                                    response.setSymbol(symbol);
                                    response.setName(symbol);
                                    return response;
                                });
                    }
                    return Mono.error(e);
                });
    }

    private Mono<StockPriceResponse> fetchFullStockDataFromApi(String symbol) {
        return stockClient.get()
                .uri(uri -> uri.path("/query")
                        .queryParam("function", "GLOBAL_QUOTE")
                        .queryParam("symbol", symbol)
                        .queryParam("apikey", apiKey)
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .map(json -> {
                    JsonNode node;
                    try {
                        node = objectMapper.readTree(json);
                    } catch (JsonProcessingException e) {
                        log.error("Failed to parse Alpha Vantage response for {}. Raw Body: {}", symbol, json);
                        throw new RuntimeException("Failed to parse Alpha Vantage response", e);
                    }

                    if (node.has("Error Message")) {
                        log.error("Alpha Vantage API Error for {}: {}. Raw Body: {}", symbol, node.path("Error Message").asText(), json);
                        throw new RuntimeException("Invalid API Key or API Configuration Error");
                    }
                    if (node.has("Note") || node.has("Information")) {
                        String info = node.has("Note") ? node.path("Note").asText() : node.path("Information").asText();
                        log.warn("Rate limit/Info for {}: {}", symbol, info);
                        throw new RuntimeException("API Limitation: " + info);
                    }
                    JsonNode q = node.path("Global Quote");
                    if (q.isMissingNode() || q.isEmpty()) {
                        log.warn("No data found for symbol: {}. Raw Body: {}", symbol, json);
                        throw new RuntimeException("Symbol not found");
                    }

                    BigDecimal price = parseBigDecimal(q, "05. price", "0");
                    BigDecimal open = parseBigDecimal(q, "02. open", "0");
                    BigDecimal high = parseBigDecimal(q, "03. high", "0");
                    BigDecimal low = parseBigDecimal(q, "04. low", "0");

                    log.info("Successfully fetched {} price: {}", symbol, price);

                    return new StockPriceResponse(
                            symbol, symbol, symbol, price, open, high, low,
                            LocalDateTime.now()
                    );
                });
    }

    private BigDecimal parseBigDecimal(JsonNode node, String fieldName, String defaultValue) {
        String text = node.path(fieldName).asText(defaultValue).replaceAll("[^\\d.]", "");
        return new BigDecimal(text.isBlank() ? defaultValue : text);
    }

    private Mono<StockPriceResponse> fetchMutualFundFullData(String symbol) {
        String schemeCode = extractMutualFundCode(symbol);
        return mfClient.get()
                .uri(uri -> uri.path("/mf/{schemeCode}").build(schemeCode))
                .retrieve()
                .bodyToMono(String.class)
                .map(json -> {
                    JsonNode node;
                    try {
                        node = objectMapper.readTree(json);
                    } catch (JsonProcessingException e) {
                        log.error("Failed to parse Mutual Fund API response for {}. Raw Body: {}", symbol, json);
                        throw new RuntimeException("Failed to parse Mutual Fund API response", e);
                    }

                    JsonNode data = node.path("data");
                    if (!data.isArray() || data.isEmpty()) {
                        log.error("Invalid Mutual Fund API response for {}. Raw Body: {}", symbol, json);
                        throw new IllegalStateException("Unable to parse mutual fund NAV for " + symbol);
                    }
                    String nav = data.get(0).path("nav").asText(null);
                    if (nav == null || nav.isBlank()) {
                        log.error("Missing NAV field in Mutual Fund response for {}. Raw Body: {}", symbol, json);
                        throw new IllegalStateException("Missing NAV value for " + symbol);
                    }
                    BigDecimal price = new BigDecimal(nav.trim());
                    
                    return new StockPriceResponse(
                            symbol,
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

    private Mono<Void> updatePortfolioService(String symbol, BigDecimal price, String resolvedSymbol, String token) {
        return portfolioClient.put()
                .uri("/portfolio/internal/prices/{symbol}?price={price}&resolvedSymbol={resolvedSymbol}", symbol, price, resolvedSymbol)
                .headers(h -> {
                    if (token != null) {
                        h.set("Authorization", token);
                    }
                })
                .retrieve()
                .toBodilessEntity()
                .then();
    }

    public Mono<StockPriceResponse> getStockPrice(String symbol, String token) {
        log.info("Fetching cached price for symbol: {}", symbol);

        return Mono.fromCallable(() -> stockPriceRepository.findBySymbol(symbol))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(localData -> {
                    if (localData.isPresent()) {
                        StockPrice sp = localData.get();
                        return Mono.just(new StockPriceResponse(sp.getSymbol(), sp.getSymbol(), sp.getResolvedSymbol(), sp.getPrice(), sp.getOpen(), sp.getHigh(), sp.getLow(), sp.getLastUpdated()));
                    }

                    // अगर DB में नहीं है तो पहले Portfolio Service check करें फिर Live fetch करके save करें
                    return portfolioClient.get()
                            .uri("/portfolio/internal/prices/{symbol}", symbol)
                            .headers(h -> {
                                if (token != null) {
                                    h.set("Authorization", token);
                                }
                            })
                            .retrieve()
                            .onStatus(status -> !status.is2xxSuccessful(), response -> Mono.empty())
                            .bodyToMono(BigDecimal.class)
                            .map(price -> new StockPriceResponse(symbol, symbol, symbol, price, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, LocalDateTime.now()))
                            .switchIfEmpty(Mono.defer(() -> fetchLiveAndPersist(symbol)))
                            .onErrorResume(e -> {
                                log.error("Error fetching live price for {}: {}", symbol, e.getMessage());
                                return Mono.just(new StockPriceResponse(symbol, symbol, symbol, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, LocalDateTime.now()));
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