package com.example.accountanttracker.repository;

import com.example.accountanttracker.entity.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {

    /**
     * Retrieve all requests sorted by due date and time ascending.
     */
    List<Request> findAllByOrderByDueDateTimeAsc();

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
