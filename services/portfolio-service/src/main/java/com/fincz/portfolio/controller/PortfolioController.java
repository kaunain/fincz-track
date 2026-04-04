package com.fincz.portfolio.controller;

import com.fincz.portfolio.dto.AddInvestmentRequest;
import com.fincz.portfolio.dto.NetWorthResponse;
import com.fincz.portfolio.dto.PortfolioResponse;
import com.fincz.portfolio.service.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    private final PortfolioService service;

    /**
     * Adds a new investment to user's portfolio.
     */
    @PostMapping("/add")
    public ResponseEntity<PortfolioResponse> addInvestment(
            @AuthenticationPrincipal String userEmail,
            @Valid @RequestBody AddInvestmentRequest request) {
        PortfolioResponse response = service.addInvestment(userEmail, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Gets user's complete portfolio.
     */
    @GetMapping
    public ResponseEntity<List<PortfolioResponse>> getPortfolio(@AuthenticationPrincipal String userEmail) {
        List<PortfolioResponse> portfolio = service.getPortfolio(userEmail);
        return ResponseEntity.ok(portfolio);
    }

    /**
     * Gets portfolio items by investment type.
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<PortfolioResponse>> getPortfolioByType(
            @AuthenticationPrincipal String userEmail,
            @PathVariable String type) {
        List<PortfolioResponse> portfolio = service.getPortfolioByType(userEmail, type);
        return ResponseEntity.ok(portfolio);
    }

    /**
     * Gets user's net worth calculation.
     */
    @GetMapping("/networth")
    public ResponseEntity<NetWorthResponse> getNetWorth(@AuthenticationPrincipal String userEmail) {
        NetWorthResponse netWorth = service.getNetWorth(userEmail);
        return ResponseEntity.ok(netWorth);
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Portfolio Service is running!");
    }
}