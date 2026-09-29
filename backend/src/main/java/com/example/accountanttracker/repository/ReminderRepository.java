package com.example.accountanttracker.repository;

import com.example.accountanttracker.entity.Reminder;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReminderRepository extends MongoRepository<Reminder, String> {

    /**
     * Retrieve all reminders ordered by newest first.
     */
    List<Reminder> findAllByOrderByGeneratedAtDesc();

    /**
     * Delete reminders associated with a request ID.
     */
    void deleteByRequestId(String requestId);
}
