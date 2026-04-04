package com.fincz.portfolio.exception;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Custom exception for portfolio-related errors.
 */
public class PortfolioException extends RuntimeException {

    public PortfolioException(String message) {
        super(message);
    }

    public PortfolioException(String message, Throwable cause) {
        super(message, cause);
    }
}