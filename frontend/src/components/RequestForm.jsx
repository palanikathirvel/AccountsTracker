import React, { useState, useEffect } from 'react';

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
    if (!formData.assignee.trim()) errs.assignee = 'Assignee is required. Please register an employee below.';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSuccessMessage('');

    try {
      await onRequestCreated(formData);
      setSuccessMessage('✓ Task created! Live overdue alerts will be sent to assignee & accountant.');
      setFormData({
        title: '',
        clientName: '',
        assignee: employees && employees.length > 0 ? employees[0].name : '',
        assigneeEmail: employees && employees.length > 0 ? employees[0].email : '',
        accountantEmail: 'kathirvelpalani294@gmail.com',
        dueDateTime: getDefaultDateTime(),
        status: 'OPEN',
      });
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to create request';
      setErrors({ form: msg });
    } finally {
      setSubmitting(false);
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
      // Auto select the new employee
      setFormData((prev) => ({
        ...prev,
        assignee: emp.name,
        assigneeEmail: emp.email,
      }));
      setNewEmpName('');
      setNewEmpEmail('');
      setNewEmpPass('');
      setShowAddEmp(false);
      setSuccessMessage(`✓ Real employee "${emp.name}" (${emp.email}) added!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to add employee');
    } finally {
      setAddingEmp(false);
    }
  };

  return (
    <div className="card form-card">
      <div className="card-header">
        <div className="card-header-flex">
          <div>
            <h2 className="card-title">Assign New Accounting Task</h2>
            <span className="card-subtitle">
              Supervised by Accountant (<strong>kathirvelpalani294@gmail.com</strong>) • Live Watcher Agent
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddEmp(!showAddEmp)}
          >
            {showAddEmp ? '✖ Cancel' : '➕ Register Real Employee'}
          </button>
        </div>
      </div>

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {errors.form && <div className="alert alert-danger">{errors.form}</div>}

      {/* Inline Quick Add Real Employee Form */}
      {showAddEmp && (
        <div className="quick-add-emp-box">
          <h4 className="quick-add-title">Add Employee with Real Email Address:</h4>
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
              placeholder="Real Email ID (e.g. employee@gmail.com)"
              value={newEmpEmail}
              onChange={(e) => setNewEmpEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password for login"
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
            <label htmlFor="req-title">
              Task Title <span className="required">*</span>
            </label>
            <input
              id="req-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Quarterly Audit Filing"
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
              placeholder="e.g. Acme Tech Solutions"
              className={errors.clientName ? 'input-error' : ''}
              required
            />
            {errors.clientName && <span className="error-text">{errors.clientName}</span>}
          </div>

          {/* Assignee */}
          <div className="form-group">
            <label htmlFor="req-assignee">
              Assignee (Real Email) <span className="required">*</span>
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
                <span>No employees added yet. </span>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => setShowAddEmp(true)}
                >
                  Click here to add your first real employee!
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
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !employees || employees.length === 0}
          >
            {submitting ? 'Creating Task...' : '➕ ASSIGN TASK'}
          </button>
        </div>
      </form>
    </div>
  );
}
