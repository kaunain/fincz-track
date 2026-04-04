package com.fincz.market.dto;

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
 * DTO for stock price response.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StockPriceResponse {

    private String symbol;
    private String name;
    private BigDecimal price;
    private BigDecimal change;
    private BigDecimal changePercent;
    private BigDecimal volume;
    private LocalDateTime lastUpdated;
}