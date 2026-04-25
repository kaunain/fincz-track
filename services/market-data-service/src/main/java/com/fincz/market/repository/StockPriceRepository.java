package com.fincz.market.repository;

import com.fincz.market.entity.StockPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StockPriceRepository extends JpaRepository<StockPrice, Long> {
    Optional<StockPrice> findBySymbol(String symbol);
}