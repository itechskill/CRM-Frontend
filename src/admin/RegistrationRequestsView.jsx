import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  X, 
  Mail, 
  Building, 
  Briefcase, 
  Calendar, 
  Phone, 
  BadgeCheck,
  Key,
  Lock,
  EyeOff
} from 'lucide-react';
import './RegistrationRequestsView.css';

import { apiRequest } from '../utils/api';

export default function RegistrationRequestsView({ searchQuery: externalSearch = '' }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [localSearch, setLocalSearch] = useState('');
  
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', text: '' }

  // View Details Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Reject Confirmation Modal State
  const [rejectTarget, setRejectTarget] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Admin Update Password Modal State
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordErr, setPasswordErr] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, externalSearch]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const term = (externalSearch || localSearch).trim();
      if (term) params.set('search', term);
      const qs = params.toString();
      const url = `/api/admin/registration-requests${qs ? `?${qs}` : ''}`;

      const { response, data } = await apiRequest(url);

      if (response.ok && data.success) {
        setRequests(data.data || []);
      } else {
        setAlert({ type: 'error', text: data.message || 'Failed to fetch registration requests.' });
      }
    } catch (err) {
      console.error('Fetch requests error:', err);
      setAlert({ type: 'error', text: 'Error connecting to backend server.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userObj) => {
    if (!window.confirm(`Are you sure you want to approve registration for ${userObj.fullName}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const { response, data } = await apiRequest(
        `/api/admin/registration-requests/${userObj._id}/approve`,
        { method: 'PATCH' }
      );

      if (response.ok && data.success) {
        setAlert({ type: 'success', text: `Registration request for ${userObj.fullName} approved successfully!` });
        fetchRequests();
      } else {
        setAlert({ type: 'error', text: data.message || 'Failed to approve request.' });
      }
    } catch (err) {
      console.error('Approve error:', err);
      setAlert({ type: 'error', text: 'Server error during approval.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (userObj) => {
    setRejectTarget(userObj);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectTarget) return;

    setActionLoading(true);
    try {
      const { response, data } = await apiRequest(
        `/api/admin/registration-requests/${rejectTarget._id}/reject`,
        {
          method: 'PATCH',
          body: JSON.stringify({ rejectionReason })
        }
      );

      if (response.ok && data.success) {
        setAlert({ type: 'success', text: `Registration request for ${rejectTarget.fullName} rejected.` });
        setIsRejectModalOpen(false);
        setRejectTarget(null);
        fetchRequests();
      } else {
        setAlert({ type: 'error', text: data.message || 'Failed to reject request.' });
      }
    } catch (err) {
      console.error('Reject error:', err);
      setAlert({ type: 'error', text: 'Server error during rejection.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPasswordModal = (userObj) => {
    setPasswordTarget(userObj);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErr('');
    setIsPasswordModalOpen(true);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordTarget) return;

    if (newPassword !== confirmPassword) {
      setPasswordErr('Passwords do not match.');
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNum = /[0-9]/.test(newPassword);
    const hasSpec = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (newPassword.length < 8 || !hasUpper || !hasLower || !hasNum || !hasSpec) {
      setPasswordErr('Password must be 8+ chars with at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
      return;
    }

    setPasswordLoading(true);
    setPasswordErr('');
    try {
      const { response, data } = await apiRequest(
        `/api/admin/users/${passwordTarget._id}/password`,
        {
          method: 'PATCH',
          body: JSON.stringify({ newPassword, confirmPassword })
        }
      );

      if (response.ok && data.success) {
        setAlert({ type: 'success', text: `Password updated successfully for ${passwordTarget.fullName}.` });
        setIsPasswordModalOpen(false);
        setPasswordTarget(null);
      } else {
        setPasswordErr(data.message || 'Failed to update password.');
      }
    } catch (err) {
      console.error('Password update error:', err);
      setPasswordErr('Server error updating password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleViewDetails = (userObj) => {
    setSelectedRequest(userObj);
    setIsViewModalOpen(true);
  };

  // Filter local search
  const filteredRequests = requests.filter((r) => {
    const q = (externalSearch || localSearch).toLowerCase();
    return (
      r.fullName?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.role?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="reg-status-badge reg-status-active"><CheckCircle size={12} /> Active</span>;
      case 'rejected':
        return <span className="reg-status-badge reg-status-rejected"><XCircle size={12} /> Rejected</span>;
      case 'suspended':
        return <span className="reg-status-badge reg-status-suspended">Suspended</span>;
      case 'pending':
      default:
        return <span className="reg-status-badge reg-status-pending"><Clock size={12} /> Pending</span>;
    }
  };

  return (
    <div className="reg-requests-container">
      <div className="reg-requests-header">
        <div>
          <h1 className="reg-requests-title">Registration Requests</h1>
          <p className="reg-requests-subtitle">Review, approve, or reject user signup applications</p>
        </div>
      </div>

      {alert && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: alert.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${alert.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
          color: alert.type === 'success' ? '#15803D' : '#DC2626'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{alert.text}</span>
          </div>
          <X size={18} style={{ cursor: 'pointer' }} onClick={() => setAlert(null)} />
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="reg-filter-bar">
        <div className="reg-tabs">
          <button 
            className={`reg-tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`reg-tab-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Approved / Active
          </button>
          <button 
            className={`reg-tab-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            Rejected
          </button>
          <button 
            className={`reg-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Requests
          </button>
        </div>

        <div className="reg-search-box">
          <Search size={16} color="#64748B" />
          <input
            type="text"
            className="reg-search-input"
            placeholder="Search requests..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="reg-table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            Loading registration requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            No registration requests found.
          </div>
        ) : (
          <table className="reg-table">
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Email</th>
                <th>Requested Role</th>
                <th>Department</th>
                <th>Registration Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((reqItem) => (
                <tr key={reqItem._id}>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{reqItem.fullName}</td>
                  <td>{reqItem.email}</td>
                  <td>
                    <span style={{ textTransform: 'capitalize' }}>
                      {reqItem.role ? reqItem.role.replace('_', ' ') : 'Employee'}
                    </span>
                  </td>
                  <td>{reqItem.department || 'N/A'}</td>
                  <td>{reqItem.createdAt ? new Date(reqItem.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>{getStatusBadge(reqItem.status)}</td>
                  <td>
                    <div className="reg-action-btns">
                      <button 
                        className="reg-btn-view"
                        title="View Details"
                        onClick={() => handleViewDetails(reqItem)}
                      >
                        <Eye size={14} /> View
                      </button>

                      <button
                        className="reg-btn-view"
                        style={{ borderColor: '#FDE68A', color: '#B45309', backgroundColor: '#FEF3C7' }}
                        title="Update Password"
                        onClick={() => handleOpenPasswordModal(reqItem)}
                      >
                        <Key size={14} /> Password
                      </button>

                      {reqItem.status === 'pending' && (
                        <>
                          <button 
                            className="reg-btn-approve"
                            title="Approve Account"
                            disabled={actionLoading}
                            onClick={() => handleApprove(reqItem)}
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button 
                            className="reg-btn-reject"
                            title="Reject Account"
                            disabled={actionLoading}
                            onClick={() => handleOpenRejectModal(reqItem)}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Details Modal */}
      {isViewModalOpen && selectedRequest && (
        <div className="reg-modal-backdrop" onClick={() => setIsViewModalOpen(false)}>
          <div className="reg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="reg-modal-header">
              <h2 className="reg-modal-title">Registration Request Details</h2>
              <X size={20} color="#64748B" style={{ cursor: 'pointer' }} onClick={() => setIsViewModalOpen(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: '#334155', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={18} color="#2563EB" />
                <span style={{ color: '#0F172A', fontWeight: 600, fontSize: '1rem' }}>{selectedRequest.fullName}</span>
                <span style={{ marginLeft: 'auto' }}>{getStatusBadge(selectedRequest.status)}</span>
              </div>
              
              <hr style={{ borderColor: '#E2E8F0', margin: '4px 0' }} />

              <div><Mail size={15} color="#64748B" style={{ verticalAlign: 'middle', marginRight: '8px' }} /> <strong>Email:</strong> {selectedRequest.email}</div>
              <div><Phone size={15} color="#64748B" style={{ verticalAlign: 'middle', marginRight: '8px' }} /> <strong>Phone:</strong> {selectedRequest.phone || 'N/A'}</div>
              <div><Briefcase size={15} color="#64748B" style={{ verticalAlign: 'middle', marginRight: '8px' }} /> <strong>Requested Role:</strong> {selectedRequest.role}</div>
              <div><Building size={15} color="#64748B" style={{ verticalAlign: 'middle', marginRight: '8px' }} /> <strong>Department:</strong> {selectedRequest.department || 'N/A'}</div>
              <div><BadgeCheck size={15} color="#64748B" style={{ verticalAlign: 'middle', marginRight: '8px' }} /> <strong>Employee ID:</strong> {selectedRequest.employeeId || 'N/A'}</div>
              <div><Calendar size={15} color="#64748B" style={{ verticalAlign: 'middle', marginRight: '8px' }} /> <strong>Applied On:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</div>

              {selectedRequest.isApproved && selectedRequest.approvedBy && (
                <div style={{ backgroundColor: '#F0FDF4', padding: '10px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                  <strong>Approved By:</strong> {selectedRequest.approvedBy.fullName || 'Admin'} <br />
                  <small>Date: {new Date(selectedRequest.approvedAt).toLocaleString()}</small>
                </div>
              )}

              {selectedRequest.status === 'rejected' && (
                <div style={{ backgroundColor: '#FEF2F2', padding: '10px', borderRadius: '8px', border: '1px solid #FECACA' }}>
                  <strong>Rejection Reason:</strong> {selectedRequest.rejectionReason || 'No reason specified'} <br />
                  {selectedRequest.rejectedBy && <small>Rejected By: {selectedRequest.rejectedBy.fullName || 'Admin'}</small>}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="reg-btn-view" onClick={() => setIsViewModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {isRejectModalOpen && rejectTarget && (
        <div className="reg-modal-backdrop" onClick={() => setIsRejectModalOpen(false)}>
          <div className="reg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="reg-modal-header">
              <h2 className="reg-modal-title">Reject Registration Request</h2>
              <X size={20} color="#64748B" style={{ cursor: 'pointer' }} onClick={() => setIsRejectModalOpen(false)} />
            </div>

            <form onSubmit={handleConfirmReject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: '#334155', fontSize: '0.9rem', margin: 0 }}>
                You are about to reject the application for <strong>{rejectTarget.fullName}</strong> ({rejectTarget.email}).
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: '#334155', fontSize: '0.85rem', fontWeight: 600 }}>Rejection Reason (Optional)</label>
                <textarea
                  rows={3}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    color: '#0F172A',
                    padding: '10px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="Provide a reason for rejecting this registration..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="reg-btn-view" onClick={() => setIsRejectModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="reg-btn-reject" disabled={actionLoading}>
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Admin Update Password Modal */}
      {isPasswordModalOpen && passwordTarget && (
        <div className="reg-modal-backdrop" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="reg-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="reg-modal-header">
              <h2 className="reg-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} color="#D97706" /> Update User Password
              </h2>
              <X size={20} color="#64748B" style={{ cursor: 'pointer' }} onClick={() => setIsPasswordModalOpen(false)} />
            </div>

            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
              Set a new password for <strong style={{ color: '#0F172A' }}>{passwordTarget.fullName}</strong> ({passwordTarget.email}).
            </p>

            {passwordErr && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '14px'
              }}>
                {passwordErr}
              </div>
            )}

            <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: '#334155', fontSize: '0.85rem', fontWeight: 600 }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      color: '#0F172A',
                      padding: '10px 38px 10px 12px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div 
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#64748B' }}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: '#334155', fontSize: '0.85rem', fontWeight: 600 }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      color: '#0F172A',
                      padding: '10px 38px 10px 12px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div 
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#64748B' }}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748B', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                Must be 8+ characters, with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="reg-btn-view" onClick={() => setIsPasswordModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="reg-btn-approve" disabled={passwordLoading}>
                  {passwordLoading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}