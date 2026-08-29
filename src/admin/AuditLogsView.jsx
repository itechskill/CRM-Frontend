import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, RefreshCw, Clock, User, FileText, AlertCircle } from 'lucide-react';
import './RegistrationRequestsView.css';

import { apiRequest } from '../utils/api';

export default function AuditLogsView({ searchQuery: externalSearch = '' }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState(null);

  const effectiveSearch = externalSearch || searchQuery;

  useEffect(() => {
    fetchAuditLogs();
  }, [externalSearch]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/audit-logs');

      if (response.ok && data.success) {
        setLogs(data.data || []);
      } else {
        setAlert({ type: 'error', text: data.message || 'Failed to fetch audit logs.' });
      }
    } catch (err) {
      console.error('Audit logs error:', err);
      setAlert({ type: 'error', text: 'Error connecting to server.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const q = effectiveSearch.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.performedByName?.toLowerCase().includes(q) ||
      log.targetUserName?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q)
    );
  });

  const getActionBadgeClass = (action) => {
    if (action.includes('Approved') || action.includes('Activated')) return 'reg-status-active';
    if (action.includes('Rejected') || action.includes('Suspended')) return 'reg-status-rejected';
    if (action.includes('Password') || action.includes('Role')) return 'reg-status-pending';
    return 'reg-status-pending';
  };

  return (
    <div className="reg-requests-container">
      <div className="reg-requests-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="reg-requests-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="#2563EB" /> System Audit Logs
          </h1>
          <p className="reg-requests-subtitle">Immutable security audit record of system activities, approvals, and authentication events</p>
        </div>
        <button
          className="reg-btn-view"
          onClick={fetchAuditLogs}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {alert && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          marginBottom: '16px'
        }}>
          {alert.text}
        </div>
      )}

      <div className="reg-filter-bar">
        <div className="reg-search-box" style={{ width: '100%', maxWidth: '400px' }}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            className="reg-search-input"
            placeholder="Search audit logs by action, user, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="reg-table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            Loading audit logs from database...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            No audit log entries found.
          </div>
        ) : (
          <table className="reg-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Target User</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td style={{ fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                    <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <span className={`reg-status-badge ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: '#0F172A', fontWeight: 500 }}>
                    {log.performedByName || (log.performedBy?.fullName) || 'System / Public'}
                  </td>
                  <td style={{ color: '#334155' }}>
                    {log.targetUserName || (log.targetUser?.fullName) || 'N/A'}
                  </td>
                  <td style={{ color: '#64748B', fontSize: '0.85rem' }}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}