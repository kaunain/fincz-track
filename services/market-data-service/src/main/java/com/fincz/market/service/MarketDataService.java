/*
 * Copyright (c) 2026 Fincz-Track
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
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
import java.io.IOException;
import java.io.StringReader;
import reactor.core.scheduler.Schedulers;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
public class MarketDataService {

    private final WebClient mfClient;
    private final WebClient portfolioClient;
    private final WebClient csvClient;
    private final ObjectMapper objectMapper;
    private final StockPriceRepository stockPriceRepository;
    private final StockPriceHistoryRepository stockPriceHistoryRepository;
    private final SyncStatusRepository syncStatusRepository;
    private final int refreshIntervalHours;
    private final String googleSheetCsvUrl;

    private final Map<String, StockPriceResponse> csvCache = new ConcurrentHashMap<>();
    private LocalDateTime lastCsvRefresh = LocalDateTime.MIN;

    public MarketDataService(WebClient.Builder webClientBuilder,
                             @Value("${market.api.stock-base-url:https://www.alphavantage.co}") String stockBaseUrl,
                             @Value("${market.api.mf-base-url:https://api.mfapi.in}") String mfBaseUrl,
                             @Value("${market.api.key:${MARKET_API_KEY:}}") String apiKey,
                             @Value("${app.services.portfolio-url:http://localhost:8083}") String portfolioUrl, // Default for local dev
                             @Value("${market.api.refresh-interval-hours:24}") int refreshIntervalHours, // Default refresh interval
                             @Value("${market.api.google-sheet-url:${MARKET_GOOGLE_SHEET_URL:}}") String googleSheetCsvUrl, // MANDATORY: No hardcoded fallback
                             ObjectMapper objectMapper,
                             StockPriceRepository stockPriceRepository,
                             StockPriceHistoryRepository stockPriceHistoryRepository,
                             SyncStatusRepository syncStatusRepository) {
        this.mfClient = webClientBuilder.clone().baseUrl(mfBaseUrl).build();
        this.portfolioClient = webClientBuilder.clone().baseUrl(portfolioUrl).build();
        this.csvClient = webClientBuilder.clone().build();
        this.objectMapper = objectMapper;
        this.stockPriceRepository = stockPriceRepository;
        this.stockPriceHistoryRepository = stockPriceHistoryRepository;
        this.syncStatusRepository = syncStatusRepository;
        this.refreshIntervalHours = refreshIntervalHours;
        this.googleSheetCsvUrl = googleSheetCsvUrl;

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
                            .concatMap(symbol -> Mono.delay(Duration.ofMillis(500)) // Reduced delay for Google Sheets
                                    .then(processSymbolUpdate(symbol, force, token))
                                    .onErrorResume(e -> {
                                        if (e.getMessage() != null && e.getMessage().contains("25 requests per day")) {
                                            log.error("CRITICAL: Alpha Vantage daily limit (25) reached. Terminating sync process.");
                                            return Mono.error(e); // Stop the whole Flux
                                        }
                                        log.error("Skipping sync for symbol {}: {}.", symbol, e.getMessage());
                                        return Mono.empty(); // Continue with next symbol
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
                .orElse(StockPrice.builder()
                    .symbol(response.getSymbol())
                    .resolvedSymbol(response.getResolvedSymbol())
                    .build());
        
        // Core price fields
        entity.setSymbol(response.getSymbol());
        entity.setResolvedSymbol(response.getResolvedSymbol());
        entity.setPrice(response.getPrice());
        entity.setOpen(response.getOpen());
        entity.setHigh(response.getHigh());
        entity.setLow(response.getLow());
        entity.setLastUpdated(LocalDateTime.now());
        
        // Extended fields from Google Sheets CSV
        if (response.getMarketCap() != null) {
            entity.setMarketCap(response.getMarketCap());
        }
        if (response.getPe() != null) {
            entity.setPe(response.getPe());
        }
        if (response.getEps() != null) {
            entity.setEps(response.getEps());
        }
        if (response.getHigh52() != null) {
            entity.setHigh52(response.getHigh52());
        }
        if (response.getLow52() != null) {
            entity.setLow52(response.getLow52());
        }
        if (response.getExchange() != null) {
            entity.setExchange(response.getExchange());
        }
        if (response.getType() != null) {
            entity.setType(response.getType());
        }
        
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
        return fetchFromGoogleSheetCsv(symbol);
    }

    /**
     * Fetches market data from the configured Google Sheet CSV with local Map caching.
     * Optimized: Single parse per cache refresh, O(1) lookup after.
     */
    private Mono<StockPriceResponse> fetchFromGoogleSheetCsv(String symbol) {
        String normalizedSymbol = symbol.toUpperCase().trim();
        
        // Check cache first - if cache is fresh, no HTTP call needed
        if (lastCsvRefresh.isAfter(LocalDateTime.now().minusMinutes(30)) && !csvCache.isEmpty()) {
            StockPriceResponse cached = csvCache.get(normalizedSymbol);
            if (cached == null && normalizedSymbol.contains(".")) {
                cached = csvCache.get(normalizedSymbol.split("\\.")[0]);
            }
            if (cached != null) {
                return Mono.just(cached);
            }
        }

        log.info("Cache miss or stale for {}, refreshing from Google Sheet CSV...", symbol);
        return csvClient.get()
                .uri(googleSheetCsvUrl)
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(csvContent -> {
                    // Parse entire CSV once and populate cache
                    parseCsvToCache(csvContent);
                    
                    // Now lookup from populated cache
                    StockPriceResponse match = csvCache.get(normalizedSymbol);
                    if (match == null && normalizedSymbol.contains(".")) {
                        match = csvCache.get(normalizedSymbol.split("\\.")[0]);
                    }

                    if (match != null) {
                        return Mono.just(match);
                    }
                    
                    log.warn("Symbol {} not found in Google Sheet CSV after parsing {} symbols", 
                        symbol, csvCache.size());
                    return Mono.<StockPriceResponse>error(
                        new ResponseStatusException(HttpStatus.NOT_FOUND, 
                            "Symbol '" + symbol + "' not found in CSV registry. Available: " + csvCache.size() + " symbols"));
                })
                .doOnError(e -> log.error("Failed to fetch {} from Google Sheet: {}", symbol, e.getMessage()));
    }

    private void parseCsvToCache(String csvContent) {
        Map<String, StockPriceResponse> newCache = new HashMap<>();

        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build();

        try (StringReader reader = new StringReader(csvContent);
             CSVParser csvParser = format.parse(reader)) {

            for (CSVRecord record : csvParser) {
                try {
                    // --- Mandatory fields validation ---
                    String ticker = record.isMapped("Ticker") ? record.get("Ticker").toUpperCase().trim() : null;
                    if (ticker == null || ticker.isBlank()) {
                        log.warn("Skipping CSV record due to missing or blank 'Ticker': {}", record);
                        continue;
                    }

                    BigDecimal price = parseBigDecimal(record.isMapped("Price") ? record.get("Price") : null);
                    if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                        log.warn("Skipping ticker {} - invalid or zero 'Price': '{}'", 
                            ticker, record.isMapped("Price") ? record.get("Price") : "N/A");
                        continue;
                    }

                    // --- Optional fields parsing with graceful fallbacks ---
                    // Note: Column name is often 'Priceopen' in sheets exported as CSV
                    BigDecimal open = parseBigDecimal(record.get("Priceopen"));
                    BigDecimal high = parseBigDecimal(record.get("High"));
                    BigDecimal low = parseBigDecimal(record.get("Low"));
                    BigDecimal marketCap = parseBigDecimal(record.get("Marketcap"));
                    BigDecimal pe = parsePE(record.get("PE"));
                    BigDecimal eps = parseBigDecimal(record.get("EPS"));
                    BigDecimal high52 = parseBigDecimal(record.get("High52"));
                    BigDecimal low52 = parseBigDecimal(record.get("Low52"));
                    
                    String exchange = safeGet(record, "Exchange");
                    String type = safeGet(record, "Type");

                    StockPriceResponse response = StockPriceResponse.builder()
                            .symbol(ticker)
                            .name(ticker)
                            .resolvedSymbol(ticker)
                            .price(price)
                            .open(open != null ? open : price) // Default to current price if not available
                            .high(high != null ? high : price) // Default to current price if not available
                            .low(low != null ? low : price)   // Default to current price if not available
                            .marketCap(marketCap)
                            .pe(pe)
                            .eps(eps)
                            .high52(high52)
                            .low52(low52)
                            .exchange(exchange)
                            .type(type)
                            .lastUpdated(LocalDateTime.now())
                            .build();

                    newCache.put(ticker, response);
                    
                    // Store normalized version (without .NS/.BO suffix) for faster lookup
                    if (ticker.contains(".")) {
                        String baseSymbol = ticker.split("\\.")[0];
                        newCache.putIfAbsent(baseSymbol, response);
                    }
                    
                } catch (Exception e) {
                    log.warn("Skipping malformed CSV record: {}. Error: {}", record, e.getMessage());
                }
            }
        } catch (IOException e) {
            log.error("Failed to parse CSV content from Google Sheet", e);
        }
        
        if (!newCache.isEmpty()) {
            this.csvCache.clear();
            this.csvCache.putAll(newCache);
            this.lastCsvRefresh = LocalDateTime.now();
            log.info("CSV cache refreshed with {} items.", csvCache.size());
        } else {
            log.warn("CSV cache was not refreshed as no valid items were parsed.");
        }
    }

    /**
     * Safely parse BigDecimal with null handling.
     */
    private BigDecimal parseBigDecimal(String value) {
        if (value == null || value.isBlank() || "#N/A".equalsIgnoreCase(value) || "#DIV/0!".equalsIgnoreCase(value)) {
            return null;
        }
        try {
            // Remove any commas used as thousand separators
            String cleaned = value.replace(",", "").trim();
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Parse PE ratio - handle special cases like "#N/A".
     */
    private BigDecimal parsePE(String value) {
        if (value == null || value.isBlank() || "#N/A".equalsIgnoreCase(value)) {
            return null;
        }
        return parseBigDecimal(value);
    }

    /**
     * Safely get string value from CSV record.
     */
    private String safeGet(CSVRecord record, String header) {
        try {
            return record.isMapped(header) ? record.get(header).trim() : "";
        } catch (Exception e) {
            return "";
        }
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
                    
                    return StockPriceResponse.builder()
                            .symbol(symbol)
                            .name(symbol)
                            .resolvedSymbol(symbol)
                            .price(price)
                            .open(BigDecimal.ZERO)
                            .high(BigDecimal.ZERO)
                            .low(BigDecimal.ZERO)
                            .lastUpdated(LocalDateTime.now())
                            .build();
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
                        return Mono.just(StockPriceResponse.builder()
                            .symbol(sp.getSymbol())
                            .name(sp.getSymbol())
                            .resolvedSymbol(sp.getResolvedSymbol())
                            .price(sp.getPrice())
                            .open(sp.getOpen())
                            .high(sp.getHigh())
                            .low(sp.getLow())
                            .lastUpdated(sp.getLastUpdated())
                            .build());
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
                            .map(price -> StockPriceResponse.builder()
                                .symbol(symbol)
                                .name(symbol)
                                .resolvedSymbol(symbol)
                                .price(price)
                                .open(BigDecimal.ZERO)
                                .high(BigDecimal.ZERO)
                                .low(BigDecimal.ZERO)
                                .lastUpdated(LocalDateTime.now())
                                .build())
                            .switchIfEmpty(Mono.defer(() -> fetchLiveAndPersist(symbol)))
                            .onErrorResume(e -> {
                                log.error("Error fetching live price for {}: {}", symbol, e.getMessage());
                                return Mono.just(StockPriceResponse.builder()
                                .symbol(symbol)
                                .name(symbol)
                                .resolvedSymbol(symbol)
                                .price(BigDecimal.ZERO)
                                .open(BigDecimal.ZERO)
                                .high(BigDecimal.ZERO)
                                .low(BigDecimal.ZERO)
                                .lastUpdated(LocalDateTime.now())
                                .build());
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