package com.dormisync.dormitory_management.Service;

import com.dormisync.dormitory_management.DTO.LoginRequest;
import com.dormisync.dormitory_management.DTO.RegisterRequest;
import com.dormisync.dormitory_management.Entity.User;
import com.dormisync.dormitory_management.Enums.UserRole;
import com.dormisync.dormitory_management.Repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, UserService userService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerTenant(RegisterRequest request) {
        if (isBlank(request.getFirstName()) || isBlank(request.getLastName())
                || isBlank(request.getEmail()) || isBlank(request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "First name, last name, email and password are required");
        }
        if (request.getPassword().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must be at least 6 characters");
        }

        User user = new User(
                request.getFirstName().trim(),
                request.getLastName().trim(),
                request.getEmail().trim(),
                request.getPassword(),
                request.getContactNumber(),
                UserRole.TENANT); // never taken from the request

        return userService.createUser(user); // hashes the password
    }

    public User login(LoginRequest request) {
        if (isBlank(request.getEmail()) || isBlank(request.getPassword()) || request.getPortal() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email, password and portal are required");
        }

        User user = userRepository.findByEmail(request.getEmail().trim())
                .filter(u -> passwordMatches(u, request.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        boolean staff = user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.LANDLORD;
        if (request.getPortal() == LoginRequest.Portal.STAFF && !staff) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This login is for staff accounts. Tenants sign in at /login.");
        }
        if (request.getPortal() == LoginRequest.Portal.TENANT && staff) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Admins and landlords sign in at /admin.");
        }

        return user;
    }

    private boolean passwordMatches(User user, String raw) {
        String stored = user.getPassword();
        if (stored == null) {
            return false;
        }
        if (UserService.isBcryptHash(stored)) {
            return passwordEncoder.matches(raw, stored);
        }
        // Accounts created before hashing was added still hold plain text.
        // Accept it once, then replace it with a hash.
        if (stored.equals(raw)) {
            user.setPassword(passwordEncoder.encode(raw));
            userRepository.save(user);
            return true;
        }
        return false;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
