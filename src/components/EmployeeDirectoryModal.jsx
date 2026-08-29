import React, { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, Shield, Calendar, CheckSquare, Clock, User, Briefcase, FileText } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './EmployeeDirectoryModal.css';

export default function EmployeeDirectoryModal({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!userId) return;
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const { response, data } = await apiRequest(`/api/admin/directory/${userId}`);
        if (response.ok && data.success) {
          setData(data.data);
        }
      } catch (err) {
        console.error('Fetch user details error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  if (!userId) return null;

  const user = data?.user;
  const tasks = data?.tasks || [];
  const attendance = data?.attendance || [];
  const leaves = data?.leaves || [];
  const projects = data?.projects || [];

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="dir-modal-overlay">
      <div className="dir-modal-content">
        <div className="dir-modal-header">
          <h3>Employee Profile & Directory Record</h3>
          <button className="dir-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {loading ? (
          <div className="dir-modal-loading">Loading employee profile details...</div>
        ) : user ? (
          <div className="dir-modal-body">
            {/* Header Profile Info */}
            <div className="dir-profile-banner">
              <div className="dir-profile-avatar">{initials}</div>
              <div className="dir-profile-info">
                <h2>{user.fullName}</h2>
                <div className="dir-profile-meta">
                  <span className="dir-role-badge">{user.role ? user.role.replace('_', ' ').toUpperCase() : 'EMPLOYEE'}</span>
                  <span className="dir-meta-item"><Building2 size={14} /> {user.department || 'General'}</span>
                  <span className="dir-meta-item"><Mail size={14} /> {user.email}</span>
                  {user.employeeId && <span className="dir-meta-item">ID: {user.employeeId}</span>}
                </div>
              </div>
            </div>

            {/* Navigation Tabs inside modal */}
            <div className="dir-modal-tabs">
              <button className={`dir-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                Overview & Contact
              </button>
              <button className={`dir-tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
                Tasks & Projects ({tasks.length})
              </button>
              <button className={`dir-tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
                Attendance Log ({attendance.length})
              </button>
              <button className={`dir-tab ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => setActiveTab('leaves')}>
                Leave Requests ({leaves.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="dir-tab-content">
              {activeTab === 'overview' && (
                <div className="dir-overview-grid">
                  <div className="dir-info-card">
                    <h4>Account Details</h4>
                    <div className="dir-info-row"><strong>Full Name:</strong> {user.fullName}</div>
                    <div className="dir-info-row"><strong>Email:</strong> {user.email}</div>
                    <div className="dir-info-row"><strong>Phone:</strong> {user.phone || 'Not specified'}</div>
                    <div className="dir-info-row"><strong>Role:</strong> {user.role}</div>
                    <div className="dir-info-row"><strong>Department:</strong> {user.department || 'General'}</div>
                    <div className="dir-info-row"><strong>Account Status:</strong> <span className={`dir-status-pill ${user.status}`}>{user.status}</span></div>
                    <div className="dir-info-row"><strong>Approved:</strong> {user.isApproved ? 'Yes' : 'No'}</div>
                    <div className="dir-info-row"><strong>Joined Date:</strong> {new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>

                  <div className="dir-info-card">
                    <h4>Performance Summary</h4>
                    <div className="dir-info-row"><strong>Total Tasks Assigned:</strong> {tasks.length}</div>
                    <div className="dir-info-row"><strong>Completed Tasks:</strong> {tasks.filter(t => t.status === 'Completed').length}</div>
                    <div className="dir-info-row"><strong>Active Projects:</strong> {projects.length}</div>
                    <div className="dir-info-row"><strong>Recent Attendance:</strong> {attendance.length ? `${attendance[0].status} on ${new Date(attendance[0].date).toLocaleDateString()}` : 'No recent log'}</div>
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="dir-list-wrap">
                  {tasks.length > 0 ? (
                    tasks.map(t => (
                      <div key={t._id} className="dir-list-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckSquare size={16} color="#6366F1" />
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>{t.title}</span>
                        </div>
                        <span className={`dir-status-pill ${t.status ? t.status.toLowerCase().replace(' ', '-') : 'pending'}`}>
                          {t.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="dir-empty">No tasks assigned to this employee yet.</div>
                  )}
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="dir-list-wrap">
                  {attendance.length > 0 ? (
                    attendance.map(a => (
                      <div key={a._id} className="dir-list-item">
                        <div>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>{new Date(a.date).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Check In: {a.checkIn} | Check Out: {a.checkOut}</div>
                        </div>
                        <span className={`dir-status-pill ${a.status.toLowerCase().replace(' ', '-')}`}>{a.status}</span>
                      </div>
                    ))
                  ) : (
                    <div className="dir-empty">No attendance records found.</div>
                  )}
                </div>
              )}

              {activeTab === 'leaves' && (
                <div className="dir-list-wrap">
                  {leaves.length > 0 ? (
                    leaves.map(l => (
                      <div key={l._id} className="dir-list-item">
                        <div>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>{l.leaveType} ({new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()})</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Reason: {l.reason}</div>
                        </div>
                        <span className={`dir-status-pill ${l.status.toLowerCase()}`}>{l.status}</span>
                      </div>
                    ))
                  ) : (
                    <div className="dir-empty">No leave requests recorded.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="dir-modal-loading">User profile not found.</div>
        )}

        <div className="dir-modal-footer">
          <button className="dir-btn-close" onClick={onClose}>Close Profile</button>
        </div>
      </div>
    </div>
  );
}
