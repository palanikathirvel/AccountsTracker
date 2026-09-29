package com.example.accountanttracker;

import com.example.accountanttracker.controller.GlobalExceptionHandler;
import com.example.accountanttracker.controller.RequestController;
import com.example.accountanttracker.entity.Request;
import com.example.accountanttracker.service.RequestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class RequestControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RequestService requestService;

    @InjectMocks
    private RequestController requestController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(requestController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void testCreateRequest_Returns201() throws Exception {
        Request req = new Request("GST Filing", "Demo Company A", "Kumar", "kumar@company.com", LocalDateTime.now().plusDays(2), "OPEN");
        req.setId(1L);

        when(requestService.createRequest(any(Request.class))).thenReturn(req);

        mockMvc.perform(post("/api/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("GST Filing"));
    }

    @Test
    void testGetAllRequests_Returns200() throws Exception {
        Request req = new Request("GST Filing", "Demo Company A", "Kumar", "kumar@company.com", LocalDateTime.now().plusDays(2), "OPEN");
        when(requestService.getAllRequests()).thenReturn(List.of(req));

        mockMvc.perform(get("/api/requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("GST Filing"));
    }

    @Test
    void testGetRequestById_NotFound_Returns404() throws Exception {
        when(requestService.getRequestById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/requests/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateStatus_Returns200() throws Exception {
        Request updated = new Request("GST Filing", "Demo Company A", "Kumar", "kumar@company.com", LocalDateTime.now().plusDays(2), "IN_PROGRESS");
        updated.setId(1L);

        when(requestService.updateStatus(eq(1L), eq("IN_PROGRESS"))).thenReturn(updated);

        mockMvc.perform(put("/api/requests/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "IN_PROGRESS"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    void testGetOverdueRequests_Returns200() throws Exception {
        Request overdue = new Request("TDS Report", "Demo Company B", "Ravi", "ravi@company.com", LocalDateTime.now().minusHours(1), "OPEN");
        when(requestService.getOverdueRequests()).thenReturn(List.of(overdue));

        mockMvc.perform(get("/api/requests/overdue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("TDS Report"));
    }
}
