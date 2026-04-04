package com.fincz.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * DTO for portfolio item response.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioResponse {

    private Long id;
    private String type;
    private String name;
    private String symbol;
    private BigDecimal units;
    private BigDecimal buyPrice;
    private BigDecimal currentPrice;
    private BigDecimal totalInvestment;
    private BigDecimal currentValue;
    private BigDecimal pnl;
    private BigDecimal pnlPercentage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}