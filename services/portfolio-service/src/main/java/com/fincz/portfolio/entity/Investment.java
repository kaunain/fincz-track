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