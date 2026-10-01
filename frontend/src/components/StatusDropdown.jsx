import React, { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

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
        return 'status-select-open';
      case 'IN_PROGRESS':
        return 'status-select-progress';
      case 'COMPLETED':
        return 'status-select-completed';
      default:
        return 'status-select-default';
    }
  };

  return (
    <div className={`status-dropdown-container ${getStatusColorClass(currentStatus)}`}>
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={loading}
        className={`status-select ${getStatusColorClass(currentStatus)}`}
        title="Click to update task status"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="status-dropdown-icon">
        {loading ? (
          <Loader2 size={12} className="spin text-primary" />
        ) : (
          <ChevronDown size={12} />
        )}
      </div>
    </div>
  );
}
