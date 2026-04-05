package com.fincz.notification.controller;

import com.fincz.notification.dto.NotificationResponse;
import com.fincz.notification.dto.SendNotificationRequest;
import com.fincz.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * REST Controller for Notification operations.
 */
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    private final NotificationService service;

    /**
     * Sends a notification to a user.
     */
    @PostMapping("/send")
    public ResponseEntity<NotificationResponse> sendNotification(@Valid @RequestBody SendNotificationRequest request) {
        logger.info("Sending notification to user: {} with type: {}", request.getUserEmail(), request.getType());

        try {
            NotificationResponse response = service.sendNotification(request);
            logger.info("Successfully sent notification to user {}: id={}", request.getUserEmail(), response.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to send notification to user {}: {}", request.getUserEmail(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Gets notification history for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(@AuthenticationPrincipal String userEmail) {
        logger.debug("Retrieving notifications for user: {}", userEmail);

        try {
            List<NotificationResponse> notifications = service.getUserNotifications(userEmail);
            logger.info("Retrieved {} notifications for user {}", notifications.size(), userEmail);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            logger.error("Failed to retrieve notifications for user {}: {}", userEmail, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Manually triggers tax reminder check (for testing).
     */
    @PostMapping("/tax-reminder")
    public ResponseEntity<String> triggerTaxReminder() {
        logger.info("Manually triggering tax reminder check");

        try {
            service.sendTaxReminders();
            logger.info("Tax reminder check completed successfully");
            return ResponseEntity.ok("Tax reminder check triggered");
        } catch (Exception e) {
            logger.error("Failed to trigger tax reminder check: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Manually triggers portfolio alert check (for testing).
     */
    @PostMapping("/portfolio-alert")
    public ResponseEntity<String> triggerPortfolioAlert() {
        logger.info("Manually triggering portfolio alert check");

        try {
            service.sendPortfolioAlerts();
            logger.info("Portfolio alert check completed successfully");
            return ResponseEntity.ok("Portfolio alert check triggered");
        } catch (Exception e) {
            logger.error("Failed to trigger portfolio alert check: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        logger.debug("Health check request received");
        String response = "Notification Service is running!";
        logger.debug("Health check response: {}", response);
        return ResponseEntity.ok(response);
    }
}