package com.fincz.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * DTO for sending notification request.
 */
@Getter
@Setter
public class SendNotificationRequest {

    @NotBlank(message = "User email is required")
    @Email(message = "Invalid email format")
    private String userEmail;

    @NotBlank(message = "Notification type is required")
    private String type; // tax_reminder, portfolio_alert, etc.

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Message is required")
    private String message;
}