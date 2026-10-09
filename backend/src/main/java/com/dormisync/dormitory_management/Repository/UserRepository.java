package com.dormisync.dormitory_management.Repository;

import com.dormisync.dormitory_management.Entity.User;
import com.dormisync.dormitory_management.Enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(UserRole role);
}
