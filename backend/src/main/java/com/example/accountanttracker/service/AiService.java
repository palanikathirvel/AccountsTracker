package com.example.accountanttracker.service;

import com.example.accountanttracker.entity.Request;
import com.example.accountanttracker.entity.User;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AiService {

    private static final Logger logger = LoggerFactory.getLogger(AiService.class);

    @Value("${ai.provider:gemini}")
    private String configuredProvider;

    @Value("${gemini.api-key:${ai.gemini.api-key:}}")
    private String geminiApiKey;

    @Value("${gemini.model:${ai.gemini.model:gemini-1.5-flash}}")
    private String geminiModel;

    @Value("${ai.openai.api-key:}")
    private String openaiApiKey;

    @Value("${ai.openai.model:gpt-4o-mini}")
    private String openaiModel;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public AiService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(12))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Get current AI status and active provider.
     */
    public Map<String, Object> getAiStatus() {
        String activeProvider = determineActiveProvider();
        Map<String, Object> status = new HashMap<>();
        status.put("activeProvider", activeProvider);
        status.put("geminiConfigured", geminiApiKey != null && !geminiApiKey.isBlank());
        status.put("openaiConfigured", openaiApiKey != null && !openaiApiKey.isBlank());
        status.put("geminiModel", geminiModel);
        status.put("openaiModel", openaiModel);
        status.put("isLiveLLM", !"heuristic-engine".equalsIgnoreCase(activeProvider));
        return status;
    }

    private String determineActiveProvider() {
        if ("gemini".equalsIgnoreCase(configuredProvider) && geminiApiKey != null && !geminiApiKey.isBlank()) {
            return "gemini";
        }
        if ("openai".equalsIgnoreCase(configuredProvider) && openaiApiKey != null && !openaiApiKey.isBlank()) {
            return "openai";
        }
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            return "gemini";
        }
        if (openaiApiKey != null && !openaiApiKey.isBlank()) {
            return "openai";
        }
        return "heuristic-engine";
    }

    /**
     * Analyze team workload and deadline risks.
     */
    public Map<String, Object> analyzeWorkload(List<Request> requests, List<User> employees) {
        LocalDateTime now = LocalDateTime.now();
        int total = requests.size();
        long openCount = requests.stream().filter(r -> "OPEN".equalsIgnoreCase(r.getStatus())).count();
        long inProgressCount = requests.stream().filter(r -> "IN_PROGRESS".equalsIgnoreCase(r.getStatus())).count();
        long completedCount = requests.stream().filter(r -> "COMPLETED".equalsIgnoreCase(r.getStatus())).count();
        List<Request> overdueRequests = requests.stream()
                .filter(r -> !"COMPLETED".equalsIgnoreCase(r.getStatus()) && r.getDueDateTime() != null && r.getDueDateTime().isBefore(now))
                .toList();
        int overdueCount = overdueRequests.size();

        // Calculate employee loads
        Map<String, Integer> employeeLoad = new HashMap<>();
        Map<String, Integer> employeeOverdue = new HashMap<>();
        for (Request r : requests) {
            String name = r.getAssignee() != null ? r.getAssignee() : "Unassigned";
            if (!"COMPLETED".equalsIgnoreCase(r.getStatus())) {
                employeeLoad.put(name, employeeLoad.getOrDefault(name, 0) + 1);
                if (r.getDueDateTime() != null && r.getDueDateTime().isBefore(now)) {
                    employeeOverdue.put(name, employeeOverdue.getOrDefault(name, 0) + 1);
                }
            }
        }

        // Determine risk level
        String riskLevel = overdueCount > 2 ? "CRITICAL" : (overdueCount > 0 ? "ELEVATED" : "HEALTHY");

        String prompt = buildWorkloadPrompt(total, openCount, inProgressCount, completedCount, overdueCount, employeeLoad, employeeOverdue, overdueRequests);
        String activeProvider = determineActiveProvider();
        String analysisContent = null;

        if ("gemini".equalsIgnoreCase(activeProvider)) {
            analysisContent = callGemini(prompt, "You are an expert CPA and Chief Financial Controller assisting accounting teams in workload optimization, risk mitigation, and audit compliance.");
        } else if ("openai".equalsIgnoreCase(activeProvider)) {
            analysisContent = callOpenAi(prompt, "You are an expert CPA and Chief Financial Controller assisting accounting teams in workload optimization, risk mitigation, and audit compliance.");
        }

        if (analysisContent == null || analysisContent.isBlank()) {
            analysisContent = generateHeuristicWorkloadReport(total, openCount, inProgressCount, completedCount, overdueCount, employeeLoad, employeeOverdue, overdueRequests);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("riskLevel", riskLevel);
        result.put("totalTasks", total);
        result.put("openTasks", openCount);
        result.put("inProgressTasks", inProgressCount);
        result.put("completedTasks", completedCount);
        result.put("overdueTasks", overdueCount);
        result.put("employeeLoad", employeeLoad);
        result.put("employeeOverdue", employeeOverdue);
        result.put("analysisMarkdown", analysisContent);
        result.put("providerUsed", activeProvider);
        result.put("generatedAt", LocalDateTime.now().toString());

        return result;
    }

    /**
     * Draft an AI reminder email for a specific request and tone.
     */
    public Map<String, String> draftReminderEmail(Request request, String tone) {
        String effectiveTone = (tone == null || tone.isBlank()) ? "PROFESSIONAL" : tone.trim().toUpperCase();
        LocalDateTime now = LocalDateTime.now();
        boolean isOverdue = request.getDueDateTime() != null && request.getDueDateTime().isBefore(now);
        long hoursDiff = request.getDueDateTime() != null ? ChronoUnit.HOURS.between(request.getDueDateTime(), now) : 0;

        String prompt = String.format(
                "Draft a high-impact accounting reminder email for the following task:\n" +
                "- Task: %s\n" +
                "- Client: %s\n" +
                "- Assignee: %s\n" +
                "- Accountant: %s\n" +
                "- Deadline: %s\n" +
                "- Current Status: %s\n" +
                "- Overdue Status: %s (by approx %d hours)\n" +
                "- Desired Tone: %s\n\n" +
                "Requirements:\n" +
                "1. Provide a clear, compelling Subject Line prefixed with 'Subject: '\n" +
                "2. Provide the email body highlighting accounting compliance, client expectations, and exact next steps.\n" +
                "3. Ensure the closing signature represents the Accountant (%s).",
                request.getTitle(),
                request.getClientName(),
                request.getAssignee(),
                request.getAccountantEmail(),
                request.getDueDateTime(),
                request.getStatus(),
                isOverdue ? "OVERDUE" : "UPCOMING",
                Math.abs(hoursDiff),
                effectiveTone,
                request.getAccountantEmail()
        );

        String activeProvider = determineActiveProvider();
        String generated = null;

        if ("gemini".equalsIgnoreCase(activeProvider)) {
            generated = callGemini(prompt, "You are a professional Executive Accounting Assistant crafting crisp, respectful, and outcome-oriented reminder communications.");
        } else if ("openai".equalsIgnoreCase(activeProvider)) {
            generated = callOpenAi(prompt, "You are a professional Executive Accounting Assistant crafting crisp, respectful, and outcome-oriented reminder communications.");
        }

        if (generated == null || generated.isBlank()) {
            return generateHeuristicEmailDraft(request, effectiveTone, isOverdue, hoursDiff);
        }

        return parseSubjectAndBody(generated, request, effectiveTone);
    }

    /**
     * Autonomous Watcher Agent Generative AI: Automatically generates context-aware overdue reminder email.
     */
    public Map<String, String> generateOverdueEmail(Request request) {
        return draftReminderEmail(request, "URGENT");
    }

    /**
     * Auto-breakdown a task into accounting checklist items and feasibility estimate.
     */
    public Map<String, Object> breakdownTask(String title, String clientName, String assignee) {
        String prompt = String.format(
                "Break down this accounting task into a structured workflow:\n" +
                "- Task Title: %s\n" +
                "- Client: %s\n" +
                "- Assigned To: %s\n\n" +
                "Return a structured breakdown including:\n" +
                "1. Estimated hours to complete\n" +
                "2. Key subtasks / compliance steps\n" +
                "3. Required source documents from client\n" +
                "4. Potential accounting or statutory audit risks",
                title, clientName, assignee
        );

        String activeProvider = determineActiveProvider();
        String content = null;

        if ("gemini".equalsIgnoreCase(activeProvider)) {
            content = callGemini(prompt, "You are a Senior Tax & Accounting Workflow Consultant.");
        } else if ("openai".equalsIgnoreCase(activeProvider)) {
            content = callOpenAi(prompt, "You are a Senior Tax & Accounting Workflow Consultant.");
        }

        if (content == null || content.isBlank()) {
            content = generateHeuristicTaskBreakdown(title, clientName, assignee);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("title", title);
        response.put("clientName", clientName);
        response.put("assignee", assignee);
        response.put("breakdownMarkdown", content);
        response.put("providerUsed", activeProvider);
        return response;
    }

    // =========================================================================
    // Live LLM Integrations: Google Gemini & OpenAI REST APIs
    // =========================================================================

    private String callGemini(String userPrompt, String systemInstruction) {
        String[] candidateModels = new String[]{
                (geminiModel != null && !geminiModel.isBlank()) ? geminiModel : "gemini-flash-lite-latest",
                "gemini-flash-lite-latest",
                "gemini-3.1-flash-lite-preview",
                "gemini-3.1-flash-lite",
                "gemini-3.8-flash"
        };

        for (String modelToTry : candidateModels) {
            try {
                String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                        modelToTry, geminiApiKey);

                Map<String, Object> requestPayload = new HashMap<>();
                List<Map<String, Object>> contents = new ArrayList<>();
                Map<String, Object> content = new HashMap<>();
                List<Map<String, String>> parts = new ArrayList<>();
                parts.add(Map.of("text", systemInstruction + "\n\n" + userPrompt));
                content.put("parts", parts);
                contents.add(content);
                requestPayload.put("contents", contents);

                String jsonBody = objectMapper.writeValueAsString(requestPayload);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .header("x-goog-api-key", geminiApiKey)
                        .timeout(Duration.ofSeconds(15))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode candidates = root.path("candidates");
                    if (candidates.isArray() && !candidates.isEmpty()) {
                        JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                        if (!textNode.isMissingNode()) {
                            return textNode.asText();
                        }
                    }
                } else {
                    logger.warn("Gemini model {} returned status {}. Trying next model...", modelToTry, response.statusCode());
                }
            } catch (Exception ex) {
                logger.warn("Exception calling Gemini model {}: {}", modelToTry, ex.getMessage());
            }
        }
        return null;
    }

    private String callOpenAi(String userPrompt, String systemInstruction) {
        try {
            String url = "https://api.openai.com/v1/chat/completions";

            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("model", openaiModel);
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemInstruction));
            messages.add(Map.of("role", "user", "content", userPrompt));
            requestPayload.put("messages", messages);
            requestPayload.put("temperature", 0.7);

            String jsonBody = objectMapper.writeValueAsString(requestPayload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + openaiApiKey)
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    JsonNode contentNode = choices.get(0).path("message").path("content");
                    if (!contentNode.isMissingNode()) {
                        return contentNode.asText();
                    }
                }
            } else {
                logger.warn("OpenAI API returned status {}: {}", response.statusCode(), response.body());
            }
        } catch (Exception ex) {
            logger.warn("Exception calling OpenAI API: {}", ex.getMessage());
        }
        return null;
    }

    // =========================================================================
    // Heuristic & Intelligent Heuristic Fallback Generators
    // =========================================================================

    private String buildWorkloadPrompt(int total, long open, long inProg, long comp, int overdue,
                                       Map<String, Integer> load, Map<String, Integer> overdues, List<Request> overdueList) {
        StringBuilder sb = new StringBuilder();
        sb.append("Please provide an executive accounting workload and risk analysis for our firm:\n");
        sb.append(String.format("- Total Tasks: %d | Open: %d | In Progress: %d | Completed: %d | Overdue: %d\n", total, open, inProg, comp, overdue));
        sb.append("- Team Active Task Allocation:\n");
        load.forEach((k, v) -> sb.append(String.format("  * %s: %d active tasks (%d overdue)\n", k, v, overdues.getOrDefault(k, 0))));
        sb.append("- Current Overdue Items:\n");
        for (Request r : overdueList) {
            sb.append(String.format("  * '%s' for Client '%s' (Assigned: %s, Due: %s, Status: %s)\n",
                    r.getTitle(), r.getClientName(), r.getAssignee(), r.getDueDateTime(), r.getStatus()));
        }
        sb.append("\nPlease output clean GitHub Markdown covering:\n");
        sb.append("1. **Executive Workload Assessment & Risk Rating** (CRITICAL, ELEVATED, or HEALTHY)\n");
        sb.append("2. **Team Bottleneck & Allocation Insights**\n");
        sb.append("3. **High-Priority Mitigation Actions for Accountant**\n");
        sb.append("4. **Client Communication Strategy**\n");
        return sb.toString();
    }

    private String generateHeuristicWorkloadReport(int total, long open, long inProg, long comp, int overdue,
                                                  Map<String, Integer> load, Map<String, Integer> overdues, List<Request> overdueList) {
        StringBuilder sb = new StringBuilder();
        String risk = overdue > 2 ? "🔴 CRITICAL RISK" : (overdue > 0 ? "🟡 ELEVATED RISK" : "🟢 HEALTHY & ON TRACK");

        sb.append("### 📊 AI Executive Workload & Risk Assessment\n\n");
        sb.append(String.format("**Overall Status:** %s\n\n", risk));
        sb.append(String.format("Currently tracking **%d total client assignments**, with **%d open**, **%d in progress**, **%d completed**, and **%d overdue**.\n\n",
                total, open, inProg, comp, overdue));

        sb.append("#### 1. 🔍 Team Capacity & Bottleneck Analysis\n");
        if (load.isEmpty()) {
            sb.append("*No active tasks are currently assigned to the team.*\n\n");
        } else {
            // Find employee with highest load
            String topLoaded = load.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("None");
            sb.append(String.format("- **Primary Workload Concentration:** **%s** is carrying the largest active queue with **%d active task(s)**.\n",
                    topLoaded, load.getOrDefault(topLoaded, 0)));

            if (!overdues.isEmpty()) {
                String topOverdue = overdues.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("None");
                sb.append(String.format("- **Critical Deadline Pressure:** **%s** has **%d overdue task(s)** requiring immediate accountant intervention.\n",
                        topOverdue, overdues.get(topOverdue)));
            } else {
                sb.append("- **Deadline Adherence:** All active tasks are currently within scheduled timeframe windows.\n");
            }
            sb.append("\n");
        }

        sb.append("#### 2. ⚠️ Critical Task Breakdown\n");
        if (overdueList.isEmpty()) {
            sb.append("✅ **Zero overdue tasks.** The autonomous watcher agent has verified all deadlines are in compliance.\n\n");
        } else {
            for (Request r : overdueList) {
                sb.append(String.format("- 🚨 **%s** (Client: *%s*) → Assigned to **%s** | Deadline was **%s** | Status: `%s`\n",
                        r.getTitle(), r.getClientName(), r.getAssignee(), r.getDueDateTime(), r.getStatus()));
            }
            sb.append("\n");
        }

        sb.append("#### 3. 🎯 Strategic Recommendations for the Accountant\n");
        if (overdue > 0) {
            sb.append("1. **Trigger Priority Follow-ups:** Immediately dispatch reminder emails to assignees with overdue items.\n");
            sb.append("2. **Workload Redistribution:** If bottlenecks persist on specific employees, reallocate new filings to team members with lower active queues.\n");
            sb.append("3. **Client Proactive Notice:** Inform impacted clients of updated turnaround schedules to safeguard firm compliance and SLA standards.\n");
        } else {
            sb.append("1. **Sustain Current Velocity:** Continue regular 30-second Watcher Agent monitoring.\n");
            sb.append("2. **Pipeline Planning:** Team capacity is balanced; ready to intake additional client accounting requests.\n");
        }

        sb.append("\n> *💡 Generated via Built-in Intelligent Rule Engine. Configure `ai.gemini.api-key` in `application.properties` to enable Google Gemini live generation.*");
        return sb.toString();
    }

    private Map<String, String> generateHeuristicEmailDraft(Request request, String tone, boolean isOverdue, long hoursDiff) {
        String client = request.getClientName();
        String title = request.getTitle();
        String assignee = request.getAssignee();
        String deadlineStr = request.getDueDateTime() != null ? request.getDueDateTime().toString().replace('T', ' ') : "Scheduled Date";
        String accountantEmail = request.getAccountantEmail() != null ? request.getAccountantEmail() : "kathirvelpalani294@gmail.com";

        String subject;
        StringBuilder body = new StringBuilder();

        switch (tone) {
            case "URGENT":
                subject = String.format("🚨 CRITICAL: Immediate Action Required on '%s' for Client '%s'", title, client);
                body.append(String.format("Dear %s,\n\n", assignee));
                body.append(String.format("This is an urgent notification regarding the accounting assignment '%s' for client '%s'.\n\n", title, client));
                body.append(String.format("The scheduled deadline was %s and this item is currently marked as %s.\n\n", deadlineStr, request.getStatus()));
                body.append("Missing this submission creates direct compliance and financial exposure for the client. Please immediately prioritize this task and update its status in the Accountant Tracker as soon as you have completed it.\n\n");
                body.append("If there are blocking dependencies (missing client vouchers, bank statements, or portal errors), notify me immediately.\n\n");
                body.append(String.format("Regards,\nSenior Accountant\n%s", accountantEmail));
                break;

            case "EXECUTIVE":
                subject = String.format("ESCALATION: Overdue Assignment Notice - '%s' (%s)", title, client);
                body.append(String.format("Attention: %s,\n\n", assignee));
                body.append(String.format("Please be advised that the deadline (%s) for '%s' (Client: %s) has lapsed without recorded completion.\n\n", deadlineStr, title, client));
                body.append("As part of our internal quality assurance and deadline oversight, this item has been flagged on the executive dashboard.\n\n");
                body.append("Required Next Step:\n");
                body.append("1. Complete reconciliation or file the requested return today.\n");
                body.append("2. Mark task status as COMPLETED in the portal.\n\n");
                body.append(String.format("Sincerely,\nAccounting Lead & Supervisory Team\n%s", accountantEmail));
                break;

            case "POLITE":
                subject = String.format("Friendly Reminder: Update on '%s' for '%s'", title, client);
                body.append(String.format("Hi %s,\n\n", assignee));
                body.append(String.format("Hope you are having a productive week! Just touching base on '%s' for '%s'.\n\n", title, client));
                body.append(String.format("The targeted deadline was %s. Could you kindly check the status and update the system when you have a moment?\n\n", deadlineStr));
                body.append("Let me know if you need any assistance or additional client records to wrap this up.\n\n");
                body.append(String.format("Best regards,\n%s", accountantEmail));
                break;

            case "FIRM":
            case "PROFESSIONAL":
            default:
                subject = String.format("Reminder: Overdue Status for '%s' (Client: %s)", title, client);
                body.append(String.format("Dear %s,\n\n", assignee));
                body.append(String.format("This is a reminder from the Accounting Desk regarding the task '%s' for client '%s'.\n\n", title, client));
                body.append(String.format("• Scheduled Deadline: %s\n", deadlineStr));
                body.append(String.format("• Current Status: %s\n\n", request.getStatus()));
                body.append("Kindly review the current progress on this filing and submit the completed records or update the status in the tracker portal.\n\n");
                body.append(String.format("Thank you,\nAccountant\n%s", accountantEmail));
                break;
        }

        Map<String, String> result = new HashMap<>();
        result.put("subject", subject);
        result.put("body", body.toString());
        result.put("tone", tone);
        result.put("providerUsed", "heuristic-engine");
        return result;
    }

    private String generateHeuristicTaskBreakdown(String title, String clientName, String assignee) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("### 📋 AI Workflow Breakdown for '%s'\n", title));
        sb.append(String.format("**Client:** %s | **Assignee:** %s\n\n", clientName, assignee));

        sb.append("#### ⏱️ Estimated Effort & Turnaround\n");
        sb.append("- **Estimated Working Time:** 2 – 4 Business Hours\n");
        sb.append("- **Recommended Buffer:** 24 Hours prior to statutory filing deadline\n\n");

        sb.append("#### 📌 Key Operational Steps\n");
        sb.append("1. **Document Intake & Verification:** Verify client invoices, ledger exports, and bank statements for the relevant period.\n");
        sb.append("2. **Reconciliation & Trial Balance Review:** Check for debit/credit variances and GST/TDS mismatch reports.\n");
        sb.append("3. **Preparation & Quality Check:** Compile statements, draft return/voucher, and verify client approvals.\n");
        sb.append("4. **Portal Submission & Archival:** Upload final computation to portal, archive acknowledgment receipt, and mark task COMPLETED.\n\n");

        sb.append("#### ⚠️ Statutory & Compliance Risk Assessment\n");
        sb.append("- **Late Filing Exposure:** Potential interest, late fees, or loss of input tax credit for client if deadline lapses.\n");
        sb.append("- **Audit Readiness:** Ensure supporting tax invoices and signed confirmations are archived in the client folder.\n\n");

        sb.append("> *💡 AI-assisted suggestions tailored for accounting & audit operations.*");
        return sb.toString();
    }

    private Map<String, String> parseSubjectAndBody(String generated, Request request, String tone) {
        Map<String, String> res = new HashMap<>();
        String subject = "Reminder: " + request.getTitle() + " for " + request.getClientName();
        String body = generated;

        String[] lines = generated.split("\n");
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.toLowerCase().startsWith("subject:")) {
                subject = line.substring(8).trim();
                // Remove subject line from body
                StringBuilder sb = new StringBuilder();
                for (int j = i + 1; j < lines.length; j++) {
                    sb.append(lines[j]).append("\n");
                }
                body = sb.toString().trim();
                break;
            }
        }

        res.put("subject", subject);
        res.put("body", body);
        res.put("tone", tone);
        res.put("providerUsed", determineActiveProvider());
        return res;
    }
}
