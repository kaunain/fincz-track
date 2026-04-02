package com.fincz.user.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 */
@Getter
@Setter
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String phone;
    private Integer age;
    private String occupation;
    private String financialGoals;
}