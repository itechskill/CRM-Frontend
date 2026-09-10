import React, { useState } from 'react';
import { Mail, Lock, Zap, AlertCircle, ArrowRight, Clock, XCircle, ShieldAlert, Eye, EyeOff, BarChart3, Users, ShieldCheck, X } from 'lucide-react';
import { getFrontendRole } from '../config/roleConfig';
import { setToken, setUser } from '../utils/authStorage';
import { API_BASE } from '../utils/api';
import './Login.css';

export default function Login({ onLoginSuccess, onSwitchToRegister, onSwitchToForgotPassword, onSwitchToLanding }) {
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

      if (data.token && data.data) {
        setToken(data.token);
        setUser(data.data);
        const frontendRole = getFrontendRole(data.data.role);
        onLoginSuccess(frontendRole, data.data);
      }
    } catch (error) {
      console.error('Login request error:', error);
      setErrorMessage('Unable to connect to backend server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setInfoMessage('Please contact your System Administrator to reset your password credentials.');
  };

  const getAlertIcon = (msg) => {
    if (msg.includes('pending')) return Clock;
    if (msg.includes('rejected')) return XCircle;
    if (msg.includes('suspended')) return ShieldAlert;
    return AlertCircle;
  };

  const AlertIcon = getAlertIcon(errorMessage);

  return (
    <div className="auth-split-page">
      {/* Left branding / background image panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-overlay" />
        <div className="auth-brand-content">
          <div className="auth-brand-logo-row" style={{ cursor: onSwitchToLanding ? 'pointer' : 'default' }} onClick={onSwitchToLanding}>
            <div className="auth-logo-badge auth-logo-badge-brand">
              <Zap size={24} color="#FFFFFF" />
            </div>
            <span className="auth-brand-name">Fortline CRM</span>
          </div>

          <h2 className="auth-brand-heading">
            Run your entire business from one platform.
          </h2>
          <p className="auth-brand-subheading">
            Projects, sales, HR, and finance — unified in a single enterprise workspace built for modern teams.
          </p>

          <div className="auth-brand-features">
            <div className="auth-brand-feature">
              <div className="auth-brand-feature-icon"><BarChart3 size={18} /></div>
              <div>
                <div className="auth-brand-feature-title">Real-time analytics</div>
                <div className="auth-brand-feature-desc">Track performance across every department</div>
              </div>
            </div>
            <div className="auth-brand-feature">
              <div className="auth-brand-feature-icon"><Users size={18} /></div>
              <div>
                <div className="auth-brand-feature-title">Role-based portals</div>
                <div className="auth-brand-feature-desc">Tailored dashboards for every team</div>
              </div>
            </div>
            <div className="auth-brand-feature">
              <div className="auth-brand-feature-icon"><ShieldCheck size={18} /></div>
              <div>
                <div className="auth-brand-feature-title">Enterprise-grade security</div>
                <div className="auth-brand-feature-desc">Audit logs and role-based access control</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel — same auth-card markup as before */}
      <div className="auth-form-panel">
        <div className="auth-page-container auth-page-container-embedded">
          <div className="auth-card" style={{ position: 'relative' }}>
            {onSwitchToLanding && (
              <button
                type="button"
                className="auth-close-btn"
                onClick={onSwitchToLanding}
                title="Return to Public Website"
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                  transition: 'all 0.2s',
                  zIndex: 10
                }}
              >
                <X size={18} />
              </button>
            )}
            <div className="auth-header">
              <div className="auth-logo-badge">
                <Zap size={28} color="#FFFFFF" />
              </div>
              <h1 className="auth-title">Welcome back</h1>
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
      </div>
    </div>
  );
}