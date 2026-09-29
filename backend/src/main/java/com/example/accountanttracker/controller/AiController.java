package com.example.accountanttracker.controller;

import com.example.accountanttracker.entity.Reminder;
import com.example.accountanttracker.entity.Request;
import com.example.accountanttracker.entity.User;
import com.example.accountanttracker.repository.UserRepository;
import com.example.accountanttracker.service.AiService;
import com.example.accountanttracker.service.RequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;
    private final RequestService requestService;
    private final UserRepository userRepository;

    public AiController(AiService aiService, RequestService requestService, UserRepository userRepository) {
        this.aiService = aiService;
        this.requestService = requestService;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/ai/status
     * Returns AI engine status (Gemini, OpenAI, or Smart Heuristics).
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(aiService.getAiStatus());
    }

    /**
     * POST /api/ai/workload-analysis
     * Analyzes overall firm workload, bottlenecks, and deadline exposure.
     */
    @PostMapping("/workload-analysis")
    public ResponseEntity<Map<String, Object>> analyzeWorkload() {
        List<Request> allRequests = requestService.getAllRequests();
        List<User> employees = userRepository.findByRoleIgnoreCase("EMPLOYEE");
        Map<String, Object> analysis = aiService.analyzeWorkload(allRequests, employees);
        return ResponseEntity.ok(analysis);
    }

    /**
     * POST /api/ai/draft-email
     * Drafts context-aware reminder email using chosen tone.
     */
    @PostMapping("/draft-email")
    public ResponseEntity<?> draftReminderEmail(@RequestBody Map<String, Object> payload) {
        Object reqIdObj = payload.get("requestId");
        if (reqIdObj == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "requestId is required"));
        }
        String requestId = reqIdObj.toString();
        String tone = (String) payload.getOrDefault("tone", "PROFESSIONAL");

        return requestService.getRequestById(requestId)
                .map(request -> ResponseEntity.ok(aiService.draftReminderEmail(request, tone)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("error", "Request not found with id: " + requestId)));
    }

    /**
     * POST /api/ai/send-draft
     * Sends the AI-generated email to Assignee and copies Accountant.
     */
    @PostMapping("/send-draft")
    public ResponseEntity<?> sendDraft(@RequestBody Map<String, Object> payload) {
        Object reqIdObj = payload.get("requestId");
        String subject = (String) payload.get("subject");
        String body = (String) payload.get("body");

        if (reqIdObj == null || subject == null || body == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "requestId, subject, and body are required"));
        }

        try {
            String requestId = reqIdObj.toString();
            Reminder reminder = requestService.sendAiReminder(requestId, subject, body);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "AI reminder email successfully dispatched and logged",
                    "reminder", reminder
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Failed to dispatch email: " + ex.getMessage()));
        }
    }

    /**
     * POST /api/ai/task-breakdown
     * Generates subtasks, compliance steps, and time estimate for an assignment.
     */
    @PostMapping("/task-breakdown")
    public ResponseEntity<?> taskBreakdown(@RequestBody Map<String, String> payload) {
        String title = payload.get("title");
        String clientName = payload.get("clientName");
        String assignee = payload.get("assignee");

        if (title == null || title.isBlank()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "title is required"));
        }

        Map<String, Object> breakdown = aiService.breakdownTask(
                title,
                clientName != null ? clientName : "Client",
                assignee != null ? assignee : "Assigned Staff"
        );
        return ResponseEntity.ok(breakdown);
    }
}
