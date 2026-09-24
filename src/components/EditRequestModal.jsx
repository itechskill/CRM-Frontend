import React, { useState } from 'react';
import { X, Lock, ShieldAlert, Send, CheckCircle, FileText, UserCheck } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function EditRequestModal({
  isOpen,
  onClose,
  documentType,
  documentId,
  documentNumber,
  currentUser,
  onRequestSubmitted
}) {
  const [requestType, setRequestType] = useState('SpecificField'); // 'SpecificField' | 'General'
  const [fieldName, setFieldName] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [requestedValue, setRequestedValue] = useState('');
  const [reason, setReason] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const userName = currentUser?.fullName || currentUser?.name || 'Current User';
  const userId = currentUser?._id || currentUser?.id || 'USR-XXXXX';
  const userRole = currentUser?.role || 'Staff';
  const userDept = currentUser?.department || (
    userRole.includes('sales') ? 'Sales' :
    userRole.includes('purchaser') ? 'Procurement' :
    userRole.includes('support') ? 'Support' :
    userRole.includes('account') ? 'Accounts' :
    userRole.includes('finance') ? 'Finance' : 'Operations'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Please state the reason for requesting edit permission.');
      return;
    }

    if (requestType === 'SpecificField' && !fieldName.trim()) {
      setErrorMsg('Please specify the field you want to edit.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        documentType,
        documentId,
        documentNumber,
        reason: reason.trim(),
        requestType,
        requestedFields: requestType === 'SpecificField' ? [
          {
            fieldName: fieldName.trim(),
            label: fieldName.trim(),
            currentValue: currentValue.trim(),
            requestedValue: requestedValue.trim()
          }
        ] : []
      };

      const { response, data } = await apiRequest('/api/edit-permissions/request', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok && data.success) {
        setSuccessMsg('Edit permission request submitted to CEO successfully.');
        setFieldName('');
        setCurrentValue('');
        setRequestedValue('');
        setReason('');
        setTimeout(() => {
          if (onRequestSubmitted) onRequestSubmitted(data.data);
          onClose();
          setSuccessMsg('');
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Failed to submit edit permission request.');
      }
    } catch (err) {
      console.error('[EditRequestModal Error]:', err);
      setErrorMsg('Server error submitting request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Lock size={20} style={{ color: '#f59e0b' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
              Edit Access Request (CEO Approval)
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
          {errorMsg && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ShieldAlert size={16} />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle size={16} />
              {successMsg}
            </div>
          )}

          {/* User & Document Metadata Summary (Read-Only) */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #e2e8f0',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Requester Identity & Document Reference
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#475569' }}>Requested By:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{userName}</span></div>
              <div><strong style={{ color: '#475569' }}>User ID:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{String(userId).slice(-8)}</span></div>
              <div><strong style={{ color: '#475569' }}>Role:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{userRole}</span></div>
              <div><strong style={{ color: '#475569' }}>Department:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{userDept}</span></div>
              <div><strong style={{ color: '#475569' }}>Document:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{documentType}</span></div>
              <div><strong style={{ color: '#475569' }}>Doc Ref No:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{documentNumber || 'N/A'}</span></div>
            </div>
          </div>

          {/* Request Type Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
              Request Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setRequestType('SpecificField')}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: requestType === 'SpecificField' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                  backgroundColor: requestType === 'SpecificField' ? '#f1f5f9' : '#ffffff',
                  color: '#0f172a',
                  fontWeight: requestType === 'SpecificField' ? 700 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                Type A – Specific Field Edit
              </button>

              <button
                type="button"
                onClick={() => setRequestType('General')}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: requestType === 'General' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                  backgroundColor: requestType === 'General' ? '#f1f5f9' : '#ffffff',
                  color: '#0f172a',
                  fontWeight: requestType === 'General' ? 700 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                Type B – General Document Edit
              </button>
            </div>
          </div>

          {/* Specific Field Inputs (Type A) */}
          {requestType === 'SpecificField' && (
            <div style={{
              backgroundColor: '#fafafa',
              border: '1px solid #e4e4e7',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Target Field Preset / Selector
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setFieldName(e.target.value);
                    }
                  }}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginBottom: '0.5rem', backgroundColor: '#ffffff' }}
                >
                  <option value="">-- Select Standard Document Field (or enter custom below) --</option>
                  <option value="Customer Name">Customer / Client Name (clientName)</option>
                  <option value="Order Number">Order Reference / Number (orderNumber)</option>
                  <option value="Total Amount">Total Amount / Net Amount (totalAmount)</option>
                  <option value="Items List">Items / Products List & Quantities (items)</option>
                  <option value="Due Date">Due Date / Delivery Date (dueDate)</option>
                  <option value="Client Address">Client Address / Location (clientAddress)</option>
                  <option value="Contact Phone/Email">Client Phone / Email (clientPhone)</option>
                  <option value="custom">Custom / Other Field (Type custom below)</option>
                </select>

                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Target Field Name / Detail <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g. Customer Name, Order Number, Total Amount, test7 to test75"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  required={requestType === 'SpecificField'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                    Current Value
                  </label>
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="e.g. 10"
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#16a34a', marginBottom: '0.25rem' }}>
                    Requested New Value
                  </label>
                  <input
                    type="text"
                    value={requestedValue}
                    onChange={(e) => setRequestedValue(e.target.value)}
                    placeholder="e.g. 15"
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #16a34a', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Reason for Edit Request <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a clear, detailed explanation for why this edit is required..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                resize: 'vertical',
                outline: 'none'
              }}
              required
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: submitting ? 0.7 : 1
              }}
            >
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit Request to CEO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
