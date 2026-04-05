package com.fincz.notification.controller;

import com.fincz.notification.dto.NotificationResponse;
import com.fincz.notification.dto.SendNotificationRequest;
import com.fincz.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
public class NotificationController {

    private final NotificationService service;

    // Explicit constructor
    public NotificationController(NotificationService service) {
        this.service = service;
    }

    /**
     * Sends a notification to a user.
     */
    @PostMapping("/send")
    public ResponseEntity<NotificationResponse> sendNotification(@Valid @RequestBody SendNotificationRequest request) {
        NotificationResponse response = service.sendNotification(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Gets notification history for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(@AuthenticationPrincipal String userEmail) {
        List<NotificationResponse> notifications = service.getUserNotifications(userEmail);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Manually triggers tax reminder check (for testing).
     */
    @PostMapping("/tax-reminder")
    public ResponseEntity<String> triggerTaxReminder() {
        service.sendTaxReminders();
        return ResponseEntity.ok("Tax reminder check triggered");
    }

    /**
     * Manually triggers portfolio alert check (for testing).
     */
    @PostMapping("/portfolio-alert")
    public ResponseEntity<String> triggerPortfolioAlert() {
        service.sendPortfolioAlerts();
        return ResponseEntity.ok("Portfolio alert check triggered");
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Notification Service is running!");
    }
}