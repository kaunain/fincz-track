package com.fincz.market;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Market Data Service for Fincz-Track.
 * Provides stock prices and market data.
 */
@SpringBootApplication
@EnableCaching
public class MarketDataServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(MarketDataServiceApplication.class, args);
	}

}