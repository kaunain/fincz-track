package com.fincz.market.controller;

import com.fincz.market.dto.StockPriceResponse;
import com.fincz.market.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<StockPriceResponse> getStockPrice(@PathVariable String symbol) {
        logger.debug("Requesting stock price for symbol: {}", symbol);

        try {
            StockPriceResponse price = service.getStockPrice(symbol);
            logger.info("Retrieved stock price for {}: ${}", symbol, price.getPrice());
            return ResponseEntity.ok(price);
        } catch (Exception e) {
            logger.error("Failed to retrieve stock price for symbol {}: {}", symbol, e.getMessage(), e);
            throw e;
        }
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