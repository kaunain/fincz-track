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
import com.fincz.portfolio.entity.Portfolio;
import com.fincz.portfolio.repository.PortfolioRepository;
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

    private final PortfolioRepository repository;

    /**
     * Adds a new investment to user's portfolio.
     */
    @Transactional
    public PortfolioResponse addInvestment(String userEmail, AddInvestmentRequest request) {
        logger.info("Adding investment for user {}: symbol={}, units={}, buyPrice={}",
                   userEmail, request.getSymbol(), request.getUnits(), request.getBuyPrice());
        
        if (userEmail == null) throw new PortfolioException("User email is required");

        Portfolio portfolio = new Portfolio();
        portfolio.setUserEmail(userEmail);
        portfolio.setType(request.getType());
        portfolio.setName(request.getName());
        portfolio.setSymbol(request.getSymbol());
        portfolio.setUnits(request.getUnits());
        portfolio.setBuyPrice(request.getBuyPrice());

        // For now, set current price same as buy price
        portfolio.setCurrentPrice(request.getBuyPrice());

        Portfolio saved = repository.save(portfolio);
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
            List<Portfolio> holdings = repository.findAll().stream()
                    .filter(p -> p.getSymbol().equals(symbol))
                    .collect(Collectors.toList());

            logger.debug("Found {} holdings for symbol {}", holdings.size(), symbol);

            for (Portfolio holding : holdings) {
                holding.setCurrentPrice(currentPrice);
                repository.save(holding);
                logger.debug("Updated holding id {} for user {}", holding.getId(), holding.getUserEmail());
            }

            logger.info("Successfully updated {} holdings for symbol {}", holdings.size(), symbol);
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

        Portfolio portfolio = repository.findById(id)
                .orElseThrow(() -> new PortfolioNotFoundException(id));

        if (userEmail == null || !portfolio.getUserEmail().equalsIgnoreCase(userEmail)) {
            logger.warn("Unauthorized update attempt: user {} tried to update investment {} owned by {}", 
                    userEmail, id, portfolio.getUserEmail());
            throw new PortfolioException("Unauthorized: You do not own this investment");
        }

        portfolio.setName(request.getName());
        portfolio.setSymbol(request.getSymbol());
        portfolio.setType(request.getType());
        portfolio.setUnits(request.getUnits());
        portfolio.setBuyPrice(request.getBuyPrice());
        // In a real app, current price might stay same or fetch latest
        portfolio.setCurrentPrice(request.getBuyPrice());

        Portfolio saved = repository.save(portfolio);
        logger.info("Successfully updated investment {} for user {}", id, userEmail);
        return mapToResponse(saved);
    }

    /**
     * Deletes an investment from user's portfolio.
     */
    @Transactional
    public void deleteInvestment(Long id, String userEmail) {
        logger.info("Deleting investment {} for user {}", id, userEmail);

        Portfolio portfolio = repository.findById(id)
                .orElseThrow(() -> new PortfolioNotFoundException(id));

        if (userEmail == null || !portfolio.getUserEmail().equalsIgnoreCase(userEmail)) {
            throw new PortfolioException("Unauthorized: You do not own this investment");
        }

        repository.delete(portfolio);
    }

    private PortfolioResponse mapToResponse(Portfolio portfolio) {
        return new PortfolioResponse(
                portfolio.getId(),
                portfolio.getType(),
                portfolio.getName(),
                portfolio.getSymbol(),
                portfolio.getUnits(),
                portfolio.getBuyPrice(),
                portfolio.getCurrentPrice(),
                portfolio.getTotalInvestment(),
                portfolio.getCurrentValue(),
                portfolio.getPnl(),
                portfolio.getPnlPercentage(),
                portfolio.getCreatedAt(),
                portfolio.getUpdatedAt()
        );
    }
}