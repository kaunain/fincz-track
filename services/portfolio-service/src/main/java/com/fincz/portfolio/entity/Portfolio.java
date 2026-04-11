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

package com.fincz.portfolio.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Portfolio entity representing a user's investment holding.
 */
@Entity
@Table(name = "portfolios")
@Getter
@Setter
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String type; // stock, mf, nps, etc.

    @Column(nullable = false)
    private String name; // TCS, HDFC MF, etc.

    @Column(nullable = false)
    private String symbol; // TCS.NS, HDFCMFGETF, etc.

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal units; // Number of units/shares

    @Column(name = "buy_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal buyPrice; // Price per unit at purchase

    @Column(name = "current_price", precision = 19, scale = 4)
    private BigDecimal currentPrice; // Latest market price

    @Column(name = "total_investment", nullable = false, precision = 19, scale = 2)
    private BigDecimal totalInvestment; // units * buyPrice

    @Column(name = "current_value", precision = 19, scale = 2)
    private BigDecimal currentValue; // units * currentPrice

    @Column(precision = 19, scale = 2)
    private BigDecimal pnl; // Profit/Loss

    @Column(name = "pnl_percentage", precision = 7, scale = 4)
    private BigDecimal pnlPercentage; // Profit/Loss percentage

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        calculateValues();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateValues();
    }

    private void calculateValues() {
        if (units != null && buyPrice != null) {
            totalInvestment = units.multiply(buyPrice);
        }

        if (units != null && currentPrice != null) {
            currentValue = units.multiply(currentPrice);
        }

        if (totalInvestment != null && currentValue != null) {
            pnl = currentValue.subtract(totalInvestment);
            if (totalInvestment.compareTo(BigDecimal.ZERO) != 0) {
                pnlPercentage = pnl.divide(totalInvestment, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            }
        }
    }
}