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
    public Page<PortfolioResponse> getPortfolio(String userEmail, Pageable pageable) {
        if (userEmail == null) return Page.empty();
        return repository.findByUserEmail(userEmail, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Bulk adds or updates investments from a list of requests.
     */
    @Transactional
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

        for (AddInvestmentRequest request : requests) {
            // Find existing by symbol to update, or create new
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
            
            // Initialize current price only if it's a new investment
            if (investment.getCurrentPrice() == null) {
                investment.setCurrentPrice(request.getBuyPrice());
            }
            
            if (request.getName() != null) investment.setName(request.getName());
            if (request.getType() != null) investment.setType(request.getType());
            if (request.getPurchaseDate() != null) investment.setPurchaseDate(request.getPurchaseDate());

            repository.save(investment);
        }
    }

    /**
     * Imports investments from a Zerodha holdings CSV file.
     */
    @Transactional
    public void importZerodhaCsv(String userEmail, MultipartFile file) {
        logger.info("Importing Zerodha CSV for user: {}", userEmail);
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isHeader = true;
            while ((line = reader.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue; // Skip header row
                }
                String[] columns = line.split(",");
                
                // Zerodha CSV format:
                // 0: Symbol, 1: ISIN, 2: Sector, 3: Quantity Available, 4: Quantity Discrepant,
                // 5: Quantity Long Term, 6: Quantity Pledged (Margin), 7: Quantity Pledged (Loan),
                // 8: Average Price, 9: Previous Closing Price, 10: Unrealized P&L, 11: Unrealized P&L Pct.
                
                // Ensure enough columns are present
                if (columns.length < 10) { 
                    logger.warn("Skipping malformed CSV line: {}", line);
                    continue;
                }

                String symbol = columns[0].trim();
                BigDecimal units = new BigDecimal(columns[3].trim());
                BigDecimal buyPrice = new BigDecimal(columns[8].trim());
                BigDecimal currentPrice = new BigDecimal(columns[9].trim());

                // Skip if quantity is 0 or less
                if (units.compareTo(BigDecimal.ZERO) <= 0) {
                    logger.debug("Skipping investment with zero or negative units for symbol: {}", symbol);
                    continue;
                }

                // Check if symbol already exists for this user to update instead of duplicate
                Investment investment = repository.findByUserEmailAndSymbol(userEmail, symbol)
                        .orElseGet(() -> Investment.builder()
                                .userEmail(userEmail)
                                .symbol(symbol)
                                .name(symbol) // Zerodha CSV lacks full names, defaulting to symbol
                                .type("stock")
                                .purchaseDate(LocalDate.now())
                                .build());

                investment.setUnits(units);
                investment.setBuyPrice(buyPrice);
                investment.setCurrentPrice(currentPrice);

                repository.save(investment); // Save each investment
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
    public int updateCurrentPrices(String symbol, BigDecimal currentPrice) {
        logger.info("Updating current prices for symbol {} to {}", symbol, currentPrice);
        try {
            int updatedCount = repository.updatePriceBySymbol(symbol, currentPrice);
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

    /**
     * Updates an existing investment.
     */
    @Transactional
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

        return new PortfolioResponse(
                investment.getId(),
                investment.getType(),
                investment.getName(),
                investment.getSymbol(),
                investment.getUnits(),
                investment.getBuyPrice(),
                investment.getCurrentPrice(),
                totalInvestment,
                currentValue,
                pnl,
                pnlPercentage,
                investment.getCreatedAt(),
                investment.getUpdatedAt()
        );
    }
}