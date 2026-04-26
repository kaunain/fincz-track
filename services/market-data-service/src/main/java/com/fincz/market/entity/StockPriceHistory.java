package com.fincz.market.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "stock_price_history", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"symbol", "price_date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockPriceHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String symbol;

    @Column(name = "resolved_symbol")
    private String resolvedSymbol;

    private BigDecimal price;
    private BigDecimal open;
    private BigDecimal high;
    private BigDecimal low;
    
    @Column(name = "price_date")
    private LocalDate priceDate;
}