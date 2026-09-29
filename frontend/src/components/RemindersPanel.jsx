import React, { useState } from 'react';

export default function RemindersPanel({ reminders, onTriggerScheduler, refreshing }) {
  const [isOpen, setIsOpen] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [notification, setNotification] = useState('');

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await onTriggerScheduler();
      setNotification(`Scheduler executed! ${res.remindersGenerated} new reminder(s) generated.`);
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      setNotification('Failed to trigger scheduler: ' + (err.response?.data?.error || err.message));
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="card reminders-card">
      <div className="reminders-header">
        <div className="reminders-title-group">
          <span className="bell-icon">🔔</span>
          <div>
            <h3 className="reminders-title">Automated Assignee Reminders</h3>
            <span className="reminders-subtitle">
              Generated automatically by Spring Scheduler for overdue OPEN requests
            </span>
          </div>
        </div>
        <div className="reminders-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleTrigger}
            disabled={triggering}
            title="Force immediate execution of Spring Scheduler check"
          >
            {triggering ? 'Running...' : '⚡ Run Overdue Check Now'}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? 'Hide Log ▲' : `View Log (${reminders.length}) ▼`}
          </button>
        </div>
      </div>

      {notification && <div className="alert alert-info">{notification}</div>}

      {isOpen && (
        <div className="reminders-content">
          {reminders.length === 0 ? (
            <p className="no-reminders-text">
              No reminders generated yet. If an OPEN request is past its due date, the scheduler will automatically log a reminder here and in the backend console.
            </p>
          ) : (
            <div className="reminders-list">
              {reminders.map((rem) => (
                <div key={rem.id} className="reminder-item">
                  <div className="reminder-item-header">
                    <span className="reminder-badge">ASSIGNED TO: {rem.assignee}</span>
                    <span className="reminder-time">
                      {new Date(rem.generatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="reminder-details">
                    <strong>{rem.requestTitle}</strong> ({rem.clientName}) — Due: <span className="text-danger">{rem.dueDate}</span>
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
