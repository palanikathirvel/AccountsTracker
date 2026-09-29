import React, { useState } from 'react';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'COMPLETED'];

export default function StatusDropdown({ currentStatus, requestId, onStatusChange }) {
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;

    setLoading(true);
    try {
      await onStatusChange(requestId, newStatus);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'OPEN':
        return 'status-open';
      case 'IN_PROGRESS':
        return 'status-progress';
      case 'COMPLETED':
        return 'status-completed';
      default:
        return 'status-default';
    }
  };

  return (
    <div className="status-dropdown-container">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={loading}
        className={`status-select ${getStatusColorClass(currentStatus)}`}
        title="Change status"
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {status.replace('_', ' ')}
          </option>
        ))}
      </select>
      {loading && <span className="status-spinner" title="Updating...">⏳</span>}
    </div>
  );
}
