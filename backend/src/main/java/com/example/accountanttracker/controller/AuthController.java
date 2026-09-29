package com.example.accountanttracker.controller;

import com.example.accountanttracker.entity.User;
import com.example.accountanttracker.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * User login.
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Email and password are required"));
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email.trim());
        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(password.trim())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", "Invalid email or password"));
        }

        User user = userOpt.get();
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole()
        ));
    }

    /**
     * Register a new employee.
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User newUser) {
        if (userRepository.findByEmailIgnoreCase(newUser.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "An account with this email already exists"));
        }

        if (newUser.getRole() == null || newUser.getRole().isBlank()) {
            newUser.setRole("EMPLOYEE");
        }

        User saved = userRepository.save(newUser);
        return new ResponseEntity<>(Map.of(
                "id", saved.getId(),
                "name", saved.getName(),
                "email", saved.getEmail(),
                "role", saved.getRole()
        ), HttpStatus.CREATED);
    }

    /**
     * List all employees (for assignee dropdown).
     * GET /api/auth/employees
     */
    @GetMapping("/employees")
    public ResponseEntity<List<User>> getEmployees() {
        return ResponseEntity.ok(userRepository.findByRoleIgnoreCase("EMPLOYEE"));
    }
}
