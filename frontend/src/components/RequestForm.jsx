import React, { useState, useEffect } from 'react';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'COMPLETED'];

export default function RequestForm({ employees, onRequestCreated }) {
  // Default due date time: 1 hour from now formatted for datetime-local
  const getDefaultDateTime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
    // YYYY-MM-DDTHH:mm
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    assignee: '',
    assigneeEmail: '',
    accountantEmail: 'kathirvelpalani294@gmail.com',
    dueDateTime: getDefaultDateTime(),
    status: 'OPEN',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Set default assignee when employees list loads
  useEffect(() => {
    if (employees && employees.length > 0 && !formData.assignee) {
      setFormData((prev) => ({
        ...prev,
        assignee: employees[0].name,
        assigneeEmail: employees[0].email,
      }));
    }
  }, [employees]);

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.clientName.trim()) errs.clientName = 'Client name is required';
    if (!formData.assignee.trim()) errs.assignee = 'Assignee is required';
    if (!formData.dueDateTime) errs.dueDateTime = 'Due date and time is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'assignee') {
      const selectedEmp = employees.find((emp) => emp.name === value);
      setFormData((prev) => ({
        ...prev,
        assignee: value,
        assigneeEmail: selectedEmp ? selectedEmp.email : `${value.toLowerCase()}@company.com`,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
      setSuccessMessage('✓ Task created! Watcher Agent will monitor deadline.');
      setFormData({
        title: '',
        clientName: '',
        assignee: employees && employees.length > 0 ? employees[0].name : '',
        assigneeEmail: employees && employees.length > 0 ? employees[0].email : '',
        accountantEmail: 'kathirvelpalani294@gmail.com',
        dueDateTime: getDefaultDateTime(),
        status: 'OPEN',
      });
      setTimeout(() => setSuccessMessage(''), 4000);
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
        <h2 className="card-title">Assign New Accounting Task</h2>
        <span className="card-subtitle">
          Supervised by Accountant (<strong>kathirvelpalani294@gmail.com</strong>) • Monitored by Overdue Watcher Agent
        </span>
      </div>

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {errors.form && <div className="alert alert-danger">{errors.form}</div>}

      <form onSubmit={handleSubmit} className="request-form" noValidate>
        <div className="form-grid">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="req-title">
              Task Title <span className="required">*</span>
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
              {employees && employees.length > 0 ? (
                employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.email})
                  </option>
                ))
              ) : (
                <option value="Kumar">Kumar</option>
              )}
            </select>
            {errors.assignee && <span className="error-text">{errors.assignee}</span>}
          </div>

          {/* Due Date AND Time */}
          <div className="form-group">
            <label htmlFor="req-due-date-time">
              Deadline (Date & Exact Time) <span className="required">*</span>
            </label>
            <input
              id="req-due-date-time"
              type="datetime-local"
              name="dueDateTime"
              value={formData.dueDateTime}
              onChange={handleChange}
              className={errors.dueDateTime ? 'input-error' : ''}
              required
            />
            {errors.dueDateTime && <span className="error-text">{errors.dueDateTime}</span>}
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
            {submitting ? 'Creating Task...' : '➕ ASSIGN TASK'}
          </button>
        </div>
      </form>
    </div>
  );
}
