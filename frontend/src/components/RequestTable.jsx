import React, { useState } from 'react';
import StatusDropdown from './StatusDropdown';
import AiEmailModal from './AiEmailModal';
import {
  Sparkles,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Building,
  User,
  Inbox,
  Hourglass,
  Check,
} from 'lucide-react';

export default function RequestTable({
  requests,
  loading,
  onStatusChange,
  currentUser,
  onDeleteRequest,
  onEmailDispatched,
}) {
  const [selectedTaskForAi, setSelectedTaskForAi] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Synchronizing tasks with watcher engine...</p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="table-empty">
        <div className="empty-icon-wrap">
          <Inbox size={42} className="empty-icon-svg" />
        </div>
        <h4 className="empty-title">No matching tasks found</h4>
        <p className="empty-hint">
          {currentUser?.role === 'ACCOUNTANT'
            ? 'Assign a new task using the form above or adjust your search filter.'
            : 'You currently have no tasks assigned to you in this view.'}
        </p>
      </div>
    );
  }

  // Format Date and Time
  const formatDateTime = (dtStr) => {
    if (!dtStr) return '—';
    try {
      const dt = new Date(dtStr);
      return dt.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dtStr;
    }
  };

  // Human-readable relative time (e.g. "Overdue by 2h 15m" or "Due in 3 hours")
  const getDeadlineMeta = (dueDateTime, status) => {
    if (!dueDateTime) return { label: 'No deadline', isOverdue: false };
    if (status === 'COMPLETED') {
      return { label: 'Completed', isOverdue: false, isCompleted: true };
    }

    const now = new Date();
    const due = new Date(dueDateTime);
    const diffMs = due - now;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 0) {
      const absMins = Math.abs(diffMins);
      const hours = Math.floor(absMins / 60);
      const days = Math.floor(hours / 24);
      let overdueStr = '';
      if (days > 0) overdueStr = `${days}d ${hours % 24}h`;
      else if (hours > 0) overdueStr = `${hours}h ${absMins % 60}m`;
      else overdueStr = `${absMins}m`;
      return { label: `Overdue by ${overdueStr}`, isOverdue: true };
    } else {
      const hours = Math.floor(diffMins / 60);
      const days = Math.floor(hours / 24);
      let remainingStr = '';
      if (days > 0) remainingStr = `in ${days}d ${hours % 24}h`;
      else if (hours > 0) remainingStr = `in ${hours}h ${diffMins % 60}m`;
      else remainingStr = `in ${diffMins}m`;
      return { label: `Due ${remainingStr}`, isOverdue: false };
    }
  };

  // Check if overdue by comparing exact timestamp (both OPEN and IN_PROGRESS)
  const checkIfOverdue = (req) => {
    if (req.overdue !== undefined) return req.overdue;
    if (!req.dueDateTime || !req.status) return false;
    return (req.status === 'OPEN' || req.status === 'IN_PROGRESS') && new Date(req.dueDateTime) < new Date();
  };

  const handleOpenAiModal = (req) => {
    setSelectedTaskForAi(req);
    setAiModalOpen(true);
  };

  return (
    <div className="table-wrapper">
      {/* Desktop & Tablet Table View */}
      <div className="table-responsive desktop-table-view">
        <table className="request-table">
          <thead>
            <tr>
              <th style={{ width: '68px' }}>Task ID</th>
              <th>Task Title</th>
              <th>Client</th>
              <th>Assignee</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Watcher Alert</th>
              <th style={{ minWidth: '220px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const isOverdue = checkIfOverdue(req);
              const deadlineMeta = getDeadlineMeta(req.dueDateTime, req.status);
              const assigneeInitial = req.assignee ? req.assignee.charAt(0).toUpperCase() : '?';

              return (
                <tr key={req.id} className={isOverdue ? 'row-overdue' : ''}>
                  <td className="cell-id">
                    <span className="task-id-badge">#{req.id}</span>
                  </td>
                  <td className="cell-title">
                    <span className="task-title-text font-semibold">{req.title}</span>
                  </td>
                  <td className="cell-client">
                    <div className="client-chip">
                      <Building size={13} className="client-icon" />
                      <span>{req.clientName}</span>
                    </div>
                  </td>
                  <td className="cell-assignee">
                    <div className="assignee-wrap">
                      <div className="assignee-pill">
                        <span className="assignee-avatar">{assigneeInitial}</span>
                        <span className="assignee-name">{req.assignee}</span>
                      </div>
                      {req.assigneeEmail && (
                        <span className="assignee-email-sub">{req.assigneeEmail}</span>
                      )}
                    </div>
                  </td>
                  <td className="cell-due-date">
                    <div className="deadline-stack">
                      <span className="deadline-formatted">{formatDateTime(req.dueDateTime)}</span>
                      <span
                        className={`deadline-countdown ${
                          deadlineMeta.isOverdue
                            ? 'countdown-overdue'
                            : deadlineMeta.isCompleted
                            ? 'countdown-completed'
                            : 'countdown-normal'
                        }`}
                      >
                        {deadlineMeta.isOverdue && <AlertTriangle size={11} />}
                        {deadlineMeta.isCompleted && <CheckCircle2 size={11} />}
                        {!deadlineMeta.isOverdue && !deadlineMeta.isCompleted && <Clock size={11} />}
                        <span>{deadlineMeta.label}</span>
                      </span>
                    </div>
                  </td>
                  <td className="cell-status">
                    <StatusDropdown
                      currentStatus={req.status}
                      requestId={req.id}
                      onStatusChange={onStatusChange}
                    />
                  </td>
                  <td className="cell-overdue">
                    {isOverdue ? (
                      <span className="overdue-tag">
                        <span className="pulse-dot"></span>
                        <span>OVERDUE</span>
                      </span>
                    ) : req.status === 'COMPLETED' ? (
                      <span className="completed-tag">
                        <Check size={12} />
                        <span>Resolved</span>
                      </span>
                    ) : (
                      <span className="on-time-tag">
                        <Clock size={12} />
                        <span>On Track</span>
                      </span>
                    )}
                  </td>
                  <td className="cell-actions">
                    <div className="actions-cluster">
                      {/* AI Email Reminder Trigger (Accountant or Employee) */}
                      <button
                        type="button"
                        className="btn-ai-draft-trigger"
                        onClick={() => handleOpenAiModal(req)}
                        title="Draft & Dispatch AI Reminder Email"
                      >
                        <Sparkles size={13} />
                        <span>AI Reminder</span>
                      </button>

                      {/* Accountant-only Delete Action */}
                      {currentUser?.role === 'ACCOUNTANT' && (
                        <button
                          type="button"
                          className="btn-delete-task"
                          onClick={() => onDeleteRequest && onDeleteRequest(req)}
                          title="Delete this task record"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout (Visible only on screens <= 768px) */}
      <div className="mobile-cards-view">
        {requests.map((req) => {
          const isOverdue = checkIfOverdue(req);
          const deadlineMeta = getDeadlineMeta(req.dueDateTime, req.status);
          const assigneeInitial = req.assignee ? req.assignee.charAt(0).toUpperCase() : '?';

          return (
            <div
              key={req.id}
              className={`mobile-task-card ${isOverdue ? 'mobile-card-overdue' : ''}`}
            >
              <div className="mobile-card-top">
                <div className="mobile-card-title-group">
                  <span className="task-id-badge">#{req.id}</span>
                  <h4 className="mobile-card-title">{req.title}</h4>
                </div>
                {isOverdue ? (
                  <span className="overdue-tag">
                    <span className="pulse-dot"></span>
                    <span>OVERDUE</span>
                  </span>
                ) : req.status === 'COMPLETED' ? (
                  <span className="completed-tag">✓ Done</span>
                ) : (
                  <span className="on-time-tag">On Track</span>
                )}
              </div>

              <div className="mobile-card-details">
                <div className="mobile-detail-row">
                  <span className="mobile-detail-label">Client:</span>
                  <span className="mobile-detail-value font-semibold">{req.clientName}</span>
                </div>
                <div className="mobile-detail-row">
                  <span className="mobile-detail-label">Assignee:</span>
                  <div className="mobile-detail-value">
                    <div className="assignee-pill" style={{ marginLeft: 'auto' }}>
                      <span className="assignee-avatar">{assigneeInitial}</span>
                      <span>{req.assignee}</span>
                    </div>
                    {req.assigneeEmail && (
                      <span className="assignee-email-sub" style={{ textAlign: 'right', display: 'block' }}>
                        {req.assigneeEmail}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mobile-detail-row">
                  <span className="mobile-detail-label">Deadline:</span>
                  <div className="mobile-detail-value text-right">
                    <span className={isOverdue ? 'text-danger font-semibold' : ''}>
                      {formatDateTime(req.dueDateTime)}
                    </span>
                    <span
                      className={`deadline-countdown ${
                        deadlineMeta.isOverdue ? 'countdown-overdue' : 'countdown-normal'
                      }`}
                      style={{ display: 'block', marginTop: '2px' }}
                    >
                      {deadlineMeta.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mobile-card-footer">
                <div className="mobile-status-section">
                  <StatusDropdown
                    currentStatus={req.status}
                    requestId={req.id}
                    onStatusChange={onStatusChange}
                  />
                </div>
                <div className="mobile-footer-actions">
                  <button
                    type="button"
                    className="btn-ai-draft-trigger"
                    onClick={() => handleOpenAiModal(req)}
                    title="Draft AI Reminder Email"
                  >
                    <Sparkles size={13} />
                    <span>AI Alert</span>
                  </button>
                  {currentUser?.role === 'ACCOUNTANT' && (
                    <button
                      type="button"
                      className="btn-delete-task"
                      onClick={() => onDeleteRequest && onDeleteRequest(req)}
                      title="Delete task"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Reminder Modal */}
      {selectedTaskForAi && (
        <AiEmailModal
          isOpen={aiModalOpen}
          request={selectedTaskForAi}
          onClose={() => {
            setAiModalOpen(false);
            setSelectedTaskForAi(null);
          }}
          onSent={(res) => {
            if (onEmailDispatched) onEmailDispatched(res);
          }}
        />
      )}
    </div>
  );
}
