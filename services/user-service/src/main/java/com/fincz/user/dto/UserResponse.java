/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.user.dto;

import lombok.Data;

/**
 * DTO for sending user profile data to the frontend.
 */
@Data
public class UserResponse {
    private String email;
    private String name;
    private String firstName;
    private String lastName;
    private String phone;
    private String currency;
    private String avatarUrl;
    private boolean mfaEnabled;
}