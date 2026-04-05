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