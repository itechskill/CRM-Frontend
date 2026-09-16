import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  Crown,
  Award,
  TrendingUp,
  Eye,
  FileDown,
  RefreshCw,
  Search,
  Filter,
  Medal,
  Users
} from 'lucide-react';
import { exportOrgOverviewPDF } from './OrgPDFService';

export default function OrgPerformanceRanking({ onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('all');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/admin/org/users?limit=100');
      if (response.ok && data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching users for ranking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and sort by score descending
  const filteredUsers = users
    .filter(u => {
      const matchDept = department === 'all' || (u.department && u.department.toLowerCase().includes(department.toLowerCase()));
      const matchSearch = !search.trim() || 
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase());
      return matchDept && matchSearch;
    })
    .sort((a, b) => {
      const scoreA = a.metrics?.score || 0;
      const scoreB = b.metrics?.score || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.metrics?.revenue || 0) - (a.metrics?.revenue || 0);
    });

  const top1 = filteredUsers[0];
  const top2 = filteredUsers[1];
  const top3 = filteredUsers[2];

  return (
    <div className="org-container">
      {/* Header Bar */}
      <div className="org-header-bar">
        <div className="org-header-title-group">
          <h1>
            <Crown size={24} color="#D97706" />
            Organization Performance Leaderboard
          </h1>
          <p>Real-time employee ranking based on completed workflows and efficiency scores</p>
        </div>

        <div className="org-actions-group">
          <button className="org-btn org-btn-secondary" onClick={fetchUsers}>
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            className="org-btn org-btn-primary"
            onClick={() => exportOrgOverviewPDF(null, filteredUsers)}
          >
            <FileDown size={16} />
            Export Rankings PDF
          </button>
        </div>
      </div>

      {/* Podium Cards for Top 3 */}
      {!loading && filteredUsers.length >= 3 && (
        <div className="org-podium">
          {/* #2 Silver */}
          {top2 && (
            <div className="org-podium-card" style={{ order: 1 }}>
              <div className="org-rank-medal org-rank-2" style={{ width: '36px', height: '36px', fontSize: '1rem', margin: '0 auto 10px' }}>
                #2
              </div>
              <div className="org-avatar" style={{ margin: '0 auto 8px', width: '48px', height: '48px', backgroundColor: '#64748B' }}>
                {top2.fullName?.substring(0, 2).toUpperCase()}
              </div>
              <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>{top2.fullName}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{top2.department || 'General'}</span>
              <div style={{ marginTop: '12px', background: '#F1F5F9', padding: '6px 16px', borderRadius: '20px' }}>
                <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>{top2.metrics?.score || 0}%</span>
              </div>
            </div>
          )}

          {/* #1 Gold */}
          {top1 && (
            <div className="org-podium-card first" style={{ order: 2 }}>
              <Crown size={24} color="#D97706" style={{ margin: '0 auto 4px' }} />
              <div className="org-rank-medal org-rank-1" style={{ width: '42px', height: '42px', fontSize: '1.2rem', margin: '0 auto 10px' }}>
                #1
              </div>
              <div className="org-avatar" style={{ margin: '0 auto 8px', width: '56px', height: '56px', backgroundColor: '#D97706' }}>
                {top1.fullName?.substring(0, 2).toUpperCase()}
              </div>
              <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>{top1.fullName}</span>
              <span style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 600 }}>{top1.department || 'General'}</span>
              <div style={{ marginTop: '12px', background: '#FEF3C7', padding: '8px 20px', borderRadius: '20px' }}>
                <span style={{ fontWeight: 800, color: '#B45309', fontSize: '1.25rem' }}>{top1.metrics?.score || 0}%</span>
              </div>
            </div>
          )}

          {/* #3 Bronze */}
          {top3 && (
            <div className="org-podium-card" style={{ order: 3 }}>
              <div className="org-rank-medal org-rank-3" style={{ width: '36px', height: '36px', fontSize: '1rem', margin: '0 auto 10px' }}>
                #3
              </div>
              <div className="org-avatar" style={{ margin: '0 auto 8px', width: '48px', height: '48px', backgroundColor: '#C2410C' }}>
                {top3.fullName?.substring(0, 2).toUpperCase()}
              </div>
              <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>{top3.fullName}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{top3.department || 'General'}</span>
              <div style={{ marginTop: '12px', background: '#FFEDD5', padding: '6px 16px', borderRadius: '20px' }}>
                <span style={{ fontWeight: 800, color: '#C2410C', fontSize: '1.1rem' }}>{top3.metrics?.score || 0}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="org-filters-bar">
        <div className="org-search-box">
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search ranked employee by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="org-filter-select"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="all">All Departments</option>
          <option value="Sales">Sales</option>
          <option value="Support">Support</option>
          <option value="Accounts">Accounts</option>
          <option value="Finance">Finance</option>
          <option value="Human Resources">Human Resources</option>
        </select>
      </div>

      {/* Leaderboard Table */}
      <div className="org-table-container">
        <div className="org-table-responsive">
          <table className="org-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Items Handled</th>
                <th>Completed</th>
                <th>Performance Score</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    Loading rankings...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No employees found matching filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const rank = idx + 1;
                  const score = u.metrics?.score || 0;
                  return (
                    <tr key={u._id}>
                      <td>
                        <div className={`org-rank-medal ${rank === 1 ? 'org-rank-1' : (rank === 2 ? 'org-rank-2' : (rank === 3 ? 'org-rank-3' : 'org-rank-other'))}`}>
                          #{rank}
                        </div>
                      </td>
                      <td>
                        <div className="org-user-cell">
                          <div className="org-avatar">
                            {u.profileImage ? <img src={u.profileImage} alt={u.fullName} /> : u.fullName?.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="org-user-cell-info">
                            <span className="org-user-cell-name">{u.fullName}</span>
                            <span className="org-user-cell-sub">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="org-badge org-badge-dept">{u.department || 'General'}</span></td>
                      <td><span className="org-badge org-badge-role">{(u.role || '').replace('_', ' ').toUpperCase()}</span></td>
                      <td>{u.metrics?.totalItems || 0}</td>
                      <td style={{ color: '#16A34A', fontWeight: 600 }}>{u.metrics?.completedItems || 0}</td>
                      <td>
                        <div className="org-score-box">
                          <div className="org-score-bar-bg">
                            <div className="org-score-bar-fill" style={{ width: `${score}%`, backgroundColor: score >= 80 ? '#10B981' : '#3B82F6' }} />
                          </div>
                          <span className="org-score-text">{score}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="org-btn org-btn-outline"
                          onClick={() => onSelectUser && onSelectUser(u)}
                          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        >
                          <Eye size={13} />
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
      </div>
    </div>
  );
}
