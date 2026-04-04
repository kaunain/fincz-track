package com.fincz.auth.service;

import com.fincz.auth.dto.LoginRequest;
import com.fincz.auth.dto.SignupRequest;
import com.fincz.user.entity.User;
import com.fincz.auth.exception.AuthException;
import com.fincz.auth.repository.UserRepository;
import com.fincz.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
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

    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    /**
     * Handles user registration.
     * Throws AuthException if the email is already registered.
     */
    public void signup(SignupRequest req) {

        // Prevent duplicate registrations
        if (repo.findByEmail(req.getEmail()).isPresent()) {
            throw new AuthException("Email already exists");
        }

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(encoder.encode(req.getPassword()));
        user.setRole("ROLE_USER");

        repo.save(user);
    }

    /**
     * Authenticates user credentials and generates a JWT.
     * 
     * @return Generated JWT string
     */
    public String login(LoginRequest req) {

        User user = repo.findByEmail(req.getEmail())
                .orElseThrow(() -> new AuthException("User not found"));

        // Validate the provided raw password against the hashed database password
        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            throw new AuthException("Invalid password");
        }

        return jwtUtil.generateToken(user.getEmail());
    }
}