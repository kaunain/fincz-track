package com.fincz.portfolio.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * DTO for adding new investment to portfolio.
 */
@Getter
@Setter
public class AddInvestmentRequest {

    @NotBlank(message = "Investment type is required")
    private String type; // stock, mf, nps

    @NotBlank(message = "Investment name is required")
    private String name; // TCS, HDFC MF

    @NotBlank(message = "Symbol is required")
    private String symbol; // TCS.NS, HDFCMFGETF

    @NotNull(message = "Units are required")
    @DecimalMin(value = "0.01", message = "Units must be greater than 0")
    private BigDecimal units;

    @NotNull(message = "Buy price is required")
    @DecimalMin(value = "0.01", message = "Buy price must be greater than 0")
    private BigDecimal buyPrice;
}