package com.fincz.user.service;

import com.fincz.user.config.JwtProperties;
import com.fincz.user.dto.*;
import com.fincz.user.entity.User;
import com.fincz.user.repository.UserRepository;
import com.fincz.user.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final MfaService mfaService;
    private final JwtProperties jwtProperties;

    @Transactional
    public void signup(SignupRequest req) {
        String normalizedEmail = req.getEmail().toLowerCase();

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPassword(encoder.encode(req.getPassword()));
        
        // Split name into first and last for the profile part of the entity
        if (req.getName() != null) {
            String[] parts = req.getName().split(" ", 2);
            user.setFirstName(parts[0]);
            if (parts.length > 1) {
                user.setLastName(parts[1]);
            }
        }

        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
        logger.info("User registered and profile initialized for: {}", normalizedEmail);
    }

    public AuthResponse login(LoginRequest req, String deviceToken) {
        String normalizedEmail = req.getEmail().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        if (user.isMfaEnabled()) {
            // Check if device is trusted to skip MFA
            if (deviceToken != null) {
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
            return new AuthResponse(null, true);
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, false);
    }

    /**
     * Starts the MFA setup process for a user.
     */
    @Transactional
    public MfaSetupResponse setupMfa(String email) {
        String normalizedEmail = email.toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String secret = mfaService.generateSecret();
        user.setMfaSecret(secret);

        // Generate 10 unique 8-character recovery codes
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            codes.add(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        user.setRecoveryCodes(codes);

        userRepository.save(user);

        return new MfaSetupResponse(secret, mfaService.getQrCodeUrl(normalizedEmail, secret), codes);
    }

    /**
     * Verifies MFA during login.
     */
    @Transactional
    public MfaVerifyResponse verifyMfa(MfaVerifyRequest req) {
        String normalizedEmail = req.getEmail().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean verified = mfaService.verifyCode(user.getMfaSecret(), req.getCode());

        // Fallback: Check if the provided code is a valid recovery code
        if (!verified && req.getCode() != null) {
            String inputCode = req.getCode().toUpperCase();
            if (user.getRecoveryCodes().contains(inputCode)) {
                user.getRecoveryCodes().remove(inputCode);
                userRepository.save(user);
                verified = true;
                logger.info("MFA verified using recovery code for user: {}", user.getEmail());
            }
        }

        if (!verified) {
            throw new RuntimeException("Invalid verification code");
        }

        String accessToken = jwtUtil.generateToken(user.getEmail());
        String deviceToken = null;

        if (req.isRememberMe()) {
            deviceToken = jwtUtil.generateToken(user.getEmail(), jwtProperties.getDeviceTokenExpiration());
        }

        return new MfaVerifyResponse(accessToken, deviceToken);
    }

    @Transactional
    public void enableMfa(String email, String code) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getMfaSecret() == null) {
            throw new RuntimeException("MFA setup not initiated. Please call setup first.");
        }

        if (mfaService.verifyCode(user.getMfaSecret(), code)) {
            user.setMfaEnabled(true);
            userRepository.save(user);
        } else {
            throw new RuntimeException("Invalid verification code");
        }
    }

    /**
     * Regenerates recovery codes for a user.
     */
    @Transactional
    public List<String> regenerateRecoveryCodes(String email) {
        String normalizedEmail = email.toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isMfaEnabled()) {
            throw new RuntimeException("MFA must be enabled to regenerate recovery codes");
        }

        List<String> codes = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            codes.add(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        user.setRecoveryCodes(codes);
        userRepository.save(user);

        return codes;
    }

    @Transactional
    public void disableMfa(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        userRepository.save(user);
    }
}