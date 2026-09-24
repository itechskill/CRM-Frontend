import React, { useState, useEffect } from 'react';
import { History, RefreshCw, Filter, Search, User, FileText, Calendar, Shield } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function CEOEditHistoryView({ onNavigateRequests }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [userFilter, setUserFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [docNumFilter, setDocNumFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userFilter) params.append('user', userFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (deptFilter) params.append('department', deptFilter);
      if (docTypeFilter) params.append('documentType', docTypeFilter);
      if (docNumFilter) params.append('documentNumber', docNumFilter);

      const { response, data } = await apiRequest(`/api/edit-permissions/audit-logs?${params.toString()}`);
      if (response.ok && data.success) {
        setLogs(data.data || []);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('[CEOEditHistoryView Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const parseChangesList = (log) => {
    if (Array.isArray(log.changes) && log.changes.length > 0) {
      return log.changes.map(c => ({
        field: c.field || 'Field',
        oldValue: c.oldValue ?? '',
        newValue: c.newValue ?? ''
      }));
    } else if (log.changes && typeof log.changes === 'object' && Object.keys(log.changes).length > 0) {
      return Object.keys(log.changes).map(key => ({
        field: key,
        oldValue: log.changes[key]?.old ?? log.changes[key]?.oldValue ?? '',
        newValue: log.changes[key]?.new ?? log.changes[key]?.newValue ?? log.changes[key]
      }));
    }
    return [];
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1350px', margin: '0 auto' }}>
      {/* Header */}
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
          <div style={{ backgroundColor: '#eff6ff', padding: '0.65rem', borderRadius: '8px', color: '#2563eb' }}>
            <History size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>
              Centralized Document Edit History & Audit Logs
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Complete audit trail of all modified documents, including field-level differences, user roles, departments, and CEO authorization references.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {onNavigateRequests && (
            <button
              onClick={onNavigateRequests}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #2563eb',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Shield size={15} />
              Pending Edit Requests
            </button>
          )}
          <button
            onClick={fetchLogs}
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
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Filter Form */}
      <form onSubmit={handleFilterSubmit} style={{
        backgroundColor: '#ffffff',
        padding: '1rem 1.25rem',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginBottom: '1.25rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
        alignItems: 'end'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
            User Name
          </label>
          <input
            type="text"
            placeholder="Search by user name"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
            Department
          </label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
          >
            <option value="">All Departments</option>
            <option value="Sales">Sales</option>
            <option value="Support">Support</option>
            <option value="Procurement">Procurement</option>
            <option value="Logistics">Logistics</option>
            <option value="Accounts">Accounts</option>
            <option value="Finance">Finance</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
            Document Type
          </label>
          <input
            type="text"
            placeholder="e.g. Sales Order, Invoice"
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
            Doc Number / Ref
          </label>
          <input
            type="text"
            placeholder="e.g. SO-1025"
            value={docNumFilter}
            onChange={(e) => setDocNumFilter(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Logs Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading audit logs...
        </div>
      ) : logs.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '3rem',
          textAlign: 'center',
          color: '#64748b',
          border: '1px dashed #cbd5e1'
        }}>
          <History size={36} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
          <p style={{ margin: 0, fontWeight: 500 }}>No document edit audit logs recorded yet.</p>
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
                <th style={{ padding: '12px 16px' }}>Date & Time</th>
                <th style={{ padding: '12px 16px' }}>Edited By</th>
                <th style={{ padding: '12px 16px' }}>Role / Dept</th>
                <th style={{ padding: '12px 16px' }}>Document</th>
                <th style={{ padding: '12px 16px' }}>Doc Ref No</th>
                <th style={{ padding: '12px 16px' }}>Permission Type</th>
                <th style={{ padding: '12px 16px' }}>Modified Fields (Old &rarr; New)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const changeList = parseChangesList(log);
                return (
                  <tr key={log._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt || log.timestamp).toLocaleString()}
                    </td>

                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {log.editedByName || 'User'}
                    </td>

                    <td style={{ padding: '14px 16px', color: '#334155' }}>
                      <div style={{ fontWeight: 600 }}>{log.editedByRole || '-'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.editedByDepartment || '-'}</div>
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
                        {log.documentType}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                      {log.documentNumber}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        backgroundColor: log.permissionType === 'DIRECT_EDIT' ? '#e0f2fe' : '#f0fdf4',
                        color: log.permissionType === 'DIRECT_EDIT' ? '#0369a1' : '#15803d',
                        border: `1px solid ${log.permissionType === 'DIRECT_EDIT' ? '#bae6fd' : '#bbf7d0'}`
                      }}>
                        {log.permissionType === 'DIRECT_EDIT' ? 'Direct Edit Exception' : 'CEO Approved'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', maxWidth: '350px' }}>
                      {changeList.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {changeList.map((c, idx) => (
                            <div key={idx} style={{ fontSize: '0.8rem', backgroundColor: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                              <strong style={{ color: '#0f172a' }}>{c.field}:</strong>{' '}
                              <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>{String(c.oldValue ?? '')}</span>{' '}
                              &rarr; <span style={{ color: '#16a34a', fontWeight: 600 }}>{String(c.newValue ?? '')}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>{log.reason || 'No specific field diff recorded'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
