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

 
package com.fincz.portfolio.service;

import com.fincz.portfolio.dto.AddInvestmentRequest;
import com.fincz.portfolio.exception.PortfolioException;
import com.fincz.portfolio.exception.PortfolioNotFoundException;
import com.fincz.portfolio.dto.NetWorthResponse;
import com.fincz.portfolio.dto.PortfolioResponse;
import com.fincz.portfolio.entity.Investment;
import com.fincz.portfolio.repository.InvestmentRepository;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Set;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Service class for portfolio management operations.
 */
@Service
@RequiredArgsConstructor
public class PortfolioService {

    private static final Logger logger = LoggerFactory.getLogger(PortfolioService.class);

    private final InvestmentRepository repository;
    private final Validator validator;

    /**
     * Adds a new investment to user's portfolio.
     */
    @Transactional
    @CacheEvict(value = {"netWorth", "portfolioList", "portfolioByType"}, key = "#userEmail")
    public PortfolioResponse addInvestment(String userEmail, AddInvestmentRequest request) {
        logger.info("Adding investment for user {}: symbol={}, units={}, buyPrice={}",
                   userEmail, request.getSymbol(), request.getUnits(), request.getBuyPrice());
        
        if (userEmail == null) throw new PortfolioException("User email is required");

        Investment investment = Investment.builder()
                .userEmail(userEmail)
                .type(request.getType())
                .name(request.getName())
                .symbol(request.getSymbol())
                .units(request.getUnits())
                .buyPrice(request.getBuyPrice())
                .currentPrice(request.getBuyPrice()) // Default current to buy price initially
                .purchaseDate(request.getPurchaseDate())
                .build();

        Investment saved = repository.save(investment);
        logger.info("Successfully saved investment for user {}: id={}", userEmail, saved.getId());
        return mapToResponse(saved);
    }

    /**
     * Gets user's complete portfolio.
     */
    @Cacheable(value = "portfolioList", key = "{#userEmail, #pageable}")
    public Page<PortfolioResponse> getPortfolio(String userEmail, Pageable pageable) {
        if (userEmail == null) return Page.empty();
        return repository.findByUserEmail(userEmail, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Bulk adds or updates investments from a list of requests.
     */
    @CacheEvict(value = {"netWorth", "portfolioList", "portfolioByType"}, key = "#userEmail")
    public void bulkAddInvestments(String userEmail, List<AddInvestmentRequest> requests) {
        logger.info("Bulk adding {} investments for user: {}", requests.size(), userEmail);
        
        StringBuilder errorReport = new StringBuilder();
        for (int i = 0; i < requests.size(); i++) {
            AddInvestmentRequest request = requests.get(i);
            Set<ConstraintViolation<AddInvestmentRequest>> violations = validator.validate(request);
            
            if (!violations.isEmpty()) {
                String messages = violations.stream()
                        .map(v -> v.getPropertyPath() + " " + v.getMessage())
                        .collect(Collectors.joining(", "));
                errorReport.append(String.format("[Row %d: %s] ", i + 1, messages));
            }
        }

        if (errorReport.length() > 0) {
            throw new PortfolioException("Bulk import validation failed: " + errorReport.toString());
        }

        ExecutorService executor = Executors.newFixedThreadPool(Math.max(1, Math.min(requests.size(), Runtime.getRuntime().availableProcessors())));
        try {
            for (AddInvestmentRequest request : requests) {
                executor.submit(() -> {
                    Investment investment = repository.findByUserEmailAndSymbol(userEmail, request.getSymbol())
                            .orElseGet(() -> Investment.builder()
                                    .userEmail(userEmail)
                                    .symbol(request.getSymbol())
                                    .name(request.getName() != null ? request.getName() : request.getSymbol())
                                    .type(request.getType() != null ? request.getType() : "stock")
                                    .purchaseDate(request.getPurchaseDate() != null ? request.getPurchaseDate() : LocalDate.now())
                                    .build());

                    investment.setUnits(request.getUnits());
                    investment.setBuyPrice(request.getBuyPrice());
                    
                    if (investment.getCurrentPrice() == null) {
                        investment.setCurrentPrice(request.getBuyPrice());
                    }
                    
                    if (request.getName() != null) investment.setName(request.getName());
                    if (request.getType() != null) investment.setType(request.getType());
                    if (request.getPurchaseDate() != null) investment.setPurchaseDate(request.getPurchaseDate());

                    repository.save(investment);
                });
            }
        } finally {
            executor.shutdown();
        }
    }

    /**
     * Imports investments from a Zerodha holdings CSV file.
     */
    @CacheEvict(value = {"netWorth", "portfolioList", "portfolioByType"}, key = "#userEmail")
    public void importZerodhaCsv(String userEmail, MultipartFile file) {
        logger.info("Importing Zerodha CSV for user: {}", userEmail);
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            List<String> lines = reader.lines().skip(1).collect(Collectors.toList());

            ExecutorService executor = Executors.newFixedThreadPool(Math.max(1, Math.min(lines.size(), Runtime.getRuntime().availableProcessors())));
            try {
                for (String line : lines) {
                    executor.submit(() -> {
                        String[] columns = line.split(",");
                        if (columns.length < 10) {
                            logger.warn("Skipping malformed CSV line: {}", line);
                            return;
                        }

                        String symbol = columns[0].trim();
                        BigDecimal units = new BigDecimal(columns[3].trim());
                        BigDecimal buyPrice = new BigDecimal(columns[8].trim());
                        BigDecimal currentPrice = new BigDecimal(columns[9].trim());

                        if (units.compareTo(BigDecimal.ZERO) <= 0) {
                            return;
                        }

                        Investment investment = repository.findByUserEmailAndSymbol(userEmail, symbol)
                                .orElseGet(() -> Investment.builder()
                                        .userEmail(userEmail)
                                        .symbol(symbol)
                                        .name(symbol)
                                        .type("stock")
                                        .purchaseDate(LocalDate.now())
                                        .build());

                        investment.setUnits(units);
                        investment.setBuyPrice(buyPrice);
                        investment.setCurrentPrice(currentPrice);

                        repository.save(investment);
                    });
                }
            } finally {
                executor.shutdown();
            }
            logger.info("Zerodha import completed for user: {}", userEmail);
        } catch (Exception e) {
            logger.error("Error parsing Zerodha CSV: {}", e.getMessage(), e);
            throw new PortfolioException("Failed to parse CSV file: " + e.getMessage());
        }
    }

    /**
     * Gets portfolio items by type.
     */
    @Cacheable(value = "portfolioByType", key = "{#userEmail, #type}")
    public List<PortfolioResponse> getPortfolioByType(String userEmail, String type) {
        if (userEmail == null) return java.util.Collections.emptyList();
        return repository.findByUserEmailAndType(userEmail, type)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Calculates user's net worth.
     */
    @Cacheable(value = "netWorth", key = "#userEmail")
    public NetWorthResponse getNetWorth(String userEmail) {
        logger.debug("Calculating net worth for user: {}", userEmail);
        if (userEmail == null) return new NetWorthResponse(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);

        BigDecimal totalInvestment = repository.getTotalInvestmentByUser(userEmail);
        BigDecimal currentValue = repository.getCurrentValueByUser(userEmail);
        BigDecimal totalPnl = repository.getTotalPnLByUser(userEmail);

        BigDecimal pnlPercentage = BigDecimal.ZERO;
        if (totalInvestment != null && totalInvestment.compareTo(BigDecimal.ZERO) != 0 && totalPnl != null) {
            pnlPercentage = totalPnl.divide(totalInvestment, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        NetWorthResponse response = new NetWorthResponse(
                totalInvestment != null ? totalInvestment : BigDecimal.ZERO,
                currentValue != null ? currentValue : BigDecimal.ZERO,
                totalPnl != null ? totalPnl : BigDecimal.ZERO,
                pnlPercentage
        );

        logger.info("Calculated net worth for user {}: totalInvestment=${}, currentValue=${}, pnl=${} ({}%)",
                   userEmail, response.getTotalInvestment(), response.getCurrentValue(),
                   response.getTotalPnl(), response.getPnlPercentage());
        return response;
    }

    /**
     * Updates current prices for all holdings (would be called by market data service).
     */
    @Transactional
    @CacheEvict(value = {"netWorth", "portfolioList", "portfolioByType"}, allEntries = true)
    public int updateCurrentPrices(String symbol, BigDecimal currentPrice, String resolvedSymbol, 
                                   BigDecimal marketCap, BigDecimal pe, BigDecimal eps, 
                                   BigDecimal high52, BigDecimal low52, String exchange) {
        logger.info("Updating prices & metrics for {}: Price={}, MarketCap={}, PE={}", 
                   symbol, currentPrice, marketCap, pe);
        try {
            List<Investment> holdings = repository.findBySymbol(symbol);
            holdings.forEach(h -> {
                h.setCurrentPrice(currentPrice);
                h.setResolvedSymbol(resolvedSymbol);
                h.setMarketCap(marketCap);
                h.setPe(pe);
                h.setEps(eps);
                h.setHigh52(high52);
                h.setHigh52(low52);
                h.setExchange(exchange);
            });
            repository.saveAll(holdings);
            int updatedCount = holdings.size();

            if (updatedCount == 0) {
                logger.warn("No investment holdings found for symbol: {}. No prices were updated.", symbol);
            } else {
                logger.info("Successfully updated {} holdings for symbol {}", updatedCount, symbol);
            }
            return updatedCount;
        } catch (Exception e) {
            logger.error("Failed to update current prices for symbol {}: {}", symbol, e.getMessage(), e);
            throw e;
        }
    }

    public List<String> getDistinctSymbols() {
        return repository.findDistinctSymbols();
    }

    public BigDecimal getCurrentPriceForSymbol(String symbol) {
        return repository.findCurrentPriceBySymbol(symbol).orElse(null);
    }

    /**
     * Updates an existing investment.
     */
    @Transactional
    @CacheEvict(value = "netWorth", key = "#userEmail")
    public PortfolioResponse updateInvestment(Long id, String userEmail, AddInvestmentRequest request) {
        logger.info("Updating investment {} for user {}", id, userEmail);

        Investment investment = repository.findById(id)
                .orElseThrow(() -> new PortfolioNotFoundException(id));

        if (userEmail == null || !investment.getUserEmail().equalsIgnoreCase(userEmail)) {
            logger.warn("Unauthorized update attempt: user {} tried to update investment {} owned by {}", 
                    userEmail, id, investment.getUserEmail());
            throw new PortfolioException("Unauthorized: You do not own this investment");
        }

        investment.setName(request.getName());
        investment.setSymbol(request.getSymbol());
        investment.setType(request.getType());
        investment.setUnits(request.getUnits());
        investment.setBuyPrice(request.getBuyPrice());
        investment.setPurchaseDate(request.getPurchaseDate());
        // In a real app, current price might stay same or fetch latest
        investment.setCurrentPrice(request.getBuyPrice());

        Investment saved = repository.save(investment);
        logger.info("Successfully updated investment {} for user {}", id, userEmail);
        return mapToResponse(saved);
    }

    /**
     * Deletes an investment from user's portfolio.
     */
    @Transactional
    @CacheEvict(value = "netWorth", key = "#userEmail")
    public void deleteInvestment(Long id, String userEmail) {
        logger.info("Deleting investment {} for user {}", id, userEmail);

        Investment investment = repository.findById(id)
                .orElseThrow(() -> new PortfolioNotFoundException(id));

        if (userEmail == null || !investment.getUserEmail().equalsIgnoreCase(userEmail)) {
            throw new PortfolioException("Unauthorized: You do not own this investment");
        }

        repository.delete(investment);
    }

    private PortfolioResponse mapToResponse(Investment investment) {
        BigDecimal totalInvestment = investment.getTotalInvestment();
        BigDecimal currentValue = investment.getCurrentValue() != null ? investment.getCurrentValue() : totalInvestment;
        
        BigDecimal pnl = currentValue.subtract(totalInvestment);
        BigDecimal pnlPercentage = BigDecimal.ZERO;

        if (totalInvestment.compareTo(BigDecimal.ZERO) != 0 && pnl.compareTo(BigDecimal.ZERO) != 0) {
            pnlPercentage = pnl.divide(totalInvestment, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        return PortfolioResponse.builder()
                .id(investment.getId())
                .type(investment.getType())
                .name(investment.getName())
                .symbol(investment.getSymbol())
                .resolvedSymbol(investment.getResolvedSymbol())
                .units(investment.getUnits())
                .buyPrice(investment.getBuyPrice())
                .currentPrice(investment.getCurrentPrice())
                .totalInvestment(totalInvestment)
                .currentValue(currentValue)
                .pnl(pnl)
                .pnlPercentage(pnlPercentage)
                .purchaseDate(investment.getPurchaseDate())
                .marketCap(investment.getMarketCap())
                .pe(investment.getPe())
                .eps(investment.getEps())
                .high52(investment.getHigh52())
                .low52(investment.getLow52())
                .exchange(investment.getExchange())
                .createdAt(investment.getCreatedAt())
                .updatedAt(investment.getUpdatedAt())
                .build();
    }
}