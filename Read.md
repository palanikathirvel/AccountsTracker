# Accounts Tracker

Full-stack accounting task management platform featuring role-based workflows (Accountant & Employee portals), precise date/time deadline tracking, an autonomous overdue watcher agent, and AI-assisted workflow automation.

---

## 1. Git Repository

- **Repository URL**: [https://github.com/palanikathirvel/AccountsTracker.git](https://github.com/palanikathirvel/AccountsTracker.git)
- **Primary Branch**: `main`

---

## 2. Brief Instructions to Run

### Prerequisites
- **Java**: JDK 17 or higher
- **Build Tool**: Apache Maven 3.8+
- **Node.js**: v18.0+ and `npm`
- **Database**: MongoDB (Local MongoDB instance or MongoDB Atlas Cloud Cluster)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/palanikathirvel/AccountsTracker.git
cd AccountsTracker
```

---

### Step 2: Configure Environment Variables
You can configure the backend using environment variables or by updating `backend/src/main/resources/application.properties` (or `application-local.properties`):

```properties
# MongoDB Connection
spring.data.mongodb.uri=mongodb+srv://<username>:<password>@cluster0.mongodb.net/accountant_tracker?retryWrites=true&w=majority

# Scheduler / Autonomous Watcher Agent
scheduler.overdue-check-rate=15000
scheduler.reminder-cooldown-minutes=10
scheduler.enabled=true

# Optional: Email Service (Gmail SMTP)
spring.mail.username=demo.accountant@example.com
spring.mail.password=YOUR_16_CHAR_APP_PASSWORD

# Optional: AI Features (Google Gemini or OpenAI)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-flash-lite-latest
```
> *Note: If no email credentials or AI API keys are configured, the system automatically runs in safe simulation mode with built-in rule engines.*

---

### Step 3: Run the Backend
```bash
cd backend
mvn clean spring-boot:run
```
- **Backend API**: `http://localhost:8080`
- **Health / AI Status Check**: `http://localhost:8080/api/ai/status`

---

### Step 4: Run the Frontend
Open a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
- **Frontend App**: `http://localhost:5173`

---

### Demo Accounts (Dummy Data Only)

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Accountant** | `accountant@example.com` | `accountant123` | Full dashboard, create/assign tasks, AI analysis, watcher agent |
| **Employee** | `employee1@example.com` | `employee123` | Personal assigned task queue, status updates |
| **Employee** | `employee2@example.com` | `employee123` | Personal assigned task queue, status updates |

*(You can also register any new employee account directly from the login page).*

---

## 3. What Works

### 1. Role-Based Portals & Task Management
- **Accountant Dashboard**: Create tasks with client name, priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and exact date & time deadlines. View all team tasks, sort chronologically, and filter by status.
- **Employee Portal**: Tailored view showing strictly tasks assigned to the logged-in employee, with one-click status transitions (`OPEN` → `IN_PROGRESS` → `COMPLETED`).
- **Dynamic Employee Directory**: Auto-populates assignees from registered users.

### 2. Autonomous Overdue Watcher Agent
- Scheduled background task scans tasks at configured intervals (every 15 seconds).
- Identifies overdue open tasks (`dueDateTime < now()`).
- Automatically dispatches alert notifications, tracks reminders in MongoDB, and enforces cooldown windows to eliminate notification spam.

### 3. AI / LLM Automation (Gemini + Resilient Offline Engine)
- **Workload & Risk Analysis**: Evaluates team capacity, detects overdue bottlenecks, and provides actionable recommendations.
- **Context-Aware Email Drafting**: Drafts professional reminder emails with adjustable tone (`GENTLE`, `FIRM`, `URGENT`).
- **Statutory Task Breakdown**: Automatically generates compliance checklists, estimated hours, and step-by-step procedures for standard accounting workflows.

### 4. UI/UX & Responsive Theme Engine
- Polished, modern interface with multiple switchable themes (Modern Dark, Corporate Slate, Emerald Mint, Sunset Ember).
- Real-time KPI summary counters (Total, Open, In Progress, Completed, Overdue).

### 5. Automated Tests
- Backend test suite covering Controller and Service layers (`RequestServiceTest`, `RequestControllerTest`, `AiControllerTest`).

---

## 4. What Could Be Improved With More Time

1. **Production-Grade Authentication & Authorization**:
   - Upgrade from simulated authentication to stateless JWT / OAuth2 tokens with refresh token rotation and bcrypt-hashed salted passwords.
   - Enforce server-side Spring Security method-level annotations (`@PreAuthorize("hasRole('ACCOUNTANT')")`).

2. **Real-Time Push Notifications**:
   - Replace polling with WebSockets (STOMP) or Server-Sent Events (SSE) so status updates and agent alerts appear instantly without page reloads.

3. **Document & Attachment Handling**:
   - Add secure document upload/download functionality (e.g., invoices, bank statements, challans) integrated with AWS S3 or MinIO.

4. **Multi-Tenancy & Client Portal**:
   - Support multiple accounting firms/organizations with isolated databases or tenant schemas.
   - Introduce a read-only "Client Portal" where corporate clients can upload requested documents directly.

5. **Audit Logging & Regulatory Compliance**:
   - Maintain an immutable audit trail recording every task edit, deadline extension, status transition, and email dispatch for compliance reporting.

6. **End-to-End Testing & CI/CD Pipeline**:
   - Implement Cypress or Playwright test suites for end-to-end user workflows.
   - Set up automated GitHub Actions workflow for linting, test execution, container builds, and deployment.
