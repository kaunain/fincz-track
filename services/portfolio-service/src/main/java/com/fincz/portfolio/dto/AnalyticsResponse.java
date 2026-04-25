package com.fincz.portfolio.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.HashMap;

/**
 * DTO for portfolio analytics summary.
 * Matches the requirements for CAGR, Concentration Risk, and Tax analysis.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {

    /**
     * Map of Symbol to its Compound Annual Growth Rate.
     */
    @Builder.Default
    private Map<String, BigDecimal> cagrPerAsset = new HashMap<>();

    /**
     * Map of Asset Type to its percentage allocation in the portfolio.
     */
    @Builder.Default
    private Map<String, BigDecimal> concentrationRisk = new HashMap<>();

    /**
     * Historical net worth trend data (Date to Value).
     */
    @Builder.Default
    private Map<LocalDate, BigDecimal> netWorthHistory = new HashMap<>();

    /**
     * The date this analytics snapshot was generated.
     */
    private LocalDate lastCalculated;
}