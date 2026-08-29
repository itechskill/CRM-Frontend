import React, { useState } from 'react';
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Zap, X } from 'lucide-react';
import './Login.css';

export default function ForgotPassword({ onSwitchToLogin, onSwitchToLanding }) {
  const [step, setStep] = useState(1); // 1: Email Request, 2: Reset Form, 3: Success
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Error processing request.');
        setLoading(false);
        return;
      }

      setInfoMessage(data.message || 'If an account with that email exists, password reset instructions have been generated.');

      if (data.resetToken) {
        setToken(data.resetToken);
      }

      setStep(2);
    } catch (error) {
      console.error('Forgot password error:', error);
      setErrorMessage('Unable to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!token) {
      setErrorMessage('Reset token is required.');
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMessage('Please fill in both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/auth/reset-password/${token.trim()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password, confirmPassword })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Password reset failed. Token may be invalid or expired.');
        setLoading(false);
        return;
      }

      setStep(3);
    } catch (error) {
      console.error('Reset password error:', error);
      setErrorMessage('Server error during password reset.');
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
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Recover your NexusCRM enterprise account</p>
        </div>

        {errorMessage && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && step === 2 && (
          <div className="auth-alert auth-alert-warning">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{infoMessage}</span>
          </div>
        )}

        {step === 1 && (
          <form className="auth-form" onSubmit={handleRequestToken}>
            <div className="auth-field-group">
              <label className="auth-label">Enter your registered Email Address</label>
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
              {loading ? 'Generating Reset Token...' : (
                <>
                  Generate Reset Token <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="auth-field-group">
              <label className="auth-label">Reset Token *</label>
              <div className="auth-input-wrapper">
                <KeyRound className="auth-input-icon" size={18} />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Paste secure reset token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">New Password *</label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Confirm New Password *</label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Resetting Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', alignItems: 'center' }}>
            <div className="auth-alert auth-alert-success" style={{ textAlign: 'left' }}>
              <CheckCircle2 size={24} style={{ flexShrink: 0, color: '#10B981' }} />
              <span>Password reset successful! You can now log in with your new password.</span>
            </div>
            <button type="button" className="auth-submit-btn" onClick={onSwitchToLogin}>
              Back to Sign In
            </button>
          </div>
        )}

        <div className="auth-footer">
          <button
            type="button"
            className="auth-link"
            style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={onSwitchToLogin}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
