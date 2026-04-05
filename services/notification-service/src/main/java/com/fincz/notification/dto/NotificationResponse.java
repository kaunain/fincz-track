package com.fincz.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * DTO for notification response.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private String userEmail;
    private String type;
    private String subject;
    private String message;
    private LocalDateTime sentAt;
    private String status;
    private String errorMessage;

    // Explicit constructor for Lombok issues
    public NotificationResponse(Long id, String userEmail, String type, String subject, String message, LocalDateTime sentAt, String status, String errorMessage) {
        this.id = id;
        this.userEmail = userEmail;
        this.type = type;
        this.subject = subject;
        this.message = message;
        this.sentAt = sentAt;
        this.status = status;
        this.errorMessage = errorMessage;
    }
}