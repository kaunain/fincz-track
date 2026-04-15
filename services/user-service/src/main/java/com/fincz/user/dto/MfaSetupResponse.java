package com.fincz.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO for MFA setup response containing the secret and QR code URL.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MfaSetupResponse {
    private String secret;
    private String qrCodeUrl;
    private List<String> recoveryCodes;
}