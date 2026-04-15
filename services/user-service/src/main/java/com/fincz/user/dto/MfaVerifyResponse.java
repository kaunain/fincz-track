package com.fincz.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for successful MFA verification response.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MfaVerifyResponse {
    private String accessToken;
    private String deviceToken;
}