package com.example.accountanttracker;

import com.example.accountanttracker.controller.AiController;
import com.example.accountanttracker.controller.GlobalExceptionHandler;
import com.example.accountanttracker.entity.Reminder;
import com.example.accountanttracker.entity.Request;
import com.example.accountanttracker.repository.UserRepository;
import com.example.accountanttracker.service.AiService;
import com.example.accountanttracker.service.RequestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AiControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AiService aiService;

    @Mock
    private RequestService requestService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AiController aiController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(aiController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testGetAiStatus() throws Exception {
        when(aiService.getAiStatus()).thenReturn(Map.of(
                "activeProvider", "heuristic-engine",
                "isLiveLLM", false
        ));

        mockMvc.perform(get("/api/ai/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeProvider").value("heuristic-engine"));
    }

    @Test
    void testAnalyzeWorkload() throws Exception {
        when(aiService.analyzeWorkload(any(), any())).thenReturn(Map.of(
                "riskLevel", "HEALTHY",
                "totalTasks", 5
        ));

        mockMvc.perform(post("/api/ai/workload-analysis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.riskLevel").value("HEALTHY"));
    }

    @Test
    void testDraftEmail() throws Exception {
        Request req = new Request("TDS Filing", "Client X", "Kumar", "kumar@company.com", LocalDateTime.now(), "OPEN");
        req.setId("1");

        when(requestService.getRequestById("1")).thenReturn(Optional.of(req));
        when(aiService.draftReminderEmail(eq(req), eq("URGENT"))).thenReturn(Map.of(
                "subject", "Urgent Filing Notice",
                "body", "Please complete TDS filing."
        ));

        mockMvc.perform(post("/api/ai/draft-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("requestId", "1", "tone", "URGENT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subject").value("Urgent Filing Notice"));
    }

    @Test
    void testSendDraft() throws Exception {
        Reminder reminder = new Reminder("1", "TDS Filing", "Client X", "Kumar", LocalDate.now(), "OPEN", "AI Reminder");
        when(requestService.sendAiReminder("1", "Subject", "Body")).thenReturn(reminder);

        mockMvc.perform(post("/api/ai/send-draft")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "requestId", "1",
                                "subject", "Subject",
                                "body", "Body"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
