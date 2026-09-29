package com.example.accountanttracker.service;

import com.example.accountanttracker.entity.Reminder;
import com.example.accountanttracker.entity.Request;
import com.example.accountanttracker.repository.ReminderRepository;
import com.example.accountanttracker.repository.RequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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

    public RequestService(RequestRepository requestRepository, ReminderRepository reminderRepository) {
        this.requestRepository = requestRepository;
        this.reminderRepository = reminderRepository;
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
        if (request.getDueDate() == null) {
            throw new IllegalArgumentException("Due date cannot be empty");
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
     * Get requests sorted by due date (ascending).
     */
    public List<Request> getSortedRequests() {
        return requestRepository.findAllByOrderByDueDateAsc();
    }

    /**
     * Get overdue requests: status is OPEN and due date is strictly before today.
     */
    public List<Request> getOverdueRequests() {
        LocalDate today = LocalDate.now();
        return requestRepository.findByStatusIgnoreCaseAndDueDateBefore("OPEN", today);
    }

    /**
     * Check for overdue requests and generate reminders for the assignees.
     * Prevents duplicate reminders by checking if a reminder has already been generated today.
     *
     * @return count of newly generated reminders
     */
    @Transactional
    public int checkAndGenerateOverdueReminders() {
        LocalDate today = LocalDate.now();
        List<Request> overdueRequests = getOverdueRequests();
        int generatedCount = 0;

        for (Request request : overdueRequests) {
            // Avoid duplicate reminders: only 1 reminder per day per overdue request
            if (request.getLastReminderAt() != null && request.getLastReminderAt().toLocalDate().isEqual(today)) {
                logger.debug("Skipping duplicate reminder for request ID {} today", request.getId());
                continue;
            }

            String reminderMessage = String.format(
                    "OVERDUE REQUEST REMINDER%n" +
                    "Request: %s%n" +
                    "Client: %s%n" +
                    "Assigned To: %s%n" +
                    "Due Date: %s%n" +
                    "Status: %s%n" +
                    "This request is overdue.",
                    request.getTitle(),
                    request.getClientName(),
                    request.getAssignee(),
                    request.getDueDate(),
                    request.getStatus()
            );

            // Print clean log output for demonstration
            logger.warn("\n========================================\n" +
                        "OVERDUE REQUEST REMINDER\n" +
                        "Request: {}\n" +
                        "Client: {}\n" +
                        "Assigned To: {}\n" +
                        "Due Date: {}\n" +
                        "Status: {}\n" +
                        "This request is overdue.\n" +
                        "========================================",
                    request.getTitle(),
                    request.getClientName(),
                    request.getAssignee(),
                    request.getDueDate(),
                    request.getStatus());

            // Save Reminder entity
            Reminder reminder = new Reminder(
                    request.getId(),
                    request.getTitle(),
                    request.getClientName(),
                    request.getAssignee(),
                    request.getDueDate(),
                    request.getStatus(),
                    reminderMessage
            );
            reminderRepository.save(reminder);

            // Update lastReminderAt
            request.setLastReminderAt(LocalDateTime.now());
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

    /**
     * Seed sample demo data for quick walkthrough testing.
     */
    @Transactional
    public void seedSampleData() {
        LocalDate today = LocalDate.now();

        // Sample data from requirements
        Request r1 = new Request("GST Filing", "Demo Company A", "Kumar", today.plusDays(1), "OPEN");
        Request r2 = new Request("TDS Report", "Demo Company B", "Ravi", today.minusDays(1), "OPEN"); // Overdue!
        Request r3 = new Request("Audit Report", "Demo Company C", "Arun", today.plusDays(7), "COMPLETED");
        Request r4 = new Request("Tax Calculation", "Demo Company D", "Priya", today.plusDays(5), "IN_PROGRESS");
        Request r5 = new Request("Quarterly Financial Review", "Demo Enterprise", "Kumar", today.minusDays(3), "OPEN"); // Overdue!

        requestRepository.saveAll(Arrays.asList(r1, r2, r3, r4, r5));
    }
}
