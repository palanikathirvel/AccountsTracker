import React, { useState, useEffect } from 'react';
import requestService from '../services/requestService';
import {
  FilePlus,
  UserPlus,
  Calendar,
  Building,
  User,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ListChecks,
} from 'lucide-react';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'COMPLETED'];

export default function RequestForm({ employees, onEmployeeAdded, onRequestCreated }) {
  const getDefaultDateTime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
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

  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPass, setNewEmpPass] = useState('');
  const [addingEmp, setAddingEmp] = useState(false);

  // AI Task Breakdown helper
  const [showAiBreakdown, setShowAiBreakdown] = useState(false);
  const [aiBreakdown, setAiBreakdown] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Update selected assignee when employees change
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
    if (!formData.assignee.trim()) errs.assignee = 'Assignee is required. Register an employee if list is empty.';
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
        assigneeEmail: selectedEmp ? selectedEmp.email : '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Quick preset deadline buttons
  const setQuickDeadline = (hoursFromNow, targetHour = null) => {
    const d = new Date();
    if (targetHour !== null) {
      if (hoursFromNow > 0) d.setDate(d.getDate() + 1);
      d.setHours(targetHour, 0, 0, 0);
    } else {
      d.setHours(d.getHours() + hoursFromNow);
      d.setMinutes(0, 0, 0);
    }
    const pad = (n) => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setFormData((prev) => ({ ...prev, dueDateTime: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSuccessMessage('');

    try {
      await onRequestCreated(formData);
      setSuccessMessage('✓ Task successfully created & assigned! Watcher Agent is active.');
      setFormData({
        title: '',
        clientName: '',
        assignee: employees && employees.length > 0 ? employees[0].name : '',
        assigneeEmail: employees && employees.length > 0 ? employees[0].email : '',
        accountantEmail: 'kathirvelpalani294@gmail.com',
        dueDateTime: getDefaultDateTime(),
        status: 'OPEN',
      });
      setShowAiBreakdown(false);
      setAiBreakdown(null);
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to create request';
      setErrors({ form: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Quick AI Breakdown of task
  const handleFetchAiBreakdown = async () => {
    if (!formData.title.trim()) {
      setErrors((prev) => ({ ...prev, title: 'Please enter a task title first to generate AI insights' }));
      return;
    }
    setLoadingAi(true);
    try {
      const res = await requestService.getTaskBreakdown(
        formData.title,
        formData.clientName || 'Client',
        formData.assignee || 'Assigned Staff'
      );
      setAiBreakdown(res);
      setShowAiBreakdown(true);
    } catch (err) {
      console.warn('AI breakdown error:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Quick-add new employee directly from this form
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpEmail.trim() || !newEmpPass.trim()) {
      alert('Please fill in Employee Name, Email, and Password');
      return;
    }
    setAddingEmp(true);
    try {
      const emp = await onEmployeeAdded({
        name: newEmpName.trim(),
        email: newEmpEmail.trim().toLowerCase(),
        password: newEmpPass.trim(),
        role: 'EMPLOYEE',
      });
      const resolvedName = emp?.name || newEmpName.trim();
      const resolvedEmail = emp?.email || newEmpEmail.trim().toLowerCase();

      // Auto select the newly added employee
      setFormData((prev) => ({
        ...prev,
        assignee: resolvedName,
        assigneeEmail: resolvedEmail,
      }));
      setNewEmpName('');
      setNewEmpEmail('');
      setNewEmpPass('');
      setShowAddEmp(false);
      setSuccessMessage(`✓ Real employee "${resolvedName}" (${resolvedEmail}) registered successfully!`);
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to add employee';
      alert(errMsg);
    } finally {
      setAddingEmp(false);
    }
  };

  return (
    <div className="card form-card">
      <div className="card-header">
        <div className="card-header-flex">
          <div className="card-title-group">
            <div className="form-icon-wrap">
              <FilePlus size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="card-title">Assign New Accounting Task</h2>
              <span className="card-subtitle">
                Supervised by Accountant (<strong>kathirvelpalani294@gmail.com</strong>) • Live Watcher Agent
              </span>
            </div>
          </div>
          <div className="card-header-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAddEmp(!showAddEmp)}
            >
              {showAddEmp ? (
                <>
                  <X size={13} style={{ marginRight: '4px' }} /> Cancel
                </>
              ) : (
                <>
                  <UserPlus size={13} style={{ marginRight: '4px' }} /> Register Real Employee
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}
      {errors.form && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Inline Quick Add Real Employee Form */}
      {showAddEmp && (
        <div className="quick-add-emp-box">
          <div className="quick-add-header">
            <UserPlus size={16} className="text-primary" />
            <h4 className="quick-add-title">Register Real Employee Account:</h4>
          </div>
          <form onSubmit={handleCreateEmployee} className="quick-add-grid">
            <input
              type="text"
              placeholder="Employee Full Name"
              value={newEmpName}
              onChange={(e) => setNewEmpName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Real Email ID (e.g. name@gmail.com)"
              value={newEmpEmail}
              onChange={(e) => setNewEmpEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Login Password"
              value={newEmpPass}
              onChange={(e) => setNewEmpPass(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={addingEmp}>
              {addingEmp ? 'Saving...' : 'Save Employee'}
            </button>
          </form>
        </div>
      )}

      <form onSubmit={handleSubmit} className="request-form" noValidate>
        <div className="form-grid">
          {/* Title */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="req-title">
                Task Title <span className="required">*</span>
              </label>
              <button
                type="button"
                className="btn-ai-suggest-inline"
                onClick={handleFetchAiBreakdown}
                disabled={loadingAi}
                title="Use Gemini AI to suggest compliance subtasks"
              >
                <Sparkles size={11} className={loadingAi ? 'spin' : ''} />
                <span>{loadingAi ? 'Thinking...' : 'AI Subtasks'}</span>
              </button>
            </div>
            <input
              id="req-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Quarterly Audit Filing, GST Return, IT Reconciliation"
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
              placeholder="e.g. Acme Corporation, Global Logistics Ltd."
              className={errors.clientName ? 'input-error' : ''}
              required
            />
            {errors.clientName && <span className="error-text">{errors.clientName}</span>}
          </div>

          {/* Assignee */}
          <div className="form-group">
            <label htmlFor="req-assignee">
              Assignee (Real Employee) <span className="required">*</span>
            </label>
            {employees && employees.length > 0 ? (
              <select
                id="req-assignee"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                className={errors.assignee ? 'input-error' : ''}
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} — {emp.email}
                  </option>
                ))}
              </select>
            ) : (
              <div className="no-emp-warning">
                <span>No employees registered yet. </span>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => setShowAddEmp(true)}
                >
                  Register employee now
                </button>
              </div>
            )}
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
            {/* Quick Presets */}
            <div className="deadline-quick-presets">
              <span className="preset-label">Quick:</span>
              <button
                type="button"
                className="btn-preset-pill"
                onClick={() => setQuickDeadline(2)}
              >
                +2 Hours
              </button>
              <button
                type="button"
                className="btn-preset-pill"
                onClick={() => setQuickDeadline(0, 17)}
              >
                Today 5 PM
              </button>
              <button
                type="button"
                className="btn-preset-pill"
                onClick={() => setQuickDeadline(1, 10)}
              >
                Tomorrow 10 AM
              </button>
            </div>
            {errors.dueDateTime && <span className="error-text">{errors.dueDateTime}</span>}
          </div>

          {/* Status */}
          <div className="form-group">
            <label htmlFor="req-status">Initial Status</label>
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

        {/* AI Task Breakdown suggestion box if generated */}
        {showAiBreakdown && aiBreakdown && (
          <div className="ai-breakdown-card">
            <div className="ai-breakdown-header">
              <Sparkles size={16} className="text-primary" />
              <strong>AI Suggested Compliance Subtasks:</strong>
              <button
                type="button"
                className="btn-link text-muted"
                style={{ marginLeft: 'auto', fontSize: '11px' }}
                onClick={() => setShowAiBreakdown(false)}
              >
                ✕ Dismiss
              </button>
            </div>
            {aiBreakdown.estimatedHours && (
              <span className="ai-est-badge">
                <Clock size={11} /> Est. Duration: {aiBreakdown.estimatedHours} hours
              </span>
            )}
            {aiBreakdown.subtasks && aiBreakdown.subtasks.length > 0 && (
              <ul className="ai-subtasks-list">
                {aiBreakdown.subtasks.map((st, i) => (
                  <li key={i}>
                    <CheckCircle2 size={12} className="text-success" />
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-submit-task"
            disabled={submitting || !employees || employees.length === 0}
          >
            {submitting ? (
              'Creating Task...'
            ) : (
              <>
                <FilePlus size={15} style={{ marginRight: '6px' }} />
                ASSIGN ACCOUNTING TASK
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
