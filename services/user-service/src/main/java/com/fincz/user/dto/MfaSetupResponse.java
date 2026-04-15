package com.fincz.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO sent to the frontend during the MFA setup process.
 * Contains the secret key, the QR code image data, and backup recovery codes.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MfaSetupResponse {
    private String secret;
    
    // This contains the Base64 encoded QR code image (Data URI)
    private String qrCodeUrl;
    
    // Initial list of recovery codes for the user to save
    private List<String> recoveryCodes;
}