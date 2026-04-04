package com.fincz.notification.exception;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Custom exception for notification-related errors.
 */
public class NotificationException extends RuntimeException {

    public NotificationException(String message) {
        super(message);
    }

    public NotificationException(String message, Throwable cause) {
        super(message, cause);
    }
}