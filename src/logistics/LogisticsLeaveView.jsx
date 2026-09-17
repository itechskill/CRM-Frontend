import React, { useState, useEffect } from 'react';
import {
  CalendarX,
  CalendarCheck,
  Clock,
  Plus,
  CheckCircle,
  AlertCircle,
  FileText,
  RefreshCw,
  X,
  UserCheck,
  Calendar
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import './LogisticsPortal.css';

export default function LogisticsLeaveView() {
  const [activeTab, setActiveTab] = useState('attendance');
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
      console.error('Fetch logistics leave/attendance error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!startDate || !endDate || !reason.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const { response, data } = await apiRequest('/api/hr/leaves', {
        method: 'POST',
        body: JSON.stringify({
          type: leaveType,
          startDate,
          endDate,
          reason,
          proofDocument
        })
      });

      if (response.ok && data.success) {
        setFormSuccess('Leave request submitted successfully for approval.');
        setIsModalOpen(false);
        setReason('');
        setStartDate('');
        setEndDate('');
        setProofDocument('');
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

  const pendingLeavesCount = leaves.filter(l => (l.status || '').toLowerCase() === 'pending').length;
  const approvedLeavesCount = leaves.filter(l => (l.status || '').toLowerCase() === 'approved').length;
  const presentDaysCount = attendance.filter(a => (a.status || '').toLowerCase() === 'present').length;

  return (
    <div className="logistics-leave-container">
      {/* Welcome Banner */}
      <div className="logistics-welcome-banner">
        <div>
          <h2 className="logistics-welcome-title">Attendance &amp; Leave Portal</h2>
          <p className="logistics-welcome-sub">
            Monitor your daily office check-ins, working hours, and manage leave applications with HR approval.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchEmployeeData}
            className="logistics-btn-secondary"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#FFF' }}
          >
            <RefreshCw size={14} className={loading ? 'logistics-spin' : ''} /> Refresh
          </button>
          <button
            className="logistics-btn-primary"
            onClick={() => {
              setFormError('');
              setFormSuccess('');
              setIsModalOpen(true);
            }}
            style={{ background: '#2563EB', color: '#FFFFFF' }}
          >
            <Plus size={16} /> Apply for Leave
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="logistics-leave-stats-row">
        <div className="logistics-leave-stat-card">
          <div className="logistics-leave-stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <CalendarCheck size={22} />
          </div>
          <div>
            <div className="logistics-leave-stat-val">{attendance.length}</div>
            <div className="logistics-leave-stat-lbl">Attendance Logs</div>
          </div>
        </div>

        <div className="logistics-leave-stat-card">
          <div className="logistics-leave-stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div className="logistics-leave-stat-val">{presentDaysCount}</div>
            <div className="logistics-leave-stat-lbl">Days Present</div>
          </div>
        </div>

        <div className="logistics-leave-stat-card">
          <div className="logistics-leave-stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="logistics-leave-stat-val">{pendingLeavesCount}</div>
            <div className="logistics-leave-stat-lbl">Pending Leaves</div>
          </div>
        </div>

        <div className="logistics-leave-stat-card">
          <div className="logistics-leave-stat-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
            <CalendarX size={22} />
          </div>
          <div>
            <div className="logistics-leave-stat-val">{approvedLeavesCount}</div>
            <div className="logistics-leave-stat-lbl">Approved Leaves</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="logistics-leave-tabs-bar">
        <button
          className={`logistics-leave-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <CalendarCheck size={16} /> Attendance Log ({attendance.length})
        </button>
        <button
          className={`logistics-leave-tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          <CalendarX size={16} /> Leave Applications ({leaves.length})
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748B', background: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <RefreshCw size={24} className="logistics-spin" />
          <p style={{ marginTop: '8px', fontSize: '0.86rem' }}>Loading records...</p>
        </div>
      ) : activeTab === 'attendance' ? (
        <div className="logistics-leave-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
              My Attendance History
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="logistics-leave-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Work Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length > 0 ? (
                  attendance.map((rec) => {
                    const st = (rec.status || 'Present').toLowerCase();
                    return (
                      <tr key={rec._id}>
                        <td style={{ fontWeight: 600 }}>{new Date(rec.date).toLocaleDateString()}</td>
                        <td>
                          {rec.checkIn ? (
                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>
                              {new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {rec.checkOut ? (
                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>
                              {new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          <span className={`logistics-status-tag ${st}`}>
                            {rec.status || 'Present'}
                          </span>
                        </td>
                        <td>
                          {rec.workingHours ? (
                            <span style={{ fontWeight: 700, color: '#2563EB' }}>
                              {rec.workingHours} hrs
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                      <Clock size={36} color="#CBD5E1" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: 0, fontSize: '0.88rem' }}>No attendance records found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="logistics-leave-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
              My Leave Requests
            </h3>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                color: '#2563EB',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={14} /> New Request
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="logistics-leave-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length > 0 ? (
                  leaves.map((lv) => {
                    const st = (lv.status || 'Pending').toLowerCase();
                    const sDate = new Date(lv.startDate);
                    const eDate = new Date(lv.endDate);
                    const days = Math.max(1, Math.round((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1);
                    return (
                      <tr key={lv._id}>
                        <td>
                          <span style={{ fontWeight: 700, color: '#0F172A' }}>
                            {lv.type || lv.leaveType}
                          </span>
                        </td>
                        <td>{sDate.toLocaleDateString()}</td>
                        <td>{eDate.toLocaleDateString()}</td>
                        <td>
                          <span style={{
                            background: '#F1F5F9',
                            color: '#475569',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}>
                            {isNaN(days) ? '1 day' : `${days} days`}
                          </span>
                        </td>
                        <td style={{ maxWidth: '280px', color: '#475569', fontSize: '0.84rem' }}>
                          {lv.reason}
                        </td>
                        <td>
                          <span className={`logistics-status-tag ${st}`}>
                            {lv.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                      <CalendarX size={36} color="#CBD5E1" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: 0, fontSize: '0.88rem' }}>No leave applications submitted yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div className="logistics-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="logistics-modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="logistics-modal-header">
              <div>
                <h3 className="logistics-modal-title">Apply for Leave</h3>
                <p className="logistics-modal-sub">Submit your leave request for departmental approval.</p>
              </div>
              <button className="logistics-modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{
                background: '#FEE2E2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                marginBottom: '16px'
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitLeave}>
              <div className="logistics-form-group">
                <label className="logistics-label">Leave Type</label>
                <select
                  className="logistics-select"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>

              <div className="logistics-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '12px' }}>
                <div className="logistics-form-group">
                  <label className="logistics-label">Start Date *</label>
                  <input
                    type="date"
                    required
                    className="logistics-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="logistics-form-group">
                  <label className="logistics-label">End Date *</label>
                  <input
                    type="date"
                    required
                    className="logistics-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="logistics-form-group" style={{ marginTop: '12px' }}>
                <label className="logistics-label">Reason for Leave *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Provide details about your leave application..."
                  className="logistics-textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="logistics-modal-footer">
                <button
                  type="button"
                  className="logistics-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="logistics-btn-primary"
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

