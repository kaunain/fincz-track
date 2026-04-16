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
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    public List<PortfolioResponse> getPortfolio(String userEmail) {
        if (userEmail == null) return java.util.Collections.emptyList();
        return repository.findByUserEmail(userEmail)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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
        if (totalInvestment != null && totalInvestment.compareTo(BigDecimal.ZERO) != 0) {
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
    public void updateCurrentPrices(String symbol, BigDecimal currentPrice) {
        logger.info("Updating current prices for symbol {} to {}", symbol, currentPrice);
        try {
            int updatedCount = repository.updatePriceBySymbol(symbol, currentPrice);
            logger.info("Successfully updated {} holdings for symbol {}", updatedCount, symbol);
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
        BigDecimal currentValue = investment.getCurrentValue();
        BigDecimal pnl = currentValue.subtract(totalInvestment);
        BigDecimal pnlPercentage = BigDecimal.ZERO;

        if (totalInvestment.compareTo(BigDecimal.ZERO) != 0) {
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