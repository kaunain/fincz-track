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

    // Explicit getters/setters as backup
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}