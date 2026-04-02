package com.fincz.user.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 */
@Getter
@Setter
public class UserUpdateRequest {
    
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number format")
    private String phone;

    @Min(value = 0, message = "Age must be a positive number")
    private Integer age;

    @Size(max = 100, message = "Occupation must be less than 100 characters")
    private String occupation;

    @Size(max = 255, message = "Financial goals must be less than 255 characters")
    private String financialGoals;
}