package com.example.accountanttracker.service;

import com.example.accountanttracker.entity.Reminder;
import com.example.accountanttracker.entity.Request;
import com.example.accountanttracker.entity.User;
import com.example.accountanttracker.repository.ReminderRepository;
import com.example.accountanttracker.repository.RequestRepository;
import com.example.accountanttracker.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class RequestService {

    private static final Logger logger = LoggerFactory.getLogger(RequestService.class);

    private static final List<String> VALID_STATUSES = Arrays.asList("OPEN", "IN_PROGRESS", "COMPLETED");

    private final RequestRepository requestRepository;
    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public RequestService(RequestRepository requestRepository,
                          ReminderRepository reminderRepository,
                          UserRepository userRepository,
                          EmailService emailService) {
        this.requestRepository = requestRepository;
        this.reminderRepository = reminderRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    /**
     * Seed static accountant and initial employees if user table is empty.
     */
    @PostConstruct
    @Transactional
    public void initDefaultUsers() {
        if (userRepository.findByEmailIgnoreCase("kathirvelpalani294@gmail.com").isEmpty()) {
            logger.info("Initializing static Accountant account (kathirvelpalani294@gmail.com)...");
            User accountant = new User("Senior Accountant", "kathirvelpalani294@gmail.com", "accountant123", "ACCOUNTANT");
            userRepository.save(accountant);
            logger.info("Accountant account created. All employees will be registered dynamically.");
        }
    }

    /**
     * Create a new accountant request.
     */
    @Transactional
    public Request createRequest(Request request) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title cannot be empty");
        }
        if (request.getClientName() == null || request.getClientName().trim().isEmpty()) {
            throw new IllegalArgumentException("Client name cannot be empty");
        }
        if (request.getAssignee() == null || request.getAssignee().trim().isEmpty()) {
            throw new IllegalArgumentException("Assignee cannot be empty");
        }
        if (request.getDueDateTime() == null) {
            throw new IllegalArgumentException("Due date and time cannot be empty");
        }

        if (request.getStatus() == null || request.getStatus().trim().isEmpty()) {
            request.setStatus("OPEN");
        } else {
            String upperStatus = request.getStatus().trim().toUpperCase();
            if (!VALID_STATUSES.contains(upperStatus)) {
                throw new IllegalArgumentException("Invalid status: " + request.getStatus() + ". Allowed values: " + VALID_STATUSES);
            }
            request.setStatus(upperStatus);
        }

        if (request.getAccountantEmail() == null || request.getAccountantEmail().isBlank()) {
            request.setAccountantEmail("kathirvelpalani294@gmail.com");
        }

        if (request.getAssigneeEmail() == null || request.getAssigneeEmail().isBlank()) {
            // Find employee email by name if available
            userRepository.findByEmailIgnoreCase(request.getAssignee().toLowerCase() + "@company.com")
                    .ifPresentOrElse(
                            u -> request.setAssigneeEmail(u.getEmail()),
                            () -> request.setAssigneeEmail(request.getAssignee().toLowerCase() + "@company.com")
                    );
        }

        request.setCreatedAt(LocalDateTime.now());
        return requestRepository.save(request);
    }

    /**
     * Get all requests.
     */
    public List<Request> getAllRequests() {
        return requestRepository.findAll();
    }

    /**
     * Get requests for a specific user (role-based view):
     * - Accountant sees all requests
     * - Employee only sees requests assigned to them
     */
    public List<Request> getRequestsForUser(String email, String role) {
        if ("ACCOUNTANT".equalsIgnoreCase(role)) {
            return requestRepository.findAll();
        }
        // Employee view: search by email or name
        return requestRepository.findByAssigneeEmailIgnoreCaseOrderByDueDateTimeAsc(email);
    }

    /**
     * Get request by ID.
     */
    public Optional<Request> getRequestById(Long id) {
        return requestRepository.findById(id);
    }

    /**
     * Update request status.
     */
    @Transactional
    public Request updateStatus(Long id, String status) {
        Request request = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + id));

        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Status cannot be empty");
        }

        String upperStatus = status.trim().toUpperCase();
        if (!VALID_STATUSES.contains(upperStatus)) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Allowed values: " + VALID_STATUSES);
        }

        request.setStatus(upperStatus);
        return requestRepository.save(request);
    }

    /**
     * Get requests sorted by due date and time (ascending).
     */
    public List<Request> getSortedRequests() {
        return requestRepository.findAllByOrderByDueDateTimeAsc();
    }

    /**
     * Get overdue requests: status is OPEN and dueDateTime is strictly before now.
     */
    public List<Request> getOverdueRequests() {
        LocalDateTime now = LocalDateTime.now();
        return requestRepository.findByStatusIgnoreCaseAndDueDateTimeBefore("OPEN", now);
    }

    /**
     * Autonomous Agent: Check for overdue requests and notify both the Assignee and the Accountant.
     * Also dispatches email alert and records reminder.
     * Prevents duplicate alerts for the same deadline day.
     */
    @Transactional
    public int checkAndGenerateOverdueReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<Request> overdueRequests = getOverdueRequests();
        int generatedCount = 0;

        for (Request request : overdueRequests) {
            // Avoid spamming duplicate reminders: skip if reminded in the last 2 hours
            if (request.getLastReminderAt() != null && request.getLastReminderAt().isAfter(now.minusHours(2))) {
                continue;
            }

            String reminderMessage = String.format(
                    "OVERDUE REQUEST REMINDER\n" +
                    "Request: %s\n" +
                    "Client: %s\n" +
                    "Assigned To: %s <%s>\n" +
                    "Accountant Email: %s\n" +
                    "Deadline: %s\n" +
                    "Status: %s\n" +
                    "This request has crossed its scheduled date and time.",
                    request.getTitle(),
                    request.getClientName(),
                    request.getAssignee(),
                    request.getAssigneeEmail(),
                    request.getAccountantEmail(),
                    request.getDueDateTime(),
                    request.getStatus()
            );

            // Log agent alert
            logger.warn("\n🚨 [DATE & TIME WATCHER AGENT] OVERDUE DETECTED!\n" +
                        "Task: {} | Client: {}\n" +
                        "Assignee: {} ({})\n" +
                        "Accountant: {}\n" +
                        "Deadline: {} | Current Time: {}",
                    request.getTitle(),
                    request.getClientName(),
                    request.getAssignee(),
                    request.getAssigneeEmail(),
                    request.getAccountantEmail(),
                    request.getDueDateTime(),
                    now);

            // Dispatch Email via EmailService (sends to assignee, CCs accountant)
            emailService.sendOverdueAlert(request);

            // Save Reminder entity
            Reminder reminder = new Reminder(
                    request.getId(),
                    request.getTitle(),
                    request.getClientName(),
                    request.getAssignee(),
                    request.getDueDateTime().toLocalDate(),
                    request.getStatus(),
                    reminderMessage
            );
            reminderRepository.save(reminder);

            // Update lastReminderAt
            request.setLastReminderAt(now);
            requestRepository.save(request);

            generatedCount++;
        }

        return generatedCount;
    }

    /**
     * Retrieve all logged reminders.
     */
    public List<Reminder> getAllReminders() {
        return reminderRepository.findAllByOrderByGeneratedAtDesc();
    }
}
