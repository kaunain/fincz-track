/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.user.service;

import com.fincz.user.client.AuthServiceClient;
import com.fincz.user.entity.UserProfile;
import com.fincz.user.repository.UserProfileRepository;
import com.fincz.user.dto.UserResponse;
import com.fincz.user.dto.UserUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private final UserProfileRepository repository;
    private final AuthServiceClient authClient;

    /**
     * Retrieves the profile data for a user.
     */
    public UserResponse getProfile(String email) {
        UserProfile profile = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return convertToResponse(profile);
    }

    /**
     * Retrieves a user profile by its ID.
     */
    public UserResponse getById(Long id) {
        UserProfile profile = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Profile not found with id: " + id));
        return convertToResponse(profile);
    }

    /**
     * Creates a new user profile.
     */
    @Transactional
    public UserResponse createProfile(String email, String name) {
        if (repository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Profile already exists for email: " + email);
        }

        UserProfile profile = new UserProfile();
        profile.setEmail(email);
        profile.setUserId(0L); // Default/Placeholder ID for the test endpoint

        if (name != null) {
            String[] parts = name.split(" ", 2);
            profile.setFirstName(parts[0]);
            if (parts.length > 1) {
                profile.setLastName(parts[1]);
            }
        }

        return convertToResponse(repository.save(profile));
    }

    /**
     * Updates an existing user profile.
     */
    @Transactional
    public UserResponse updateProfile(String email, UserUpdateRequest request) {
        UserProfile profile = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Profile not found for email: " + email));

        if (request.getName() != null) {
            String[] parts = request.getName().split(" ", 2);
            profile.setFirstName(parts[0]);
            profile.setLastName(parts.length > 1 ? parts[1] : "");
        }

        profile.setPhone(request.getPhone());
        profile.setAge(request.getAge());
        profile.setOccupation(request.getOccupation());
        profile.setFinancialGoals(request.getFinancialGoals());
        profile.setUpdatedAt(LocalDateTime.now());

        return convertToResponse(repository.save(profile));
    }

    private UserResponse convertToResponse(UserProfile profile) {
        UserResponse response = new UserResponse();
        response.setEmail(profile.getEmail());
        response.setName((profile.getFirstName() != null ? profile.getFirstName() : "") + " " + (profile.getLastName() != null ? profile.getLastName() : ""));
        response.setFirstName(profile.getFirstName());
        response.setLastName(profile.getLastName());
        response.setPhone(profile.getPhone());
        response.setCurrency(profile.getCurrency());
        response.setAvatarUrl(profile.getAvatarUrl());
        
        // Fetch MFA status from Auth Service on the fly
        try {
            AuthServiceClient.MfaStatusResponse mfaStatusResponse = authClient.getMfaStatus(profile.getEmail());
            response.setMfaEnabled(mfaStatusResponse.isMfaEnabled());
            logger.debug("MFA status fetched successfully for user {}: {}", profile.getEmail(), mfaStatusResponse.isMfaEnabled());
        } catch (Exception e) {
            logger.error("Failed to fetch MFA status for user: {}. Error: {}", profile.getEmail(), e.getMessage(), e);
            // Default to false if we can't fetch the status
            response.setMfaEnabled(false);
        }
        return response;
    }
}