package com.example.accountanttracker.repository;

import com.example.accountanttracker.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    /**
     * Retrieve all reminders ordered by newest first.
     */
    List<Reminder> findAllByOrderByGeneratedAtDesc();
}
