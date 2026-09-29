package com.example.accountanttracker.service;

import com.example.accountanttracker.entity.Request;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired(required = false)
    private AiService aiService;

    @Value("${spring.mail.username:kathirvelpalani294@gmail.com}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    /**
     * Send live overdue email alerts from Accountant email to both the Assignee
     * and the Accountant (reminding both when status is OPEN or IN_PROGRESS).
     * Automatically generates personalized, high-impact reminder content using Google Gemini AI!
     */
    public boolean sendOverdueAlert(Request request) {
        String assigneeEmail = request.getAssigneeEmail();
        if (assigneeEmail == null || assigneeEmail.trim().isEmpty()) {
            if (request.getAssignee() != null) {
                assigneeEmail = request.getAssignee().trim().toLowerCase().replaceAll("\\s+", "") + "@company.com";
            }
        }

        String accountantEmail = request.getAccountantEmail();
        if (accountantEmail == null || accountantEmail.trim().isEmpty()) {
            accountantEmail = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "kathirvelpalani294@gmail.com";
        }

        String statusDisplay = request.getStatus() != null ? request.getStatus().replace('_', ' ') : "OPEN";
        String subject = String.format("🚨 [OVERDUE ALERT - %s] Task '%s' for '%s' is Overdue",
                statusDisplay, request.getTitle(), request.getClientName());

        // Default template
        String messageContent = String.format(
                "====================================================\n" +
                "AUTONOMOUS WATCHER AGENT: OVERDUE NOTIFICATION\n" +
                "====================================================\n\n" +
                "Dear %s,\n\n" +
                "This is an automated overdue alert sent from Accountant (%s).\n" +
                "The scheduled deadline for your task has passed.\n\n" +
                "Task Details:\n" +
                "----------------------------------------------------\n" +
                "• Task Title: %s\n" +
                "• Client Name: %s\n" +
                "• Assignee: %s <%s>\n" +
                "• Accountant: %s\n" +
                "• Scheduled Deadline: %s\n" +
                "• Current Status: %s\n" +
                "----------------------------------------------------\n\n" +
                "ACTION REQUIRED: This task is currently %s and has crossed its deadline. Please immediately take action or update its status in the Accountant Request Tracker.\n\n" +
                "Regards,\n" +
                "%s\n" +
                "Accountant Request Tracker • Autonomous Agent",
                request.getAssignee(),
                accountantEmail,
                request.getTitle(),
                request.getClientName(),
                request.getAssignee(),
                assigneeEmail != null ? assigneeEmail : "N/A",
                accountantEmail,
                request.getDueDateTime(),
                statusDisplay,
                statusDisplay,
                accountantEmail
        );

        // Enhance with Gemini Generative AI dynamically if available
        if (aiService != null) {
            try {
                Map<String, String> aiEmail = aiService.generateOverdueEmail(request);
                if (aiEmail != null && aiEmail.get("body") != null && !aiEmail.get("body").isBlank()) {
                    messageContent = aiEmail.get("body");
                    if (aiEmail.get("subject") != null && !aiEmail.get("subject").isBlank()) {
                        subject = aiEmail.get("subject");
                    }
                    logger.info("✨ [GEMINI GENERATIVE AI] Overdue reminder email dynamically drafted by Gemini AI for task '{}'", request.getTitle());
                }
            } catch (Exception ex) {
                logger.warn("⚠️ AI overdue generation exception, using standard notice: {}", ex.getMessage());
            }
        }

        // Always log to console
        logger.info("\n=======================================================\n" +
                    "📧 AGENT DISPATCHING LIVE EMAIL:\n" +
                    "From (Accountant): {}\n" +
                    "To (Assignee): {}\n" +
                    "Supervisor Copy (Accountant): {}\n" +
                    "Status: {}\n" +
                    "Subject: {}\n" +
                    "=======================================================",
                accountantEmail, assigneeEmail, accountantEmail, statusDisplay, subject);

        // Attempt live Gmail SMTP dispatch
        if (mailSender != null && mailPassword != null && !mailPassword.isBlank()) {
            boolean sentAny = false;

            // In Gmail SMTP, from address should use the accountant email (or fromEmail) with replyTo to accountant
            String senderAddress = (accountantEmail != null && accountantEmail.contains("@")) ? accountantEmail : fromEmail;

            // 1. Deliver to Assignee's real email from accountant email
            if (assigneeEmail != null && assigneeEmail.contains("@")) {
                try {
                    SimpleMailMessage assigneeMsg = new SimpleMailMessage();
                    assigneeMsg.setFrom(senderAddress);
                    assigneeMsg.setReplyTo(accountantEmail);
                    assigneeMsg.setTo(assigneeEmail);
                    assigneeMsg.setSubject(subject);
                    assigneeMsg.setText(messageContent);
                    mailSender.send(assigneeMsg);
                    logger.info("✅ Live email successfully sent to Assignee at {} from Accountant {}", assigneeEmail, senderAddress);
                    sentAny = true;
                } catch (Exception ex) {
                    logger.warn("⚠️ Could not deliver email to Assignee ({}): {}", assigneeEmail, ex.getMessage());
                }
            }

            // 2. Deliver reminder notice to Accountant
            if (accountantEmail != null && accountantEmail.contains("@")) {
                try {
                    SimpleMailMessage accountantMsg = new SimpleMailMessage();
                    accountantMsg.setFrom(senderAddress);
                    accountantMsg.setReplyTo(accountantEmail);
                    accountantMsg.setTo(accountantEmail);
                    accountantMsg.setSubject(subject + " [Supervisor Copy]");
                    accountantMsg.setText(
                        "====================================================\n" +
                        "AUTONOMOUS WATCHER AGENT: SUPERVISOR NOTIFICATION\n" +
                        "====================================================\n\n" +
                        "Dear Accountant,\n\n" +
                        "This is an automated supervisor reminder that a task assigned to " + request.getAssignee() +
                        " (" + assigneeEmail + ") has crossed its deadline and is currently " + statusDisplay + ".\n\n" +
                        "An overdue reminder has also been sent to the assignee.\n\n" +
                        messageContent
                    );
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

    /**
     * Send an AI-drafted or customized reminder email for a specific task.
     */
    public boolean sendAiEmail(Request request, String subject, String body) {
        String assigneeEmail = request.getAssigneeEmail();
        if (assigneeEmail == null || assigneeEmail.trim().isEmpty()) {
            if (request.getAssignee() != null) {
                assigneeEmail = request.getAssignee().trim().toLowerCase().replaceAll("\\s+", "") + "@company.com";
            }
        }

        String accountantEmail = request.getAccountantEmail();
        if (accountantEmail == null || accountantEmail.trim().isEmpty()) {
            accountantEmail = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "kathirvelpalani294@gmail.com";
        }

        logger.info("\n=======================================================\n" +
                    "🤖 DISPATCHING AI-CRAFTED REMINDER EMAIL:\n" +
                    "From (Accountant): {}\n" +
                    "To (Assignee): {}\n" +
                    "Subject: {}\n" +
                    "=======================================================",
                accountantEmail, assigneeEmail, subject);

        if (mailSender != null && mailPassword != null && !mailPassword.isBlank()) {
            boolean sentAny = false;
            String senderAddress = (accountantEmail != null && accountantEmail.contains("@")) ? accountantEmail : fromEmail;

            // 1. Deliver to Assignee
            if (assigneeEmail != null && assigneeEmail.contains("@")) {
                try {
                    SimpleMailMessage msg = new SimpleMailMessage();
                    msg.setFrom(senderAddress);
                    msg.setReplyTo(accountantEmail);
                    msg.setTo(assigneeEmail);
                    msg.setSubject(subject);
                    msg.setText(body);
                    mailSender.send(msg);
                    logger.info("✅ Live AI email successfully sent to Assignee at {}", assigneeEmail);
                    sentAny = true;
                } catch (Exception ex) {
                    logger.warn("⚠️ Could not deliver AI email to Assignee ({}): {}", assigneeEmail, ex.getMessage());
                }
            }

            // 2. Deliver copy to Accountant
            if (accountantEmail != null && accountantEmail.contains("@")) {
                try {
                    SimpleMailMessage supervisorMsg = new SimpleMailMessage();
                    supervisorMsg.setFrom(senderAddress);
                    supervisorMsg.setReplyTo(accountantEmail);
                    supervisorMsg.setTo(accountantEmail);
                    supervisorMsg.setSubject(subject + " [Copy]");
                    supervisorMsg.setText(
                            "AI Reminder dispatched to: " + assigneeEmail + "\n\n" +
                            "--- Message Content ---\n" +
                            body
                    );
                    mailSender.send(supervisorMsg);
                    logger.info("✅ Live AI email copy sent to Accountant at {}", accountantEmail);
                    sentAny = true;
                } catch (Exception ex) {
                    logger.warn("⚠️ Could not deliver AI email copy to Accountant ({}): {}", accountantEmail, ex.getMessage());
                }
            }
            return sentAny;
        } else {
            logger.info("ℹ️ Gmail App Password not configured. Simulated AI email dispatch logged.");
            return true;
        }
    }
}
