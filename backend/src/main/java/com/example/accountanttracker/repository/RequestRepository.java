package com.example.accountanttracker.repository;

import com.example.accountanttracker.entity.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {

    /**
     * Retrieve all requests sorted by due date in ascending order.
     */
    List<Request> findAllByOrderByDueDateAsc();

    /**
     * Find overdue requests where status matches (e.g. "OPEN") and due date is strictly before the specified date.
     */
    List<Request> findByStatusIgnoreCaseAndDueDateBefore(String status, LocalDate date);

    /**
     * Find requests by status.
     */
    List<Request> findByStatusIgnoreCase(String status);
}
