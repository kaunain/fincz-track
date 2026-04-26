package com.fincz.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for portfolio investment details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioResponse {
    private Long id;
    private String type;
    private String name;
    private String symbol;
    private String resolvedSymbol;
    private BigDecimal units;
    private BigDecimal buyPrice;
    private BigDecimal currentPrice;
    private BigDecimal totalInvestment;
    private BigDecimal currentValue;
    private BigDecimal pnl;
    private BigDecimal pnlPercentage;
    private LocalDate purchaseDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}