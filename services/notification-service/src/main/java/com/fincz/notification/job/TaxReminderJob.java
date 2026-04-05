package com.fincz.notification.job;

import com.fincz.notification.service.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Scheduled job for sending tax filing reminders.
 */
@Component
@Slf4j
public class TaxReminderJob {


    private final NotificationService notificationService;

    // Explicit constructor
    public TaxReminderJob(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Runs every day at 9 AM to check for tax filing reminders.
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void sendTaxReminders() {
        log.info("Running scheduled tax reminder job");
        try {
            notificationService.sendTaxReminders();
        } catch (Exception e) {
            log.error("Error in tax reminder job: {}", e.getMessage(), e);
        }
    }
}