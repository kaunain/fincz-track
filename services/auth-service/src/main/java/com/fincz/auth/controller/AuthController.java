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

import com.fincz.auth.dto.AuthResponse;
import com.fincz.auth.dto.LoginRequest;
import com.fincz.auth.dto.SignupRequest;
import com.fincz.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        logger.info("User login attempt for email: {}", req.getEmail());
        try {
            String token = service.login(req);
            logger.info("User successfully logged in with email: {}", req.getEmail());
            return ResponseEntity.ok(new AuthResponse(token));
        } catch (Exception e) {
            logger.warn("Failed login attempt for email: {}", req.getEmail(), e);
            throw e;
        }
    }
}