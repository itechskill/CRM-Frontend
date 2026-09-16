import React, { useState, useEffect } from 'react';
import { CalendarX, CalendarCheck, Clock, Plus, Upload, CheckCircle, AlertTriangle, FileText, Search } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './AccountsLeaveView.css';

export default function AccountsLeaveView() {
  const [activeTab, setActiveTab] = useState('leaves');
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leave Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [proofDocument, setProofDocument] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const [lRes, aRes] = await Promise.all([
        apiRequest('/api/hr/leaves'),
        apiRequest('/api/hr/attendance')
      ]);

      if (lRes.response.ok && lRes.data.success) {
        setLeaves(lRes.data.data || []);
      }
      if (aRes.response.ok && aRes.data.success) {
        setAttendance(aRes.data.data || []);
      }
    } catch (err) {
      console.error('Fetch employee leave/attendance error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchEmployeeData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!startDate || !endDate || !reason) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const { response, data } = await apiRequest('/api/hr/leaves', {
        method: 'POST',
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          reason,
          proofDocument
        })
      });

      if (response.ok && data.success) {
        setFormSuccess('Leave request submitted successfully!');
        setStartDate('');
        setEndDate('');
        setReason('');
        setProofDocument('');
        setIsModalOpen(false);
        fetchEmployeeData();
      } else {
        setFormError(data.message || 'Failed to submit leave request.');
      }
    } catch (err) {
      setFormError('Network error submitting leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'Rejected').length;
  const presentDays = attendance.filter(a => ['Present', 'Late'].includes(a.status)).length;

  return (
    <div className="emp-leave-container">
      {/* Header */}
      <div className="emp-leave-header">
        <div>
          <h2>My Leave & Attendance</h2>
          <p>Submit leave requests, view application statuses, and track your attendance logs.</p>
        </div>
        <button className="emp-leave-btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Request Leave
        </button>
      </div>

      {/* Stats Cards */}
      <div className="emp-leave-stats-grid">
        <div className="emp-leave-stat-card">
          <div className="emp-leave-stat-icon green"><CalendarCheck size={20} /></div>
          <div>
            <span className="emp-leave-stat-val">{presentDays} Days</span>
            <span className="emp-leave-stat-lbl">Days Present</span>
          </div>
        </div>

        <div className="emp-leave-stat-card">
          <div className="emp-leave-stat-icon amber"><Clock size={20} /></div>
          <div>
            <span className="emp-leave-stat-val">{pendingCount}</span>
            <span className="emp-leave-stat-lbl">Pending Approvals</span>
          </div>
        </div>

        <div className="emp-leave-stat-card">
          <div className="emp-leave-stat-icon blue"><CalendarX size={20} /></div>
          <div>
            <span className="emp-leave-stat-val">{approvedCount}</span>
            <span className="emp-leave-stat-lbl">Approved Leaves</span>
          </div>
        </div>

        <div className="emp-leave-stat-card">
          <div className="emp-leave-stat-icon red"><AlertTriangle size={20} /></div>
          <div>
            <span className="emp-leave-stat-val">{rejectedCount}</span>
            <span className="emp-leave-stat-lbl">Rejected Requests</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="emp-leave-tabs">
        <button
          className={`emp-leave-tab ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          My Leave Requests ({leaves.length})
        </button>
        <button
          className={`emp-leave-tab ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          My Attendance History ({attendance.length})
        </button>
      </div>

      {/* Leave Requests Table */}
      {activeTab === 'leaves' && (
        <div className="emp-leave-card">
          <div className="emp-leave-table-wrap">
            <table className="emp-leave-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Supporting Proof</th>
                  <th>Status</th>
                  <th>Submitted On</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length > 0 ? (
                  leaves.map((item) => {
                    const proof = item.proofDocument || '';
                    const isImg = proof.startsWith('data:image');
                    const isUrl = !isImg && (proof.startsWith('http://') || proof.startsWith('https://'));
                    return (
                      <tr key={item._id}>
                        <td style={{ fontWeight: 700, color: '#0F172A' }}>{item.leaveType}</td>
                        <td>
                          {new Date(item.startDate).toLocaleDateString()} — {new Date(item.endDate).toLocaleDateString()}
                        </td>
                        <td style={{ color: '#475569', maxWidth: '220px' }}>{item.reason}</td>
                        <td>
                          {isImg ? (
                            <img
                              src={proof}
                              alt="Proof preview"
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                              onClick={() => {
                                const w = window.open();
                                if (w) { w.document.write(`<img src="${proof}" style="max-width:100%" />`); }
                              }}
                              title="Click to expand image"
                            />
                          ) : isUrl ? (
                            <a href={proof} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', fontSize: '0.8rem', fontWeight: 600 }}>
                              View Attachment
                            </a>
                          ) : proof ? (
                            <span className="emp-proof-badge">
                              <FileText size={13} /> Attached
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>None</span>
                          )}
                        </td>
                        <td>
                          <span className={`emp-status-badge ${item.status ? item.status.toLowerCase() : 'pending'}`}>
                            {item.status}
                          </span>
                        </td>
                      <td style={{ color: '#64748B', fontSize: '0.8rem' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                      No leave requests submitted yet. Click "Request Leave" to apply.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance History Table */}
      {activeTab === 'attendance' && (
        <div className="emp-leave-card">
          <div className="emp-leave-table-wrap">
            <table className="emp-leave-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hours</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length > 0 ? (
                  attendance.map((rec) => (
                    <tr key={rec._id}>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>
                        {new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td>{rec.checkIn || '—'}</td>
                      <td>{rec.checkOut || '—'}</td>
                      <td>{rec.workHours ? `${rec.workHours} hrs` : '—'}</td>
                      <td>
                        <span className={`emp-status-badge ${rec.status ? rec.status.toLowerCase().replace(' ', '-') : 'present'}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748B', fontSize: '0.82rem' }}>{rec.notes || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                      No attendance records found. HR updates your attendance logs daily.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="emp-leave-modal-overlay">
          <div className="emp-leave-modal">
            <div className="emp-leave-modal-header">
              <h3>Submit Leave Request</h3>
              <button className="emp-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSubmitLeave}>
              <div className="emp-leave-modal-body">
                {formError && <div className="emp-leave-alert error">{formError}</div>}
                {formSuccess && <div className="emp-leave-alert success">{formSuccess}</div>}

                <div className="emp-form-group">
                  <label>Leave Type *</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="emp-form-input"
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                    <option value="Unpaid Leave">Unpaid Leave</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="emp-form-group">
                    <label>From Date *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="emp-form-input"
                    />
                  </div>

                  <div className="emp-form-group">
                    <label>To Date *</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="emp-form-input"
                    />
                  </div>
                </div>

                <div className="emp-form-group">
                  <label>Reason *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide a reason for your leave request..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="emp-form-input"
                  />
                </div>

                <div className="emp-form-group">
                  <label>Supporting Proof / Attachment (Optional Image)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProofDocument(reader.result || file.name);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="emp-form-input"
                  />
                  {proofDocument && (
                    <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✓ File selected!
                      {proofDocument.startsWith('data:image') && (
                        <img src={proofDocument} alt="Proof preview" style={{ maxHeight: '40px', borderRadius: '4px', border: '1px solid #E2E8F0' }} />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="emp-leave-modal-footer">
                <button
                  type="button"
                  className="emp-leave-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="emp-leave-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
