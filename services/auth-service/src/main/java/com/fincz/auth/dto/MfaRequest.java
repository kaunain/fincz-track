/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for MFA-related actions like enabling or disabling MFA.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MfaRequest {

    /**
     * The 6-digit TOTP verification code.
     */
    @NotBlank(message = "Verification code is required")
    @Pattern(regexp = "^\\d{6}$", message = "Verification code must be 6 digits")
    private String code;
}