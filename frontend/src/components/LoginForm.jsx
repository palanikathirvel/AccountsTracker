import React, { useState } from 'react';

export default function LoginForm({ onLoginSuccess, onRegisterEmployee }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (loginEmail, loginPass) => {
    setError('');
    setLoading(true);
    try {
      await onLoginSuccess(loginEmail || email, loginPass || password);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed. Check your email & password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please fill in all registration fields');
      return;
    }
    setLoading(true);
    try {
      await onRegisterEmployee({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword.trim(),
        role: 'EMPLOYEE',
      });
      setIsRegistering(false);
      // Auto login after registration with real email
      await onLoginSuccess(regEmail.trim().toLowerCase(), regPassword.trim());
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modal-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🛡️</div>
          <h2>Accountant Request Tracker</h2>
          <p className="login-tagline">Autonomous Date & Time Overdue Watcher Agent</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {!isRegistering ? (
          <div>
            {/* 1-Click Accountant Login */}
            <div className="quick-login-section">
              <label className="section-mini-label">Accountant Quick Sign In:</label>
              <button
                type="button"
                className="btn btn-quick-accountant"
                onClick={() => handleLogin('kathirvelpalani294@gmail.com', 'accountant123')}
                disabled={loading}
              >
                👔 Sign in as Accountant (kathirvelpalani294@gmail.com)
              </button>
            </div>

            <div className="divider-text">
              <span>Employee Sign In (Real Email ID)</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="login-form"
            >
              <div className="form-group">
                <label>Employee Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@domain.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In as Employee'}
              </button>
            </form>

            <div className="login-footer">
              <span>Need to add an employee? </span>
              <button
                type="button"
                className="btn-link font-semibold"
                onClick={() => {
                  setError('');
                  setIsRegistering(true);
                }}
              >
                ➕ Register Employee with Real Email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
            <h3 className="sub-title">Register Real Employee</h3>
            <p className="form-hint-text">
              Add your employee with their real email address so the Watcher Agent can dispatch live notifications.
            </p>

            <div className="form-group">
              <label>Employee Full Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                required
              />
            </div>

            <div className="form-group">
              <label>Employee Real Email Address</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. employee@gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Create Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Registering...' : 'Register & Log In'}
            </button>

            <div className="login-footer">
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setError('');
                  setIsRegistering(false);
                }}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
