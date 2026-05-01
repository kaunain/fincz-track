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

 package com.fincz.portfolio.repository;

import com.fincz.portfolio.entity.Investment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Investment entity.
 */
@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {
    
    List<Investment> findByUserEmail(String userEmail);

    Page<Investment> findByUserEmail(String userEmail, Pageable pageable);
    
    List<Investment> findBySymbol(String symbol);
    
    List<Investment> findByUserEmailAndType(String userEmail, String type);
    
    /**
     * Finds a specific investment by user and symbol.
     * Used to prevent duplicate entries during imports.
     */
    Optional<Investment> findByUserEmailAndSymbol(String userEmail, String symbol);

    @Query("SELECT SUM(i.units * i.buyPrice) FROM Investment i WHERE i.userEmail = :userEmail")
    BigDecimal getTotalInvestmentByUser(@Param("userEmail") String userEmail);

    @Query("SELECT SUM(i.units * i.currentPrice) FROM Investment i WHERE i.userEmail = :userEmail")
    BigDecimal getCurrentValueByUser(@Param("userEmail") String userEmail);

    /**
     * Calculates total P&L for a user.
     * Note: This calculation is performed in the database for better performance.
     */
    @Query("SELECT SUM((i.currentPrice - i.buyPrice) * i.units) FROM Investment i WHERE i.userEmail = :userEmail")
    BigDecimal getTotalPnLByUser(@Param("userEmail") String userEmail);

    /**
     * Performs a bulk update of market prices for a specific symbol.
     * This is called by the Market Data Service's scheduled tasks.
     * 
     * @return number of records updated.
     */
    @Modifying
    @Query("UPDATE Investment i SET i.currentPrice = :price, i.resolvedSymbol = :resolvedSymbol WHERE i.symbol = :symbol")
    int updatePriceBySymbol(
            @Param("symbol") String symbol, 
            @Param("price") BigDecimal price, 
            @Param("resolvedSymbol") String resolvedSymbol);

    @Query("SELECT DISTINCT i.symbol FROM Investment i")
    List<String> findDistinctSymbols();

    @Query("SELECT i.currentPrice FROM Investment i WHERE i.symbol = :symbol")
    Optional<BigDecimal> findCurrentPriceBySymbol(@Param("symbol") String symbol);
}