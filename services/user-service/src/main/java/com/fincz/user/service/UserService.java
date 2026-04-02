package com.fincz.user.service;

import com.fincz.user.dto.UserResponse;
import com.fincz.user.dto.UserUpdateRequest;
import com.fincz.user.entity.User;
import com.fincz.user.exception.UserException;
import com.fincz.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repo;

    /**
     * Fetches user profile data based on email.
     */
    public UserResponse getProfile(String email) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new UserException("User profile not found"));
        
        return mapToResponse(user);
    }

    /**
     * Updates user profile details for the authenticated user.
     *
     * @param email The email of the authenticated user.
     * @param request DTO containing editable profile fields.
     * @return UserResponse DTO of the updated user profile.
     */
    public UserResponse updateProfile(String email, UserUpdateRequest request) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new UserException("User profile not found"));

        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setAge(request.getAge());
        user.setOccupation(request.getOccupation());
        user.setFinancialGoals(request.getFinancialGoals());

        return mapToResponse(repo.save(user));
    }

    /**
     * Retrieves a user profile by ID.
     */
    public UserResponse getById(Long id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new UserException("User not found"));

        return mapToResponse(user);
    }

    private UserResponse mapToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setPhone(user.getPhone());
        response.setAge(user.getAge());
        response.setOccupation(user.getOccupation());
        response.setFinancialGoals(user.getFinancialGoals());
        return response;
    }
}