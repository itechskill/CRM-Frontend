import React, { useState } from 'react';
import { Mail, Lock, Zap, AlertCircle, ArrowRight, Clock, XCircle, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { getFrontendRole } from '../config/roleConfig';
import { setToken, setUser } from '../utils/authStorage';
import { API_BASE } from '../utils/api';
import './Login.css';

export default function Login({ onLoginSuccess, onSwitchToRegister, onSwitchToForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      // Successful Authentication
      if (data.token && data.data) {
        setToken(data.token);
        setUser(data.data);

        // Automatically determine user portal using central role configuration
        const frontendRole = getFrontendRole(data.data.role);
        onLoginSuccess(frontendRole, data.data);
      }
    } catch (error) {
      console.error('Login request error:', error);
      setErrorMessage('Unable to connect to backend server. Please make sure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setInfoMessage('Please contact your System Administrator to reset your password credentials.');
  };

  // Select alert icon based on message content
  const getAlertIcon = (msg) => {
    if (msg.includes('pending')) return Clock;
    if (msg.includes('rejected')) return XCircle;
    if (msg.includes('suspended')) return ShieldAlert;
    return AlertCircle;
  };

  const AlertIcon = getAlertIcon(errorMessage);

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Zap size={28} color="#FFFFFF" />
          </div>
          <h1 className="auth-title">NexusCRM</h1>
          <p className="auth-subtitle">Sign in to your enterprise account</p>
        </div>

        {errorMessage && (
          <div className={`auth-alert ${errorMessage.includes('pending') ? 'auth-alert-warning' : 'auth-alert-error'}`}>
            <AlertIcon size={20} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="auth-alert auth-alert-warning">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{infoMessage}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-field-group">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail className="auth-input-icon" size={18} />
              <input
                type="email"
                className="auth-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field-group">
            <div className="auth-row-between">
              <label className="auth-label">Password</label>
              <button
                type="button"
                className="auth-link"
                style={{ background: 'none', border: 'none', padding: 0 }}
                onClick={onSwitchToForgotPassword || handleForgotPassword}
              >
                Forgot Password?
              </button>
            </div>
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '40px' }}
                required
              />
              <div
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <button
            type="button"
            className="auth-link"
            style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.85rem' }}
            onClick={onSwitchToRegister}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
