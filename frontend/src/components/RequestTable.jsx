import React from 'react';
import StatusDropdown from './StatusDropdown';

export default function RequestTable({ requests, loading, onStatusChange, currentUser }) {
  if (loading) {
    return (
      <div className="table-loading">
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="table-empty">
        <p>No tasks found.</p>
        <span className="empty-hint">
          {currentUser?.role === 'ACCOUNTANT'
            ? 'Assign a new task using the form above.'
            : 'You currently have no tasks assigned to you.'}
        </span>
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

  // Check if overdue by comparing exact timestamp
  const checkIfOverdue = (req) => {
    if (req.overdue !== undefined) return req.overdue;
    if (!req.dueDateTime || !req.status) return false;
    return req.status === 'OPEN' && new Date(req.dueDateTime) < new Date();
  };

  return (
    <div className="table-responsive">
      <table className="request-table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>ID</th>
            <th>Task Title</th>
            <th>Client</th>
            <th>Assignee</th>
            <th>Deadline (Date & Time)</th>
            <th>Status</th>
            <th>Overdue Indicator</th>
            <th style={{ width: '180px' }}>Update Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => {
            const isOverdue = checkIfOverdue(req);
            return (
              <tr key={req.id} className={isOverdue ? 'row-overdue' : ''}>
                <td className="cell-id">#{req.id}</td>
                <td className="cell-title font-semibold">{req.title}</td>
                <td className="cell-client">{req.clientName}</td>
                <td className="cell-assignee">
                  <div className="assignee-wrap">
                    <span className="assignee-badge">{req.assignee}</span>
                    {req.assigneeEmail && (
                      <span className="assignee-email-sub">{req.assigneeEmail}</span>
                    )}
                  </div>
                </td>
                <td className="cell-due-date">
                  <span className={isOverdue ? 'text-danger font-semibold' : ''}>
                    {formatDateTime(req.dueDateTime)}
                  </span>
                </td>
                <td className="cell-status">
                  <span className={`status-badge status-${req.status?.toLowerCase()}`}>
                    {req.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="cell-overdue">
                  {isOverdue ? (
                    <span className="overdue-tag">
                      <span className="warning-icon" aria-hidden="true">⚠️</span> OVERDUE
                    </span>
                  ) : (
                    <span className="on-time-tag">On Track ✓</span>
                  )}
                </td>
                <td className="cell-actions">
                  <StatusDropdown
                    currentStatus={req.status}
                    requestId={req.id}
                    onStatusChange={onStatusChange}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
