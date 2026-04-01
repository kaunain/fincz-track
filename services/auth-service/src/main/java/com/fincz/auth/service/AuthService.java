package com.fincz.auth.service;

import com.fincz.auth.dto.LoginRequest;
import com.fincz.auth.dto.SignupRequest;
import com.fincz.auth.entity.User;
import com.fincz.auth.exception.AuthException;
import com.fincz.auth.repository.UserRepository;
import com.fincz.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public void signup(SignupRequest req) {

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

    public String login(LoginRequest req) {

        User user = repo.findByEmail(req.getEmail())
                .orElseThrow(() -> new AuthException("User not found"));

        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            throw new AuthException("Invalid password");
        }

        return jwtUtil.generateToken(user.getEmail());
    }
}