package com.example.accountanttracker.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity representing an accountant task request with date and time deadline.
 */
@Entity
@Table(name = "requests")
public class Request {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Column(name = "title", nullable = false)
    private String title;

    @NotBlank(message = "Client name is required")
    @Column(name = "client_name", nullable = false)
    private String clientName;

    @NotBlank(message = "Assignee is required")
    @Column(name = "assignee", nullable = false)
    private String assignee;

    @Column(name = "assignee_email")
    private String assigneeEmail;

    @Column(name = "accountant_email")
    private String accountantEmail = "kathirvelpalani294@gmail.com";

    @NotNull(message = "Due date and time is required")
    @Column(name = "due_date_time", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime dueDateTime;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "OPEN";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_reminder_at")
    private LocalDateTime lastReminderAt;

    public Request() {
    }

    public Request(String title, String clientName, String assignee, String assigneeEmail, LocalDateTime dueDateTime, String status) {
        this.title = title;
        this.clientName = clientName;
        this.assignee = assignee;
        this.assigneeEmail = assigneeEmail;
        this.accountantEmail = "kathirvelpalani294@gmail.com";
        this.dueDateTime = dueDateTime;
        this.status = (status != null && !status.isBlank()) ? status : "OPEN";
    }

    public Request(String title, String clientName, String assignee, LocalDate dueDate, String status) {
        this(title, clientName, assignee, assignee != null ? assignee.toLowerCase() + "@company.com" : null, dueDate != null ? dueDate.atTime(17, 0) : null, status);
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null || this.status.isBlank()) {
            this.status = "OPEN";
        }
        if (this.accountantEmail == null || this.accountantEmail.isBlank()) {
            this.accountantEmail = "kathirvelpalani294@gmail.com";
        }
    }

    /**
     * Exact business rule for overdue:
     * Request is overdue if status is OPEN and the current time has crossed the dueDateTime deadline.
     */
    @Transient
    public boolean isOverdue() {
        if (this.dueDateTime == null || this.status == null) {
            return false;
        }
        return "OPEN".equalsIgnoreCase(this.status) && this.dueDateTime.isBefore(LocalDateTime.now());
    }

    // Date helper for compatibility
    @Transient
    public LocalDate getDueDate() {
        return this.dueDateTime != null ? this.dueDateTime.toLocalDate() : null;
    }

    public void setDueDate(LocalDate date) {
        if (date != null) {
            if (this.dueDateTime != null) {
                this.dueDateTime = LocalDateTime.of(date, this.dueDateTime.toLocalTime());
            } else {
                this.dueDateTime = date.atTime(17, 0); // default to 5 PM
            }
        }
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getAssignee() {
        return assignee;
    }

    public void setAssignee(String assignee) {
        this.assignee = assignee;
    }

    public String getAssigneeEmail() {
        return assigneeEmail;
    }

    public void setAssigneeEmail(String assigneeEmail) {
        this.assigneeEmail = assigneeEmail;
    }

    public String getAccountantEmail() {
        return accountantEmail;
    }

    public void setAccountantEmail(String accountantEmail) {
        this.accountantEmail = accountantEmail;
    }

    public LocalDateTime getDueDateTime() {
        return dueDateTime;
    }

    public void setDueDateTime(LocalDateTime dueDateTime) {
        this.dueDateTime = dueDateTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastReminderAt() {
        return lastReminderAt;
    }

    public void setLastReminderAt(LocalDateTime lastReminderAt) {
        this.lastReminderAt = lastReminderAt;
    }
}
