import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  Calendar,
  FileDown,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  Calculator,
  Wallet,
  Users,
  Eye
} from 'lucide-react';
import { exportMonthlyPDF } from './OrgPDFService';

export default function OrgMonthlyReports({ onSelectUser }) {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const months = [
    { num: 1, name: 'January' },
    { num: 2, name: 'February' },
    { num: 3, name: 'March' },
    { num: 4, name: 'April' },
    { num: 5, name: 'May' },
    { num: 6, name: 'June' },
    { num: 7, name: 'July' },
    { num: 8, name: 'August' },
    { num: 9, name: 'September' },
    { num: 10, name: 'October' },
    { num: 11, name: 'November' },
    { num: 12, name: 'December' },
  ];

  const years = [2024, 2025, 2026, 2027];

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const { response, data: resData } = await apiRequest(`/api/admin/org/monthly?year=${year}&month=${month}`);
      if (response.ok && resData.success) {
        setData(resData.data);
      }
    } catch (err) {
      console.error('Error fetching monthly data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [year, month]);

  const kpis = data?.kpis || {};
  const rankings = data?.userRankings || [];

  return (
    <div className="org-container">
      {/* Header Bar */}
      <div className="org-header-bar">
        <div className="org-header-title-group">
          <h1>
            <Calendar size={24} color="#2563EB" />
            Monthly Organization Performance
          </h1>
          <p>
            Audit month-wise growth trajectory, cross-departmental volume, and employee output
          </p>
        </div>

        <div className="org-actions-group">
          <select
            className="org-filter-select"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {months.map(m => (
              <option key={m.num} value={m.num}>{m.name}</option>
            ))}
          </select>

          <select
            className="org-filter-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button className="org-btn org-btn-secondary" onClick={fetchMonthlyData}>
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            className="org-btn org-btn-primary"
            onClick={() => exportMonthlyPDF(data)}
            disabled={!data}
          >
            <FileDown size={16} />
            Export Month PDF
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="org-kpi-grid">
        <div className="org-kpi-card">
          <div className="org-kpi-header">
            <span className="org-kpi-title">Sales Orders</span>
            <div className="org-kpi-icon" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Package size={18} />
            </div>
          </div>
          <span className="org-kpi-value">{kpis.salesOrders?.count || 0}</span>
          <span className="org-kpi-subtext" style={{ color: (kpis.salesOrders?.growth || 0) >= 0 ? '#16A34A' : '#DC2626' }}>
            {(kpis.salesOrders?.growth || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {kpis.salesOrders?.growth || 0}% vs previous month
          </span>
        </div>

        <div className="org-kpi-card">
          <div className="org-kpi-header">
            <span className="org-kpi-title">Delivery Notes</span>
            <div className="org-kpi-icon" style={{ backgroundColor: '#CCFBF1', color: '#0D9488' }}>
              <Truck size={18} />
            </div>
          </div>
          <span className="org-kpi-value">{kpis.deliveryNotes?.count || 0}</span>
          <span className="org-kpi-subtext">
            {kpis.deliveryNotes?.confirmed || 0} Confirmed / Delivered
          </span>
        </div>

        <div className="org-kpi-card">
          <div className="org-kpi-header">
            <span className="org-kpi-title">Invoiced Volume</span>
            <div className="org-kpi-icon" style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
              <Calculator size={18} />
            </div>
          </div>
          <span className="org-kpi-value">PKR {(kpis.invoices?.amount || 0).toLocaleString()}</span>
          <span className="org-kpi-subtext">
            {kpis.invoices?.count || 0} Invoices Issued
          </span>
        </div>

        <div className="org-kpi-card">
          <div className="org-kpi-header">
            <span className="org-kpi-title">Cash Collected</span>
            <div className="org-kpi-icon" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
              <Wallet size={18} />
            </div>
          </div>
          <span className="org-kpi-value">PKR {(kpis.revenueCollected?.amount || 0).toLocaleString()}</span>
          <span className="org-kpi-subtext" style={{ color: (kpis.revenueCollected?.growth || 0) >= 0 ? '#16A34A' : '#DC2626' }}>
            {(kpis.revenueCollected?.growth || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {kpis.revenueCollected?.growth || 0}% vs previous month
          </span>
        </div>
      </div>

      {/* Monthly Leaderboard */}
      <div className="org-table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700 }}>
          Employee Leaderboard for {data?.period?.monthName || ''} {year} ({rankings.length} Active Contributors)
        </div>
        <div className="org-table-responsive">
          <table className="org-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Work Items</th>
                <th>Completed</th>
                <th>Revenue Handled</th>
                <th>Month Score</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    Loading monthly data...
                  </td>
                </tr>
              ) : rankings.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No recorded workflows in this period.
                  </td>
                </tr>
              ) : (
                rankings.map((r, idx) => (
                  <tr key={r.userId || idx}>
                    <td style={{ fontWeight: 700, color: idx < 3 ? '#D97706' : '#64748B' }}>
                      #{idx + 1}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{r.fullName}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8' }}>{r.email}</span>
                    </td>
                    <td><span className="org-badge org-badge-dept">{r.department}</span></td>
                    <td><span className="org-badge org-badge-role">{(r.role || '').replace('_', ' ').toUpperCase()}</span></td>
                    <td>{r.items}</td>
                    <td style={{ color: '#16A34A', fontWeight: 600 }}>{r.completed}</td>
                    <td>PKR {(r.revenue || 0).toLocaleString()}</td>
                    <td>
                      <div className="org-score-box">
                        <div className="org-score-bar-bg">
                          <div className="org-score-bar-fill" style={{ width: `${r.score}%`, backgroundColor: r.score >= 80 ? '#10B981' : '#3B82F6' }} />
                        </div>
                        <span className="org-score-text">{r.score}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="org-btn org-btn-outline"
                        onClick={() => onSelectUser && onSelectUser({ _id: r.userId, fullName: r.fullName })}
                        style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                      >
                        <Eye size={13} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
