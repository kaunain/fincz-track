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
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "investments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String type; // e.g., STOCKS, MUTUAL_FUNDS, ELSS, NPS

    @Column(nullable = false)
    private String name; // e.g., HDFC Bank, Parag Parikh Flexi Cap

    @Column(nullable = false)
    private String symbol; // e.g., HDFCBANK.NS

    @Column(name = "resolved_symbol")
    private String resolvedSymbol;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal units;

    @Column(name = "buy_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal buyPrice;

    @Column(name = "current_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal currentPrice;

    // New fields from MarketDataService
    @Column(name = "market_cap")
    private BigDecimal marketCap;

    private BigDecimal pe;
    private BigDecimal eps;

    @Column(name = "high_52")
    private BigDecimal high52;

    @Column(name = "low_52")
    private BigDecimal low52;

    private String exchange;

    @Column(nullable = false)
    private LocalDate purchaseDate;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public BigDecimal getTotalInvestment() {
        return units.multiply(buyPrice);
    }

    public BigDecimal getCurrentValue() {
        return units.multiply(currentPrice);
    }
}