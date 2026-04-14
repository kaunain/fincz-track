/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for MFA setup details, including recovery codes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MfaSetupResponse {
    private String secret;
    private String qrCodeUrl;
    private List<String> recoveryCodes;
}