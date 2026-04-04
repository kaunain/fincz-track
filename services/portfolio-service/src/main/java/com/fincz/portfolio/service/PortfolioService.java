package com.fincz.portfolio.service;

import com.fincz.portfolio.dto.AddInvestmentRequest;
import com.fincz.portfolio.dto.NetWorthResponse;
import com.fincz.portfolio.dto.PortfolioResponse;
import com.fincz.portfolio.entity.Portfolio;
import com.fincz.portfolio.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Service class for portfolio management operations.
 */
@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository repository;

    /**
     * Adds a new investment to user's portfolio.
     */
    @Transactional
    public PortfolioResponse addInvestment(String userEmail, AddInvestmentRequest request) {
        Portfolio portfolio = new Portfolio();
        portfolio.setUserEmail(userEmail);
        portfolio.setType(request.getType());
        portfolio.setName(request.getName());
        portfolio.setSymbol(request.getSymbol());
        portfolio.setUnits(request.getUnits());
        portfolio.setBuyPrice(request.getBuyPrice());

        // For now, set current price same as buy price
        // In real implementation, this would come from market data service
        portfolio.setCurrentPrice(request.getBuyPrice());

        Portfolio saved = repository.save(portfolio);
        return mapToResponse(saved);
    }

    /**
     * Gets user's complete portfolio.
     */
    public List<PortfolioResponse> getPortfolio(String userEmail) {
        return repository.findByUserEmail(userEmail)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Gets portfolio items by type.
     */
    public List<PortfolioResponse> getPortfolioByType(String userEmail, String type) {
        return repository.findByUserEmailAndType(userEmail, type)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Calculates user's net worth.
     */
    public NetWorthResponse getNetWorth(String userEmail) {
        BigDecimal totalInvestment = repository.getTotalInvestmentByUser(userEmail);
        BigDecimal currentValue = repository.getCurrentValueByUser(userEmail);
        BigDecimal totalPnl = repository.getTotalPnLByUser(userEmail);

        BigDecimal pnlPercentage = BigDecimal.ZERO;
        if (totalInvestment != null && totalInvestment.compareTo(BigDecimal.ZERO) != 0) {
            pnlPercentage = totalPnl.divide(totalInvestment, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        return new NetWorthResponse(
                totalInvestment != null ? totalInvestment : BigDecimal.ZERO,
                currentValue != null ? currentValue : BigDecimal.ZERO,
                totalPnl != null ? totalPnl : BigDecimal.ZERO,
                pnlPercentage
        );
    }

    /**
     * Updates current prices for all holdings (would be called by market data service).
     */
    @Transactional
    public void updateCurrentPrices(String symbol, BigDecimal currentPrice) {
        List<Portfolio> holdings = repository.findAll().stream()
                .filter(p -> p.getSymbol().equals(symbol))
                .collect(Collectors.toList());

        for (Portfolio holding : holdings) {
            holding.setCurrentPrice(currentPrice);
            repository.save(holding);
        }
    }

    private PortfolioResponse mapToResponse(Portfolio portfolio) {
        return new PortfolioResponse(
                portfolio.getId(),
                portfolio.getType(),
                portfolio.getName(),
                portfolio.getSymbol(),
                portfolio.getUnits(),
                portfolio.getBuyPrice(),
                portfolio.getCurrentPrice(),
                portfolio.getTotalInvestment(),
                portfolio.getCurrentValue(),
                portfolio.getPnl(),
                portfolio.getPnlPercentage(),
                portfolio.getCreatedAt(),
                portfolio.getUpdatedAt()
        );
    }
}