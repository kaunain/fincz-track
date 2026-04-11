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

package com.fincz.notification.controller;

import com.fincz.notification.dto.NotificationResponse;
import com.fincz.notification.dto.SendNotificationRequest;
import com.fincz.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class NotificationController {


    private final NotificationService service;

    /**
     * Sends a notification to a user.
     */
    @PostMapping("/send")
    public ResponseEntity<NotificationResponse> sendNotification(@Valid @RequestBody SendNotificationRequest request) {
        log.info("Sending notification to user: {} with type: {}", request.getUserEmail(), request.getType());

        try {
            NotificationResponse response = service.sendNotification(request);
            log.info("Successfully sent notification to user {}: id={}", request.getUserEmail(), response.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to send notification to user {}: {}", request.getUserEmail(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Gets notification history for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(@AuthenticationPrincipal String userEmail) {
        log.debug("Retrieving notifications for user: {}", userEmail);

        try {
            List<NotificationResponse> notifications = service.getUserNotifications(userEmail);
            log.info("Retrieved {} notifications for user {}", notifications.size(), userEmail);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Failed to retrieve notifications for user {}: {}", userEmail, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Manually triggers tax reminder check (for testing).
     */
    @PostMapping("/tax-reminder")
    public ResponseEntity<String> triggerTaxReminder() {
        log.info("Manually triggering tax reminder check");

        try {
            service.sendTaxReminders();
            log.info("Tax reminder check completed successfully");
            return ResponseEntity.ok("Tax reminder check triggered");
        } catch (Exception e) {
            log.error("Failed to trigger tax reminder check: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Manually triggers portfolio alert check (for testing).
     */
    @PostMapping("/portfolio-alert")
    public ResponseEntity<String> triggerPortfolioAlert() {
        log.info("Manually triggering portfolio alert check");

        try {
            service.sendPortfolioAlerts();
            log.info("Portfolio alert check completed successfully");
            return ResponseEntity.ok("Portfolio alert check triggered");
        } catch (Exception e) {
            log.error("Failed to trigger portfolio alert check: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        log.debug("Health check request received");
        String response = "Notification Service is running!";
        log.debug("Health check response: {}", response);
        return ResponseEntity.ok(response);
    }
}