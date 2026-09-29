import React, { useState } from 'react';

export default function RemindersPanel({ reminders, onTriggerScheduler, refreshing }) {
  const [isOpen, setIsOpen] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [notification, setNotification] = useState('');

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await onTriggerScheduler();
      setNotification(`Agent scan complete! ${res.remindersGenerated} overdue alerts dispatched via email & logs.`);
      setTimeout(() => setNotification(''), 4500);
    } catch (err) {
      setNotification('Failed to trigger agent: ' + (err.response?.data?.error || err.message));
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="card reminders-card">
      <div className="reminders-header">
        <div className="reminders-title-group">
          <span className="bell-icon">🤖</span>
          <div>
            <div className="agent-status-badge-row">
              <h3 className="reminders-title">Autonomous Date & Time Watcher Agent</h3>
              <span className="agent-live-badge">● LIVE (Scanning every 30s)</span>
            </div>
            <span className="reminders-subtitle">
              Monitors task deadlines. Dispatches email alerts to Assignees & CCs Accountant (<strong>kathirvelpalani294@gmail.com</strong>).
            </span>
          </div>
        </div>
        <div className="reminders-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleTrigger}
            disabled={triggering}
            title="Force immediate agent deadline scan"
          >
            {triggering ? 'Scanning...' : '⚡ Scan Deadlines Now'}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? 'Hide Agent Log ▲' : `View Agent Log (${reminders.length}) ▼`}
          </button>
        </div>
      </div>

      {notification && <div className="alert alert-info">{notification}</div>}

      {isOpen && (
        <div className="reminders-content">
          {reminders.length === 0 ? (
            <p className="no-reminders-text">
              No overdue alerts generated yet. As soon as a task crosses its scheduled date and time, the Watcher Agent will log it here and dispatch an email alert to the Assignee with Accountant CC'd.
            </p>
          ) : (
            <div className="reminders-list">
              {reminders.map((rem) => (
                <div key={rem.id} className="reminder-item">
                  <div className="reminder-item-header">
                    <span className="reminder-badge">ALERTED ASSIGNEE: {rem.assignee}</span>
                    <span className="reminder-cc-badge">CC: kathirvelpalani294@gmail.com</span>
                    <span className="reminder-time">
                      {new Date(rem.generatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="reminder-details">
                    <strong>{rem.requestTitle}</strong> ({rem.clientName})
                  </div>
                  <pre className="reminder-raw-box">{rem.message}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
