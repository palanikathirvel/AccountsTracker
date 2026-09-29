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
     * Send overdue email alert to the Accountant (kathirvelpalani294@gmail.com)
     * and the Assignee.
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

        String accountantContent = String.format(
                "====================================================\n" +
                "AUTONOMOUS WATCHER AGENT: SUPERVISOR OVERDUE NOTICE\n" +
                "====================================================\n\n" +
                "Hello Accountant / Supervisor (%s),\n\n" +
                "This is an automated alert from your Date & Time Watcher Agent.\n" +
                "The following task assigned to %s has crossed its deadline:\n\n" +
                "Task Details:\n" +
                "----------------------------------------------------\n" +
                "• Task Title: %s\n" +
                "• Client: %s\n" +
                "• Assignee: %s <%s>\n" +
                "• Deadline (Date & Time): %s\n" +
                "• Current Status: %s\n" +
                "----------------------------------------------------\n\n" +
                "Please follow up with the assignee to ensure completion.\n\n" +
                "Accountant Request Tracker • Autonomous Agent",
                accountantEmail,
                request.getAssignee(),
                request.getTitle(),
                request.getClientName(),
                request.getAssignee(),
                assigneeEmail,
                request.getDueDateTime(),
                request.getStatus()
        );

        // Always log to console
        logger.info("\n=======================================================\n" +
                    "📧 AGENT DISPATCHING EMAIL:\n" +
                    "From: {}\n" +
                    "To (Accountant): {}\n" +
                    "Assignee: {} <{}>\n" +
                    "Subject: {}\n" +
                    "Content:\n{}\n" +
                    "=======================================================",
                fromEmail, accountantEmail, request.getAssignee(), assigneeEmail, subject, accountantContent);

        // Attempt real Gmail SMTP dispatch
        if (mailSender != null && mailPassword != null && !mailPassword.isBlank() && !mailPassword.contains("YOUR_16_DIGIT")) {
            boolean accountantSent = false;
            try {
                // Send primary notification to Accountant
                SimpleMailMessage accountantMsg = new SimpleMailMessage();
                accountantMsg.setFrom(fromEmail);
                accountantMsg.setTo(accountantEmail);
                accountantMsg.setSubject(subject);
                accountantMsg.setText(accountantContent);

                mailSender.send(accountantMsg);
                logger.info("✅ Live email successfully sent to Accountant at {}", accountantEmail);
                accountantSent = true;
            } catch (Exception ex) {
                logger.error("⚠️ Failed to send email to Accountant ({}): {}", accountantEmail, ex.getMessage());
            }

            // Also attempt to notify assignee if different from accountant and looks like a valid address
            if (!assigneeEmail.equalsIgnoreCase(accountantEmail) && assigneeEmail.contains("@") && !assigneeEmail.endsWith("@company.com")) {
                try {
                    SimpleMailMessage assigneeMsg = new SimpleMailMessage();
                    assigneeMsg.setFrom(fromEmail);
                    assigneeMsg.setTo(assigneeEmail);
                    assigneeMsg.setSubject("🚨 [URGENT] Your assigned task is Overdue: " + request.getTitle());
                    assigneeMsg.setText(accountantContent.replace("Hello Accountant / Supervisor", "Dear " + request.getAssignee()));
                    mailSender.send(assigneeMsg);
                    logger.info("✅ Live email successfully sent to Assignee at {}", assigneeEmail);
                } catch (Exception ex) {
                    logger.warn("⚠️ Could not deliver to Assignee email ({}) : {}", assigneeEmail, ex.getMessage());
                }
            }

            return accountantSent;
        } else {
            logger.info("ℹ️ Real email skipped: Gmail App Password not yet configured.");
            return false;
        }
    }
}
