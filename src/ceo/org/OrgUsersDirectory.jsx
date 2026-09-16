import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  Users,
  Search,
  Filter,
  Eye,
  FileDown,
  TrendingUp,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  RefreshCw
} from 'lucide-react';
import { exportOrgOverviewPDF } from './OrgPDFService';

export default function OrgUsersDirectory({ onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        department,
        role,
        status,
        page: String(page),
        limit: '25'
      });
      const { response, data } = await apiRequest(`/api/admin/org/users?${params.toString()}`);
      if (response.ok && data.success) {
        setUsers(data.data || []);
        setTotalPages(data.pages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching org users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, department, role, status, page]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 50) return '#3B82F6';
    if (score > 0) return '#F59E0B';
    return '#94A3B8';
  };

  return (
    <div className="org-container">
      {/* Header Bar */}
      <div className="org-header-bar">
        <div className="org-header-title-group">
          <h1>
            <Users size={24} color="#2563EB" />
            Organization Users Directory
          </h1>
          <p>Complete centralized employee registry with real-time performance scores and activity metrics</p>
        </div>

        <div className="org-actions-group">
          <button
            className="org-btn org-btn-secondary"
            onClick={fetchUsers}
            title="Refresh list"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            className="org-btn org-btn-primary"
            onClick={() => exportOrgOverviewPDF(null, users)}
            title="Export Directory PDF"
          >
            <FileDown size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="org-kpi-grid">
        <div className="org-kpi-card">
          <div className="org-kpi-header">
            <span className="org-kpi-title">Total Registered Users</span>
            <div className="org-kpi-icon" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Users size={18} />
            </div>
          </div>
          <span className="org-kpi-value">{totalCount}</span>
          <span className="org-kpi-subtext">Active & verified personnel</span>
        </div>

        <div className="org-kpi-card">
          <div className="org-kpi-header">
            <span className="org-kpi-title">Active Accounts</span>
            <div className="org-kpi-icon" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <span className="org-kpi-value">
            {users.filter(u => u.status === 'active').length}
          </span>
          <span className="org-kpi-subtext">Current page active users</span>
        </div>

        <div className="org-kpi-card">
          <div className="org-kpi-header">
            <span className="org-kpi-title">Departments Represented</span>
            <div className="org-kpi-icon" style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
              <Briefcase size={18} />
            </div>
          </div>
          <span className="org-kpi-value">
            {new Set(users.map(u => u.department || 'General')).size}
          </span>
          <span className="org-kpi-subtext">Operational divisions</span>
        </div>

        <div className="org-kpi-card">
          <div className="org-kpi-header">
            <span className="org-kpi-title">Average Performance</span>
            <div className="org-kpi-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <span className="org-kpi-value">
            {users.length > 0 ? Math.round(users.reduce((s, u) => s + (u.metrics?.score || 0), 0) / users.length) : 0}%
          </span>
          <span className="org-kpi-subtext">Completion & turnaround rate</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="org-filters-bar">
        <div className="org-search-box">
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search by name, email, role, or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="org-filter-select"
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
        >
          <option value="all">All Departments</option>
          <option value="Sales">Sales</option>
          <option value="Support">Support & Operations</option>
          <option value="Accounts">Accounts</option>
          <option value="Finance">Finance</option>
          <option value="Human Resources">Human Resources</option>
          <option value="Executive Leadership">Executive Leadership</option>
        </select>

        <select
          className="org-filter-select"
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
        >
          <option value="all">All Roles</option>
          <option value="ceo">CEO</option>
          <option value="admin">Admin</option>
          <option value="sales_manager">Sales Manager</option>
          <option value="sales_member">Sales Person</option>
          <option value="sales_rep">Sales Representative</option>
          <option value="support">Support</option>
          <option value="accountant">Accounts / Accountant</option>
          <option value="finance">Finance</option>
          <option value="hr_manager">HR Manager</option>
          <option value="project_manager">Project Manager</option>
          <option value="employee">Employee</option>
        </select>

        <select
          className="org-filter-select"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="org-table-container">
        <div className="org-table-responsive">
          <table className="org-table">
            <thead>
              <tr>
                <th>Employee / User</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Handled Items</th>
                <th>Performance Score</th>
                <th>Last Activity</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <RefreshCw size={18} className="animate-spin" />
                      Loading centralized organization data...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No employees or users found matching your filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const score = u.metrics?.score || 0;
                  const scoreColor = getScoreColor(score);
                  return (
                    <tr key={u._id}>
                      <td>
                        <div className="org-user-cell">
                          <div className="org-avatar">
                            {u.profileImage ? (
                              <img src={u.profileImage} alt={u.fullName} />
                            ) : (
                              u.fullName ? u.fullName.substring(0, 2).toUpperCase() : 'U'
                            )}
                          </div>
                          <div className="org-user-cell-info">
                            <span className="org-user-cell-name">{u.fullName}</span>
                            <span className="org-user-cell-sub">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="org-badge org-badge-dept">
                          {u.department || 'General'}
                        </span>
                      </td>

                      <td>
                        <span className="org-badge org-badge-role">
                          {(u.role || '').replace('_', ' ').toUpperCase()}
                        </span>
                      </td>

                      <td>
                        <span className={`org-badge org-badge-${u.status === 'active' ? 'active' : (u.status === 'pending' ? 'pending' : 'inactive')}`}>
                          {(u.status || 'Active').toUpperCase()}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>
                            {u.metrics?.totalItems || 0} Total
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#16A34A' }}>
                            {u.metrics?.completedItems || 0} Completed
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="org-score-box">
                          <div className="org-score-bar-bg">
                            <div
                              className="org-score-bar-fill"
                              style={{ width: `${score}%`, backgroundColor: scoreColor }}
                            />
                          </div>
                          <span className="org-score-text" style={{ color: scoreColor }}>
                            {score}%
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '0.8rem' }}>
                          <Clock size={14} color="#94A3B8" />
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="org-btn org-btn-outline"
                          onClick={() => onSelectUser(u)}
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          title="Open complete read-only profile"
                        >
                          <Eye size={14} />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
              Showing Page {page} of {totalPages} ({totalCount} users total)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="org-btn org-btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Previous
              </button>
              <button
                className="org-btn org-btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
