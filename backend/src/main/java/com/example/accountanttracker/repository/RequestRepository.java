package com.example.accountanttracker.repository;

import com.example.accountanttracker.entity.Request;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface RequestRepository extends MongoRepository<Request, String> {

    /**
     * Retrieve all requests sorted by due date and time ascending.
     */
    List<Request> findAllByOrderByDueDateTimeAsc();

    /**
     * Find overdue requests where status is OPEN or IN_PROGRESS and dueDateTime is strictly before now.
     */
    @Query(value = "{ 'status': { $in: ['OPEN', 'IN_PROGRESS'] }, 'dueDateTime': { $lt: ?0 } }", sort = "{ 'dueDateTime': 1 }")
    List<Request> findOverdueRequests(LocalDateTime dateTime);

    /**
     * Find overdue requests matching any given collection of statuses.
     */
    List<Request> findByStatusInAndDueDateTimeBeforeOrderByDueDateTimeAsc(Collection<String> statuses, LocalDateTime dateTime);

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
