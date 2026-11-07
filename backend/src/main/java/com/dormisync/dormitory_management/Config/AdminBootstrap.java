package com.dormisync.dormitory_management.Config;

import com.dormisync.dormitory_management.Entity.User;
import com.dormisync.dormitory_management.Enums.UserRole;
import com.dormisync.dormitory_management.Repository.UserRepository;
import com.dormisync.dormitory_management.Service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Creates the first admin account on startup when the database has none,
 * using the app.bootstrap.admin.* settings. Does nothing once an admin exists.
 * Every other staff account is created by an admin from the Users page.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final UserService userService;

    @Value("${app.bootstrap.admin.email:}")
    private String email;

    @Value("${app.bootstrap.admin.password:}")
    private String password;

    @Value("${app.bootstrap.admin.first-name:System}")
    private String firstName;

    @Value("${app.bootstrap.admin.last-name:Administrator}")
    private String lastName;

    public AdminBootstrap(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.findByRole(UserRole.ADMIN).isEmpty()) {
            return;
        }
        if (email.isBlank() || password.isBlank()) {
            log.warn("No admin account exists and app.bootstrap.admin.email/password are not set. "
                    + "Nobody can sign in at /admin until an admin is created.");
            return;
        }
        if (userRepository.existsByEmail(email)) {
            log.warn("No admin account exists, but {} is already used by a non-admin account. "
                    + "Set app.bootstrap.admin.email to a different address.", email);
            return;
        }

        userService.createUser(new User(firstName, lastName, email, password, null, UserRole.ADMIN));
        log.info("Created initial admin account {}. Sign in at /admin and change this password.", email);
    }
}
