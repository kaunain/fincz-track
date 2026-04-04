package com.fincz.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Notification Service for Fincz-Track.
 * Handles email notifications and scheduled alerts.
 */
@SpringBootApplication
@EnableScheduling
public class NotificationServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(NotificationServiceApplication.class, args);
	}

}