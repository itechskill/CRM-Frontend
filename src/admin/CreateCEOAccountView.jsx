import React, { useState } from 'react';
import { Crown, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './RegistrationRequestsView.css';

export default function CreateCEOAccountView() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    status: 'active'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/admin/ceo', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      if (response.ok && data.success) {
        setSuccessMessage(data.message || 'CEO account created successfully.');
        setForm({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          status: 'active'
        });
      } else {
        setErrorMessage(data.message || 'Unable to create CEO account.');
      }
    } catch {
      setErrorMessage('Unable to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '0.9rem',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: '6px',
    color: '#334155',
  };

  return (
    <div className="reg-requests-container">
      <div className="reg-requests-header">
        <div>
          <h1 className="reg-requests-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0F172A' }}>
            <Crown size={24} color="#4F46E5" /> Create CEO Account
          </h1>
          <p className="reg-requests-subtitle" style={{ color: '#64748B' }}>
            Create an executive CEO account directly. CEO accounts do not require registration approval.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626'
        }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          color: '#15803D'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <div
        style={{
          padding: '24px',
          maxWidth: '640px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>CEO Name *</label>
            <input
              style={inputStyle}
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. John Smith"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>CEO Email *</label>
            <input
              type="email"
              style={inputStyle}
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ceo@company.com"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Phone</label>
            <input
              style={inputStyle}
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+923001234567"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...inputStyle, padding: '10px 36px 10px 12px' }}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  style={{ ...inputStyle, padding: '10px 36px 10px 12px' }}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              style={inputStyle}
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '12px 20px',
              backgroundColor: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating CEO Account...' : 'Create CEO Account'}
          </button>
        </form>
      </div>
    </div>
  );
}