package com.fincz.portfolio.service;

import com.fincz.portfolio.dto.AnalyticsResponse;
import com.fincz.portfolio.entity.Investment;
import com.fincz.portfolio.repository.InvestmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class FinancialAnalyticsService {

    private final InvestmentRepository investmentRepository;

    /**
     * Calculates comprehensive analytics for a user's portfolio.
     */
    public AnalyticsResponse getPortfolioAnalytics(String userEmail) {
        List<Investment> investments = investmentRepository.findByUserEmail(userEmail);
        
        BigDecimal totalCurrentValue = investments.stream()
                .map(i -> i.getUnits().multiply(i.getCurrentPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AnalyticsResponse.builder()
                .concentrationRisk(calculateConcentrationRisk(investments, totalCurrentValue))
                .performanceMetrics(calculatePerformanceMetrics(investments))
                .taxSummary(calculateTaxStatus(investments))
                .taxLossOpportunities(calculateTaxLossOpportunities(investments))
                .build();
    }

    /**
     * Calculates concentration risk (Asset Allocation %).
     */
    private Map<String, Double> calculateConcentrationRisk(List<Investment> investments, BigDecimal totalValue) {
        if (totalValue.compareTo(BigDecimal.ZERO) == 0) return Map.of();

        return investments.stream()
                .collect(Collectors.groupingBy(
                        Investment::getType,
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                i -> i.getUnits().multiply(i.getCurrentPrice()),
                                BigDecimal::add
                        )
                )).entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().divide(totalValue, 4, RoundingMode.HALF_UP).doubleValue() * 100
                ));
    }

    /**
     * Calculates CAGR for each investment.
     */
    private Map<String, Double> calculatePerformanceMetrics(List<Investment> investments) {
        return investments.stream()
                .collect(Collectors.toMap(
                        Investment::getName,
                        i -> calculateCAGR(i).doubleValue()
                ));
    }

    private BigDecimal calculateCAGR(Investment i) {
        long days = ChronoUnit.DAYS.between(i.getPurchaseDate(), LocalDate.now());
        if (days < 1) return BigDecimal.ZERO;

        double years = days / 365.0;
        double currentValue = i.getUnits().multiply(i.getCurrentPrice()).doubleValue();
        double initialValue = i.getUnits().multiply(i.getBuyPrice()).doubleValue();

        if (initialValue == 0) return BigDecimal.ZERO;

        double cagr = (Math.pow((currentValue / initialValue), (1.0 / years)) - 1) * 100;
        return BigDecimal.valueOf(cagr).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Simplified Tax Tracker for 80C/80CCD.
     */
    private Map<String, BigDecimal> calculateTaxStatus(List<Investment> investments) {
        BigDecimal taxExemptTotal = investments.stream()
                .filter(i -> isTaxExemptType(i.getType()))
                .map(i -> i.getUnits().multiply(i.getBuyPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal limit80C = new BigDecimal("150000");
        BigDecimal remaining80C = limit80C.subtract(taxExemptTotal).max(BigDecimal.ZERO);

        return Map.of(
                "totalInvested80C", taxExemptTotal,
                "remaining80CLimit", remaining80C
        );
    }

    private boolean isTaxExemptType(String type) {
        if (type == null) return false;
        String t = type.trim().toUpperCase();
        // NPS is checked here for general 80C, though it often utilizes 80CCD(1B)
        return t.equals("ELSS") || t.equals("PPF") || t.equals("NPS") || t.equals("LIC");
    }

    /**
     * Identifies investments with unrealized losses for Tax-Loss Harvesting.
     * Categorizes them as STCG (Short Term) or LTCG (Long Term) based on 1-year holding.
     */
    private List<Map<String, Object>> calculateTaxLossOpportunities(List<Investment> investments) {
        return investments.stream()
                .filter(i -> i.getCurrentPrice().compareTo(i.getBuyPrice()) < 0)
                .map(i -> {
                    BigDecimal unrealizedLoss = i.getUnits()
                            .multiply(i.getBuyPrice().subtract(i.getCurrentPrice()))
                            .setScale(2, RoundingMode.HALF_UP);
                    
                    long daysHeld = ChronoUnit.DAYS.between(i.getPurchaseDate(), LocalDate.now());
                    String taxType = (daysHeld > 365) ? "LTCG" : "STCG";

                    return Map.<String, Object>of(
                            "name", i.getName(),
                            "symbol", i.getSymbol(),
                            "unrealizedLoss", unrealizedLoss,
                            "taxType", taxType
                    );
                })
                .collect(Collectors.toList());
    }
}