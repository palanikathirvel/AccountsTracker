package com.example.accountanttracker.repository;

import com.example.accountanttracker.entity.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {

    /**
     * Retrieve all requests sorted by due date and time ascending.
     */
    List<Request> findAllByOrderByDueDateTimeAsc();

    /**
     * Find overdue requests where status is OPEN or IN_PROGRESS and dueDateTime is strictly before now.
     */
    @Query("SELECT r FROM Request r WHERE UPPER(r.status) IN ('OPEN', 'IN_PROGRESS') AND r.dueDateTime < :dateTime ORDER BY r.dueDateTime ASC")
    List<Request> findOverdueRequests(@Param("dateTime") LocalDateTime dateTime);

    /**
     * Find overdue requests matching any given collection of statuses.
     */
    @Query("SELECT r FROM Request r WHERE UPPER(r.status) IN :statuses AND r.dueDateTime < :dateTime ORDER BY r.dueDateTime ASC")
    List<Request> findByStatusInAndDueDateTimeBefore(@Param("statuses") Collection<String> statuses, @Param("dateTime") LocalDateTime dateTime);

    /**
     * Find overdue requests where status is OPEN and dueDateTime is strictly before now.
     */
    List<Request> findByStatusIgnoreCaseAndDueDateTimeBefore(String status, LocalDateTime dateTime);

    /**
     * Find requests assigned to a specific employee email.
     */
    List<Request> findByAssigneeEmailIgnoreCaseOrderByDueDateTimeAsc(String assigneeEmail);

    /**
     * Find requests assigned to a specific assignee name.
     */
    List<Request> findByAssigneeIgnoreCaseOrderByDueDateTimeAsc(String assignee);
}
