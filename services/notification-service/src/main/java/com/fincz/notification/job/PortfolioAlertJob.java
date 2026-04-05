package com.fincz.notification.job;

import com.fincz.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Scheduled job for sending portfolio performance alerts.
 */
@Component
public class PortfolioAlertJob {

    private static final Logger log = LoggerFactory.getLogger(PortfolioAlertJob.class);

    private final NotificationService notificationService;

    // Explicit constructor
    public PortfolioAlertJob(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Runs every hour to check for portfolio alerts.
     */
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    public void sendPortfolioAlerts() {
        log.info("Running scheduled portfolio alert job");
        try {
            notificationService.sendPortfolioAlerts();
        } catch (Exception e) {
            log.error("Error in portfolio alert job: {}", e.getMessage(), e);
        }
    }
}