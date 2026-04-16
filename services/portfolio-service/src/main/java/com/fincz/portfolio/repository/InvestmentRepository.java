package com.fincz.portfolio.repository;

import com.fincz.portfolio.entity.Investment;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {

    List<Investment> findByUserEmail(String userEmail);
    
    List<Investment> findByUserEmailAndType(String userEmail, String type);

    @Query("SELECT SUM(i.units * i.buyPrice) FROM Investment i WHERE i.userEmail = :userEmail")
    BigDecimal getTotalInvestmentByUser(@Param("userEmail") String userEmail);

    @Query("SELECT SUM(i.units * i.currentPrice) FROM Investment i WHERE i.userEmail = :userEmail")
    BigDecimal getCurrentValueByUser(@Param("userEmail") String userEmail);

    @Query("SELECT SUM((i.units * i.currentPrice) - (i.units * i.buyPrice)) FROM Investment i WHERE i.userEmail = :userEmail")
    BigDecimal getTotalPnLByUser(@Param("userEmail") String userEmail);

    @Modifying
    @Query("UPDATE Investment i SET i.currentPrice = :price, i.updatedAt = CURRENT_TIMESTAMP WHERE i.symbol = :symbol")
    int updatePriceBySymbol(@Param("symbol") String symbol, @Param("price") BigDecimal price);
}