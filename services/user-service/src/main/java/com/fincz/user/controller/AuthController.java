package com.fincz.user.controller;

import com.fincz.user.dto.*;
import com.fincz.user.service.AuthService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest req) {
        logger.info("User signup attempt for email: {}", req.getEmail());
        try {
            authService.signup(req);
            logger.info("User successfully registered with email: {}", req.getEmail());
            return ResponseEntity.ok("User registered successfully");
        } catch (Exception e) {
            logger.error("Failed to register user with email: {}", req.getEmail(), e);
            throw e;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest req,
            @RequestHeader(value = "X-Device-Token", required = false) String deviceToken) {
        logger.info("User login attempt for email: {}", req.getEmail());
        try {
            AuthResponse response = authService.login(req, deviceToken);
            logger.info("User successfully logged in with email: {}", req.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.warn("Failed login attempt for email: {}", req.getEmail(), e);
            throw e;
        }
    }

    @GetMapping("/mfa/setup")
    public ResponseEntity<MfaSetupResponse> setupMfa(@RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(authService.setupMfa(email));
    }

    @PostMapping("/mfa/enable")
    public ResponseEntity<?> enableMfa(@RequestHeader("X-User-Email") String email, @Valid @RequestBody MfaRequest req) {
        authService.enableMfa(email, req.getCode());
        return ResponseEntity.ok("MFA enabled");
    }

    @PostMapping("/mfa/disable")
    public ResponseEntity<?> disableMfa(@RequestHeader("X-User-Email") String email) {
        authService.disableMfa(email);
        return ResponseEntity.ok("MFA disabled");
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<MfaVerifyResponse> verifyMfa(@Valid @RequestBody MfaVerifyRequest req) {
        return ResponseEntity.ok(authService.verifyMfa(req));
    }

    @PostMapping("/mfa/recovery-codes/regenerate")
    public ResponseEntity<List<String>> regenerateRecoveryCodes(@RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(authService.regenerateRecoveryCodes(email));
    }
}