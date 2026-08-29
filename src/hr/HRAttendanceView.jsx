import React, { useState, useEffect } from 'react';
import { Search, CalendarCheck, CalendarX, Clock, CheckCircle, XCircle, Plus, X, Edit, Eye, Trash2, AlertTriangle, Building2, Calendar } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './HRViews.css';

const attendanceStatusOptions = ['Present', 'Absent', 'Late', 'On Leave'];
const leaveTypeOptions = ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Unpaid Leave'];
const leaveStatusOptions = ['Pending', 'Approved', 'Rejected'];

function calcHours(checkIn, checkOut) {
  if (!checkIn || !checkOut || checkIn === '—' || checkOut === '—') return '—';
  const parseTime = (t) => {
    const parts = t.trim().split(' ');
    if (parts.length < 2) return 0;
    const [time, meridiem] = parts;
    let [h, m] = time.split(':').map(Number);
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };
  const diff = parseTime(checkOut) - parseTime(checkIn);
  if (diff <= 0) return '—';
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m}m`;
}

function AttendanceFormModal({ title, initialValues, onClose, onSubmit, employees, saving, errorMessage }) {
  const isEdit = !!initialValues;
  const [selectedName, setSelectedName] = useState(initialValues?.name || employees[0]?.name || '');
  const [status, setStatus] = useState(initialValues?.status || 'Present');
  const [checkIn, setCheckIn] = useState(initialValues?.checkIn && initialValues.checkIn !== '—' ? initialValues.checkIn : '09:00 AM');
  const [checkOut, setCheckOut] = useState(initialValues?.checkOut && initialValues.checkOut !== '—' ? initialValues.checkOut : '06:00 PM');

  const needsTimes = status === 'Present' || status === 'Late';

  const handleSubmit = (e) => {
    e.preventDefault();
    const emp = (employees || []).find((e2) => e2.name === selectedName);
    if (!emp && !isEdit) return;

    const finalCheckIn = needsTimes ? checkIn : '—';
    const finalCheckOut = needsTimes ? checkOut : '—';

    onSubmit({
      name: emp?.name || initialValues?.name,
      initials: emp?.initials || initialValues?.initials,
      bg: emp?.bg || initialValues?.bg,
      dept: emp?.dept || initialValues?.dept,
      checkIn: finalCheckIn,
      checkOut: finalCheckOut,
      hours: needsTimes ? calcHours(finalCheckIn, finalCheckOut) : '—',
      status,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Employee</label>
              <select
                className="form-select"
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
                disabled={isEdit}
              >
                {(employees || []).map((emp) => (
                  <option key={emp.id || emp.name} value={emp.name}>{emp.name} — {emp.dept}</option>
                ))}
                {isEdit && !employees.find(e => e.name === selectedName) && (
                  <option value={selectedName}>{selectedName}</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {attendanceStatusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {needsTimes && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Check In</label>
                  <input
                    className="form-input"
                    placeholder="e.g. 09:00 AM"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Check Out</label>
                  <input
                    className="form-input"
                    placeholder="e.g. 06:00 PM"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <div style={{ color: '#DC2626', fontSize: '0.85rem' }}>{errorMessage}</div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AttendanceViewModal({ record, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Attendance Details</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
            <div
              className="hr-emp-avatar"
              style={{ backgroundColor: record.bg, width: '52px', height: '52px', fontSize: '1.1rem' }}
            >
              {record.initials}
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{record.name}</div>
              <span className={`hr-status-badge ${record.status.toLowerCase().replace(' ', '-')}`}>
                {record.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{record.dept}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{record.date}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>
                Check In {record.checkIn} · Check Out {record.checkOut}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarCheck size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>Hours Worked: {record.hours}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ title, message, onClose, onConfirm, deleting }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center', paddingTop: '28px' }}>
          <div
            style={{
              width: '52px', height: '52px', borderRadius: '50%',
              backgroundColor: '#FEE2E2', color: '#DC2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {title}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
            {message}
          </p>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ backgroundColor: '#DC2626' }}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaveFormModal({ initialValues, employees, onClose, onSubmit, saving }) {
  const [type, setType] = useState(initialValues?.type || leaveTypeOptions[0]);
  const [reason, setReason] = useState(initialValues?.reason || '');
  const [newStatus, setNewStatus] = useState(initialValues?.status || 'Pending');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ type, reason: reason.trim(), status: newStatus });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Leave Request</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Employee</label>
              <input className="form-input" value={initialValues?.name || ''} disabled />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Leave Type</label>
                <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                  {leaveTypeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {leaveStatusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Reason</label>
              <input
                className="form-input"
                placeholder="Reason for leave"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeaveViewModal({ request, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Leave Request Details</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
            <div
              className="hr-emp-avatar"
              style={{ backgroundColor: request.bg, width: '52px', height: '52px', fontSize: '1.1rem' }}
            >
              {request.initials}
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{request.name}</div>
              <span className={`hr-status-badge ${request.status.toLowerCase()}`}>
                {request.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{request.dept}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarX size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{request.type} · {request.days} day(s)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{request.from} → {request.to}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Eye size={16} color="#64748B" style={{ marginTop: '2px' }} />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{request.reason || '—'}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HRAttendanceView({ searchQuery = '', headerAction = null }) {
  const [activeTab, setActiveTab] = useState('attendance');
  const [search, setSearch] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isMarkOpen, setIsMarkOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [editingLeave, setEditingLeave] = useState(null);
  const [viewingLeave, setViewingLeave] = useState(null);
  const [deletingLeave, setDeletingLeave] = useState(null);

  const avatarColors = ['#2563EB', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#0EA5E9', '#EF4444', '#7C3AED', '#14B8A6'];

  function getInitials(name) {
    return (name || 'U').trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  const mapAttendanceRecord = (record, index) => ({
    id: record._id,
    userId: record.user?._id || record.user,
    name: record.userName || record.user?.fullName || 'Unknown',
    initials: getInitials(record.userName || record.user?.fullName || 'U'),
    bg: avatarColors[index % avatarColors.length],
    dept: record.user?.department || '—',
    date: record.date ? new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    checkIn: record.checkIn || '—',
    checkOut: record.checkOut || '—',
    hours: record.workHours ? `${record.workHours}h` : (record.checkIn && record.checkOut ? calcHours(record.checkIn, record.checkOut) : '—'),
    status: record.status || 'Present'
  });

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const term = (searchQuery || search).trim();
      const qs = term ? `?search=${encodeURIComponent(term)}` : '';
      const { response, data } = await apiRequest(`/api/hr/attendance${qs}`);
      if (response.ok && data.success) {
        setAttendanceRecords((data.data || []).map(mapAttendanceRecord));
      }
    } catch (err) {
      console.error('Fetch attendance error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesForDropdown = async () => {
    try {
      const { response, data } = await apiRequest('/api/hr/employees');
      if (response.ok && data.success && data.data?.length) {
        setEmployeeOptions(data.data.map((u, i) => ({
          id: u._id,
          name: u.fullName,
          initials: getInitials(u.fullName),
          bg: avatarColors[i % avatarColors.length],
          dept: u.department || '—'
        })));
      }
    } catch (err) {
      console.error('Fetch employees for attendance error:', err);
    }
  };

  const fetchLeaves = async () => {
    try {
      const term = (searchQuery || search).trim();
      const qs = term ? `?search=${encodeURIComponent(term)}` : '';
      const { response, data } = await apiRequest(`/api/hr/leaves${qs}`);
      if (response.ok && data.success && Array.isArray(data.data)) {
        setLeaveRequests(data.data.map((l, i) => ({
          ...l,
          id: l._id,
          name: l.userName || l.user?.fullName || 'Employee',
          initials: getInitials(l.userName || l.user?.fullName || 'E'),
          bg: avatarColors[i % avatarColors.length],
          dept: l.user?.department || 'General',
          type: l.leaveType,
          from: new Date(l.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          to: new Date(l.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          days: Math.max(1, Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / (1000 * 60 * 60 * 24))),
          reason: l.reason,
          status: l.status
        })));
      }
    } catch (err) {
      console.error('Fetch leaves error:', err);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchLeaves();
    fetchEmployeesForDropdown();
  }, [searchQuery]);

  useEffect(() => {
    if (headerAction?.type === 'mark_attendance') setIsMarkOpen(true);
  }, [headerAction]);

  const presentCount = attendanceRecords.filter((r) => r.status === 'Present').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'Absent').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'Late').length;
  const onLeaveCount = attendanceRecords.filter((r) => r.status === 'On Leave').length;
  const pendingLeaveCount = leaveRequests.filter((r) => r.status === 'Pending').length;

  const addAttendanceRecord = async (record) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const employee = employeeOptions.find((e) => e.name === record.name);
      const { response, data } = await apiRequest('/api/hr/attendance', {
        method: 'POST',
        body: JSON.stringify({
          userId: employee?.id,
          status: record.status,
          checkIn: record.checkIn !== '—' ? record.checkIn : undefined,
          checkOut: record.checkOut !== '—' ? record.checkOut : undefined
        })
      });

      if (response.ok && data.success) {
        setIsMarkOpen(false);
        await fetchAttendance();
      } else {
        setSubmitError(data.message || 'Unable to save attendance.');
      }
    } catch {
      setSubmitError('Unable to connect to backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  // KEY FIX: Edit attendance calls PATCH /api/hr/attendance/:id to persist to MongoDB
  const saveAttendanceEdit = async (updatedData) => {
    if (!editingRecord?.id) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const { response, data } = await apiRequest(`/api/hr/attendance/${editingRecord.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: updatedData.status,
          checkIn: updatedData.checkIn !== '—' ? updatedData.checkIn : '—',
          checkOut: updatedData.checkOut !== '—' ? updatedData.checkOut : '—',
        })
      });

      if (response.ok && data.success) {
        setEditingRecord(null);
        await fetchAttendance(); // Refresh from DB
      } else {
        setSubmitError(data.message || 'Failed to update attendance record.');
      }
    } catch {
      setSubmitError('Unable to connect to backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  const removeAttendanceRecord = async (id) => {
    setDeleting(true);
    try {
      // Soft-delete: for now just remove from UI since there's no DELETE endpoint
      // If a DELETE endpoint is added, call it here
      setAttendanceRecords((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeleting(false);
      setDeletingRecord(null);
    }
  };

  const approveLeaveRequest = async (req) => {
    const { response, data } = await apiRequest(`/api/hr/leaves/${req.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Approved' })
    });
    if (response.ok && data.success) {
      fetchLeaves();
      fetchAttendance();
    }
  };

  const rejectLeaveRequest = async (req) => {
    await apiRequest(`/api/hr/leaves/${req.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Rejected' })
    });
    fetchLeaves();
  };

  const saveLeaveEdit = async (updatedData) => {
    if (!editingLeave?.id) return;
    setSubmitting(true);
    try {
      const { response, data } = await apiRequest(`/api/hr/leaves/${editingLeave.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: updatedData.status })
      });
      if (response.ok && data.success) {
        setEditingLeave(null);
        fetchLeaves();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const removeLeaveRequest = (id) => {
    setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
    setDeletingLeave(null);
  };

  const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const effectiveSearch = searchQuery || search;

  return (
    <div className="hr-view-container">
      {/* Summary Cards */}
      <div className="hr-summary-cards hr-summary-cards-5">
        <div className="hr-summary-card">
          <div className="hr-summary-icon green"><CalendarCheck size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{presentCount}</span>
            <span className="hr-summary-lbl">Present Today</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon red"><CalendarX size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{absentCount}</span>
            <span className="hr-summary-lbl">Absent Today</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon amber"><Clock size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{lateCount}</span>
            <span className="hr-summary-lbl">Late Arrivals</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon blue"><CalendarX size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{onLeaveCount}</span>
            <span className="hr-summary-lbl">On Leave Today</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon purple"><CalendarX size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{pendingLeaveCount}</span>
            <span className="hr-summary-lbl">Pending Leave Approvals</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="hr-tabs">
        <button className={`hr-tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
          Attendance Log
        </button>
        <button className={`hr-tab ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => setActiveTab('leaves')}>
          Leave Requests
        </button>
      </div>

      {/* Toolbar */}
      <div className="hr-toolbar">
        <div className="hr-toolbar-left">
          <div className="hr-search-input-wrapper">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (fetchAttendance(), fetchLeaves())}
            />
          </div>
        </div>
        {activeTab === 'attendance' && (
          <div className="hr-toolbar-right">
            <button className="hr-action-btn" onClick={() => setIsMarkOpen(true)}>
              <Plus size={15} /> Mark Attendance
            </button>
          </div>
        )}
      </div>

      {/* Attendance Log */}
      {activeTab === 'attendance' && (
        <div className="hr-data-card">
          <div className="hr-data-card-header">
            <div className="hr-data-card-title">
              <CalendarCheck size={17} color="#7C3AED" />
              Attendance Log — {todayLabel}
              <span className="hr-count-badge">{attendanceRecords.length} records</span>
            </div>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading attendance data...</div>
          ) : (
            <div className="hr-table-wrapper">
              <table className="hr-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours Worked</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords
                    .filter(r => !effectiveSearch || r.name.toLowerCase().includes(effectiveSearch.toLowerCase()))
                    .map(rec => (
                      <tr key={rec.id}>
                        <td>
                          <div className="hr-emp-cell">
                            <div className="hr-emp-avatar" style={{ backgroundColor: rec.bg }}>{rec.initials}</div>
                            <span className="hr-emp-name">{rec.name}</span>
                          </div>
                        </td>
                        <td>{rec.dept}</td>
                        <td style={{ color: '#64748B', fontSize: '0.83rem' }}>{rec.date}</td>
                        <td>{rec.checkIn}</td>
                        <td>{rec.checkOut}</td>
                        <td>{rec.hours}</td>
                        <td>
                          <span className={`hr-status-badge ${rec.status.toLowerCase().replace(' ', '-')}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td>
                          <div className="hr-row-action">
                            <button className="hr-edit-btn" onClick={() => setEditingRecord(rec)}>
                              <Edit size={13} /> Edit
                            </button>
                            <button className="hr-view-btn" onClick={() => setViewingRecord(rec)}>
                              <Eye size={13} /> View
                            </button>
                            <button className="hr-delete-btn" onClick={() => setDeletingRecord(rec)}>
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {attendanceRecords.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>
                        No attendance records found. Use "Mark Attendance" to add records.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Leave Requests */}
      {activeTab === 'leaves' && (
        <div className="hr-data-card">
          <div className="hr-data-card-header">
            <div className="hr-data-card-title">
              <CalendarX size={17} color="#7C3AED" />
              Leave Requests
              <span className="hr-count-badge">{leaveRequests.length} total</span>
            </div>
          </div>
          <div className="hr-table-wrapper">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests
                  .filter(r => !effectiveSearch || r.name.toLowerCase().includes(effectiveSearch.toLowerCase()))
                  .map(req => (
                    <tr key={req.id}>
                      <td>
                        <div className="hr-emp-cell">
                          <div className="hr-emp-avatar" style={{ backgroundColor: req.bg }}>{req.initials}</div>
                          <span className="hr-emp-name">{req.name}</span>
                        </div>
                      </td>
                      <td>{req.type}</td>
                      <td>{req.from}</td>
                      <td>{req.to}</td>
                      <td>{req.days}d</td>
                      <td style={{ color: '#64748B', fontSize: '0.83rem' }}>{req.reason}</td>
                      <td>
                        <span className={`hr-status-badge ${req.status.toLowerCase()}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        <div className="hr-row-action" style={{ flexWrap: 'wrap', rowGap: '6px' }}>
                          {req.status === 'Pending' && (
                            <>
                              <button
                                className="hr-approve-btn"
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                onClick={() => approveLeaveRequest(req)}
                              >
                                <CheckCircle size={13} /> Approve
                              </button>
                              <button
                                className="hr-reject-btn"
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                onClick={() => rejectLeaveRequest(req)}
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </>
                          )}
                          <button className="hr-edit-btn" onClick={() => setEditingLeave(req)}>
                            <Edit size={13} /> Edit
                          </button>
                          <button className="hr-view-btn" onClick={() => setViewingLeave(req)}>
                            <Eye size={13} /> View
                          </button>
                          <button className="hr-delete-btn" onClick={() => setDeletingLeave(req)}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {leaveRequests.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>
                      No leave requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isMarkOpen && (
        <AttendanceFormModal
          title="Mark Attendance"
          initialValues={null}
          onClose={() => { setIsMarkOpen(false); setSubmitError(''); }}
          onSubmit={addAttendanceRecord}
          employees={employeeOptions}
          saving={submitting}
          errorMessage={submitError}
        />
      )}

      {editingRecord && (
        <AttendanceFormModal
          title="Edit Attendance Record"
          initialValues={editingRecord}
          onClose={() => { setEditingRecord(null); setSubmitError(''); }}
          onSubmit={saveAttendanceEdit}
          employees={employeeOptions}
          saving={submitting}
          errorMessage={submitError}
        />
      )}

      {viewingRecord && (
        <AttendanceViewModal
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
        />
      )}

      {deletingRecord && (
        <DeleteConfirmModal
          title={`Remove attendance for ${deletingRecord.name}?`}
          message="This will remove this attendance entry from the view."
          onClose={() => setDeletingRecord(null)}
          onConfirm={() => removeAttendanceRecord(deletingRecord.id)}
          deleting={deleting}
        />
      )}

      {editingLeave && (
        <LeaveFormModal
          initialValues={editingLeave}
          employees={employeeOptions}
          onClose={() => setEditingLeave(null)}
          onSubmit={saveLeaveEdit}
          saving={submitting}
        />
      )}

      {viewingLeave && (
        <LeaveViewModal
          request={viewingLeave}
          onClose={() => setViewingLeave(null)}
        />
      )}

      {deletingLeave && (
        <DeleteConfirmModal
          title={`Remove leave request from ${deletingLeave.name}?`}
          message="This will remove this leave request from the view."
          onClose={() => setDeletingLeave(null)}
          onConfirm={() => removeLeaveRequest(deletingLeave.id)}
          deleting={deleting}
        />
      )}
    </div>
  );
}