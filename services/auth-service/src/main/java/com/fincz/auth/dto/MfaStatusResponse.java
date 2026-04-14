/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO to return the MFA status.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MfaStatusResponse {
    private boolean mfaEnabled;
}