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
     * Send overdue email alert to the Assignee and CC the Accountant (kathirvelpalani294@gmail.com).
     */
    public boolean sendOverdueAlert(Request request) {
        String assigneeEmail = request.getAssigneeEmail();
        if (assigneeEmail == null || assigneeEmail.trim().isEmpty()) {
            assigneeEmail = request.getAssignee().toLowerCase() + "@company.com";
        }

        String accountantEmail = request.getAccountantEmail();
        if (accountantEmail == null || accountantEmail.trim().isEmpty()) {
            accountantEmail = "kathirvelpalani294@gmail.com";
        }

        String subject = String.format("🚨 [OVERDUE ALERT] Task '%s' for '%s' is Overdue",
                request.getTitle(), request.getClientName());

        String content = String.format(
                "====================================================\n" +
                "AUTONOMOUS WATCHER AGENT: OVERDUE NOTIFICATION\n" +
                "====================================================\n\n" +
                "Dear %s,\n\n" +
                "Your assigned task has crossed its scheduled deadline.\n\n" +
                "Task Details:\n" +
                "----------------------------------------------------\n" +
                "• Title: %s\n" +
                "• Client: %s\n" +
                "• Assignee: %s <%s>\n" +
                "• Accountant / Manager: %s\n" +
                "• Due Date & Time: %s\n" +
                "• Current Status: %s\n" +
                "----------------------------------------------------\n\n" +
                "ACTION REQUIRED: Please immediately complete the task or update its status in the Accountant Request Tracker.\n\n" +
                "Sent automatically by the Date & Time Watcher Agent.",
                request.getAssignee(),
                request.getTitle(),
                request.getClientName(),
                request.getAssignee(),
                assigneeEmail,
                accountantEmail,
                request.getDueDateTime(),
                request.getStatus()
        );

        // Always log to console for visibility
        logger.info("\n=======================================================\n" +
                    "📧 AGENT DISPATCHING EMAIL:\n" +
                    "From: {}\n" +
                    "To: {}\n" +
                    "Cc (Accountant): {}\n" +
                    "Subject: {}\n" +
                    "Content:\n{}\n" +
                    "=======================================================",
                fromEmail, assigneeEmail, accountantEmail, subject, content);

        // Attempt real Gmail SMTP dispatch if mailSender is available and password is set
        if (mailSender != null && mailPassword != null && !mailPassword.isBlank() && !mailPassword.contains("YOUR_16_DIGIT")) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(assigneeEmail);
                message.setCc(accountantEmail);
                message.setSubject(subject);
                message.setText(content);

                mailSender.send(message);
                logger.info("✅ Live email successfully sent via Gmail SMTP to {} (CC: {})", assigneeEmail, accountantEmail);
                return true;
            } catch (Exception ex) {
                logger.warn("⚠️ Could not send live email via SMTP (Check App Password): {}", ex.getMessage());
                return false;
            }
        } else {
            logger.info("ℹ️ Real email skipped: Enter your 16-character Gmail App Password in application.properties to enable live transmission.");
            return false;
        }
    }
}
