import React, { useState, useEffect, useMemo } from 'react';
import requestService from './services/requestService';
import LoginForm from './components/LoginForm';
import RequestForm from './components/RequestForm';
import RequestTable from './components/RequestTable';
import RemindersPanel from './components/RemindersPanel';

export default function App() {
  // Current user state (persisted in localStorage for convenience)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('tracker_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isSorted, setIsSorted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  const showMessage = (text, type = 'info') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
  };

  // Login handler
  const handleLogin = async (email, password) => {
    const user = await requestService.login(email, password);
    setCurrentUser(user);
    localStorage.setItem('tracker_user', JSON.stringify(user));
    showMessage(`Signed in as ${user.name} (${user.role})`, 'success');
  };

  // Register employee handler
  const handleRegisterEmployee = async (userData) => {
    await requestService.register(userData);
    showMessage(`Employee account created for ${userData.name}!`, 'success');
    await fetchEmployees();
  };

  // Sign out handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tracker_user');
    setRequests([]);
    showMessage('Signed out successfully', 'info');
  };

  // Fetch employees list
  const fetchEmployees = async () => {
    try {
      const data = await requestService.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  // Fetch requests for current user role
  const fetchRequests = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      let data;
      if (isSorted) {
        data = await requestService.getSortedRequests();
        if (currentUser.role === 'EMPLOYEE') {
          data = data.filter((r) => r.assigneeEmail === currentUser.email || r.assignee === currentUser.name);
        }
      } else {
        data = await requestService.getRequests(currentUser.email, currentUser.role);
      }
      setRequests(data);
    } catch (err) {
      showMessage('Failed to load requests: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reminders
  const fetchReminders = async () => {
    try {
      const data = await requestService.getReminders();
      setReminders(data);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchRequests();
      fetchEmployees();
      fetchReminders();

      // Poll every 15 seconds to sync with background Watcher Agent
      const interval = setInterval(() => {
        fetchRequests();
        fetchReminders();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser, isSorted]);

  // Create request handler
  const handleRequestCreated = async (formData) => {
    await requestService.createRequest(formData);
    await fetchRequests();
    await fetchReminders();
    showMessage('Task successfully assigned! Agent will watch deadline.', 'success');
  };

  // Status change handler
  const handleStatusChange = async (id, newStatus) => {
    try {
      await requestService.updateStatus(id, newStatus);
      showMessage(`Status updated to ${newStatus.replace('_', ' ')}`, 'success');
      await fetchRequests();
      await fetchReminders();
    } catch (err) {
      showMessage('Failed to update status: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  // Toggle sort by due date & time
  const handleToggleSort = async () => {
    setIsSorted(!isSorted);
  };

  // Trigger agent scan manually
  const handleTriggerScheduler = async () => {
    const res = await requestService.triggerScheduler();
    await fetchReminders();
    await fetchRequests();
    return res;
  };

  // Summary counts
  const summary = useMemo(() => {
    let total = requests.length;
    let open = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;
    const now = new Date();

    requests.forEach((r) => {
      const isOverdue = r.status === 'OPEN' && r.dueDateTime && new Date(r.dueDateTime) < now;
      if (isOverdue) overdue++;
      if (r.status === 'OPEN') open++;
      else if (r.status === 'IN_PROGRESS') inProgress++;
      else if (r.status === 'COMPLETED') completed++;
    });

    return { total, open, inProgress, completed, overdue };
  }, [requests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    const now = new Date();
    return requests.filter((r) => {
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'OVERDUE') {
        return r.status === 'OPEN' && r.dueDateTime && new Date(r.dueDateTime) < now;
      }
      return r.status === activeFilter;
    });
  }, [requests, activeFilter]);

  // If user is not logged in, show clean Login Form
  if (!currentUser) {
    return (
      <LoginForm
        onLoginSuccess={handleLogin}
        onRegisterEmployee={handleRegisterEmployee}
      />
    );
  }

  const isAccountant = currentUser.role === 'ACCOUNTANT';

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="title-row">
            <h1 className="app-title">Accountant Request Tracker</h1>
            <span className="role-tag role-tag-accountant">
              {isAccountant ? '👔 ACCOUNTANT DASHBOARD' : '👷 EMPLOYEE PORTAL'}
            </span>
          </div>
          <p className="app-tagline">
            Autonomous Date & Time Watcher Agent • Monitoring Deadlines & Dispatches
          </p>
        </div>

        <div className="header-right">
          <div className="user-profile-badge">
            <span className="user-name font-semibold">{currentUser.name}</span>
            <span className="user-email-text">{currentUser.email}</span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>
      </header>

      {/* Global alert banner */}
      {actionMessage.text && (
        <div className={`alert alert-${actionMessage.type === 'error' ? 'danger' : 'info'} banner-alert`}>
          {actionMessage.text}
        </div>
      )}

      {/* Employee Overdue Urgency Warning */}
      {!isAccountant && summary.overdue > 0 && (
        <div className="alert alert-danger urgent-overdue-alert">
          🚨 <strong>URGENT:</strong> You have {summary.overdue} task(s) whose date and time deadline has expired! Please review and update them immediately.
        </div>
      )}

      {/* Accountant: Create Request Form */}
      {isAccountant && (
        <section className="section-form">
          <RequestForm
            employees={employees}
            onEmployeeAdded={handleRegisterEmployee}
            onRequestCreated={handleRequestCreated}
          />
        </section>
      )}

      {/* Summary Statistics Cards */}
      <section className="section-summary">
        <div className="summary-grid">
          <div
            className={`summary-card ${activeFilter === 'ALL' ? 'active-card' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            <span className="summary-label">Total Assigned</span>
            <span className="summary-value">{summary.total}</span>
          </div>

          <div
            className={`summary-card status-card-open ${activeFilter === 'OPEN' ? 'active-card' : ''}`}
            onClick={() => setActiveFilter('OPEN')}
          >
            <span className="summary-label">Open</span>
            <span className="summary-value">{summary.open}</span>
          </div>

          <div
            className={`summary-card status-card-progress ${activeFilter === 'IN_PROGRESS' ? 'active-card' : ''}`}
            onClick={() => setActiveFilter('IN_PROGRESS')}
          >
            <span className="summary-label">In Progress</span>
            <span className="summary-value">{summary.inProgress}</span>
          </div>

          <div
            className={`summary-card status-card-completed ${activeFilter === 'COMPLETED' ? 'active-card' : ''}`}
            onClick={() => setActiveFilter('COMPLETED')}
          >
            <span className="summary-label">Completed</span>
            <span className="summary-value">{summary.completed}</span>
          </div>

          <div
            className={`summary-card status-card-overdue ${activeFilter === 'OVERDUE' ? 'active-card' : ''}`}
            onClick={() => setActiveFilter('OVERDUE')}
          >
            <div className="summary-label-overdue">
              <span className="overdue-dot"></span>
              <span>Overdue</span>
            </div>
            <span className="summary-value overdue-number">{summary.overdue}</span>
          </div>
        </div>
      </section>

      {/* Accountant: Autonomous Watcher Agent Panel */}
      {isAccountant && (
        <section className="section-reminders">
          <RemindersPanel
            reminders={reminders}
            onTriggerScheduler={handleTriggerScheduler}
            refreshing={loading}
          />
        </section>
      )}

      {/* Main Request Table & Controls Section */}
      <section className="section-table card">
        <div className="table-controls-bar">
          <div className="filter-buttons">
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              All ({summary.total})
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'OPEN' ? 'active' : ''}`}
              onClick={() => setActiveFilter('OPEN')}
            >
              Open ({summary.open})
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'IN_PROGRESS' ? 'active' : ''}`}
              onClick={() => setActiveFilter('IN_PROGRESS')}
            >
              In Progress ({summary.inProgress})
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setActiveFilter('COMPLETED')}
            >
              Completed ({summary.completed})
            </button>
            <button
              type="button"
              className={`filter-btn filter-btn-overdue ${activeFilter === 'OVERDUE' ? 'active' : ''}`}
              onClick={() => setActiveFilter('OVERDUE')}
            >
              ⚠️ Overdue ({summary.overdue})
            </button>
          </div>

          <div className="sort-controls">
            <button
              type="button"
              className={`btn btn-sort ${isSorted ? 'btn-sort-active' : ''}`}
              onClick={handleToggleSort}
              title="Sort requests by deadline date and time ascending"
            >
              ⏰ {isSorted ? 'Sorted by Deadline (Asc) ✓' : 'SORT BY DEADLINE'}
            </button>
          </div>
        </div>

        <RequestTable
          requests={filteredRequests}
          loading={loading}
          onStatusChange={handleStatusChange}
          currentUser={currentUser}
        />
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Accountant: <strong>kathirvelpalani294@gmail.com</strong> • Watcher Agent: Spring Scheduler (@Scheduled 30s) • Java 23 / Spring Boot 3 • MySQL
        </p>
      </footer>
    </div>
  );
}
