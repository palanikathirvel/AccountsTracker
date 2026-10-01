import React, { useState } from 'react';
import ThemeSelector from './ThemeSelector';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  UserCheck,
  Sparkles,
  Bot,
  AlertCircle,
} from 'lucide-react';

export default function LoginForm({ onLoginSuccess, onRegisterEmployee }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

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
      <div className="login-ambient-glow"></div>

      {/* Top right theme toggle */}
      <div className="login-theme-bar">
        <ThemeSelector compact={false} />
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-brand-icon">
            <ShieldCheck size={36} className="shield-icon" />
          </div>
          <h2 className="login-main-title">Accountant Request Tracker</h2>
          <div className="login-agent-tag">
            <Bot size={13} />
            <span>Autonomous Overdue Watcher Agent • Live AI Supervision</span>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!isRegistering ? (
          <div>
            {/* 1-Click Accountant Quick Sign In */}
            <div className="quick-login-section">
              <div className="quick-login-header">
                <span className="section-mini-label">Direct Accountant Access</span>
                <span className="quick-chip">Instant</span>
              </div>
              <button
                type="button"
                className="btn-quick-accountant"
                onClick={() => handleLogin('kathirvelpalani294@gmail.com', 'accountant123')}
                disabled={loading}
              >
                <UserCheck size={16} />
                <div className="btn-quick-text">
                  <span className="btn-quick-title">Sign in as Lead Accountant</span>
                  <span className="btn-quick-email">kathirvelpalani294@gmail.com</span>
                </div>
                <ArrowRight size={16} className="quick-arrow-icon" />
              </button>
            </div>

            <div className="divider-text">
              <span>OR EMPLOYEE LOGIN</span>
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
                <div className="input-with-icon">
                  <Mail size={16} className="input-leading-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. employee@company.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-leading-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-pass"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block btn-login-submit" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In as Employee'}
              </button>
            </form>

            <div className="login-footer">
              <span>New employee? </span>
              <button
                type="button"
                className="btn-link font-semibold"
                onClick={() => {
                  setError('');
                  setIsRegistering(true);
                }}
              >
                Register Employee with Real Email →
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
            <div className="register-header-box">
              <h3 className="sub-title">Register Real Employee</h3>
              <p className="form-hint-text">
                Add an employee with their valid email address. The Watcher Agent will dispatch live notifications directly to their inbox.
              </p>
            </div>

            <div className="form-group">
              <label>Employee Full Name</label>
              <div className="input-with-icon">
                <User size={16} className="input-leading-icon" />
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Employee Real Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-leading-icon" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. employee@gmail.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Create Login Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-leading-icon" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-pass"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  tabIndex="-1"
                  aria-label="Toggle password visibility"
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-login-submit" disabled={loading}>
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
                ← Back to Employee Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
