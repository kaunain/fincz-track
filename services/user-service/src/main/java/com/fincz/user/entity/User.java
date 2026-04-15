/*
 * Copyright (c) 2026 Fincz-Track
 */

package com.fincz.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String role = "ROLE_USER";

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

    private String currency = "INR";

    @Column(name = "mfa_enabled")
    private boolean mfaEnabled = false;

    @Column(name = "mfa_secret")
    private String mfaSecret;

    @ElementCollection
    @CollectionTable(name = "user_recovery_codes", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "recovery_code")
    private List<String> recoveryCodes = new ArrayList<>();

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}