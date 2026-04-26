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

 
package com.fincz.user.controller;

import com.fincz.user.dto.UserResponse;
import com.fincz.user.dto.UserUpdateRequest;
import com.fincz.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 * 
 * REST Controller for User Profile management.
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController extends BaseController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    private final UserService service;

    /**
     * Retrieves the profile of the currently authenticated user.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getProfile() {
        String email = getAuthenticatedUserEmail();
        logger.debug("Retrieving profile for authenticated user: {}", email);
        try {
            UserResponse response = service.getProfile(email);
            logger.debug("Profile retrieved successfully for user: {}", email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to retrieve profile for user: {}", email, e);
            throw e;
        }
    }

    /**
     * Updates the profile information for the currently authenticated user.
     */
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody UserUpdateRequest request) {
        String email = getAuthenticatedUserEmail();
        logger.info("Updating profile for user: {}", email);
        try {
            UserResponse response = service.updateProfile(email, request);
            logger.info("Profile updated successfully for user: {}", email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to update profile for user: {}", email, e);
            throw e;
        }
    }

    /**
     * Retrieves a user profile by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        logger.debug("Retrieving user profile by ID: {}", id);
        try {
            UserResponse response = service.getById(id);
            logger.debug("User profile retrieved successfully for ID: {}", id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to retrieve user profile for ID: {}", id, e);
            throw e;
        }
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        logger.debug("Health check endpoint called");
        return ResponseEntity.ok("User Service is running!");
    }
}