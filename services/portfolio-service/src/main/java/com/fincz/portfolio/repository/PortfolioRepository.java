package com.fincz.portfolio.repository;

import com.fincz.portfolio.entity.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Repository for Portfolio entity operations.
 */
@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    List<Portfolio> findByUserEmail(String userEmail);

    List<Portfolio> findByUserEmailAndType(String userEmail, String type);

    @Query("SELECT SUM(p.totalInvestment) FROM Portfolio p WHERE p.userEmail = :userEmail")
    BigDecimal getTotalInvestmentByUser(@Param("userEmail") String userEmail);

    @Query("SELECT SUM(p.currentValue) FROM Portfolio p WHERE p.userEmail = :userEmail")
    BigDecimal getCurrentValueByUser(@Param("userEmail") String userEmail);

    @Query("SELECT SUM(p.pnl) FROM Portfolio p WHERE p.userEmail = :userEmail")
    BigDecimal getTotalPnLByUser(@Param("userEmail") String userEmail);

    boolean existsByUserEmailAndSymbol(String userEmail, String symbol);
}