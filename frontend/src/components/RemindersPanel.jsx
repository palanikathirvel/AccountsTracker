import React, { useState } from 'react';
import { Bot, Zap, ChevronDown, ChevronUp, Bell, CheckCircle2, Mail, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';

export default function RemindersPanel({ reminders, onTriggerScheduler, refreshing }) {
  const [isOpen, setIsOpen] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [notification, setNotification] = useState('');

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await onTriggerScheduler();
      setNotification(`Agent scan complete! Dispatched ${res.remindersGenerated} overdue alerts via email & logs.`);
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
          <div className="bot-icon-wrapper">
            <Bot size={24} className="bot-icon" />
          </div>
          <div>
            <div className="agent-status-badge-row">
              <h3 className="reminders-title">Autonomous Date & Time Watcher Agent</h3>
              <span className="agent-live-badge">
                <span className="agent-live-dot"></span>
                <span>Active • Scanning Every 30s</span>
              </span>
            </div>
            <p className="reminders-subtitle">
              Supervises task deadlines continuously. Automatically dispatches alerts to Assignees & CCs Accountant (<strong>kathirvelpalani294@gmail.com</strong>).
            </p>
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
            <Zap size={13} className={triggering ? 'spin' : ''} style={{ marginRight: '5px' }} />
            {triggering ? 'Scanning...' : 'Scan Deadlines Now'}
          </button>
          <button
            type="button"
            className={`btn btn-outline btn-sm ${isOpen ? 'active' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <Bell size={13} style={{ marginRight: '5px' }} />
            <span>Agent Dispatch Log ({reminders.length})</span>
            {isOpen ? <ChevronUp size={13} style={{ marginLeft: '4px' }} /> : <ChevronDown size={13} style={{ marginLeft: '4px' }} />}
          </button>
        </div>
      </div>

      {notification && (
        <div className="alert alert-info mt-3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{notification}</span>
        </div>
      )}

      {isOpen && (
        <div className="reminders-content">
          {reminders.length === 0 ? (
            <div className="no-reminders-box">
              <Bell size={24} className="text-muted" style={{ opacity: 0.5, marginBottom: '8px' }} />
              <p className="no-reminders-text">
                No overdue alerts dispatched yet. Once an assigned task crosses its date and time deadline, the Autonomous Watcher Agent logs the event here and immediately emails the Assignee with Accountant CC'd.
              </p>
            </div>
          ) : (
            <div className="reminders-list">
              {reminders.map((rem) => (
                <div key={rem.id} className="reminder-item">
                  <div className="reminder-item-header">
                    <span className="reminder-badge">
                      <Mail size={11} style={{ marginRight: '4px' }} />
                      ALERTED: {rem.assignee}
                    </span>
                    <span className="reminder-cc-badge">
                      CC: kathirvelpalani294@gmail.com
                    </span>
                    <span className="reminder-time">
                      <Clock size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      {new Date(rem.generatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="reminder-details">
                    <span className="font-semibold text-primary">{rem.requestTitle}</span>
                    <span className="reminder-client-tag">Client: {rem.clientName}</span>
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
