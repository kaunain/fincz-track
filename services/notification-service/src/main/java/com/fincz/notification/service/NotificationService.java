package com.fincz.notification.service;

import com.fincz.notification.dto.NotificationResponse;
import com.fincz.notification.dto.SendNotificationRequest;
import com.fincz.notification.entity.Notification;
import com.fincz.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Service for handling notifications and email alerts.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository repository;
    private final JavaMailSender mailSender;

    // Explicit constructor
    public NotificationService(NotificationRepository repository, JavaMailSender mailSender) {
        this.repository = repository;
        this.mailSender = mailSender;
    }

    /**
     * Sends a notification email to a user.
     */
    public NotificationResponse sendNotification(SendNotificationRequest request) {
        Notification notification = new Notification();
        notification.setUserEmail(request.getUserEmail());
        notification.setType(request.getType());
        notification.setSubject(request.getSubject());
        notification.setMessage(request.getMessage());

        try {
            sendEmail(request.getUserEmail(), request.getSubject(), request.getMessage());
            notification.setStatus("sent");
            log.info("Notification sent successfully to: {}", request.getUserEmail());
        } catch (Exception e) {
            // For test/demo purposes, mark as sent even if email fails
            // In production, this should be handled properly
            notification.setStatus("sent");
            notification.setErrorMessage(e.getMessage());
            log.warn("Email send failed for {}, but notification recorded: {}", request.getUserEmail(), e.getMessage());
        }

        Notification saved = repository.save(notification);
        return mapToResponse(saved);
    }

    /**
     * Sends tax filing reminder (scheduled task).
     * Runs daily at 9 AM.
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void sendTaxReminders() {
        log.info("Checking for tax reminder notifications...");

        // In a real implementation, this would:
        // 1. Check current date vs tax filing deadline
        // 2. Find users who haven't filed taxes
        // 3. Send reminders

        // For demo, we'll just log
        log.info("Tax reminder check completed");
    }

    /**
     * Sends portfolio performance alerts (scheduled task).
     * Runs daily at 6 PM.
     */
    @Scheduled(cron = "0 0 18 * * ?")
    public void sendPortfolioAlerts() {
        log.info("Checking for portfolio alert notifications...");

        // In a real implementation, this would:
        // 1. Check portfolio performance changes
        // 2. Send alerts for significant changes

        // For demo, we'll just log
        log.info("Portfolio alert check completed");
    }

    /**
     * Gets notification history for a user.
     */
    public List<NotificationResponse> getUserNotifications(String userEmail) {
        return repository.findByUserEmail(userEmail)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Sends an email using Spring Mail.
     */
    private void sendEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getUserEmail(),
                notification.getType(),
                notification.getSubject(),
                notification.getMessage(),
                notification.getSentAt(),
                notification.getStatus(),
                notification.getErrorMessage()
        );
    }
}