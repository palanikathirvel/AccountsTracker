package com.example.accountanttracker.scheduler;

import com.example.accountanttracker.service.RequestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler that periodically scans for overdue requests and generates reminders.
 * The interval is configurable in application.properties via 'scheduler.overdue-check-rate'.
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
     * Periodic task to check overdue requests and issue reminders to assignees.
     * Rate is configurable (default: 60000 ms = 60 seconds).
     */
    @Scheduled(fixedRateString = "${scheduler.overdue-check-rate:60000}")
    public void runOverdueCheck() {
        logger.info("Executing scheduled overdue request check...");
        int count = requestService.checkAndGenerateOverdueReminders();
        if (count > 0) {
            logger.info("Scheduler generated {} new overdue reminder(s).", count);
        } else {
            logger.debug("Scheduler check complete. No new overdue reminders to generate.");
        }
    }
}
