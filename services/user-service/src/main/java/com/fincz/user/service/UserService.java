/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.user.service;

import com.fincz.user.entity.User;
import com.fincz.user.repository.UserRepository;
import com.fincz.user.dto.UserResponse;
import com.fincz.user.dto.UserUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Retrieves the profile data for a user.
     */
    public UserResponse getProfile(String email) {
        User profile = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return convertToResponse(profile);
    }

    /**
     * Retrieves a user profile by its ID.
     */
    public UserResponse getById(Long id) {
        User profile = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Profile not found with id: " + id));
        return convertToResponse(profile);
    }

    /**
     * Updates an existing user profile.
     */
    @Transactional
    public UserResponse updateProfile(String email, UserUpdateRequest request) {
        User profile = userRepository.findByEmail(email)
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

        return convertToResponse(userRepository.save(profile));
    }

    private UserResponse convertToResponse(User profile) {
        UserResponse response = new UserResponse();
        response.setEmail(profile.getEmail());
        response.setName((profile.getFirstName() != null ? profile.getFirstName() : "") + " " + (profile.getLastName() != null ? profile.getLastName() : ""));
        response.setFirstName(profile.getFirstName());
        response.setLastName(profile.getLastName());
        response.setPhone(profile.getPhone());
        response.setCurrency(profile.getCurrency());
        response.setAvatarUrl(profile.getAvatarUrl());
        response.setMfaEnabled(profile.isMfaEnabled());
        return response;
    }
}