import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, XCircle, Clock, Users, RefreshCw, Check, X } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './AdministrationAttendanceLeaveView.css';

export default function AdministrationAttendanceLeaveView() {
  const [stats, setStats] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [workUpdates, setWorkUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'leaves' | 'work_updates'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, attRes, leaveRes, workRes] = await Promise.all([
        apiRequest('/api/hr/stats'),
        apiRequest('/api/hr/attendance'),
        apiRequest('/api/hr/leaves'),
        apiRequest('/api/work-updates')
      ]);

      if (statsRes.response.ok && statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (attRes.response.ok && attRes.data.success && Array.isArray(attRes.data.data)) {
        setAttendanceLogs(attRes.data.data);
      }

      if (leaveRes.response.ok && leaveRes.data.success && Array.isArray(leaveRes.data.data)) {
        setLeaveRequests(leaveRes.data.data);
      }

      if (workRes.response.ok && workRes.data.success && Array.isArray(workRes.data.data)) {
        setWorkUpdates(workRes.data.data);
      }
    } catch (err) {
      console.error('Fetch administration attendance, leave & work updates error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateLeaveStatus = async (leaveId, newStatus) => {
    setUpdatingId(leaveId);
    try {
      const { response, data } = await apiRequest(`/api/hr/leaves/${leaveId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok && data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Update leave status error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-emp-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 4 Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Present Today</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{stats?.presentToday ?? 0}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Absent Today</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{stats?.absentToday ?? 0}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Employees On Leave</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{stats?.onLeaveToday ?? 0}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Pending Leaves</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{stats?.pendingLeavesCount ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="ceo-card-panel">
        <div className="ceo-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setActiveTab('attendance')}
              style={{
                background: activeTab === 'attendance' ? '#2563EB' : '#F1F5F9',
                color: activeTab === 'attendance' ? '#FFFFFF' : '#475569',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Attendance Records ({attendanceLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              style={{
                background: activeTab === 'leaves' ? '#2563EB' : '#F1F5F9',
                color: activeTab === 'leaves' ? '#FFFFFF' : '#475569',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Leave Requests ({leaveRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('work_updates')}
              style={{
                background: activeTab === 'work_updates' ? '#2563EB' : '#F1F5F9',
                color: activeTab === 'work_updates' ? '#FFFFFF' : '#475569',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Employee Work Updates ({workUpdates.length})
            </button>
          </div>

          <button
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#475569' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading records from database...</div>
        ) : activeTab === 'attendance' ? (
          <div className="ceo-table-wrapper" style={{ marginTop: '16px' }}>
            <table className="ceo-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Date</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="ceo-table-name">{log.userName || log.user?.fullName || 'Employee'}</td>
                    <td>{new Date(log.date).toLocaleDateString()}</td>
                    <td><code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>{log.checkIn || '—'}</code></td>
                    <td><code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>{log.checkOut || '—'}</code></td>
                    <td><strong>{log.workHours ?? 8} hrs</strong></td>
                    <td>
                      <span className={`ceo-status-tag ${log.status === 'Present' ? 'active' : log.status === 'Late' ? 'warning' : log.status === 'Absent' ? 'danger' : 'neutral'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {attendanceLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: '24px' }}>No attendance records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'leaves' ? (
          <div className="ceo-table-wrapper" style={{ marginTop: '16px' }}>
            <table className="ceo-table admin-leave-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Leave Category</th>
                  <th>Dates / Duration</th>
                  <th>Reason</th>
                  <th>Status / Action</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((req) => (
                  <tr key={req._id}>
                    <td className="ceo-table-name">{req.userName || req.user?.fullName || 'Employee'}</td>
                    <td>{req.leaveType}</td>
                    <td>
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td>{req.reason}</td>
                    <td>
                      <div className="admin-leave-status-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`ceo-status-tag ${req.status === 'Approved' ? 'active' : req.status === 'Rejected' ? 'danger' : 'warning'}`}>
                          {req.status}
                        </span>
                        {req.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className="admin-approve-btn"
                              disabled={updatingId === req._id}
                              onClick={() => handleUpdateLeaveStatus(req._id, 'Approved')}
                              style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Approve
                            </button>
                            <button
                              disabled={updatingId === req._id}
                              onClick={() => handleUpdateLeaveStatus(req._id, 'Rejected')}
                              style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {leaveRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: '24px' }}>No leave requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ceo-table-wrapper" style={{ marginTop: '16px' }}>
            <table className="ceo-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Hours Logged</th>
                  <th>Accomplished Summary</th>
                  <th>Planned Next</th>
                  <th>Blockers</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {workUpdates.map((update) => (
                  <tr key={update._id}>
                    <td className="ceo-table-name">{update.userName || update.user?.fullName || 'Employee'}</td>
                    <td>{new Date(update.date || update.createdAt).toLocaleDateString()}</td>
                    <td><strong>{update.hoursSpent || 0} hrs</strong></td>
                    <td style={{ maxWidth: '240px', fontSize: '0.85rem' }}>{update.summary || '—'}</td>
                    <td style={{ maxWidth: '200px', fontSize: '0.85rem', color: '#2563EB' }}>{update.planned || '—'}</td>
                    <td style={{ maxWidth: '180px', fontSize: '0.85rem', color: update.blockers ? '#DC2626' : '#64748B' }}>{update.blockers || 'None'}</td>
                    <td>
                      <span className="ceo-status-tag active">{update.status || 'Submitted'}</span>
                    </td>
                  </tr>
                ))}
                {workUpdates.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8', padding: '24px' }}>No work updates submitted yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}