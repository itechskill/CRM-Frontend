import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  Building2, 
  FolderKanban, 
  Receipt, 
  Truck, 
  ArrowRight, 
  RefreshCw,
  Crown,
  Activity
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import './AdminDashboard.css';

export default function AdminDashboard({ onNavigateTab, currentUser }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminSummary = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/admin/executive-summary');
      if (response.ok && data.success) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error('Fetch admin summary error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminSummary();
  }, []);

  const data = summary || {};
  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'Administrator';

  return (
    <div className="admin-dashboard-container">
      {/* Top Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Welcome back, {firstName}
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Fortline CRM System Administration &amp; Access Governance
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchAdminSummary}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => onNavigateTab('registration_requests')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.825rem',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            <UserCheck size={16} />
            <span>Registration Requests ({data.pendingUsers || 0})</span>
          </button>
        </div>
      </div>

      {/* Top 4 Real User Administrative KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Total Users */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Users</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>{data.totalUsers || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Registered system accounts</div>
        </div>

        {/* Active Users */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Active Accounts</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>{data.activeEmployees || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>Active status in database</div>
        </div>

        {/* Pending Approval Requests */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          cursor: 'pointer'
        }}
        onClick={() => onNavigateTab('registration_requests')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Pending Approvals</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: data.pendingUsers > 0 ? '#D97706' : '#0F172A' }}>
            {data.pendingUsers || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 600 }}>Awaiting Admin approval</div>
        </div>

        {/* Inactive / Suspended Users */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Inactive / Rejected</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserX size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>{data.inactiveUsers || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Suspended or rejected</div>
        </div>
      </div>

      {/* Middle Grid: Department Distribution & System Database Records */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Department Staffing Overview */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Active Staffing by Department</span>
            <button
              onClick={() => onNavigateTab('users')}
              style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Manage Users <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Sales Department</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px' }}>
                {data.salesTeamCount || 0} Staff
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Support &amp; Operations</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284C7', background: '#E0F2FE', padding: '2px 8px', borderRadius: '6px' }}>
                {data.supportTeamCount || 0} Staff
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Accounts Department</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: '6px' }}>
                {data.accountsTeamCount || 0} Staff
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Finance Department</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: '6px' }}>
                {data.financeTeamCount || 0} Staff
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Human Resources &amp; Admin</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#E11D48', background: '#FFE4E6', padding: '2px 8px', borderRadius: '6px' }}>
                {data.hrTeamCount || 0} Staff
              </span>
            </div>
          </div>
        </div>

        {/* Database System Records Summary */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Live System Entity Records</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px' }}>
              Database Live
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
              <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>Sales Orders</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{data.salesOrders || 0}</div>
              <div style={{ fontSize: '0.7rem', color: '#16A34A', marginTop: '2px' }}>{data.ordersFinanceApproved || 0} Approved</div>
            </div>

            <div style={{ padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
              <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>Delivery Notes</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{data.totalDeliveryNotes || 0}</div>
              <div style={{ fontSize: '0.7rem', color: '#0284C7', marginTop: '2px' }}>{data.confirmedDeliveryNotes || 0} Delivered</div>
            </div>

            <div style={{ padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
              <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>Invoices</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{data.finalInvoices || 0}</div>
              <div style={{ fontSize: '0.7rem', color: '#D97706', marginTop: '2px' }}>{data.draftInvoices || 0} Drafts</div>
            </div>

            <div style={{ padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
              <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>System Projects</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{data.totalProjects || 0}</div>
              <div style={{ fontSize: '0.7rem', color: '#7C3AED', marginTop: '2px' }}>{data.activeProjects || 0} Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Audit Activity Feed */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Recent System Security &amp; Audit Logs</span>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Real audit records from MongoDB</div>
          </div>
          <button
            onClick={() => onNavigateTab('audit_logs')}
            style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            View All Audit Logs <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Action</th>
                <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Performed By</th>
                <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Target User</th>
                <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Details</th>
                <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentAuditLogs || []).map((log) => (
                <tr key={log._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontSize: '0.825rem', fontWeight: 600, color: '#0F172A' }}>
                    <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '0.825rem', color: '#334155' }}>
                    {log.performedByName || 'System'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '0.825rem', color: '#334155' }}>
                    {log.targetUserName || '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#64748B' }}>
                    {log.details || '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '0.75rem', color: '#94A3B8' }}>
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {(!data.recentAuditLogs || data.recentAuditLogs.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: '24px' }}>
                    No audit log records found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
