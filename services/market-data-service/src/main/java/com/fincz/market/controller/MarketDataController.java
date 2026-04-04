package com.fincz.market.controller;

import com.fincz.market.dto.StockPriceResponse;
import com.fincz.market.service.MarketDataService;
import lombok.RequiredArgsConstructor;
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

    private final MarketDataService service;

    /**
     * Gets current stock price for a symbol.
     */
    @GetMapping("/price/{symbol}")
    public ResponseEntity<StockPriceResponse> getStockPrice(@PathVariable String symbol) {
        StockPriceResponse price = service.getStockPrice(symbol);
        return ResponseEntity.ok(price);
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Market Data Service is running!");
    }
}