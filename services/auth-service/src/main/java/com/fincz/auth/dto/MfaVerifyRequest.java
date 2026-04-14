/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MfaVerifyRequest {
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Verification code is required")
    private String code;

    private boolean rememberMe;
}