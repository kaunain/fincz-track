/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.user.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "auth-service", url = "${fincz.services.auth-service.url:http://localhost:8081}")
public interface AuthServiceClient {

    @GetMapping("/auth/internal/mfa-status")
    boolean getMfaStatus(@RequestParam("email") String email);
}