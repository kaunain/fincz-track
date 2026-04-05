package com.fincz.portfolio.controller;

import com.fincz.portfolio.dto.AddInvestmentRequest;
import com.fincz.portfolio.dto.NetWorthResponse;
import com.fincz.portfolio.dto.PortfolioResponse;
import com.fincz.portfolio.service.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class PortfolioController {

    private static final Logger logger = LoggerFactory.getLogger(PortfolioController.class);

    private final PortfolioService service;

    /**
     * Adds a new investment to user's portfolio.
     */
    @PostMapping("/add")
    public ResponseEntity<PortfolioResponse> addInvestment(
            @AuthenticationPrincipal String userEmail,
            @Valid @RequestBody AddInvestmentRequest request) {
        logger.info("User {} adding investment: symbol={}, units={}, buyPrice={}",
                   userEmail, request.getSymbol(), request.getUnits(), request.getBuyPrice());

        try {
            PortfolioResponse response = service.addInvestment(userEmail, request);
            logger.info("Successfully added investment for user {}: {}", userEmail, response.getSymbol());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to add investment for user {}: {}", userEmail, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Gets user's complete portfolio.
     */
    @GetMapping
    public ResponseEntity<List<PortfolioResponse>> getPortfolio(@AuthenticationPrincipal String userEmail) {
        logger.debug("User {} requesting complete portfolio", userEmail);

        try {
            List<PortfolioResponse> portfolio = service.getPortfolio(userEmail);
            logger.info("Retrieved portfolio for user {}: {} items", userEmail, portfolio.size());
            return ResponseEntity.ok(portfolio);
        } catch (Exception e) {
            logger.error("Failed to retrieve portfolio for user {}: {}", userEmail, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Gets portfolio items by investment type.
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<PortfolioResponse>> getPortfolioByType(
            @AuthenticationPrincipal String userEmail,
            @PathVariable String type) {
        logger.debug("User {} requesting portfolio by type: {}", userEmail, type);

        try {
            List<PortfolioResponse> portfolio = service.getPortfolioByType(userEmail, type);
            logger.info("Retrieved {} portfolio items of type {} for user {}", portfolio.size(), type, userEmail);
            return ResponseEntity.ok(portfolio);
        } catch (Exception e) {
            logger.error("Failed to retrieve portfolio by type {} for user {}: {}", type, userEmail, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Gets user's net worth calculation.
     */
    @GetMapping("/networth")
    public ResponseEntity<NetWorthResponse> getNetWorth(@AuthenticationPrincipal String userEmail) {
        logger.debug("User {} requesting net worth calculation", userEmail);

        try {
            NetWorthResponse netWorth = service.getNetWorth(userEmail);
            logger.info("Calculated net worth for user {}: ${}", userEmail, netWorth.getCurrentValue());
            return ResponseEntity.ok(netWorth);
        } catch (Exception e) {
            logger.error("Failed to calculate net worth for user {}: {}", userEmail, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        logger.debug("Health check request received");
        String response = "Portfolio Service is running!";
        logger.debug("Health check response: {}", response);
        return ResponseEntity.ok(response);
    }
}