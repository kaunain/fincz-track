package com.fincz.gateway.config;

import com.fincz.gateway.security.JwtAuthenticationFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.stereotype.Component;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Gateway filter factory for JWT authentication.
 * Allows the filter to be used in route configurations.
 */
@Component
public class JwtAuthenticationGatewayFilterFactory extends AbstractGatewayFilterFactory<Object> {

    private final JwtAuthenticationFilter jwtFilter;

    public JwtAuthenticationGatewayFilterFactory(JwtAuthenticationFilter jwtFilter) {
        super(Object.class);
        this.jwtFilter = jwtFilter;
    }

    @Override
    public GatewayFilter apply(Object config) {
        return jwtFilter;
    }
}