package com.example.accountanttracker.scheduler;

import com.example.accountanttracker.service.RequestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Autonomous Date & Time Watcher Agent:
 * Periodically monitors task deadlines. If the current date and time passes the task deadline,
 * the agent automatically generates an overdue notice, dispatches email alerts to the assignee,
 * and notifies the accountant (kathirvelpalani294@gmail.com).
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
     * Agent heartbeat loop running on configured rate (default: every 30 seconds).
     */
    @Scheduled(fixedRateString = "${scheduler.overdue-check-rate:30000}")
    public void runOverdueCheck() {
        logger.debug("🤖 [OVERDUE WATCHER AGENT] Scanning tasks for expired deadlines...");
        int count = requestService.checkAndGenerateOverdueReminders();
        if (count > 0) {
            logger.info("🤖 [OVERDUE WATCHER AGENT] Alerted {} overdue task(s). Notifications & emails dispatched.", count);
        }
    }
}
