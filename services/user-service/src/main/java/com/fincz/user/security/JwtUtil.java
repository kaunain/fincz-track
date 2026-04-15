/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.user.security;

import com.fincz.user.config.JwtProperties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Utility class for handling JSON Web Tokens (JWT) in the consolidated User Service.
 */
@Component
@RequiredArgsConstructor
public class JwtUtil {

    private final JwtProperties jwtProperties;

    /**
     * Decodes the Base64 secret key and returns a HMAC SecretKey object.
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generates a signed JWT for a specific user email.
     */
    public String generateToken(String email) {
        return generateToken(email, jwtProperties.getExpiration());
    }

    /**
     * Generates a signed JWT with a custom expiration time.
     */
    public String generateToken(String email, long expirationMillis) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMillis))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extracts the user email (subject) from a signed JWT.
     */
    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }
}