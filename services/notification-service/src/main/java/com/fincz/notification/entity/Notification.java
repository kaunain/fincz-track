package com.fincz.notification.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Notification entity to track sent notifications.
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String type; // tax_reminder, portfolio_alert, etc.

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column
    private String status; // sent, failed

    @Column
    private String errorMessage;

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
        if (status == null) {
            status = "sent";
        }
    }
}