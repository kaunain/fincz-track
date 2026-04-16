package com.fincz.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    // Maps asset type (e.g., STOCKS, GOLD) to its percentage of the total portfolio
    private Map<String, Double> concentrationRisk;
    // Maps investment name to its calculated CAGR percentage
    private Map<String, Double> performanceMetrics;
    // Contains tax-specific keys like totalInvested80C and remaining80CLimit
    private Map<String, BigDecimal> taxSummary;
    // List of investments currently at a loss that could be used to offset gains
    private List<Map<String, Object>> taxLossOpportunities;
}