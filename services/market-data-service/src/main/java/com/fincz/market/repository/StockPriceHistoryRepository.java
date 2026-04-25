package com.fincz.market.repository;

import com.fincz.market.entity.StockPriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

public interface StockPriceHistoryRepository extends JpaRepository<StockPriceHistory, Long> {
    Optional<StockPriceHistory> findBySymbolAndPriceDate(String symbol, LocalDate priceDate);
    List<StockPriceHistory> findBySymbolOrderByPriceDateDesc(String symbol);
    List<StockPriceHistory> findBySymbolAndPriceDateAfterOrderByPriceDateDesc(String symbol, LocalDate priceDate);
}