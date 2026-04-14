/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.auth.service;

import org.apache.commons.codec.binary.Base32;
import org.apache.commons.codec.binary.Hex;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.nio.ByteBuffer;

@Service
public class MfaService {

    /**
     * Generates a random 32-character Base32 secret key.
     */
    public String generateSecret() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[20];
        random.nextBytes(bytes);
        return new Base32().encodeToString(bytes);
    }

    /**
     * Generates a Google Authenticator compatible QR Code URL.
     */
    public String getQrCodeUrl(String email, String secret) {
        return String.format(
            "otpauth://totp/Fincz-Track:%s?secret=%s&issuer=Fincz-Track",
            email, secret
        );
    }

    /**
     * Verifies a TOTP code against a secret.
     */
    public boolean verifyCode(String secret, String code) {
        if (code == null || !code.matches("\\d{6}")) return false;

        long timeIndex = System.currentTimeMillis() / 1000 / 30;
        byte[] secretBytes = new Base32().decode(secret);

        // Check current, previous, and next time windows to account for network latency or clock skew
        // Increased window to -2 to 2 for better reliability
        for (int i = -2; i <= 2; i++) {
            if (calculateCode(secretBytes, timeIndex + i).equals(code)) {
                return true;
            }
        }
        return false;
    }

    private String calculateCode(byte[] secret, long interval) {
        byte[] data = ByteBuffer.allocate(8).putLong(interval).array();
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(secret, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);

            int offset = hash[hash.length - 1] & 0xf;
            int binary = ((hash[offset] & 0x7f) << 24) |
                         ((hash[offset + 1] & 0xff) << 16) |
                         ((hash[offset + 2] & 0xff) << 8) |
                         (hash[offset + 3] & 0xff);

            int otp = binary % 1000000;
            return String.format("%06d", otp);
        } catch (Exception e) {
            throw new RuntimeException("Error calculating TOTP code", e);
        }
    }
}