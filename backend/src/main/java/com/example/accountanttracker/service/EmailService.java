package com.example.accountanttracker.service;

import com.example.accountanttracker.entity.Request;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:kathirvelpalani294@gmail.com}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    /**
     * Send live overdue email alerts to both the Assignee's real email address
     * and the Accountant (kathirvelpalani294@gmail.com).
     */
    public boolean sendOverdueAlert(Request request) {
        String assigneeEmail = request.getAssigneeEmail();
        String accountantEmail = request.getAccountantEmail();
        if (accountantEmail == null || accountantEmail.trim().isEmpty()) {
            accountantEmail = "kathirvelpalani294@gmail.com";
        }

        String subject = String.format("🚨 [OVERDUE ALERT] Task '%s' for '%s' is Overdue",
                request.getTitle(), request.getClientName());

        String messageContent = String.format(
                "====================================================\n" +
                "AUTONOMOUS WATCHER AGENT: OVERDUE NOTIFICATION\n" +
                "====================================================\n\n" +
                "Dear %s,\n\n" +
                "This is an automated overdue alert from your Date & Time Watcher Agent.\n" +
                "The scheduled deadline for your task has passed.\n\n" +
                "Task Details:\n" +
                "----------------------------------------------------\n" +
                "• Task Title: %s\n" +
                "• Client Name: %s\n" +
                "• Assignee: %s <%s>\n" +
                "• Accountant / Supervisor: %s\n" +
                "• Scheduled Deadline: %s\n" +
                "• Current Status: %s\n" +
                "----------------------------------------------------\n\n" +
                "ACTION REQUIRED: Please immediately complete the task or update its status in the Accountant Request Tracker.\n\n" +
                "Accountant Request Tracker • Autonomous Agent",
                request.getAssignee(),
                request.getTitle(),
                request.getClientName(),
                request.getAssignee(),
                assigneeEmail != null ? assigneeEmail : "N/A",
                accountantEmail,
                request.getDueDateTime(),
                request.getStatus()
        );

        // Always log to console
        logger.info("\n=======================================================\n" +
                    "📧 AGENT DISPATCHING LIVE EMAIL:\n" +
                    "From: {}\n" +
                    "To (Assignee): {}\n" +
                    "Cc / Copy (Accountant): {}\n" +
                    "Subject: {}\n" +
                    "=======================================================",
                fromEmail, assigneeEmail, accountantEmail, subject);

        // Attempt live Gmail SMTP dispatch
        if (mailSender != null && mailPassword != null && !mailPassword.isBlank()) {
            boolean sentAny = false;

            // 1. Deliver to Assignee's real email
            if (assigneeEmail != null && assigneeEmail.contains("@")) {
                try {
                    SimpleMailMessage assigneeMsg = new SimpleMailMessage();
                    assigneeMsg.setFrom(fromEmail);
                    assigneeMsg.setTo(assigneeEmail);
                    assigneeMsg.setSubject(subject);
                    assigneeMsg.setText(messageContent);
                    mailSender.send(assigneeMsg);
                    logger.info("✅ Live email successfully sent to Assignee at {}", assigneeEmail);
                    sentAny = true;
                } catch (Exception ex) {
                    logger.warn("⚠️ Could not deliver email to Assignee ({}): {}", assigneeEmail, ex.getMessage());
                }
            }

            // 2. Deliver supervisor notice to Accountant (kathirvelpalani294@gmail.com)
            if (accountantEmail != null && !accountantEmail.equalsIgnoreCase(assigneeEmail)) {
                try {
                    SimpleMailMessage accountantMsg = new SimpleMailMessage();
                    accountantMsg.setFrom(fromEmail);
                    accountantMsg.setTo(accountantEmail);
                    accountantMsg.setSubject(subject + " [Supervisor Copy]");
                    accountantMsg.setText("Hello Accountant,\n\nYour assigned task for " + request.getAssignee() + " (" + assigneeEmail + ") is overdue.\n\n" + messageContent);
                    mailSender.send(accountantMsg);
                    logger.info("✅ Live email copy successfully sent to Accountant at {}", accountantEmail);
                    sentAny = true;
                } catch (Exception ex) {
                    logger.warn("⚠️ Could not deliver copy to Accountant ({}): {}", accountantEmail, ex.getMessage());
                }
            }

            return sentAny;
        } else {
            logger.info("ℹ️ Gmail App Password not configured.");
            return false;
        }
    }
}
