package com.example.accountanttracker.controller;

import com.example.accountanttracker.entity.Reminder;
import com.example.accountanttracker.entity.Request;
import com.example.accountanttracker.service.RequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class RequestController {

    private final RequestService requestService;

    public RequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    /**
     * Create a new request.
     * POST /api/requests
     */
    @PostMapping("/requests")
    public ResponseEntity<Request> createRequest(@Valid @RequestBody Request request) {
        Request created = requestService.createRequest(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * Get all requests, or filter by user role/email.
     * GET /api/requests
     */
    @GetMapping("/requests")
    public ResponseEntity<List<Request>> getAllRequests(
            @RequestParam(required = false) String email,
            @RequestParam(required = false, defaultValue = "ACCOUNTANT") String role) {
        if (email != null && !email.trim().isEmpty()) {
            return ResponseEntity.ok(requestService.getRequestsForUser(email.trim(), role));
        }
        List<Request> list = requestService.getAllRequests();
        return ResponseEntity.ok(list);
    }

    /**
     * Get request by ID.
     * GET /api/requests/{id}
     */
    @GetMapping("/requests/{id}")
    public ResponseEntity<?> getRequestById(@PathVariable String id) {
        return requestService.getRequestById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("error", "Request not found with id: " + id)));
    }

    /**
     * Delete request by ID (Accountant only).
     * DELETE /api/requests/{id}
     */
    @DeleteMapping("/requests/{id}")
    public ResponseEntity<?> deleteRequest(@PathVariable String id) {
        try {
            requestService.deleteRequest(id);
            return ResponseEntity.ok(Map.of("message", "Task deleted successfully", "id", id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Collections.singletonMap("error", ex.getMessage()));
        }
    }

    /**
     * Update request status.
     * PUT /api/requests/{id}/status
     */
    @PutMapping("/requests/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Status field is required"));
        }
        try {
            Request updated = requestService.updateStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            if (ex.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", ex.getMessage()));
            }
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", ex.getMessage()));
        }
    }

    /**
     * Get requests sorted by due date and time ascending.
     * GET /api/requests/sorted
     */
    @GetMapping("/requests/sorted")
    public ResponseEntity<List<Request>> getSortedRequests() {
        List<Request> sorted = requestService.getSortedRequests();
        return ResponseEntity.ok(sorted);
    }

    /**
     * Get overdue requests (status is OPEN and deadline has passed).
     * GET /api/requests/overdue
     */
    @GetMapping("/requests/overdue")
    public ResponseEntity<List<Request>> getOverdueRequests() {
        List<Request> overdue = requestService.getOverdueRequests();
        return ResponseEntity.ok(overdue);
    }

    /**
     * Get list of all generated reminders.
     * GET /api/reminders
     */
    @GetMapping("/reminders")
    public ResponseEntity<List<Reminder>> getReminders() {
        return ResponseEntity.ok(requestService.getAllReminders());
    }

    /**
     * Manually trigger overdue agent check and reminder generation.
     * POST /api/scheduler/trigger
     */
    @PostMapping("/scheduler/trigger")
    public ResponseEntity<Map<String, Object>> triggerScheduler() {
        int count = requestService.checkAndGenerateOverdueReminders();
        return ResponseEntity.ok(Map.of(
                "message", "Autonomous Date & Time Watcher Agent executed check",
                "remindersGenerated", count
        ));
    }
}
