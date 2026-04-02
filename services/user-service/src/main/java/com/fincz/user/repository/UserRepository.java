package com.fincz.user.repository;

import com.fincz.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository("userServiceRepository")
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
