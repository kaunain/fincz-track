/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.user.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Base controller providing shared utility methods for user-related operations.
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
        
        if (authentication != null && authentication.isAuthenticated() 
                && !(authentication instanceof AnonymousAuthenticationToken)
                && authentication.getPrincipal() != null) {
            Object principal = authentication.getPrincipal();
            
            if (principal instanceof String) {
                return (String) principal;
            }
            return principal.toString();
        }
        
        // Fallback: Check for header passed by API Gateway
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            return request.getHeader("X-User-Email");
        }
        
        return null;
    }
}