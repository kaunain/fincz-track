package com.fincz.auth.service;

import com.fincz.auth.dto.LoginRequest;
import com.fincz.auth.dto.SignupRequest;
import com.fincz.auth.entity.User;
import com.fincz.auth.exception.AuthException;
import com.fincz.auth.repository.UserRepository;
import com.fincz.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
    public String login(LoginRequest req) {
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

        String token = jwtUtil.generateToken(user.getEmail());
        logger.info("JWT token generated successfully for user: {}", user.getEmail());
        return token;
    }
}