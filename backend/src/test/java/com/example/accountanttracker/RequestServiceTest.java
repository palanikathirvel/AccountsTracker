package com.example.accountanttracker;

import com.example.accountanttracker.entity.Reminder;
import com.example.accountanttracker.entity.Request;
import com.example.accountanttracker.repository.ReminderRepository;
import com.example.accountanttracker.repository.RequestRepository;
import com.example.accountanttracker.repository.UserRepository;
import com.example.accountanttracker.service.EmailService;
import com.example.accountanttracker.service.RequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private RequestService requestService;

    private Request sampleRequest;

    @BeforeEach
    void setUp() {
        sampleRequest = new Request("GST Filing", "Demo Company A", "Kumar", "kumar@company.com",
                LocalDateTime.now().plusDays(2), "OPEN");
        sampleRequest.setId("1");
    }

    @Test
    void testCreateRequest_Success() {
        when(requestRepository.save(any(Request.class))).thenReturn(sampleRequest);

        Request created = requestService.createRequest(sampleRequest);

        assertNotNull(created);
        assertEquals("GST Filing", created.getTitle());
        assertEquals("OPEN", created.getStatus());
        assertEquals("kathirvelpalani294@gmail.com", created.getAccountantEmail());
        verify(requestRepository, times(1)).save(sampleRequest);
    }

    @Test
    void testCreateRequest_ValidationError_EmptyTitle() {
        Request invalid = new Request("", "Demo Company", "Kumar", "kumar@company.com",
                LocalDateTime.now(), "OPEN");

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
    void testGetRequestsForUser_EmployeeView() {
        when(requestRepository.findByAssigneeEmailIgnoreCaseOrderByDueDateTimeAsc("kumar@company.com"))
                .thenReturn(List.of(sampleRequest));

        List<Request> list = requestService.getRequestsForUser("kumar@company.com", "EMPLOYEE");

        assertEquals(1, list.size());
        assertEquals("Kumar", list.get(0).getAssignee());
    }

    @Test
    void testUpdateStatus_Success() {
        when(requestRepository.findById("1")).thenReturn(Optional.of(sampleRequest));
        when(requestRepository.save(any(Request.class))).thenReturn(sampleRequest);

        Request updated = requestService.updateStatus("1", "IN_PROGRESS");

        assertEquals("IN_PROGRESS", updated.getStatus());
        verify(requestRepository, times(1)).save(sampleRequest);
    }

    @Test
    void testUpdateStatus_InvalidStatus() {
        when(requestRepository.findById("1")).thenReturn(Optional.of(sampleRequest));

        assertThrows(IllegalArgumentException.class, () -> {
            requestService.updateStatus("1", "INVALID_STATUS");
        });
    }

    @Test
    void testGetSortedRequests() {
        Request r1 = new Request("Req 1", "Client A", "Kumar", "kumar@company.com", LocalDateTime.now().plusHours(1), "OPEN");
        Request r2 = new Request("Req 2", "Client B", "Ravi", "ravi@company.com", LocalDateTime.now().plusHours(5), "OPEN");
        when(requestRepository.findAllByOrderByDueDateTimeAsc()).thenReturn(Arrays.asList(r1, r2));

        List<Request> sorted = requestService.getSortedRequests();

        assertEquals(2, sorted.size());
        assertTrue(sorted.get(0).getDueDateTime().isBefore(sorted.get(1).getDueDateTime()));
        verify(requestRepository, times(1)).findAllByOrderByDueDateTimeAsc();
    }

    @Test
    void testGetOverdueRequests_Detection() {
        LocalDateTime past = LocalDateTime.now().minusHours(2);
        Request overdueOpen = new Request("TDS Report", "Demo Company B", "Ravi", "ravi@company.com", past, "OPEN");
        overdueOpen.setId("2");
        Request overdueInProgress = new Request("Audit Filing", "Demo Company C", "Kumar", "kumar@company.com", past, "IN_PROGRESS");
        overdueInProgress.setId("3");

        when(requestRepository.findOverdueRequests(any(LocalDateTime.class)))
                .thenReturn(List.of(overdueOpen, overdueInProgress));

        List<Request> result = requestService.getOverdueRequests();

        assertEquals(2, result.size());
        assertEquals("TDS Report", result.get(0).getTitle());
        assertTrue(result.get(0).isOverdue());
        assertEquals("Audit Filing", result.get(1).getTitle());
        assertTrue(result.get(1).isOverdue());
    }

    @Test
    void testCheckAndGenerateOverdueReminders_DispatchesEmailAndSaves() {
        LocalDateTime past = LocalDateTime.now().minusHours(2);
        Request overdueOpen = new Request("TDS Report", "Demo Company B", "Ravi", "ravi@company.com", past, "OPEN");
        overdueOpen.setId("2");
        overdueOpen.setLastReminderAt(null);

        Request overdueInProgress = new Request("GST Reconciliation", "Demo Company A", "Kumar", "kumar@company.com", past, "IN_PROGRESS");
        overdueInProgress.setId("3");
        overdueInProgress.setLastReminderAt(null);

        when(requestRepository.findOverdueRequests(any(LocalDateTime.class)))
                .thenReturn(List.of(overdueOpen, overdueInProgress));

        int count = requestService.checkAndGenerateOverdueReminders();

        assertEquals(2, count);
        verify(emailService, times(1)).sendOverdueAlert(overdueOpen);
        verify(emailService, times(1)).sendOverdueAlert(overdueInProgress);
        verify(reminderRepository, times(2)).save(any(Reminder.class));
        verify(requestRepository, times(1)).save(overdueOpen);
        verify(requestRepository, times(1)).save(overdueInProgress);
        assertNotNull(overdueOpen.getLastReminderAt());
        assertNotNull(overdueInProgress.getLastReminderAt());
    }

    @Test
    void testUpdateStatus_ResetsLastReminderAt() {
        Request req = new Request("Payroll Audit", "Client X", "Kumar", "kumar@company.com", LocalDateTime.now().minusHours(1), "OPEN");
        req.setId("10");
        req.setLastReminderAt(LocalDateTime.now().minusMinutes(30));

        when(requestRepository.findById("10")).thenReturn(Optional.of(req));
        when(requestRepository.save(any(Request.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Request updated = requestService.updateStatus("10", "IN_PROGRESS");
        assertEquals("IN_PROGRESS", updated.getStatus());
        assertNull(updated.getLastReminderAt());
    }
}
