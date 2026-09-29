import React, { useState } from 'react';

const ASSIGNEE_OPTIONS = ['Kumar', 'Ravi', 'Arun', 'Priya'];
const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'COMPLETED'];

export default function RequestForm({ onRequestCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    assignee: 'Kumar',
    dueDate: '',
    status: 'OPEN',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Title is required';
    }
    if (!formData.clientName.trim()) {
      errs.clientName = 'Client name is required';
    }
    if (!formData.assignee.trim()) {
      errs.assignee = 'Assignee is required';
    }
    if (!formData.dueDate) {
      errs.dueDate = 'Due date is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSuccessMessage('');

    try {
      await onRequestCreated(formData);
      setSuccessMessage('✓ Request created successfully!');
      // Reset form
      setFormData({
        title: '',
        clientName: '',
        assignee: 'Kumar',
        dueDate: '',
        status: 'OPEN',
      });
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to create request';
      setErrors({ form: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card form-card">
      <div className="card-header">
        <h2 className="card-title">Create New Request</h2>
        <span className="card-subtitle">Assign an accounting task to a team member</span>
      </div>

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {errors.form && <div className="alert alert-danger">{errors.form}</div>}

      <form onSubmit={handleSubmit} className="request-form" noValidate>
        <div className="form-grid">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="req-title">
              Title <span className="required">*</span>
            </label>
            <input
              id="req-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. GST Filing"
              className={errors.title ? 'input-error' : ''}
              required
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          {/* Client Name */}
          <div className="form-group">
            <label htmlFor="req-client">
              Client Name <span className="required">*</span>
            </label>
            <input
              id="req-client"
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="e.g. ABC Demo Company"
              className={errors.clientName ? 'input-error' : ''}
              required
            />
            {errors.clientName && <span className="error-text">{errors.clientName}</span>}
          </div>

          {/* Assignee */}
          <div className="form-group">
            <label htmlFor="req-assignee">
              Assignee <span className="required">*</span>
            </label>
            <select
              id="req-assignee"
              name="assignee"
              value={formData.assignee}
              onChange={handleChange}
              className={errors.assignee ? 'input-error' : ''}
              required
            >
              {ASSIGNEE_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {errors.assignee && <span className="error-text">{errors.assignee}</span>}
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label htmlFor="req-due-date">
              Due Date <span className="required">*</span>
            </label>
            <input
              id="req-due-date"
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className={errors.dueDate ? 'input-error' : ''}
              required
            />
            {errors.dueDate && <span className="error-text">{errors.dueDate}</span>}
          </div>

          {/* Status */}
          <div className="form-group">
            <label htmlFor="req-status">Status</label>
            <select
              id="req-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'CREATE REQUEST'}
          </button>
        </div>
      </form>
    </div>
  );
}
