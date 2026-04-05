package com.fincz.notification.job;

import com.fincz.notification.service.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Scheduled job for sending portfolio performance alerts.
 */
@Component
@Slf4j
public class PortfolioAlertJob {


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