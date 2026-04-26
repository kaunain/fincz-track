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

package com.fincz.portfolio.controller;

import com.fincz.portfolio.dto.AddInvestmentRequest;
import com.fincz.portfolio.dto.AnalyticsResponse;
import com.fincz.portfolio.dto.NetWorthResponse;
import com.fincz.portfolio.dto.PortfolioResponse;
import com.fincz.portfolio.service.FinancialAnalyticsService;
import com.fincz.portfolio.service.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * REST Controller for Portfolio management operations.
 */
@RestController
@RequestMapping("/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private static final Logger log = LoggerFactory.getLogger(PortfolioController.class);

    private final PortfolioService service;
    private final FinancialAnalyticsService analyticsService;

    /**
     * Adds a new investment to user's portfolio.
     */
    @PostMapping("/add")
    @Caching(evict = {
        @CacheEvict(value = "portfolioList", key = "#userEmail"),
        @CacheEvict(value = "netWorth", key = "#userEmail"),
        @CacheEvict(value = "analyticsSummary", key = "#userEmail")
    })
    public ResponseEntity<PortfolioResponse> addInvestment(
            @RequestHeader("X-User-Email") String userEmail,
            @Valid @RequestBody AddInvestmentRequest request) {
        log.info("User {} adding investment: symbol={}, units={}, buyPrice={}, purchaseDate={}",
                   userEmail, request.getSymbol(), request.getUnits(), request.getBuyPrice(), request.getPurchaseDate());

        PortfolioResponse response = service.addInvestment(userEmail, request);
        log.info("Successfully added investment for user {}: {}", userEmail, response.getSymbol());
        return ResponseEntity.ok(response);
    }

    /**
     * Gets user's complete portfolio.
     */
    @GetMapping
    @Cacheable(value = "portfolioList", key = "#userEmail + '-' + #page + '-' + #size + '-' + #sort")
    public ResponseEntity<Page<PortfolioResponse>> getPortfolio(
            @RequestHeader("X-User-Email") String userEmail,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name,asc") String sort) {
        
        String[] sortParams = sort.split(",");
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortParams[1]), sortParams[0]));

        Page<PortfolioResponse> portfolio = service.getPortfolio(userEmail, pageable);
        log.info("Retrieved page {} of portfolio for user {}: {} items", page, userEmail, portfolio.getNumberOfElements());
        return ResponseEntity.ok(portfolio);
    }

    /**
     * Imports investments from a CSV file.
     */
    @PostMapping("/import")
    @CacheEvict(value = {"portfolioList", "netWorth", "analyticsSummary"}, key = "#userEmail")
    public ResponseEntity<String> importInvestments(
            @RequestHeader("X-User-Email") String userEmail,
            @RequestParam("file") MultipartFile file) {
        service.importZerodhaCsv(userEmail, file);
        return ResponseEntity.ok("Investments imported successfully");
    }

    /**
     * Bulk adds or updates investments.
     */
    @PostMapping("/bulk")
    @CacheEvict(value = {"portfolioList", "netWorth", "analyticsSummary"}, key = "#userEmail")
    public ResponseEntity<Void> bulkAdd(
            @RequestHeader("X-User-Email") String userEmail,
            @RequestBody List<AddInvestmentRequest> requests) {
        service.bulkAddInvestments(userEmail, requests);
        return ResponseEntity.ok().build();
    }

    /**
     * Gets portfolio items by investment type.
     */
    @GetMapping("/type/{type}")
    @Cacheable(value = "portfolioByType", key = "#userEmail + '-' + #type")
    public ResponseEntity<List<PortfolioResponse>> getPortfolioByType(
            @RequestHeader("X-User-Email") String userEmail,
            @PathVariable String type) {
        log.debug("User {} requesting portfolio by type: {}", userEmail, type);

        List<PortfolioResponse> portfolio = service.getPortfolioByType(userEmail, type);
        log.info("Retrieved {} portfolio items of type {} for user {}", portfolio.size(), type, userEmail);
        return ResponseEntity.ok(portfolio);
    }

    /**
     * Gets user's net worth calculation.
     */
    @GetMapping("/networth")
    @Cacheable(value = "netWorth", key = "#userEmail")
    public ResponseEntity<NetWorthResponse> getNetWorth(@RequestHeader("X-User-Email") String userEmail) {
        log.debug("User {} requesting net worth calculation", userEmail);

        NetWorthResponse netWorth = service.getNetWorth(userEmail);
        log.info("Calculated net worth for user {}: ${}", userEmail, netWorth.getCurrentValue());
        return ResponseEntity.ok(netWorth);
    }

    /**
     * Gets user's portfolio analytics summary (CAGR, Tax, Concentration).
     */
    @GetMapping("/analytics/summary")
    @Cacheable(value = "analyticsSummary", key = "#userEmail")
    public ResponseEntity<AnalyticsResponse> getAnalyticsSummary(@RequestHeader("X-User-Email") String userEmail) {
        log.info("User {} requesting portfolio analytics summary", userEmail);

        AnalyticsResponse response = analyticsService.getPortfolioAnalytics(userEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * Goal-based simulation to find required monthly savings.
     */
    @GetMapping("/analytics/goal-seek")
    public ResponseEntity<Map<String, Object>> getGoalSeek(
            @RequestHeader("X-User-Email") String userEmail,
            @RequestParam BigDecimal target,
            @RequestParam int years,
            @RequestParam(required = false) BigDecimal expectedReturn) {
        
        log.info("User {} seeking goal: target={}, years={}", userEmail, target, years);
        Map<String, Object> result = analyticsService.calculateRequiredMonthlyInvestment(userEmail, target, years, expectedReturn);
        return ResponseEntity.ok(result);
    }

    /**
     * Internal endpoint to update current market prices for a symbol.
     * This affects all user holdings for that symbol.
     */
    @PutMapping("/internal/prices/{symbol}")
    @CacheEvict(value = {"netWorth", "analyticsSummary", "portfolioList", "portfolioByType"}, allEntries = true)
    public ResponseEntity<Void> updatePrices(
            @PathVariable String symbol,
            @RequestParam BigDecimal price,
            @RequestParam(required = false) String resolvedSymbol) {
        log.debug("Internal price update request for symbol: {}, price: {}, resolvedSymbol: {}", symbol, price, resolvedSymbol);
        int updatedCount = service.updateCurrentPrices(symbol, price, resolvedSymbol);
        if (updatedCount == 0) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/internal/prices/{symbol}")
    public ResponseEntity<BigDecimal> getCurrentPrice(@PathVariable String symbol) {
        log.debug("Internal current-price request for symbol: {}", symbol);
        BigDecimal currentPrice = service.getCurrentPriceForSymbol(symbol);
        if (currentPrice == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(currentPrice);
    }

    @GetMapping("/internal/symbols")
    public ResponseEntity<List<String>> getDistinctSymbols() {
        log.debug("Internal symbol list request");
        return ResponseEntity.ok(service.getDistinctSymbols());
    }

    /**
     * Updates an existing investment.
     */
    @PutMapping("/{id}")
    @Caching(evict = {
        @CacheEvict(value = "portfolioList", key = "#userEmail"),
        @CacheEvict(value = "netWorth", key = "#userEmail"),
        @CacheEvict(value = "analyticsSummary", key = "#userEmail")
    })
    public ResponseEntity<PortfolioResponse> updateInvestment(
            @RequestHeader("X-User-Email") String userEmail,
            @PathVariable Long id,
            @Valid @RequestBody AddInvestmentRequest request) {
        log.info("User {} updating investment {}: symbol={}, units={}, buyPrice={}, purchaseDate={}",
                userEmail, id, request.getSymbol(), request.getUnits(), request.getBuyPrice(), request.getPurchaseDate());

        PortfolioResponse response = service.updateInvestment(id, userEmail, request);
        log.info("Successfully updated investment {} for user {}", id, userEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes an investment from user's portfolio.
     */
    @DeleteMapping("/{id}")
    @Caching(evict = {
        @CacheEvict(value = "portfolioList", key = "#userEmail"),
        @CacheEvict(value = "netWorth", key = "#userEmail"),
        @CacheEvict(value = "analyticsSummary", key = "#userEmail")
    })
    public ResponseEntity<Void> deleteInvestment(
            @RequestHeader("X-User-Email") String userEmail,
            @PathVariable Long id) {
        log.info("User {} deleting investment: {}", userEmail, id);

        service.deleteInvestment(id, userEmail);
        log.info("Successfully deleted investment {} for user {}", id, userEmail);
        return ResponseEntity.noContent().build();
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        log.debug("Health check request received");
        String response = "Portfolio Service is running!";
        log.debug("Health check response: {}", response);
        return ResponseEntity.ok(response);
    }
}