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
      setError(err.response?.data?.error || err.message || 'Login failed');
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
        email: regEmail.trim(),
        password: regPassword.trim(),
        role: 'EMPLOYEE',
      });
      setIsRegistering(false);
      // Auto login after registration
      await onLoginSuccess(regEmail.trim(), regPassword.trim());
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
            {/* Quick 1-Click Static Logins */}
            <div className="quick-login-section">
              <label className="section-mini-label">Quick Sign In:</label>
              <button
                type="button"
                className="btn btn-quick-accountant"
                onClick={() => handleLogin('kathirvelpalani294@gmail.com', 'accountant123')}
                disabled={loading}
              >
                👔 Login as Accountant (kathirvelpalani294@gmail.com)
              </button>

              <div className="employee-quick-grid">
                <button
                  type="button"
                  className="btn btn-quick-emp"
                  onClick={() => handleLogin('kumar@company.com', 'kumar123')}
                  disabled={loading}
                >
                  👷 Kumar
                </button>
                <button
                  type="button"
                  className="btn btn-quick-emp"
                  onClick={() => handleLogin('ravi@company.com', 'ravi123')}
                  disabled={loading}
                >
                  👷 Ravi
                </button>
                <button
                  type="button"
                  className="btn btn-quick-emp"
                  onClick={() => handleLogin('arun@company.com', 'arun123')}
                  disabled={loading}
                >
                  👷 Arun
                </button>
                <button
                  type="button"
                  className="btn btn-quick-emp"
                  onClick={() => handleLogin('priya@company.com', 'priya123')}
                  disabled={loading}
                >
                  👷 Priya
                </button>
              </div>
            </div>

            <div className="divider-text">
              <span>Or sign in with custom credentials</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="login-form"
            >
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. employee@company.com"
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
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="login-footer">
              <span>New employee? </span>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setError('');
                  setIsRegistering(true);
                }}
              >
                Register New Employee
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
            <h3 className="sub-title">Register Employee</h3>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Suresh"
                required
              />
            </div>

            <div className="form-group">
              <label>Work Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="suresh@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register & Log In'}
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
