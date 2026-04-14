/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.portfolio.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Base controller providing shared utility methods for portfolio-related operations.
 * 
 * @author Gemini Code Assist
 * @since April 2026
 */
public abstract class BaseController {

    /**
     * Extracts the email of the authenticated user from the SecurityContext.
     * This relies on the JwtAuthenticationFilter setting the email as the principal.
     *
     * @return The email of the authenticated user, or null if not authenticated.
     */
    protected String getAuthenticatedUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() != null) {
            Object principal = authentication.getPrincipal();
            
            if (principal instanceof String) {
                return (String) principal;
            }
            return principal.toString();
        }
        
        return null;
    }
}