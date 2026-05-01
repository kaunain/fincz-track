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

package com.fincz.market;

import com.fincz.market.entity.StockPrice;
import com.fincz.market.repository.StockPriceRepository;
import com.fincz.market.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.util.List;

/**
 * Command-line application for syncing stock prices to database.
 * Can be run as: java -jar market-data-service.jar --sync
 * Or scheduled via cron.
 * 
 * Usage:
 *   java -jar market-data-service.jar --sync           # Sync all prices
 *   java -jar market-data-service.jar --sync --force   # Force sync ignoring cooldown
 *   java -jar market-data-service.jar --list            # List all stored prices
 *   java -jar market-data-service.jar --price RELIANCE # Get price for specific symbol
 */
@Slf4j
@SpringBootApplication(scanBasePackages = "com.fincz.market")
@EnableJpaRepositories(basePackages = "com.fincz.market.repository")
@RequiredArgsConstructor
public class MarketDataCli {

    public static void main(String[] args) {
        // Disable web server for CLI mode
        System.setProperty("spring.main.web-application-type", "none");
        SpringApplication.run(MarketDataCli.class, args);
    }

    private final MarketDataService marketDataService;
    private final StockPriceRepository stockPriceRepository;


    @Bean
    public CommandLineRunner runner() {
        return args -> {
            if (args.length == 0) {
                printUsage();
                return;
            }

            String command = args[0];
            boolean force = false;

            // Parse arguments
            for (String arg : args) {
                if (arg.equals("--force")) {
                    force = true;
                }
            }

            switch (command) {
                case "--sync" -> {
                    log.info("Starting stock price sync...");
                    String token = System.getenv("INTERNAL_TOKEN");
                    if (token == null || token.isBlank()) {
                        token = "Bearer " + System.getenv("JWT_TOKEN");
                    }
                    marketDataService.syncPrices(force, token)
                            .doOnNext(summary -> {
                                log.info("Sync completed: Total={}, Updated={}, Skipped={}", 
                                    summary.getTotalSymbols(), summary.getUpdatedSymbols(), summary.getSkippedSymbols());
                                log.info("✓ Sync completed successfully. Total: {}, Updated: {}, Skipped: {}",
                                    summary.getTotalSymbols(), summary.getUpdatedSymbols(), summary.getSkippedSymbols());
                            })
                            .doOnError(e -> {
                                log.error("✗ Sync failed: {}", e.getMessage());
                                System.exit(1);
                            })
                            .block();
                }
                case "--sync-symbol" -> {
                    // Sync specific symbol without needing portfolio service
                    if (args.length < 2) {
                        log.error("Error: Symbol required. Usage: --sync-symbol RELIANCE");
                        System.exit(1);
                    }
                    String symbol = args[1].toUpperCase();
                    log.info("Syncing single symbol: {}", symbol);
                    marketDataService.syncSingleSymbol(symbol, force)
                            .doOnNext(result -> {
                                log.info("✓ Synced: {} = ₹{}", symbol, result);
                            })
                            .doOnError(e -> {
                                log.error("✗ Sync failed: {}", e.getMessage());
                                System.exit(1);
                            })
                            .doOnTerminate(() -> log.info("Sync process finished."))
                            .block();
                }
                case "--list" -> {
                    log.info("Fetching all stock prices from database...");
                    List<StockPrice> prices = stockPriceRepository.findAll();
                    if (prices.isEmpty()) {
                        log.info("No stock prices found in database.");
                    } else {
                        log.info("=== Stored Stock Prices ===");
                        log.info(String.format("%-12s %-12s %-10s %-20s", "Symbol", "Price", "Change", "Last Updated"));
                        log.info("-".repeat(70));
                        for (StockPrice price : prices) {
                            log.info(String.format("%-12s ₹%-11s %-10s %-20s",
                                price.getSymbol(),
                                price.getPrice() != null ? price.getPrice().toString() : "N/A",
                                "",
                                price.getLastUpdated() != null ? price.getLastUpdated().toString() : "Never"));
                        }
                        log.info("-".repeat(70));
                        log.info("Total: {} symbols", prices.size());
                    }
                }
                case "--price" -> {
                    if (args.length < 2) {
                        log.error("Error: Symbol required. Usage: --price RELIANCE");
                        System.exit(1);
                    }
                    String symbol = args[1].toUpperCase();
                    log.info("Fetching price for symbol: {}", symbol);
                    var priceOpt = stockPriceRepository.findBySymbol(symbol);
                    if (priceOpt.isPresent()) {
                        StockPrice price = priceOpt.get();
                        log.info("=== {} ===", symbol);
                        log.info("Price: ₹{}", price.getPrice());
                        log.info("Open: ₹{}", price.getOpen());
                        log.info("High: ₹{}", price.getHigh());
                        log.info("Low: ₹{}", price.getLow());
                        log.info("Last Updated: {}", price.getLastUpdated());
                        if (price.getMarketCap() != null) {
                            log.info("Market Cap: ₹{}", price.getMarketCap());
                        }
                        if (price.getPe() != null) {
                            log.info("P/E: {}", price.getPe());
                        }
                    } else {
                        log.error("Symbol {} not found in database.", symbol);
                        log.error("Run --sync to fetch latest prices.");
                        System.exit(1);
                    }
                }
                case "--help", "-h" -> {
                    printUsage();
                }
                default -> {
                    log.error("Unknown command: {}", command);
                    printUsage();
                    System.exit(1);
                }
            }
        };
    }

    private void printUsage() {
        log.info("""
            ╔════════════════════════════════════════════════════════════╗
            ║         Market Data CLI - Stock Price Sync Tool            ║
            ╚════════════════════════════════════════════════════════════╝
            
            Usage:
              java -jar market-data-service.jar <command> [options]
            
            Commands:
              --sync              Sync all stock prices from API to DB
              --sync --force      Force sync ignoring cooldown period
              --list              List all stored stock prices
              --price <SYMBOL>   Get price for specific symbol
              --help              Show this help message
            
            Examples:
              java -jar market-data-service.jar --sync
              java -jar market-data-service.jar --sync --force
              java -jar market-data-service.jar --list
              java -jar market-data-service.jar --price RELIANCE
            
            Environment Variables Required:
              DB_URL          PostgreSQL database URL
              DB_USER         Database username
              DB_PASS         Database password
              MARKET_API_KEY  Alpha Vantage API key
              JWT_TOKEN       JWT token for portfolio service
            
            Cron Example (run daily at 1 AM):
              0 1 * * * cd /path/to && java -jar market-data-service.jar --sync
            """);
    }
}