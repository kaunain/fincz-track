/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.user.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "auth-service", url = "${fincz.services.auth-service.url:http://localhost:8081}")
public interface AuthServiceClient {

    /**
     * DTO for MFA status response
     */
    class MfaStatusResponse {
        private boolean mfaEnabled;

        public MfaStatusResponse() {}
        public MfaStatusResponse(boolean mfaEnabled) {
            this.mfaEnabled = mfaEnabled;
        }

        public boolean isMfaEnabled() {
            return mfaEnabled;
        }

        public void setMfaEnabled(boolean mfaEnabled) {
            this.mfaEnabled = mfaEnabled;
        }
    }

    @GetMapping("/auth/internal/mfa-status")
    MfaStatusResponse getMfaStatus(@RequestParam("email") String email);
}