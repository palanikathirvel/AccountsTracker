# Accountant Request Tracker with Autonomous Date & Time Watcher Agent

A full-stack system designed for accounting teams featuring **Role-Based Portals** (Accountant vs. Employee), exact **Date & Time deadline tracking**, and an **Autonomous Watcher Agent** that monitors deadlines and automatically generates overdue alerts with email notifications dispatched to the Assignee and CC'd to the Accountant (**`kathirvelpalani294@gmail.com`**).

---

## 1. Project Overview & Role Architecture

### 👔 Accountant Portal
* **Static Login**: `kathirvelpalani294@gmail.com` (Password: `accountant123`)
* **Capabilities**:
  * Create and assign accounting tasks with **exact Date & Time deadlines**.
  * Choose from dynamic employees or register new ones.
  * Monitor the full team dashboard across all tasks.
  * Real-time summary metrics (Total, Open, In Progress, Completed, Overdue).
  * Sort by deadline chronologically.
  * Control and inspect the **Autonomous Overdue Watcher Agent** scan log and email alerts.

### 👷 Employee Portal
* **Demo Logins**:
  * Kumar: `kumar@company.com` (Password: `kumar123`)
  * Ravi: `ravi@company.com` (Password: `ravi123`)
  * Arun: `arun@company.com` (Password: `arun123`)
  * Priya: `priya@company.com` (Password: `priya123`)
  * *(Or register any new employee directly on the login screen)*
* **Capabilities**:
  * **Personalized View**: Only sees tasks specifically assigned to them.
  * Immediate status updates (`OPEN` → `IN_PROGRESS` → `COMPLETED`).
  * Urgent alert banner whenever any of their assigned tasks becomes overdue.

---

## 2. Autonomous Date & Time Watcher Agent

### How the Agent Works:
1. **Periodic Deadline Scanning**:
   The agent runs autonomously in the background via `@Scheduled` every 30 seconds (configurable via `scheduler.overdue-check-rate=30000`).
2. **Date & Time Comparison**:
   A task is identified as overdue the moment the current system clock passes the deadline:
   $$\text{status} = \text{"OPEN"} \land \text{dueDateTime} < \text{LocalDateTime.now()}$$
3. **Dual Notification & Email Delivery**:
   * Sends an automated email to the **Assignee's email**.
   * CCs the **Accountant** (`kathirvelpalani294@gmail.com`).
   * Records the notice in the `reminders` table and UI agent log.
4. **Duplicate Prevention**:
   Prevents spamming repeated emails for the same task.

---

## 3. Configuring Real Gmail Sending

In `backend/src/main/resources/application.properties`:
```properties
# Spring Mail (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=kathirvelpalani294@gmail.com
spring.mail.password=YOUR_16_CHARACTER_GMAIL_APP_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

> **How to generate a Gmail App Password:**
> 1. Go to your Google Account: [https://myaccount.google.com/security](https://myaccount.google.com/security)
> 2. Ensure 2-Step Verification is ON.
> 3. Search for **"App passwords"** ([https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
> 4. Create a new App Password (name it "Accounts Tracker") and paste the 16 characters into `spring.mail.password`.
>
> *(Note: If the password is not yet configured, the system automatically runs in safe simulation mode, printing full email headers to the console without crashing).*

---

## 4. How to Run Locally

### Start Backend
```bash
cd backend
mvn clean spring-boot:run
```
*(Runs on `http://localhost:8080`)*

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```
*(Runs on `http://localhost:5173`)*

---

## 5. API Endpoints

### Authentication
* `POST /api/auth/login`: `{ "email": "...", "password": "..." }`
* `POST /api/auth/register`: `{ "name": "...", "email": "...", "password": "...", "role": "EMPLOYEE" }`
* `GET /api/auth/employees`: Returns list of all registered employees for task assignment.

### Tasks
* `POST /api/requests`: Create task with `dueDateTime`, `clientName`, `title`, `assignee`, `assigneeEmail`, `accountantEmail`.
* `GET /api/requests?email=...&role=...`: Fetches all tasks (for Accountant) or assigned tasks (for Employee).
* `PUT /api/requests/{id}/status`: `{ "status": "IN_PROGRESS" }`
* `GET /api/requests/sorted`: Returns tasks sorted by deadline ascending.
* `GET /api/requests/overdue`: Returns currently overdue open tasks.

### Agent
* `POST /api/scheduler/trigger`: Forces immediate deadline scan by the Watcher Agent.
* `GET /api/reminders`: Retrieves log of agent-generated alerts.
