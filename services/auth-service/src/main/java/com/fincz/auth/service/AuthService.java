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

package com.fincz.auth.service;

import com.fincz.auth.dto.*;
import com.fincz.auth.entity.User;
import com.fincz.auth.exception.AuthException;
import com.fincz.auth.repository.UserRepository;
import com.fincz.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 * 
 * Service layer handling core authentication business logic.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final MfaService mfaService;

    /**
     * Handles user registration.
     * Throws AuthException if the email is already registered.
     */
    public void signup(SignupRequest req) {
        logger.debug("Processing signup request for email: {}", req.getEmail());

        // Prevent duplicate registrations
        if (repo.findByEmail(req.getEmail()).isPresent()) {
            logger.warn("Signup attempt failed - email already exists: {}", req.getEmail());
            throw new AuthException("Email already exists");
        }

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(encoder.encode(req.getPassword()));
        user.setRole("ROLE_USER");

        User savedUser = repo.save(user);
        logger.info("User successfully created with ID: {} and email: {}", savedUser.getId(), savedUser.getEmail());
    }

    /**
     * Authenticates user credentials and generates a JWT.
     * 
     * @return Generated JWT string
     */
    public AuthResponse login(LoginRequest req, String deviceToken) {
        logger.debug("Processing login request for email: {}", req.getEmail());

        User user = repo.findByEmail(req.getEmail())
                .orElseThrow(() -> {
                    logger.warn("Login attempt failed - user not found: {}", req.getEmail());
                    return new AuthException("User not found");
                });

        // Validate the provided raw password against the hashed database password
        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            logger.warn("Login attempt failed - invalid password for email: {}", req.getEmail());
            throw new AuthException("Invalid password");
        }

        // Check if device is trusted to skip MFA
        if (Boolean.TRUE.equals(user.getMfaEnabled()) && deviceToken != null) {
            try {
                String emailFromToken = jwtUtil.extractEmail(deviceToken);
                if (user.getEmail().equals(emailFromToken)) {
                    logger.info("MFA bypassed via trusted device token for user: {}", user.getEmail());
                    return new AuthResponse(jwtUtil.generateToken(user.getEmail()), false);
                }
            } catch (Exception e) {
                logger.debug("Invalid or expired device token provided for user: {}", user.getEmail());
            }
        }

        if (Boolean.TRUE.equals(user.getMfaEnabled())) {
            return new AuthResponse(null, true);
        }

        String token = jwtUtil.generateToken(user.getEmail());
        logger.info("JWT token generated successfully for user: {}", user.getEmail());
        return new AuthResponse(token, false);
    }

    /**
     * Updates the password for an authenticated user.
     */
    @Transactional
    public void changePassword(String email, ChangePasswordRequest req) {
        logger.info("Processing password change request for user: {}", email);

        User user = repo.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found with email: " + email));

        // Verify the current password
        if (!encoder.matches(req.getCurrent(), user.getPassword())) {
            logger.warn("Password change failed for user {}: current password incorrect", email);
            throw new AuthException("The current password you provided is incorrect");
        }

        // Verify new password and confirmation match
        if (!req.getNewPassword().equals(req.getConfirm())) {
            throw new AuthException("The new password and confirmation do not match");
        }

        // Encode and save the new password
        user.setPassword(encoder.encode(req.getNewPassword()));
        repo.save(user);
        logger.info("Password successfully updated for user: {}", email);
    }

    /**
     * Starts the MFA setup process for a user.
     */
    public MfaSetupResponse setupMfa(String email) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found"));

        String secret = mfaService.generateSecret();
        user.setMfaSecret(secret);

        // Generate 10 unique 8-character recovery codes
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            codes.add(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        user.setRecoveryCodes(codes);

        repo.save(user);

        return new MfaSetupResponse(secret, mfaService.getQrCodeUrl(email, secret), codes);
    }

    /**
     * Enables MFA after verifying the first code.
     */
    public void enableMfa(String email, String code) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found"));

        if (mfaService.verifyCode(user.getMfaSecret(), code)) {
            user.setMfaEnabled(true);
            repo.save(user);
        } else {
            throw new AuthException("Invalid verification code");
        }
    }

    /**
     * Regenerates recovery codes for a user.
     */
    @Transactional
    public List<String> regenerateRecoveryCodes(String email) {
        logger.info("Regenerating recovery codes for user: {}", email);
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found"));

        if (!Boolean.TRUE.equals(user.getMfaEnabled())) {
            throw new AuthException("MFA must be enabled to regenerate recovery codes");
        }

        List<String> codes = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            codes.add(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        user.setRecoveryCodes(codes);
        repo.save(user);

        return codes;
    }

    /**
     * Disables MFA for a user.
     */
    @Transactional
    public void disableMfa(String email) {
        logger.info("Processing MFA disable request for user: {}", email);
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found"));

        user.setMfaEnabled(false);
        user.setMfaSecret(null); // Clear secret key for security
        repo.save(user);
        logger.info("MFA successfully disabled for user: {}", email);
    }

    /**
     * Verifies MFA during login.
     */
    public MfaVerifyResponse verifyMfa(MfaVerifyRequest req) {
        User user = repo.findByEmail(req.getEmail())
                .orElseThrow(() -> new AuthException("User not found"));

        boolean verified = mfaService.verifyCode(user.getMfaSecret(), req.getCode());

        // Fallback: Check if the provided code is a valid recovery code
        if (!verified && req.getCode() != null) {
            String inputCode = req.getCode().toUpperCase();
            if (user.getRecoveryCodes().contains(inputCode)) {
                user.getRecoveryCodes().remove(inputCode);
                repo.save(user);
                verified = true;
                logger.info("MFA verified using recovery code for user: {}", user.getEmail());
            }
        }

        if (!verified) {
            throw new AuthException("Invalid verification code");
        }

        String accessToken = jwtUtil.generateToken(user.getEmail());
        String deviceToken = null;

        // Generate a long-lived device token if requested
        if (req.isRememberMe()) {
            // In a production app, this should be a different token type with a longer expiry (e.g., 30 days)
            deviceToken = jwtUtil.generateToken(user.getEmail()); 
        }

        return new MfaVerifyResponse(accessToken, deviceToken);
    }
}