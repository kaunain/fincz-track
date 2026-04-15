/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.user.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for JWT.
 */
@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    private String secret;
    private long expiration; // Expiration for access tokens (e.g., 24 hours)
    private long deviceTokenExpiration; // Expiration for device tokens (e.g., 30 days)
}