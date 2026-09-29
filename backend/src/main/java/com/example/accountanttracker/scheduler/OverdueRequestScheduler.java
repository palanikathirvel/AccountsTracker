package com.example.accountanttracker.scheduler;

import com.example.accountanttracker.service.RequestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Autonomous Agentic AI Overdue Watcher:
 * Continuously runs 24/7 in the background. As soon as a task crosses its scheduled deadline,
 * this agentic AI autonomously passes the task context to Google Gemini API to draft a dynamic,
 * urgent compliance notification, and dispatches the live email to both the Assignee and Accountant.
 */
@Component
@ConditionalOnProperty(name = "scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class OverdueRequestScheduler {

    private static final Logger logger = LoggerFactory.getLogger(OverdueRequestScheduler.class);

    private final RequestService requestService;

    public OverdueRequestScheduler(RequestService requestService) {
        this.requestService = requestService;
    }

    /**
     * Agentic AI heartbeat loop running continuously (every 15 seconds).
     */
    @Scheduled(fixedRateString = "${scheduler.overdue-check-rate:15000}")
    public void runOverdueCheck() {
        int count = requestService.checkAndGenerateOverdueReminders();
        if (count > 0) {
            logger.info("🤖 [AGENTIC AI OVERDUE WATCHER] Dispatched Gemini AI email reminders for {} overdue task(s).", count);
        }
    }
}
