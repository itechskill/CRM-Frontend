import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Zap, X, Send } from 'lucide-react';
import { API_BASE } from '../utils/api';
import './Login.css';

export default function ForgotPassword({ onSwitchToLogin, onSwitchToLanding }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address format.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Unable to process password reset request.');
        setLoading(false);
        return;
      }

      setSuccessMessage(data.message || 'Password reset link has been sent to your email address.');
    } catch (error) {
      console.error('Forgot password error:', error);
      setErrorMessage('Unable to connect to backend server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
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
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">Enter your email address to receive a secure password reset link</p>
        </div>

        {errorMessage && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', alignItems: 'center', margin: '16px 0' }}>
            <div className="auth-alert auth-alert-success" style={{ width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
              <CheckCircle2 size={24} style={{ flexShrink: 0, color: '#10B981' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>{successMessage}</strong>
                <span style={{ fontSize: '0.85rem', color: '#047857' }}>
                  Please check your email inbox and click the reset link sent to you to update your password (expires in 15 minutes).
                </span>
              </div>
            </div>

            <button
              type="button"
              className="auth-submit-btn"
              onClick={onSwitchToLogin}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSendResetLink}>
            <div className="auth-field-group">
              <label className="auth-label">Registered Email Address *</label>
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

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Sending Reset Link...' : (
                <>
                  Send Reset Link <Send size={16} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <button
            type="button"
            className="auth-link"
            style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={onSwitchToLogin}
          >
            <ArrowLeft size={14} /> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
