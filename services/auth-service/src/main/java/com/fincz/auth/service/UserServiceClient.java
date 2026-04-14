/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.auth.service;

import org.springframework.cloud.openfeign.FeignClient;
import com.fincz.auth.dto.SignupRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Feign client to communicate with the User Service.
 */
@FeignClient(name = "user-service", url = "${fincz.services.user-service.url:http://localhost:8082}")
public interface UserServiceClient {

    /**
     * Initializes a new user profile in the user-service.
     * 
     * @param req The signup details.
     */
    @PostMapping("/users/profile")
    void createProfile(@RequestBody SignupRequest req);
}