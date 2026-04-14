/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.user.repository;

import com.fincz.user.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    /**
     * Finds a user profile by their registered email address.
     */
    Optional<UserProfile> findByEmail(String email);
}