package com.fincz.user.controller;

import com.fincz.user.dto.UserResponse;
import com.fincz.user.dto.UserUpdateRequest;
import com.fincz.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 * 
 * REST Controller for User Profile management.
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService service;

    /**
     * Retrieves the profile of the currently authenticated user.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(service.getProfile(email));
    }

    /**
     * Updates the profile information for the currently authenticated user.
     */
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(service.updateProfile(email, request));
    }

    /**
     * Retrieves a user profile by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }
}