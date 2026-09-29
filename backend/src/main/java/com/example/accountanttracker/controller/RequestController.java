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
     * Get all requests.
     * GET /api/requests
     */
    @GetMapping("/requests")
    public ResponseEntity<List<Request>> getAllRequests() {
        List<Request> list = requestService.getAllRequests();
        return ResponseEntity.ok(list);
    }

    /**
     * Get request by ID.
     * GET /api/requests/{id}
     */
    @GetMapping("/requests/{id}")
    public ResponseEntity<?> getRequestById(@PathVariable Long id) {
        return requestService.getRequestById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("error", "Request not found with id: " + id)));
    }

    /**
     * Update request status.
     * PUT /api/requests/{id}/status
     * Accepts either {"status": "IN_PROGRESS"} or a plain string
     */
    @PutMapping("/requests/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
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
     * Get requests sorted by due date ascending.
     * GET /api/requests/sorted
     */
    @GetMapping("/requests/sorted")
    public ResponseEntity<List<Request>> getSortedRequests() {
        List<Request> sorted = requestService.getSortedRequests();
        return ResponseEntity.ok(sorted);
    }

    /**
     * Get overdue requests (status is OPEN and due date < today).
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
     * Manually trigger overdue check and reminder generation.
     * POST /api/scheduler/trigger
     */
    @PostMapping("/scheduler/trigger")
    public ResponseEntity<Map<String, Object>> triggerScheduler() {
        int count = requestService.checkAndGenerateOverdueReminders();
        return ResponseEntity.ok(Map.of(
                "message", "Overdue check completed",
                "remindersGenerated", count
        ));
    }

    /**
     * Seed sample demo data.
     * POST /api/requests/seed
     */
    @PostMapping("/requests/seed")
    public ResponseEntity<Map<String, String>> seedData() {
        requestService.seedSampleData();
        return ResponseEntity.ok(Collections.singletonMap("message", "Sample demo data created successfully"));
    }
}
