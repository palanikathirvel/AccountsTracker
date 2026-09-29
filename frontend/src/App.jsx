import React, { useState, useEffect, useMemo } from 'react';
import requestService from './services/requestService';
import RequestForm from './components/RequestForm';
import RequestTable from './components/RequestTable';
import RemindersPanel from './components/RemindersPanel';

export default function App() {
  const [requests, setRequests] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, OPEN, IN_PROGRESS, COMPLETED, OVERDUE
  const [isSorted, setIsSorted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Today's date string (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Fetch all requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      let data;
      if (isSorted) {
        data = await requestService.getSortedRequests();
      } else {
        data = await requestService.getAllRequests();
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
      console.error('Failed to load reminders:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchReminders();

    // Auto-poll reminders every 30 seconds
    const interval = setInterval(() => {
      fetchReminders();
    }, 30000);
    return () => clearInterval(interval);
  }, [isSorted]);

  const showMessage = (text, type = 'info') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
  };

  // Handler: Request created
  const handleRequestCreated = async (formData) => {
    await requestService.createRequest(formData);
    await fetchRequests();
    await fetchReminders();
    showMessage('Request created successfully!', 'success');
  };

  // Handler: Status updated
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

  // Handler: Toggle Sort by Due Date (calls backend GET /api/requests/sorted)
  const handleToggleSort = async () => {
    const nextSortState = !isSorted;
    setIsSorted(nextSortState);
    setLoading(true);
    try {
      if (nextSortState) {
        const sortedData = await requestService.getSortedRequests();
        setRequests(sortedData);
        showMessage('Requests sorted by Due Date (Ascending) from backend API', 'info');
      } else {
        const regularData = await requestService.getAllRequests();
        setRequests(regularData);
        showMessage('Default request ordering restored', 'info');
      }
    } catch (err) {
      showMessage('Failed to sort requests: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Seed Sample Data
  const handleSeedData = async () => {
    setLoading(true);
    try {
      await requestService.seedSampleData();
      showMessage('Sample demo data seeded successfully!', 'success');
      await fetchRequests();
      await fetchReminders();
    } catch (err) {
      showMessage('Failed to seed demo data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Trigger Scheduler manually
  const handleTriggerScheduler = async () => {
    const res = await requestService.triggerScheduler();
    await fetchReminders();
    await fetchRequests();
    return res;
  };

  // Handler for Overdue backend API test
  const handleSelectFilter = async (filter) => {
    setActiveFilter(filter);
    if (filter === 'OVERDUE') {
      setLoading(true);
      try {
        // Query backend overdue endpoint to demonstrate Section 13 API compliance
        const overdueData = await requestService.getOverdueRequests();
        showMessage(`Fetched ${overdueData.length} overdue request(s) via GET /api/requests/overdue`, 'info');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Summary counts
  const summary = useMemo(() => {
    let total = requests.length;
    let open = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;

    requests.forEach((r) => {
      const isOverdue = r.status === 'OPEN' && r.dueDate && r.dueDate < todayStr;
      if (isOverdue) {
        overdue++;
      }
      if (r.status === 'OPEN') open++;
      else if (r.status === 'IN_PROGRESS') inProgress++;
      else if (r.status === 'COMPLETED') completed++;
    });

    return { total, open, inProgress, completed, overdue };
  }, [requests, todayStr]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'OVERDUE') {
        return r.status === 'OPEN' && r.dueDate && r.dueDate < todayStr;
      }
      return r.status === activeFilter;
    });
  }, [requests, activeFilter, todayStr]);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Accountant Request Tracker</h1>
          <p className="app-tagline">
            Simple accounting task management & overdue reminder prototype
          </p>
        </div>
        <div className="header-right">
          <button
            type="button"
            className="btn btn-seed"
            onClick={handleSeedData}
            title="Populate test requests with overdue scenario"
          >
            ➕ Load Demo Data
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              fetchRequests();
              fetchReminders();
              showMessage('Data refreshed', 'info');
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Global alert banner */}
      {actionMessage.text && (
        <div className={`alert alert-${actionMessage.type === 'error' ? 'danger' : 'info'} banner-alert`}>
          {actionMessage.text}
        </div>
      )}

      {/* Top Section: Form */}
      <section className="section-form">
        <RequestForm onRequestCreated={handleRequestCreated} />
      </section>

      {/* Middle Section: Summary Statistics Cards */}
      <section className="section-summary">
        <div className="summary-grid">
          <div
            className={`summary-card ${activeFilter === 'ALL' ? 'active-card' : ''}`}
            onClick={() => handleSelectFilter('ALL')}
          >
            <span className="summary-label">Total Requests</span>
            <span className="summary-value">{summary.total}</span>
          </div>

          <div
            className={`summary-card status-card-open ${activeFilter === 'OPEN' ? 'active-card' : ''}`}
            onClick={() => handleSelectFilter('OPEN')}
          >
            <span className="summary-label">Open</span>
            <span className="summary-value">{summary.open}</span>
          </div>

          <div
            className={`summary-card status-card-progress ${activeFilter === 'IN_PROGRESS' ? 'active-card' : ''}`}
            onClick={() => handleSelectFilter('IN_PROGRESS')}
          >
            <span className="summary-label">In Progress</span>
            <span className="summary-value">{summary.inProgress}</span>
          </div>

          <div
            className={`summary-card status-card-completed ${activeFilter === 'COMPLETED' ? 'active-card' : ''}`}
            onClick={() => handleSelectFilter('COMPLETED')}
          >
            <span className="summary-label">Completed</span>
            <span className="summary-value">{summary.completed}</span>
          </div>

          <div
            className={`summary-card status-card-overdue ${activeFilter === 'OVERDUE' ? 'active-card' : ''}`}
            onClick={() => handleSelectFilter('OVERDUE')}
          >
            <div className="summary-label-overdue">
              <span className="overdue-dot"></span>
              <span>Overdue</span>
            </div>
            <span className="summary-value overdue-number">{summary.overdue}</span>
          </div>
        </div>
      </section>

      {/* Overdue Scheduler Reminders Panel */}
      <section className="section-reminders">
        <RemindersPanel
          reminders={reminders}
          onTriggerScheduler={handleTriggerScheduler}
          refreshing={loading}
        />
      </section>

      {/* Main Request Table & Controls Section */}
      <section className="section-table card">
        <div className="table-controls-bar">
          <div className="filter-buttons">
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => handleSelectFilter('ALL')}
            >
              All ({summary.total})
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'OPEN' ? 'active' : ''}`}
              onClick={() => handleSelectFilter('OPEN')}
            >
              Open ({summary.open})
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'IN_PROGRESS' ? 'active' : ''}`}
              onClick={() => handleSelectFilter('IN_PROGRESS')}
            >
              In Progress ({summary.inProgress})
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => handleSelectFilter('COMPLETED')}
            >
              Completed ({summary.completed})
            </button>
            <button
              type="button"
              className={`filter-btn filter-btn-overdue ${activeFilter === 'OVERDUE' ? 'active' : ''}`}
              onClick={() => handleSelectFilter('OVERDUE')}
            >
              ⚠️ Overdue ({summary.overdue})
            </button>
          </div>

          <div className="sort-controls">
            <button
              type="button"
              className={`btn btn-sort ${isSorted ? 'btn-sort-active' : ''}`}
              onClick={handleToggleSort}
              title="Sort requests by due date ascending via backend API"
            >
              📅 {isSorted ? 'Sorted by Due Date (Asc) ✓' : 'SORT BY DUE DATE'}
            </button>
          </div>
        </div>

        <RequestTable
          requests={filteredRequests}
          loading={loading}
          onStatusChange={handleStatusChange}
          currentDateStr={todayStr}
        />
      </section>

      {/* Footer Info */}
      <footer className="app-footer">
        <p>
          Accountant Request Tracker Demo • Backend: Spring Boot 3.3.4 (Port 8080) • DB: MySQL • Scheduler Rate: 60s
        </p>
      </footer>
    </div>
  );
}
