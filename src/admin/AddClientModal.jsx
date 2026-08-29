import React, { useState } from 'react';
import { X } from 'lucide-react';
import './AddClientModal.css';

import { authHeaders } from '../utils/api';

export default function AddClientModal({ isOpen, onClose, onAddClient }) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('USA');
  const [industry, setIndustry] = useState('Technology');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [revenueYtd, setRevenueYtd] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !contactName || !contactEmail) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:5000/api/crm/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          name: name.trim(),
          company: name.trim(),
          email: contactEmail.trim(),
          phone: '',
          industry,
          status: 'Active',
          totalValue: revenueYtd ? Number(revenueYtd.replace(/[^0-9.]/g, '')) : 50000,
          notes: `Contact: ${contactName}`
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (onAddClient) onAddClient(data.data);
        setName('');
        setContactName('');
        setContactEmail('');
        setRevenueYtd('');
        onClose();
      } else {
        setErrorMsg(data.message || 'Unable to save client. Please try again.');
      }
    } catch (err) {
      console.error('Create client error:', err);
      setErrorMsg('Unable to save client data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Add New Client</h2>
          <button
            className="close-btn"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            className="modal-body"
            style={{
              padding: '20px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div className="form-group">
              <label style={labelStyle}>Client Organization Name</label>
              <input
                className="form-input"
                style={inputStyle}
                placeholder="e.g. Proxima Labs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label style={labelStyle}>Country / Location</label>
              <input
                className="form-input"
                style={inputStyle}
                placeholder="e.g. USA"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label style={labelStyle}>Industry</label>
              <select className="form-select" style={inputStyle} value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="Technology">Technology</option>
                <option value="Construction">Construction</option>
                <option value="Finance & VC">Finance & VC</option>
                <option value="Logistics">Logistics</option>
                <option value="Cloud Services">Cloud Services</option>
                <option value="Healthcare">Healthcare</option>
              </select>
            </div>

            <div className="form-group">
              <label style={labelStyle}>Primary Contact Name</label>
              <input
                className="form-input"
                style={inputStyle}
                placeholder="e.g. Eric Vance"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label style={labelStyle}>Contact Email</label>
              <input
                type="email"
                className="form-input"
                style={inputStyle}
                placeholder="e.g. e.vance@proxima.io"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label style={labelStyle}>Revenue YTD ($ USD)</label>
              <input
                type="number"
                className="form-input"
                style={inputStyle}
                placeholder="148000"
                value={revenueYtd}
                onChange={(e) => setRevenueYtd(e.target.value)}
              />
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '12px', padding: '0 24px' }}>
              {errorMsg}
            </div>
          )}
          <div
            className="modal-footer"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '24px',
              padding: '16px 24px',
              borderTop: '1px solid #E2E8F0',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isSubmitting ? '#94A3B8' : '#2563EB',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.825rem',
  fontWeight: 600,
  color: '#334155',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
  backgroundColor: '#FFFFFF',
  fontSize: '0.9rem',
  color: '#0F172A',
  boxSizing: 'border-box',
  outline: 'none',
};