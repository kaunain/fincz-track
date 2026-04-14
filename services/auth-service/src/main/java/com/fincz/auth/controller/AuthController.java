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

package com.fincz.auth.controller;

import com.fincz.auth.dto.*;
import com.fincz.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 * 
 * REST Controller providing public endpoints for user authentication.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final AuthService service;

    /**
     * Endpoint to register a new user.
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest req) {
        logger.info("User signup attempt for email: {}", req.getEmail());
        try {
            service.signup(req);
            logger.info("User successfully registered with email: {}", req.getEmail());
            return ResponseEntity.ok("User registered");
        } catch (Exception e) {
            logger.error("Failed to register user with email: {}", req.getEmail(), e);
            throw e;
        }
    }

    /**
     * Endpoint to authenticate and receive a token.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest req,
            @RequestHeader(value = "X-Device-Token", required = false) String deviceToken) {
        logger.info("User login attempt for email: {}", req.getEmail());
        try {
            AuthResponse response = service.login(req, deviceToken);
            logger.info("User successfully logged in with email: {}", req.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.warn("Failed login attempt for email: {}", req.getEmail(), e);
            throw e;
        }
    }

    /**
     * Endpoint for authenticated users to change their password.
     */
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody ChangePasswordRequest req) {
        logger.info("Password change attempt for user: {}", email);
        service.changePassword(email, req);
        return ResponseEntity.ok("Password updated successfully");
    }

    /**
     * Generates MFA setup details for the authenticated user.
     */
    @GetMapping("/mfa/setup")
    public ResponseEntity<MfaSetupResponse> setupMfa(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(service.setupMfa(email));
    }

    /**
     * Confirms and enables MFA for the authenticated user.
     */
    @PostMapping("/mfa/enable")
    public ResponseEntity<?> enableMfa(@AuthenticationPrincipal String email, @Valid @RequestBody MfaRequest req) {
        service.enableMfa(email, req.getCode());
        return ResponseEntity.ok("MFA enabled successfully");
    }

    /**
     * Regenerates MFA recovery codes for the authenticated user.
     */
    @PostMapping("/mfa/recovery-codes/regenerate")
    public ResponseEntity<List<String>> regenerateRecoveryCodes(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(service.regenerateRecoveryCodes(email));
    }

    /**
     * Disables MFA for the authenticated user.
     */
    @PostMapping("/mfa/disable")
    public ResponseEntity<?> disableMfa(@AuthenticationPrincipal String email) {
        logger.info("MFA disable attempt for user: {}", email);
        service.disableMfa(email);
        return ResponseEntity.ok("MFA disabled successfully");
    }

    /**
     * Returns the current MFA status for the authenticated user.
     */
    @GetMapping("/mfa/status")
    public ResponseEntity<MfaStatusResponse> getMfaStatus(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(service.getMfaStatus(email));
    }

    /**
     * Internal endpoint for other services to check MFA status.
     */
    @GetMapping("/internal/mfa-status")
    public boolean getMfaStatusInternal(@RequestParam String email) {
        return service.getMfaStatus(email).isMfaEnabled();
    }

    /**
     * Public endpoint to verify MFA code during login.
     */
    @PostMapping("/mfa/verify")
    public ResponseEntity<AuthResponse> verifyMfa(@Valid @RequestBody MfaVerifyRequest req) {
        MfaVerifyResponse res = service.verifyMfa(req);
        
        ResponseEntity.BodyBuilder response = ResponseEntity.ok();
        if (res.getDeviceToken() != null) {
            response.header("X-Device-Token", res.getDeviceToken());
        }
        
        return response.body(new AuthResponse(res.getAccessToken(), false));
    }
}