import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, FileText, User, Filter, Search, Lock, X } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function CEOEditRequestsView({ onNavigateHistory }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [deptFilter, setDeptFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Review Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [permissionScope, setPermissionScope] = useState('FullDocument'); // 'SpecificFields' | 'FullDocument'
  const [expiresInHours, setExpiresInHours] = useState('2');
  const [responseNote, setResponseNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // Document Inspection Modal State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let url = `/api/edit-permissions/requests?status=${statusFilter}`;
      if (deptFilter) url += `&department=${encodeURIComponent(deptFilter)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const { response, data } = await apiRequest(url);
      if (response.ok && data.success) {
        setRequests(data.data || []);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('[CEOEditRequestsView] Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, deptFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleInspectDocument = async (docType, docId) => {
    setPreviewLoading(true);
    setPreviewDoc(null);
    try {
      const { response, data } = await apiRequest(`/api/edit-permissions/preview/${encodeURIComponent(docType)}/${docId}`);
      if (response.ok && data.success) {
        setPreviewDoc(data);
      } else {
        alert(data.message || 'Unable to load document payload for preview.');
      }
    } catch (err) {
      console.error('[Inspect Document Error]:', err);
      alert('Error fetching document payload.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRespond = async (actionStatus) => {
    if (!selectedReq) return;
    setActionLoading(true);
    setFeedback({ type: '', msg: '' });

    try {
      const payload = {
        status: actionStatus,
        responseNote: responseNote.trim(),
        permissionScope,
        expiresInHours: Number(expiresInHours) || 2,
        allowedFields: selectedReq.requestedFields ? selectedReq.requestedFields.map(f => f.fieldName) : []
      };

      const { response, data } = await apiRequest(`/api/edit-permissions/requests/${selectedReq._id}/respond`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (response.ok && data.success) {
        setFeedback({ type: 'success', msg: `Edit request for ${selectedReq.documentNumber} successfully ${actionStatus.toLowerCase()}.` });
        setSelectedReq(null);
        setResponseNote('');
        fetchRequests();
      } else {
        setFeedback({ type: 'error', msg: data.message || 'Failed to update request decision.' });
      }
    } catch (err) {
      console.error('[Respond Error]:', err);
      setFeedback({ type: 'error', msg: 'Server error processing request response.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Title & Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        backgroundColor: '#ffffff',
        padding: '1.25rem 1.5rem',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#fef3c7', padding: '0.65rem', borderRadius: '8px', color: '#d97706' }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>
              CEO Edit Requests & Approval Manager
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Centralized authorization portal for Category B document edit permissions across all operational departments.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {onNavigateHistory && (
            <button
              onClick={onNavigateHistory}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <FileText size={15} />
              View Edit Audit Logs
            </button>
          )}
          <button
            onClick={fetchRequests}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            Refresh Requests
          </button>
        </div>
      </div>

      {feedback.msg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          backgroundColor: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: feedback.type === 'success' ? '#15803d' : '#991b1b',
          border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['Pending', 'Approved', 'Rejected', 'Completed', 'Expired', 'All'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === status ? '#0f172a' : '#e2e8f0',
                color: statusFilter === status ? '#ffffff' : '#475569',
                transition: 'all 0.2s'
              }}
            >
              {status}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search user, doc no, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                width: '220px'
              }}
            />
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '10px', color: '#94a3b8' }} />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="">All Departments</option>
            <option value="Sales">Sales</option>
            <option value="Support">Support</option>
            <option value="Procurement">Procurement</option>
            <option value="Logistics">Logistics</option>
            <option value="Accounts">Accounts</option>
            <option value="Finance">Finance</option>
          </select>

          <button
            type="submit"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Filter
          </button>
        </form>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading edit permission requests...
        </div>
      ) : requests.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '3.5rem',
          textAlign: 'center',
          color: '#64748b',
          border: '1px dashed #cbd5e1'
        }}>
          <Clock size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 0.25rem', color: '#334155' }}>No {statusFilter.toLowerCase()} requests found</h3>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>There are currently no edit requests matching this filter criteria.</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px 16px' }}>Requester</th>
                <th style={{ padding: '12px 16px' }}>Role / Dept</th>
                <th style={{ padding: '12px 16px' }}>Document Type</th>
                <th style={{ padding: '12px 16px' }}>Doc Ref No</th>
                <th style={{ padding: '12px 16px' }}>Requested Change / Reason</th>
                <th style={{ padding: '12px 16px' }}>Date & Time</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>
                    {req.requestedByName}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>
                      ID: {String(req.requestedByUserId?._id || req.requestedByUserId || '').slice(-6)}
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px', color: '#334155' }}>
                    <div style={{ fontWeight: 600 }}>{req.requestedByRole}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.requestedByDepartment}</div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#f1f5f9',
                      color: '#1e293b',
                      border: '1px solid #e2e8f0'
                    }}>
                      {req.documentType}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                    {req.documentNumber}
                  </td>

                  <td style={{ padding: '14px 16px', maxWidth: '300px' }}>
                    {req.requestType === 'SpecificField' && req.requestedFields && req.requestedFields.length > 0 ? (
                      <div>
                        <span style={{ fontWeight: 600, color: '#2563eb' }}>
                          [{req.requestedFields[0].fieldName}]: {req.requestedFields[0].currentValue || 'N/A'} &rarr; {req.requestedFields[0].requestedValue}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                          "{req.reason}"
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span style={{ fontWeight: 600, color: '#475569' }}>General Document Edit</span>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                          "{req.reason}"
                        </div>
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.8rem' }}>
                    {new Date(req.createdAt).toLocaleString()}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      backgroundColor:
                        req.status === 'Approved' ? '#f0fdf4' :
                        req.status === 'Rejected' ? '#fef2f2' :
                        req.status === 'Completed' ? '#e0f2fe' :
                        req.status === 'Expired' ? '#f3f4f6' : '#fffbeb',
                      color:
                        req.status === 'Approved' ? '#15803d' :
                        req.status === 'Rejected' ? '#991b1b' :
                        req.status === 'Completed' ? '#0369a1' :
                        req.status === 'Expired' ? '#4b5563' : '#b45309',
                      border: `1px solid ${
                        req.status === 'Approved' ? '#bbf7d0' :
                        req.status === 'Rejected' ? '#fecaca' :
                        req.status === 'Completed' ? '#bae6fd' : '#e5e7eb'
                      }`
                    }}>
                      {req.status}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        setSelectedReq(req);
                        setPermissionScope(req.requestType === 'SpecificField' ? 'SpecificFields' : 'FullDocument');
                      }}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Eye size={13} />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CEO Detailed Review Modal */}
      {selectedReq && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
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
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #e2e8f0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
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
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                  Review CEO Edit Request ({selectedReq.requestId})
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Requested on {new Date(selectedReq.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Grid 1: Requester Details */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  1. Requester Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div><strong style={{ color: '#475569' }}>Name:</strong> <br /><span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedReq.requestedByName}</span></div>
                  <div><strong style={{ color: '#475569' }}>User ID:</strong> <br /><span style={{ fontWeight: 600, color: '#0f172a' }}>{String(selectedReq.requestedByUserId?._id || selectedReq.requestedByUserId || '').slice(-8)}</span></div>
                  <div><strong style={{ color: '#475569' }}>Role:</strong> <br /><span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedReq.requestedByRole}</span></div>
                  <div><strong style={{ color: '#475569' }}>Department:</strong> <br /><span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedReq.requestedByDepartment}</span></div>
                </div>
              </div>

              {/* Grid 2: Target Document Details */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    2. Target Document
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    {selectedReq.documentType} – Ref: {selectedReq.documentNumber}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Current Doc Status: <strong>{selectedReq.currentDocumentStatus || 'Active'}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleInspectDocument(selectedReq.documentType, selectedReq.documentId)}
                  disabled={previewLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #2563eb',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Eye size={15} />
                  {previewLoading ? 'Loading Doc...' : 'View Document Payload'}
                </button>
              </div>

              {/* Box 3: Requested Change Comparison */}
              <div style={{
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e4e4e7',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  3. Requested Edit & Change Scope
                </div>

                {selectedReq.requestType === 'SpecificField' && selectedReq.requestedFields && selectedReq.requestedFields.length > 0 ? (
                  <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Field: {selectedReq.requestedFields[0].fieldName}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <div style={{ backgroundColor: '#fef2f2', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fecaca', color: '#991b1b' }}>
                        <strong>Current Value:</strong> {selectedReq.requestedFields[0].currentValue || 'N/A'}
                      </div>
                      <div style={{ backgroundColor: '#f0fdf4', padding: '0.5rem', borderRadius: '4px', border: '1px solid #bbf7d0', color: '#166534' }}>
                        <strong>Requested New Value:</strong> {selectedReq.requestedFields[0].requestedValue}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                    Mode: General Document Edit Access
                  </div>
                )}

                <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>
                  <strong>Requester's Reason:</strong> "{selectedReq.reason}"
                </div>
              </div>

              {/* Box 4: CEO Response Controls (Only for Pending) */}
              {selectedReq.status === 'Pending' ? (
                <div style={{ backgroundColor: '#fffbeb', borderRadius: '8px', padding: '1.25rem', border: '1px solid #fde68a', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b45309', marginBottom: '0.75rem' }}>
                    CEO Authorization Decision
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                        Approval Scope
                      </label>
                      <select
                        value={permissionScope}
                        onChange={(e) => setPermissionScope(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="SpecificFields">Approve Specific Fields Only</option>
                        <option value="FullDocument">Approve Full Document Edit</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                        Validity Expiration
                      </label>
                      <select
                        value={expiresInHours}
                        onChange={(e) => setExpiresInHours(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="1">1 Hour</option>
                        <option value="2">2 Hours (Default)</option>
                        <option value="4">4 Hours</option>
                        <option value="24">24 Hours</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                      CEO Response Note / Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={responseNote}
                      onChange={(e) => setResponseNote(e.target.value)}
                      placeholder="Add optional notes or instructions for the user..."
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleRespond('Rejected')}
                      style={{
                        padding: '0.55rem 1.25rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: actionLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Reject Request
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleRespond('Approved')}
                      style={{
                        padding: '0.55rem 1.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: actionLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Approve Edit Access
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    Decision Recorded: {selectedReq.status}
                  </div>
                  {selectedReq.ceoResponseNote && (
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', marginTop: '4px' }}>
                      "{selectedReq.ceoResponseNote}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Payload Inspection Modal */}
      {previewDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '85vh',
            overflowY: 'auto',
            border: '1px solid #e2e8f0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                Document Payload Preview: {previewDoc.documentType} ({previewDoc.documentNumber})
              </h4>
              <button onClick={() => setPreviewDoc(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#0f172a', color: '#38bdf8' }}>
              <pre style={{ margin: 0, fontSize: '0.8rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(previewDoc.payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
