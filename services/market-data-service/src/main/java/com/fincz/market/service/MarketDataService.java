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

import com.fincz.market.dto.StockPriceResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Service for fetching market data.
 * Currently uses mock data for demonstration.
 */
@Service
@RequiredArgsConstructor
public class MarketDataService {

    private static final Logger logger = LoggerFactory.getLogger(MarketDataService.class);

    private final Random random = new Random();

    // Mock data for Indian stocks
    private static final Map<String, String> STOCK_NAMES = Map.of(
        "TCS.NS", "Tata Consultancy Services",
        "INFY.NS", "Infosys Limited",
        "HDFCBANK.NS", "HDFC Bank",
        "ICICIBANK.NS", "ICICI Bank",
        "RELIANCE.NS", "Reliance Industries",
        "HDFCFCF", "HDFC Flexi Cap Fund",
        "SBIMAGICMF", "SBI Magnum Multi Asset Fund"
    );

    // Base prices for mock data
    private static final Map<String, BigDecimal> BASE_PRICES = Map.of(
        "TCS.NS", BigDecimal.valueOf(3200.00),
        "INFY.NS", BigDecimal.valueOf(1450.00),
        "HDFCBANK.NS", BigDecimal.valueOf(1650.00),
        "ICICIBANK.NS", BigDecimal.valueOf(950.00),
        "RELIANCE.NS", BigDecimal.valueOf(2800.00),
        "HDFCFCF", BigDecimal.valueOf(150.00),
        "SBIMAGICMF", BigDecimal.valueOf(120.00)
    );

    /**
     * Gets current stock price for a symbol.
     * Uses caching to avoid repeated API calls.
     */
    @Cacheable(value = "stockPrices", key = "#symbol")
    public StockPriceResponse getStockPrice(String symbol) {
        logger.info("Fetching stock price for symbol: {}", symbol);

        try {
            // Check if we have mock data for this symbol
            if (!STOCK_NAMES.containsKey(symbol)) {
                logger.warn("Stock symbol not found in mock data: {}", symbol);
                throw new IllegalArgumentException("Stock symbol not found: " + symbol);
            }

            // Generate mock price data
            BigDecimal basePrice = BASE_PRICES.get(symbol);
            BigDecimal currentPrice = generateMockPrice(basePrice);
            BigDecimal change = currentPrice.subtract(basePrice);
            BigDecimal changePercent = change.divide(basePrice, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            BigDecimal volume = BigDecimal.valueOf(random.nextInt(1000000) + 100000);

            StockPriceResponse response = new StockPriceResponse(
                    symbol,
                    STOCK_NAMES.get(symbol),
                    currentPrice,
                    change,
                    changePercent,
                    volume,
                    LocalDateTime.now()
            );

            logger.info("Generated mock price for {} ({}): ${} (change: ${} / {}%)",
                       symbol, response.getName(), response.getPrice(),
                       response.getChange(), response.getChangePercent());
            return response;
        } catch (Exception e) {
            logger.error("Failed to fetch stock price for symbol {}: {}", symbol, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Updates portfolio service with latest prices.
     * This would be called periodically or on demand.
     */
    public void updatePortfolioPrices(String symbol) {
        logger.info("Updating portfolio prices for symbol: {}", symbol);

        try {
            // In a real implementation, this would call the portfolio service
            // to update current prices for all holdings of this symbol
            logger.debug("Portfolio price update completed for symbol: {}", symbol);
        } catch (Exception e) {
            logger.error("Failed to update portfolio prices for symbol {}: {}", symbol, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Generates a mock price with some random variation.
     */
    private BigDecimal generateMockPrice(BigDecimal basePrice) {
        // Add random variation of -5% to +5%
        double variation = (random.nextDouble() - 0.5) * 0.1; // -5% to +5%
        BigDecimal variationAmount = basePrice.multiply(BigDecimal.valueOf(variation));
        return basePrice.add(variationAmount).setScale(2, RoundingMode.HALF_UP);
    }
}