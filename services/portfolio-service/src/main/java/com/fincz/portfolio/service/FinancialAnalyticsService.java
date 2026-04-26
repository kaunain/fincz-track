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

import com.fincz.portfolio.dto.AnalyticsResponse;
import com.fincz.portfolio.entity.Investment;
import com.fincz.portfolio.repository.InvestmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for calculating advanced financial metrics.
 * Optimized for performance using parallel streams for large portfolios.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FinancialAnalyticsService {

    private final InvestmentRepository investmentRepository;

    /**
     * Calculates comprehensive analytics for a user's portfolio.
     * Results are cached as defined in CacheConfig.
     */
    @Cacheable(value = "analyticsSummary", key = "#userEmail")
    public AnalyticsResponse getPortfolioAnalytics(String userEmail) {
        log.debug("Calculating analytics for user: {}", userEmail);
        List<Investment> investments = investmentRepository.findByUserEmail(userEmail);

        if (investments.isEmpty()) {
            return new AnalyticsResponse();
        }

        // 1. Calculate Individual CAGRs (Optimized with Parallel Stream)
        Map<String, BigDecimal> cagrMap = investments.parallelStream()
                .collect(Collectors.toMap(
                        Investment::getSymbol,
                        inv -> calculateCAGR(inv.getBuyPrice(), inv.getCurrentPrice(), inv.getPurchaseDate()),
                        (existing, replacement) -> existing // Handle duplicate symbols by keeping first
                ));

        // 2. Concentration Risk Analysis
        BigDecimal totalValue = investments.stream()
                .map(inv -> inv.getCurrentPrice().multiply(inv.getUnits()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> concentrationRisk = investments.stream()
                .collect(Collectors.groupingBy(
                        Investment::getType,
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                inv -> inv.getCurrentPrice().multiply(inv.getUnits())
                                        .divide(totalValue, 4, RoundingMode.HALF_UP)
                                        .multiply(BigDecimal.valueOf(100)),
                                BigDecimal::add
                        )
                ));

        // 3. Tax Summary Logic (Simplified for 80C/80CCD)
        // This would typically filter by ELSS, NPS, etc.

        return AnalyticsResponse.builder()
                .cagrPerAsset(cagrMap)
                .concentrationRisk(concentrationRisk)
                .lastCalculated(LocalDate.now())
                .build();
    }

    /**
     * Projects future portfolio value based on weighted CAGR and optional monthly contributions.
     * 
     * @param userEmail The user's email
     * @param projectionYears Number of years to project
     * @param monthlyInvestment Amount added to the portfolio every month
     * @return Map containing projected value and the assumed growth rate
     */
    public Map<String, Object> projectFutureValue(String userEmail, int projectionYears, BigDecimal monthlyInvestment) {
        List<Investment> investments = investmentRepository.findByUserEmail(userEmail);
        
        BigDecimal totalCurrentValue = investments.stream()
                .map(inv -> inv.getCurrentPrice().multiply(inv.getUnits()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalCurrentValue.compareTo(BigDecimal.ZERO) <= 0 || projectionYears <= 0) {
            return Map.of("projectedValue", totalCurrentValue, "assumedCAGR", BigDecimal.ZERO);
        }

        // Calculate Weighted Average CAGR
        BigDecimal weightedCagrSum = investments.stream()
                .map(inv -> {
                    BigDecimal weight = inv.getCurrentPrice().multiply(inv.getUnits())
                            .divide(totalCurrentValue, 4, RoundingMode.HALF_UP);
                    BigDecimal assetCagr = calculateCAGR(inv.getBuyPrice(), inv.getCurrentPrice(), inv.getPurchaseDate());
                    return assetCagr.multiply(weight);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double r = weightedCagrSum.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP).doubleValue();
        double t = projectionYears;
        double pmt = monthlyInvestment != null ? monthlyInvestment.doubleValue() : 0;
        double pv = totalCurrentValue.doubleValue();

        double projectedValue;
        
        if (r <= 0) {
            // No growth, just principal + additions
            projectedValue = pv + (pmt * 12 * t);
        } else {
            /*
             * Future Value Formula:
             * FV = [PV * (1 + r)^t] + [PMT * (((1 + r/12)^(12*t) - 1) / (r/12))]
             */
            double compoundGrowth = pv * Math.pow(1 + r, t);
            
            double monthlyRate = r / 12;
            double totalMonths = t * 12;
            double annuityGrowth = pmt * (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;
            
            projectedValue = compoundGrowth + annuityGrowth;
        }

        // Round to 2 decimal places for financial accuracy
        BigDecimal finalValue = BigDecimal.valueOf(projectedValue).setScale(2, RoundingMode.HALF_UP);
        
        log.info("What-If Projection for {}: PV={}, Rate={}%, Years={}, MonthlyAdd={}, FV={}", 
                userEmail, totalCurrentValue, weightedCagrSum, projectionYears, monthlyInvestment, finalValue);

        return Map.of(
            "currentValue", totalCurrentValue,
            "projectedValue", finalValue,
            "assumedCAGR", weightedCagrSum,
            "totalContribution", monthlyInvestment != null ? monthlyInvestment.multiply(BigDecimal.valueOf(12 * projectionYears)) : BigDecimal.ZERO
        );
    }

    /**
     * CAGR Formula: [(Ending Value / Beginning Value) ^ (1 / Number of Years)] - 1
     * 
     * Optimization: 
     * - Uses double for Math.pow as BigDecimal doesn't natively support fractional powers.
     * - Validates duration to prevent division by zero or negative results for new assets.
     */
    private BigDecimal calculateCAGR(BigDecimal buyPrice, BigDecimal currentPrice, LocalDate purchaseDate) {
        try {
            if (buyPrice == null || currentPrice == null || buyPrice.compareTo(BigDecimal.ZERO) <= 0) {
                return BigDecimal.ZERO;
            }

            long days = ChronoUnit.DAYS.between(purchaseDate, LocalDate.now());
            
            // If held for less than a day, CAGR isn't meaningful (Absolute return used instead)
            if (days <= 0) {
                return currentPrice.subtract(buyPrice)
                        .divide(buyPrice, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            }

            double years = days / 365.25;
            double endingValue = currentPrice.doubleValue();
            double beginningValue = buyPrice.doubleValue();

            // Formula implementation
            double cagr = Math.pow((endingValue / beginningValue), (1.0 / years)) - 1;
            
            // Return as percentage scaled to 2 decimal places
            return BigDecimal.valueOf(cagr * 100)
                    .setScale(2, RoundingMode.HALF_UP);
                    
        } catch (Exception e) {
            log.warn("Error calculating CAGR for asset: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    /**
     * Calculates the required monthly investment to reach a target net worth.
     * 
     * Formula used (Rearranged Future Value of Annuity):
     * PMT = [FV - PV(1+r)^t] / [((1+r/12)^(12t) - 1) / (r/12)]
     * 
     * @param userEmail The user's email
     * @param targetNetWorth The financial goal (FV)
     * @param years Time horizon (t)
     * @param expectedReturn Optional growth rate (r). If null, uses weighted average CAGR.
     * @return Map containing required monthly investment and simulation parameters.
     */
    public Map<String, Object> calculateRequiredMonthlyInvestment(String userEmail, BigDecimal targetNetWorth, int years, BigDecimal expectedReturn) {
        List<Investment> investments = investmentRepository.findByUserEmail(userEmail);
        
        BigDecimal pv = investments.stream()
                .map(inv -> inv.getCurrentPrice().multiply(inv.getUnits()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Determine growth rate (r)
        BigDecimal rate = expectedReturn;
        if (rate == null) {
            rate = investments.stream()
                .map(inv -> {
                    BigDecimal weight = pv.compareTo(BigDecimal.ZERO) > 0 
                        ? inv.getCurrentPrice().multiply(inv.getUnits()).divide(pv, 4, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;
                    return calculateCAGR(inv.getBuyPrice(), inv.getCurrentPrice(), inv.getPurchaseDate()).multiply(weight);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        double fv = targetNetWorth.doubleValue();
        double p = pv.doubleValue();
        double r = rate.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP).doubleValue();
        double t = years;
        double n = 12; // Monthly compounding

        double requiredPmt;
        double growthOfExisting = p * Math.pow(1 + r, t);

        if (growthOfExisting >= fv) {
            requiredPmt = 0;
        } else if (r <= 0) {
            requiredPmt = (fv - p) / (t * n);
        } else {
            double numerator = fv - growthOfExisting;
            double denominator = (Math.pow(1 + r/n, n * t) - 1) / (r/n);
            requiredPmt = numerator / denominator;
        }

        BigDecimal pmtResult = BigDecimal.valueOf(requiredPmt).setScale(2, RoundingMode.HALF_UP);

        log.info("Goal Simulation for {}: Target={}, Years={}, Rate={}%, Required Monthly={}", 
                userEmail, targetNetWorth, years, rate, pmtResult);

        return Map.of(
            "targetNetWorth", targetNetWorth,
            "currentNetWorth", pv,
            "requiredMonthlyInvestment", pmtResult,
            "years", years,
            "assumedRate", rate,
            "shortfall", targetNetWorth.subtract(BigDecimal.valueOf(growthOfExisting)).max(BigDecimal.ZERO)
        );
    }
}