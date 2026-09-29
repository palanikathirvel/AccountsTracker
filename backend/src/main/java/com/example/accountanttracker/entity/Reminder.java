package com.example.accountanttracker.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity representing an automated overdue reminder sent to an assignee.
 */
@Document(collection = "reminders")
public class Reminder {

    @Id
    private String id;

    private String requestId;

    private String requestTitle;

    private String clientName;

    private String assignee;

    private LocalDate dueDate;

    private String status;

    private String message;

    private LocalDateTime generatedAt = LocalDateTime.now();

    public Reminder() {
    }

    public Reminder(String requestId, String requestTitle, String clientName, String assignee, LocalDate dueDate, String status, String message) {
        this.requestId = requestId;
        this.requestTitle = requestTitle;
        this.clientName = clientName;
        this.assignee = assignee;
        this.dueDate = dueDate;
        this.status = status;
        this.message = message;
        this.generatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getRequestTitle() {
        return requestTitle;
    }

    public void setRequestTitle(String requestTitle) {
        this.requestTitle = requestTitle;
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

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
