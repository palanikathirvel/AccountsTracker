import React, { useState, useEffect, useMemo } from 'react';
import requestService from './services/requestService';
import LoginForm from './components/LoginForm';
import RequestForm from './components/RequestForm';
import RequestTable from './components/RequestTable';
import RemindersPanel from './components/RemindersPanel';
import ThemeSelector from './components/ThemeSelector';
import {
  ShieldCheck,
  Search,
  X,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Activity,
  User,
  Sparkles,
  Bot,
  Filter,
  ArrowUpDown,
  Calendar,
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSorted, setIsSorted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock for matching against deadlines
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showMessage = (text, type = 'info') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage({ text: '', type: '' }), 4500);
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
    const res = await requestService.register(userData);
    showMessage(`Employee account registered for ${userData.name}!`, 'success');
    await fetchEmployees();
    return res;
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
  const fetchRequests = async (showSpinner = false) => {
    if (!currentUser) return;
    if (showSpinner) setLoading(true);
    try {
      let data;
      if (isSorted) {
        data = await requestService.getSortedRequests();
        if (currentUser.role === 'EMPLOYEE') {
          data = data.filter(
            (r) =>
              r.assigneeEmail === currentUser.email ||
              r.assignee?.toLowerCase() === currentUser.name?.toLowerCase()
          );
        }
      } else {
        data = await requestService.getRequests(currentUser.email, currentUser.role);
      }
      setRequests(data);
    } catch (err) {
      showMessage('Failed to load requests: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      if (showSpinner) setLoading(false);
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
      fetchRequests(true);
      fetchEmployees();
      fetchReminders();

      // Poll every 15 seconds to sync with background Watcher Agent
      const interval = setInterval(() => {
        fetchRequests(false);
        fetchReminders();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser, isSorted]);

  // Create request handler
  const handleRequestCreated = async (formData) => {
    await requestService.createRequest(formData);
    await fetchRequests(false);
    await fetchReminders();
    showMessage('Task successfully assigned! Autonomous Agent will monitor deadline.', 'success');
  };

  // Status change handler
  const handleStatusChange = async (id, newStatus) => {
    try {
      await requestService.updateStatus(id, newStatus);
      showMessage(`Status updated to ${newStatus.replace('_', ' ')}`, 'success');
      await fetchRequests(false);
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
    await fetchRequests(false);
    return res;
  };

  // Delete task handler (Accountant only)
  const handleDeleteRequest = async (request) => {
    if (
      !window.confirm(
        `Are you sure you want to delete task #${request.id} ("${request.title}") for client "${request.clientName}"?`
      )
    ) {
      return;
    }
    try {
      await requestService.deleteRequest(request.id);
      showMessage(`Task #${request.id} deleted successfully!`, 'success');
      await fetchRequests(false);
      await fetchReminders();
    } catch (err) {
      showMessage('Failed to delete task: ' + (err.response?.data?.error || err.message), 'error');
    }
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
      const isOverdue =
        (r.status === 'OPEN' || r.status === 'IN_PROGRESS') &&
        r.dueDateTime &&
        new Date(r.dueDateTime) < now;
      if (isOverdue) overdue++;
      if (r.status === 'OPEN') open++;
      else if (r.status === 'IN_PROGRESS') inProgress++;
      else if (r.status === 'COMPLETED') completed++;
    });

    return { total, open, inProgress, completed, overdue };
  }, [requests]);

  // Filtered requests by Active Filter & Search Query
  const filteredRequests = useMemo(() => {
    const now = new Date();
    const query = searchQuery.trim().toLowerCase();

    return requests.filter((r) => {
      // 1. Status Filter
      if (activeFilter === 'OVERDUE') {
        const isOverdue =
          (r.status === 'OPEN' || r.status === 'IN_PROGRESS') &&
          r.dueDateTime &&
          new Date(r.dueDateTime) < now;
        if (!isOverdue) return false;
      } else if (activeFilter !== 'ALL') {
        if (r.status !== activeFilter) return false;
      }

      // 2. Search Query (Title, Client, Assignee, AssigneeEmail)
      if (query) {
        const matchTitle = r.title?.toLowerCase().includes(query);
        const matchClient = r.clientName?.toLowerCase().includes(query);
        const matchAssignee = r.assignee?.toLowerCase().includes(query);
        const matchEmail = r.assigneeEmail?.toLowerCase().includes(query);
        const matchId = String(r.id).includes(query);
        return matchTitle || matchClient || matchAssignee || matchEmail || matchId;
      }

      return true;
    });
  }, [requests, activeFilter, searchQuery]);

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
  const userInitial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="title-row">
            <div className="header-brand-icon">
              <ShieldCheck size={28} className="brand-shield" />
            </div>
            <div>
              <div className="title-with-badge">
                <h1 className="app-title">Accountant Request Tracker</h1>
                <span
                  className={`role-tag ${
                    isAccountant ? 'role-tag-accountant' : 'role-tag-employee'
                  }`}
                >
                  {isAccountant ? 'LEAD ACCOUNTANT' : 'ASSIGNED EMPLOYEE'}
                </span>
              </div>
              <div className="header-meta-row">
                <span className="live-clock">
                  <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {currentTime.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  •{' '}
                  {currentTime.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span className="agent-indicator-badge">
                  <Bot size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Watcher Agent Online
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-right">
          {/* Visual Theme Selector */}
          <ThemeSelector compact={false} />

          {/* User Profile Pill */}
          <div className="user-profile-badge">
            <div className="user-avatar-circle">{userInitial}</div>
            <div className="user-info-text">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-email-text">{currentUser.email}</span>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm btn-signout"
            onClick={handleLogout}
            title="Sign out of portal"
          >
            <LogOut size={13} style={{ marginRight: '4px' }} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Global alert banner */}
      {actionMessage.text && (
        <div
          className={`alert alert-${
            actionMessage.type === 'error'
              ? 'danger'
              : actionMessage.type === 'success'
              ? 'success'
              : 'info'
          } banner-alert`}
        >
          {actionMessage.type === 'success' && <CheckCircle2 size={16} />}
          {actionMessage.type === 'error' && <AlertTriangle size={16} />}
          {actionMessage.type === 'info' && <Clock size={16} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Employee Overdue Urgency Warning */}
      {!isAccountant && summary.overdue > 0 && (
        <div className="alert alert-danger urgent-overdue-alert">
          <AlertTriangle size={20} className="urgent-icon" />
          <div>
            <strong>URGENT ATTENTION REQUIRED:</strong> You have{' '}
            <strong>{summary.overdue} task(s)</strong> whose deadline has expired! Live overdue
            alerts have been logged and dispatched to your supervisor. Please review and update
            their status immediately.
          </div>
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
            title="Click to show all tasks"
          >
            <div className="summary-card-header">
              <span className="summary-label">Total Assigned</span>
              <div className="summary-icon-pill icon-pill-all">
                <FileText size={16} />
              </div>
            </div>
            <span className="summary-value">{summary.total}</span>
            <div className="summary-subtext">All active & past tasks</div>
          </div>

          <div
            className={`summary-card status-card-open ${activeFilter === 'OPEN' ? 'active-card' : ''}`}
            onClick={() => setActiveFilter('OPEN')}
            title="Click to filter Open tasks"
          >
            <div className="summary-card-header">
              <span className="summary-label">Open Tasks</span>
              <div className="summary-icon-pill icon-pill-open">
                <Clock size={16} />
              </div>
            </div>
            <span className="summary-value">{summary.open}</span>
            <div className="summary-subtext">Pending commencement</div>
          </div>

          <div
            className={`summary-card status-card-progress ${
              activeFilter === 'IN_PROGRESS' ? 'active-card' : ''
            }`}
            onClick={() => setActiveFilter('IN_PROGRESS')}
            title="Click to filter In Progress tasks"
          >
            <div className="summary-card-header">
              <span className="summary-label">In Progress</span>
              <div className="summary-icon-pill icon-pill-progress">
                <Activity size={16} />
              </div>
            </div>
            <span className="summary-value">{summary.inProgress}</span>
            <div className="summary-subtext">Currently being worked on</div>
          </div>

          <div
            className={`summary-card status-card-completed ${
              activeFilter === 'COMPLETED' ? 'active-card' : ''
            }`}
            onClick={() => setActiveFilter('COMPLETED')}
            title="Click to filter Completed tasks"
          >
            <div className="summary-card-header">
              <span className="summary-label">Completed</span>
              <div className="summary-icon-pill icon-pill-completed">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <span className="summary-value">{summary.completed}</span>
            <div className="summary-subtext">Successfully resolved</div>
          </div>

          <div
            className={`summary-card status-card-overdue ${
              activeFilter === 'OVERDUE' ? 'active-card' : ''
            }`}
            onClick={() => setActiveFilter('OVERDUE')}
            title="Click to filter Overdue tasks"
          >
            <div className="summary-card-header">
              <div className="summary-label-overdue">
                <span className="overdue-dot"></span>
                <span>Overdue</span>
              </div>
              <div className="summary-icon-pill icon-pill-overdue">
                <AlertTriangle size={16} />
              </div>
            </div>
            <span className="summary-value overdue-number">{summary.overdue}</span>
            <div className="summary-subtext overdue-subtext">Requires immediate escalation</div>
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
          {/* Left: Filter Buttons */}
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
              className={`filter-btn filter-btn-overdue ${
                activeFilter === 'OVERDUE' ? 'active' : ''
              }`}
              onClick={() => setActiveFilter('OVERDUE')}
            >
              ⚠️ Overdue ({summary.overdue})
            </button>
          </div>

          {/* Right: Search Input & Sort & Refresh */}
          <div className="controls-right-cluster">
            {/* Live Search */}
            <div className="table-search-box">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, client, assignee..."
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Sort Toggle Button */}
            <button
              type="button"
              className={`btn btn-sort ${isSorted ? 'btn-sort-active' : ''}`}
              onClick={handleToggleSort}
              title="Toggle sorting by deadline date and time"
            >
              <ArrowUpDown size={13} style={{ marginRight: '5px' }} />
              {isSorted ? 'Sorted by Deadline (Asc) ✓' : 'Sort by Deadline'}
            </button>

            {/* Refresh Sync Button */}
            <button
              type="button"
              className="btn btn-secondary btn-icon-only"
              onClick={() => fetchRequests(true)}
              title="Refresh task statuses from database"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        <RequestTable
          requests={filteredRequests}
          loading={loading}
          onStatusChange={handleStatusChange}
          currentUser={currentUser}
          onDeleteRequest={handleDeleteRequest}
          onEmailDispatched={async () => {
            await fetchReminders();
            showMessage('AI reminder email dispatched and logged to Watcher Agent audit.', 'success');
          }}
        />
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p className="footer-lead">
            <strong>Accountant Request Tracker & Watcher Agent</strong> • Supervised by{' '}
            <a href="mailto:kathirvelpalani294@gmail.com">kathirvelpalani294@gmail.com</a>
          </p>
          <div className="footer-tech-stack">
            <span className="tech-badge">Java 23</span>
            <span className="tech-badge">Spring Boot 3</span>
            <span className="tech-badge">@Scheduled 30s Watcher</span>
            <span className="tech-badge">Gemini Generative AI</span>
            <span className="tech-badge">MySQL</span>
            <span className="tech-badge">React 18 + Vite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
