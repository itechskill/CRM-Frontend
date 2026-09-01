import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Zap, ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { API_BASE } from '../utils/api';
import './Login.css';

export default function ResetPassword({ token: initialToken, onSwitchToLogin, onSwitchToLanding }) {
  const [token, setToken] = useState(initialToken || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  // Password validation criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!token) {
      setErrorMessage('Password reset token is missing. Please use the reset link sent to your email.');
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMessage('Please fill in both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Confirm Password must exactly match New Password.');
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasSpecial) {
      setErrorMessage('Password does not meet security requirements.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password/${encodeURIComponent(token.trim())}`, {
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

      setSuccessMessage('Password updated successfully.');

      // Automatically redirect to Login page after brief delay
      setTimeout(() => {
        if (onSwitchToLogin) {
          onSwitchToLogin();
        }
      }, 2500);
    } catch (error) {
      console.error('Reset password request error:', error);
      setErrorMessage('Unable to connect to server. Please try again later.');
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
          <p className="auth-subtitle">Create a secure new password for your CRM account</p>
        </div>

        {!token ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', alignItems: 'center', margin: '16px 0' }}>
            <div className="auth-alert auth-alert-error" style={{ width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
              <AlertCircle size={24} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Missing Password Reset Link</strong>
                <span style={{ fontSize: '0.85rem' }}>
                  Please click the reset password link sent to your email address to access this page.
                </span>
              </div>
            </div>
            <button
              type="button"
              className="auth-submit-btn"
              onClick={onSwitchToLogin}
            >
              Back to Login Page
            </button>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="auth-alert auth-alert-error">
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', alignItems: 'center', margin: '16px 0' }}>
                <div className="auth-alert auth-alert-success" style={{ width: '100%', boxSizing: 'border-box' }}>
                  <CheckCircle2 size={24} style={{ flexShrink: 0, color: '#10B981' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>{successMessage}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#047857' }}>Redirecting to Login page...</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="auth-submit-btn"
                  onClick={onSwitchToLogin}
                >
                  Go to Login Page <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleUpdatePassword}>
                <div className="auth-field-group">
                  <label className="auth-label">New Password *</label>
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

                <div className="auth-field-group">
                  <label className="auth-label">Confirm Password *</label>
                  <div className="auth-input-wrapper">
                    <Lock className="auth-input-icon" size={18} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ paddingRight: '40px' }}
                      required
                    />
                    <div
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '12px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontWeight: 600, color: '#475569', marginBottom: '2px' }}>Password Requirements:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasMinLength ? '#10B981' : '#64748B' }}>
                    {hasMinLength ? <Check size={14} /> : <span style={{ width: 14, height: 14, display: 'inline-block', borderRadius: '50%', border: '1px solid #CBD5E1' }} />}
                    <span>At least 8 characters</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasUppercase ? '#10B981' : '#64748B' }}>
                    {hasUppercase ? <Check size={14} /> : <span style={{ width: 14, height: 14, display: 'inline-block', borderRadius: '50%', border: '1px solid #CBD5E1' }} />}
                    <span>At least 1 uppercase letter (A-Z)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasSpecial ? '#10B981' : '#64748B' }}>
                    {hasSpecial ? <Check size={14} /> : <span style={{ width: 14, height: 14, display: 'inline-block', borderRadius: '50%', border: '1px solid #CBD5E1' }} />}
                    <span>At least 1 special character (!@#$%^&*)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMatch ? '#10B981' : '#64748B' }}>
                    {isMatch ? <Check size={14} /> : <span style={{ width: 14, height: 14, display: 'inline-block', borderRadius: '50%', border: '1px solid #CBD5E1' }} />}
                    <span>Confirm password matches</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                  style={{ marginTop: '8px' }}
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            )}
          </>
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
