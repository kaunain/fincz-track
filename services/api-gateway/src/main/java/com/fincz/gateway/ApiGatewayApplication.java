package com.fincz.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * API Gateway for Fincz-Track microservices.
 * Acts as a single entry point for all client requests.
 */
@SpringBootApplication
public class ApiGatewayApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiGatewayApplication.class, args);
	}

}