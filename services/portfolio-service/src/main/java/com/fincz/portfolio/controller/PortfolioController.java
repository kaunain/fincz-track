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
import com.fincz.portfolio.dto.NetWorthResponse;
import com.fincz.portfolio.dto.PortfolioResponse;
import com.fincz.portfolio.service.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * REST Controller for Portfolio management operations.
 */
@RestController
@RequestMapping("/portfolio")
@RequiredArgsConstructor
@Slf4j
public class PortfolioController {

    private final PortfolioService service;

    /**
     * Adds a new investment to user's portfolio.
     */
    @PostMapping("/add")
    public ResponseEntity<PortfolioResponse> addInvestment(
            @AuthenticationPrincipal String userEmail,
            @Valid @RequestBody AddInvestmentRequest request) {
        log.info("User {} adding investment: symbol={}, units={}, buyPrice={}",
                   userEmail, request.getSymbol(), request.getUnits(), request.getBuyPrice());

        PortfolioResponse response = service.addInvestment(userEmail, request);
        log.info("Successfully added investment for user {}: {}", userEmail, response.getSymbol());
        return ResponseEntity.ok(response);
    }

    /**
     * Gets user's complete portfolio.
     */
    @GetMapping
    public ResponseEntity<List<PortfolioResponse>> getPortfolio(@AuthenticationPrincipal String userEmail) {
        log.debug("User {} requesting complete portfolio", userEmail);

        List<PortfolioResponse> portfolio = service.getPortfolio(userEmail);
        log.info("Retrieved portfolio for user {}: {} items", userEmail, portfolio.size());
        return ResponseEntity.ok(portfolio);
    }

    /**
     * Gets portfolio items by investment type.
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<PortfolioResponse>> getPortfolioByType(
            @AuthenticationPrincipal String userEmail,
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
    public ResponseEntity<NetWorthResponse> getNetWorth(@AuthenticationPrincipal String userEmail) {
        log.debug("User {} requesting net worth calculation", userEmail);

        NetWorthResponse netWorth = service.getNetWorth(userEmail);
        log.info("Calculated net worth for user {}: ${}", userEmail, netWorth.getCurrentValue());
        return ResponseEntity.ok(netWorth);
    }

    /**
     * Updates an existing investment.
     */
    @PutMapping("/{id}")
    public ResponseEntity<PortfolioResponse> updateInvestment(
            @AuthenticationPrincipal String userEmail,
            @PathVariable Long id,
            @Valid @RequestBody AddInvestmentRequest request) {
        log.info("User {} updating investment {}: symbol={}, units={}, buyPrice={}",
                userEmail, id, request.getSymbol(), request.getUnits(), request.getBuyPrice());

        PortfolioResponse response = service.updateInvestment(id, userEmail, request);
        log.info("Successfully updated investment {} for user {}", id, userEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes an investment from user's portfolio.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvestment(
            @AuthenticationPrincipal String userEmail,
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