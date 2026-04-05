package com.fincz.user.service;

import com.fincz.user.dto.UserResponse;
import com.fincz.user.dto.UserUpdateRequest;
import com.fincz.user.entity.User;
import com.fincz.user.exception.UserException;
import com.fincz.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private final UserRepository repo;

    /**
     * Creates a new user profile with basic information.
     * Used for testing purposes when user signs up in auth-service.
     */
    public UserResponse createProfile(String email, String name) {
        logger.debug("Creating user profile for email: {}", email);

        if (repo.findByEmail(email).isPresent()) {
            logger.warn("Attempted to create profile for existing email: {}", email);
            throw new UserException("User profile already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setFirstName(name);
        user.setUserId(1); // dummy for now

        User savedUser = repo.save(user);
        logger.info("User profile created successfully with ID: {} for email: {}", savedUser.getId(), email);
        return mapToResponse(savedUser);
    }

    /**
     * Updates user profile details for the authenticated user.
     *
     * @param email The email of the authenticated user.
     * @param request DTO containing editable profile fields.
     * @return UserResponse DTO of the updated user profile.
     */
    public UserResponse updateProfile(String email, UserUpdateRequest request) {
        logger.debug("Updating profile for email: {}", email);

        User user = repo.findByEmail(email)
                .orElseThrow(() -> {
                    logger.warn("Profile update failed - user not found: {}", email);
                    return new UserException("User profile not found");
                });

        user.setFirstName(request.getName());
        user.setPhone(request.getPhone());
        user.setAge(request.getAge());
        user.setOccupation(request.getOccupation());
        user.setFinancialGoals(request.getFinancialGoals());

        User updatedUser = repo.save(user);
        logger.info("Profile updated successfully for email: {}", email);
        return mapToResponse(updatedUser);
    }

    /**
     * Retrieves a user profile by ID.
     */
    public UserResponse getById(Long id) {
        logger.debug("Retrieving user profile by ID: {}", id);

        User user = repo.findById(id)
                .orElseThrow(() -> {
                    logger.warn("User retrieval failed - user not found with ID: {}", id);
                    return new UserException("User not found");
                });

        logger.debug("User profile retrieved successfully for ID: {}", id);
        return mapToResponse(user);
    }

    /**
     * Retrieves a user profile by email.
     */
    public UserResponse getProfile(String email) {
        logger.debug("Retrieving user profile by email: {}", email);

        User user = repo.findByEmail(email)
                .orElseThrow(() -> {
                    logger.warn("Profile retrieval failed - user not found: {}", email);
                    return new UserException("User profile not found");
                });

        logger.debug("User profile retrieved successfully for email: {}", email);
        return mapToResponse(user);
    }

    private UserResponse mapToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : ""));
        response.setEmail(user.getEmail());
        response.setRole("USER");
        response.setPhone(user.getPhone());
        response.setAge(user.getAge());
        response.setOccupation(user.getOccupation());
        response.setFinancialGoals(user.getFinancialGoals());
        return response;
    }
}