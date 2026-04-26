/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.market.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Configuration class to provide Jackson's ObjectMapper bean.
 * Ensures Java 8 Date/Time support is enabled for LocalDateTime handling.
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Register JavaTimeModule to handle LocalDate and LocalDateTime
        mapper.registerModule(new JavaTimeModule());
        // Write dates as ISO strings instead of timestamps
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}