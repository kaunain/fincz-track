package com.fincz.market.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    private final WebClient alphaVantageClient;
    private final WebClient portfolioClient;

    @Value("${app.market.api-key}")
    private String apiKey;

    public MarketDataService(WebClient.Builder webClientBuilder, 
                             @Value("${app.services.portfolio-url:http://localhost:8083}") String portfolioUrl) {
        this.alphaVantageClient = webClientBuilder.baseUrl("https://www.alphavantage.co").build();
        this.portfolioClient = webClientBuilder.baseUrl(portfolioUrl).build();
    }

    /**
     * Scheduled task to refresh prices every 5 minutes.
     * Uses Flux for non-blocking concurrent updates.
     */
    @Scheduled(fixedRateString = "${app.market.refresh-rate:300000}")
    public void refreshMarketPrices() {
        log.info("Starting scheduled market price refresh...");

        // In production, fetch this list from your local DB or Portfolio Service
        List<String> symbols = List.of("TCS.NS", "RELIANCE.NS", "HDFCBANK.NS", "INFY.NS");

        Flux.fromIterable(symbols)
                .flatMap(this::processSymbolUpdate)
                .subscribe(
                    null,
                    error -> log.error("Error in refresh cycle: {}", error.getMessage()),
                    () -> log.info("Market price refresh cycle completed.")
                );
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
        return alphaVantageClient.get()
                .uri(uri -> uri.path("/query")
                        .queryParam("function", "GLOBAL_QUOTE")
                        .queryParam("symbol", symbol)
                        .queryParam("apikey", apiKey)
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .map(json -> {
                    // Logic to parse price from Alpha Vantage response
                    // Mocking for demo:
                    return new BigDecimal("1500.00").add(BigDecimal.valueOf(Math.random() * 50));
                })
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(2)));
    }

    private Mono<Void> updatePortfolioService(String symbol, BigDecimal price) {
        return portfolioClient.put()
                .uri("/portfolio/internal/prices/{symbol}?price={price}", symbol, price)
                .retrieve()
                .toBodilessEntity()
                .then();
    }

    public StockPriceResponse getStockPrice(String symbol) {
        log.info("Fetching stock price for symbol: {}", symbol);
        BigDecimal price = fetchLatestPrice(symbol)
                .onErrorResume(e -> {
                    log.error("Error fetching price for {}: {}", symbol, e.getMessage());
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