/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.user.repository;

import com.fincz.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for User entity operations.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their email address.
     * @param email The email to search for.
     * @return An Optional containing the User if found.
     */
    Optional<User> findByEmail(String email);
}