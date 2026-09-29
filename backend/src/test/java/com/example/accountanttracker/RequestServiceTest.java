package com.example.accountanttracker;

import com.example.accountanttracker.entity.Reminder;
import com.example.accountanttracker.entity.Request;
import com.example.accountanttracker.repository.ReminderRepository;
import com.example.accountanttracker.repository.RequestRepository;
import com.example.accountanttracker.service.RequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RequestServiceTest {

    @Mock
    private RequestRepository requestRepository;

    @Mock
    private ReminderRepository reminderRepository;

    @InjectMocks
    private RequestService requestService;

    private Request sampleRequest;

    @BeforeEach
    void setUp() {
        sampleRequest = new Request("GST Filing", "Demo Company A", "Kumar", LocalDate.now().plusDays(2), "OPEN");
        sampleRequest.setId(1L);
    }

    @Test
    void testCreateRequest_Success() {
        when(requestRepository.save(any(Request.class))).thenReturn(sampleRequest);

        Request created = requestService.createRequest(sampleRequest);

        assertNotNull(created);
        assertEquals("GST Filing", created.getTitle());
        assertEquals("OPEN", created.getStatus());
        verify(requestRepository, times(1)).save(sampleRequest);
    }

    @Test
    void testCreateRequest_ValidationError_EmptyTitle() {
        Request invalid = new Request("", "Demo Company", "Kumar", LocalDate.now(), "OPEN");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            requestService.createRequest(invalid);
        });

        assertTrue(ex.getMessage().contains("Title cannot be empty"));
    }

    @Test
    void testGetAllRequests() {
        when(requestRepository.findAll()).thenReturn(List.of(sampleRequest));

        List<Request> list = requestService.getAllRequests();

        assertEquals(1, list.size());
        assertEquals("GST Filing", list.get(0).getTitle());
    }

    @Test
    void testUpdateStatus_Success() {
        when(requestRepository.findById(1L)).thenReturn(Optional.of(sampleRequest));
        when(requestRepository.save(any(Request.class))).thenReturn(sampleRequest);

        Request updated = requestService.updateStatus(1L, "IN_PROGRESS");

        assertEquals("IN_PROGRESS", updated.getStatus());
        verify(requestRepository, times(1)).save(sampleRequest);
    }

    @Test
    void testUpdateStatus_InvalidStatus() {
        when(requestRepository.findById(1L)).thenReturn(Optional.of(sampleRequest));

        assertThrows(IllegalArgumentException.class, () -> {
            requestService.updateStatus(1L, "INVALID_STATUS");
        });
    }

    @Test
    void testGetSortedRequests() {
        Request r1 = new Request("Req 1", "Client A", "Kumar", LocalDate.now().plusDays(1), "OPEN");
        Request r2 = new Request("Req 2", "Client B", "Ravi", LocalDate.now().plusDays(5), "OPEN");
        when(requestRepository.findAllByOrderByDueDateAsc()).thenReturn(Arrays.asList(r1, r2));

        List<Request> sorted = requestService.getSortedRequests();

        assertEquals(2, sorted.size());
        assertTrue(sorted.get(0).getDueDate().isBefore(sorted.get(1).getDueDate()));
        verify(requestRepository, times(1)).findAllByOrderByDueDateAsc();
    }

    @Test
    void testGetOverdueRequests_Detection() {
        LocalDate today = LocalDate.now();
        Request overdue = new Request("TDS Report", "Demo Company B", "Ravi", today.minusDays(2), "OPEN");
        overdue.setId(2L);

        when(requestRepository.findByStatusIgnoreCaseAndDueDateBefore(eq("OPEN"), any(LocalDate.class)))
                .thenReturn(List.of(overdue));

        List<Request> result = requestService.getOverdueRequests();

        assertEquals(1, result.size());
        assertEquals("TDS Report", result.get(0).getTitle());
        assertTrue(result.get(0).isOverdue());
    }

    @Test
    void testCheckAndGenerateOverdueReminders_GeneratesReminder() {
        LocalDate today = LocalDate.now();
        Request overdue = new Request("TDS Report", "Demo Company B", "Ravi", today.minusDays(2), "OPEN");
        overdue.setId(2L);
        overdue.setLastReminderAt(null);

        when(requestRepository.findByStatusIgnoreCaseAndDueDateBefore(eq("OPEN"), any(LocalDate.class)))
                .thenReturn(List.of(overdue));

        int count = requestService.checkAndGenerateOverdueReminders();

        assertEquals(1, count);
        verify(reminderRepository, times(1)).save(any(Reminder.class));
        verify(requestRepository, times(1)).save(overdue);
        assertNotNull(overdue.getLastReminderAt());
    }

    @Test
    void testAvoidDuplicateReminders_SameDay() {
        LocalDate today = LocalDate.now();
        Request overdue = new Request("TDS Report", "Demo Company B", "Ravi", today.minusDays(2), "OPEN");
        overdue.setId(2L);
        // Already reminded earlier today
        overdue.setLastReminderAt(LocalDateTime.now().minusHours(1));

        when(requestRepository.findByStatusIgnoreCaseAndDueDateBefore(eq("OPEN"), any(LocalDate.class)))
                .thenReturn(List.of(overdue));

        int count = requestService.checkAndGenerateOverdueReminders();

        // Should NOT generate duplicate reminder today
        assertEquals(0, count);
        verify(reminderRepository, never()).save(any(Reminder.class));
    }
}
