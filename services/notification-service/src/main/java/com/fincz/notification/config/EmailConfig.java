package com.fincz.notification.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Email configuration properties.
 */
@Configuration
@ConfigurationProperties(prefix = "fincz.email")
@Data
public class EmailConfig {

    private String host = "smtp.gmail.com";
    private int port = 587;
    private String username = "noreply@fincz-track.com";
    private String password = "your-app-password";
    private String from = "noreply@fincz-track.com";
    private boolean auth = true;
    private boolean starttls = true;
}