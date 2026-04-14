/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    private String phone;
    private Integer age;
    private String occupation;

    @Column(name = "financial_goals", columnDefinition = "TEXT")
    private String financialGoals;

    private String address;
    private String city;
    private String state;
    private String country;

    @Column(name = "postal_code")
    private String postalCode;

    private String currency = "INR";

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}