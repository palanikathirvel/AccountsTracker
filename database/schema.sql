-- ============================================================
-- Database Schema for Accountant Request Tracker
-- ============================================================

CREATE DATABASE IF NOT EXISTS accountant_tracker;
USE accountant_tracker;

-- Users table (Accountant & Employees)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL -- 'ACCOUNTANT' or 'EMPLOYEE'
);

-- Requests table (Date AND Time tracking)
CREATE TABLE IF NOT EXISTS requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    assignee VARCHAR(255) NOT NULL,
    assignee_email VARCHAR(255) NULL,
    accountant_email VARCHAR(255) NOT NULL DEFAULT 'kathirvelpalani294@gmail.com',
    due_date_time DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_reminder_at TIMESTAMP NULL
);

-- Reminders table (records automated agent alerts)
CREATE TABLE IF NOT EXISTS reminders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    request_title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    assignee VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
