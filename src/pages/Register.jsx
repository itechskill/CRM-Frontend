import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Briefcase, Zap, AlertCircle, CheckCircle2, Eye, EyeOff, X } from 'lucide-react';
import { API_BASE } from '../utils/api';
import './Login.css';

export default function Register({ onSwitchToLogin, onSwitchToLanding }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department: 'Sales'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const publicRoles = [
    { value: 'administration', label: 'Administration' },
    { value: 'hr_manager', label: 'HR Manager' },
    { value: 'sales_manager', label: 'Sales Manager' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'employee', label: 'Employee' }
  ];

  const departments = [
    'Sales', 'HR', 'Marketing', 'Development', 'Accounting',
    'Administration', 'Operations', 'Finance', 'Customer Support', 'Other'
  ];

  // Reset department when role changes
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setFormData(prev => ({
      ...prev,
      role: newRole,
      department: newRole === 'employee' ? 'Sales' : ''
    }));
  };

  const handleNameChange = (e) => {
    const rawVal = e.target.value;
    const sanitizedVal = rawVal.replace(/[^A-Za-z\s]/g, '');
    setFormData((prev) => ({ ...prev, fullName: sanitizedVal }));
  };

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    const sanitizedVal = rawVal.replace(/[^0-9+\-\s]/g, '');
    setFormData((prev) => ({ ...prev, phone: sanitizedVal }));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const pass = formData.password || '';
  const reqs = {
    minLength: pass.length >= 8,
    hasUpper: /[A-Z]/.test(pass),
    hasLower: /[a-z]/.test(pass),
    hasNumber: /[0-9]/.test(pass),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)
  };

  const isPasswordValid = reqs.minLength && reqs.hasUpper && reqs.hasLower && reqs.hasNumber && reqs.hasSpecial;

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(formData.fullName.trim())) {
      setErrorMessage('Full Name must contain only alphabetic letters and spaces.');
      return;
    }

    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.role) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (formData.phone && formData.phone.trim() !== '') {
      const phoneRegex = /^[0-9+\-\s]+$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        setErrorMessage('Phone Number can only contain numbers, +, - and spaces.');
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage(
        'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.'
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
        department: formData.role === 'employee' ? formData.department : ''
      };

      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      setSuccessMessage('Your registration has been submitted successfully and is pending Admin approval.');
    } catch (error) {
      console.error('Registration request error:', error);
      setErrorMessage('Unable to connect to backend server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container auth-page-container-bgimage">
      <div className="auth-card auth-card-wide auth-card-glass" style={{ position: 'relative' }}>
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
            <Zap size={24} color="#FFFFFF" />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Apply for a NexusCRM enterprise portal account</p>
        </div>

        {errorMessage && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', textAlign: 'center' }}>
            <div className="auth-alert auth-alert-success" style={{ textAlign: 'left', width: '100%' }}>
              <CheckCircle2 size={22} style={{ flexShrink: 0, color: '#059669' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Registration Successful!</strong>
                Your account has been submitted for Admin approval. You will be able to log in after approval.
              </div>
            </div>
            <button
              type="button"
              className="auth-submit-btn"
              style={{ width: '100%' }}
              onClick={onSwitchToLogin}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            {/* Full Name */}
            <div className="auth-field-group">
              <label className="auth-label">Full Name *</label>
              <div className="auth-input-wrapper">
                <User className="auth-input-icon" size={16} />
                <input
                  type="text"
                  name="fullName"
                  className="auth-input"
                  placeholder="e.g. Ali Khan"
                  value={formData.fullName}
                  onChange={handleNameChange}
                  required
                />
              </div>
            </div>

            {/* Email + Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="auth-field-group">
                <label className="auth-label">Email Address *</label>
                <div className="auth-input-wrapper">
                  <Mail className="auth-input-icon" size={16} />
                  <input
                    type="email"
                    name="email"
                    className="auth-input"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Phone Number</label>
                <div className="auth-input-wrapper">
                  <Phone className="auth-input-icon" size={16} />
                  <input
                    type="tel"
                    name="phone"
                    className="auth-input"
                    placeholder="+923001234567"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>
            </div>

            {/* Requested Role */}
            <div className="auth-field-group">
              <label className="auth-label">Requested Role *</label>
              <div className="auth-input-wrapper">
                <Briefcase className="auth-input-icon" size={16} />
                <select
                  name="role"
                  className="auth-select"
                  value={formData.role}
                  onChange={handleRoleChange}
                  required
                >
                  {publicRoles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department — only shown for Employee role */}
            {formData.role === 'employee' && (
              <div className="auth-field-group">
                <label className="auth-label">Department *</label>
                <div className="auth-input-wrapper">
                  <Briefcase className="auth-input-icon" size={16} />
                  <select
                    name="department"
                    className="auth-select"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Password & Confirm Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="auth-field-group">
                <label className="auth-label">Password *</label>
                <div className="auth-input-wrapper">
                  <Lock className="auth-input-icon" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="auth-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    style={{ paddingRight: '36px' }}
                    required
                  />
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </div>
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Confirm Password *</label>
                <div className="auth-input-wrapper">
                  <Lock className="auth-input-icon" size={16} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className="auth-input"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{ paddingRight: '36px' }}
                    required
                  />
                  <div
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '10px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Submitting Application...' : 'Sign Up'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <span>Already have an account?</span>
          <button type="button" className="auth-link" style={{ background: 'none', border: 'none', padding: 0 }} onClick={onSwitchToLogin}>
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}