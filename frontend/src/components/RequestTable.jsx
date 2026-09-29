import React from 'react';
import StatusDropdown from './StatusDropdown';

export default function RequestTable({ requests, loading, onStatusChange, currentDateStr }) {
  if (loading) {
    return (
      <div className="table-loading">
        <p>Loading requests...</p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="table-empty">
        <p>No requests found matching your filter.</p>
        <span className="empty-hint">Create a new request above or click "Load Demo Data".</span>
      </div>
    );
  }

  // Check if a request is overdue based on current date
  const checkIfOverdue = (req) => {
    if (req.overdue !== undefined) {
      return req.overdue;
    }
    if (!req.dueDate || !req.status) return false;
    const today = currentDateStr || new Date().toISOString().split('T')[0];
    return req.status === 'OPEN' && req.dueDate < today;
  };

  return (
    <div className="table-responsive">
      <table className="request-table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>ID</th>
            <th>Title</th>
            <th>Client</th>
            <th>Assignee</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Overdue Indicator</th>
            <th style={{ width: '180px' }}>Actions</th>
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
                  <span className="assignee-badge">{req.assignee}</span>
                </td>
                <td className="cell-due-date">{req.dueDate}</td>
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
                    <span className="on-time-tag">—</span>
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
