package com.fincz.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * DTO for net worth calculation response.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NetWorthResponse {

    private BigDecimal totalInvestment;
    private BigDecimal currentValue;
    private BigDecimal totalPnl;
    private BigDecimal pnlPercentage;
}