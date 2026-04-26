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

package com.fincz.market.controller;

import com.fincz.market.dto.StockPriceResponse;
import com.fincz.market.dto.SyncSummary;
import com.fincz.market.entity.StockPriceHistory;
import com.fincz.market.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * REST Controller for Market Data operations.
 */
@RestController
@RequestMapping("/market")
@RequiredArgsConstructor
public class MarketDataController {

    private static final Logger logger = LoggerFactory.getLogger(MarketDataController.class);

    private final MarketDataService service;

    /**
     * Gets current stock price for a symbol.
     */
    @GetMapping("/price/{symbol}")
    public Mono<StockPriceResponse> getStockPrice(
            @PathVariable String symbol,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        logger.debug("Requesting stock price for symbol: {}", symbol);
        return service.getStockPrice(symbol, authHeader)
                .doOnNext(price -> logger.info("Retrieved stock price for {}: ${}", symbol, price.getPrice()))
                .doOnError(e -> logger.error("Failed to retrieve stock price for symbol {}: {}", symbol, e.getMessage()));
    }

    /**
     * Gets 30-day price history for a symbol.
     */
    @GetMapping("/history/{symbol}")
    public Flux<StockPriceHistory> getStockHistory(@PathVariable String symbol) {
        return service.getPriceHistory(symbol);
    }

    /**
     * Manually triggers a sync for all symbols tracked in the portfolio.
     */
    @PostMapping("/sync")
    public Mono<SyncSummary> syncAllPrices(
            @RequestParam(required = false, defaultValue = "false") boolean force,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return service.syncPrices(force, authHeader);
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        logger.debug("Health check request received");
        String response = "Market Data Service is running!";
        logger.debug("Health check response: {}", response);
        return ResponseEntity.ok(response);
    }
}