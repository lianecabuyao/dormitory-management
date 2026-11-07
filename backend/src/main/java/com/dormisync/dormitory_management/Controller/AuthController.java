package com.dormisync.dormitory_management.Controller;

import com.dormisync.dormitory_management.DTO.LoginRequest;
import com.dormisync.dormitory_management.DTO.RegisterRequest;
import com.dormisync.dormitory_management.Entity.User;
import com.dormisync.dormitory_management.Service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Checks the email/password and that the account belongs on the given login page. */
    @PostMapping("/login")
    public User login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Public sign-up for tenants. Always creates a TENANT account. */
    @PostMapping("/register")
    public User register(@RequestBody RegisterRequest request) {
        return authService.registerTenant(request);
    }
}
