import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Calendar,
  FileText,
  Briefcase,
  Target,
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Plus,
  Search,
  X,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { apiRequest } from '../utils/api';
import './SalesManagerDashboard.css';

const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

export default function SalesManagerDashboard({ currentUser, onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [breakdownType, setBreakdownType] = useState(null); // 'overdue' | 'receivables'
  const [breakdownSearch, setBreakdownSearch] = useState('');

  const fetchDashboardStats = async () => {
    try {
      const { response, data } = await apiRequest('/api/sales-manager/dashboard-stats');
      if (response.ok && data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Fetch sales manager dashboard stats error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="smd-loading-container">
        <div className="smd-spinner" />
        <p>Loading Sales Dashboard...</p>
      </div>
    );
  }

  const kpis = [
    {
      id: 'orders',
      icon: ShoppingCart,
      bg: '#EFF6FF',
      color: '#2563EB',
      value: String(stats?.totalOrders || 0),
      label: 'Total Sales Orders',
      sub: `${stats?.totalQuotations || 0} quotations generated`,
      clickable: true,
      onClick: () => onNavigateTab?.('orders')
    },
    {
      id: 'overdue',
      icon: AlertTriangle,
      bg: '#FEF2F2',
      color: '#DC2626',
      value: `Rs. ${Number(stats?.overdueInvoiceAmount || 0).toLocaleString()}`,
      label: 'Total Overdue Amount',
      sub: 'Past due balances for entire sales team',
      clickable: true,
      onClick: () => { setBreakdownType('overdue'); setBreakdownSearch(''); }
    },
    {
      id: 'receivables',
      icon: DollarSign,
      bg: '#E0F2FE',
      color: '#0284C7',
      value: `Rs. ${Number(stats?.totalReceivables || 0).toLocaleString()}`,
      label: 'Total Receivables Amount',
      sub: 'All unpaid orders & invoices',
      clickable: true,
      onClick: () => { setBreakdownType('receivables'); setBreakdownSearch(''); }
    },
    {
      id: 'target',
      icon: Target,
      bg: '#FFFBEB',
      color: '#D97706',
      value: `${stats?.teamTargetAchievementPct || 0}%`,
      label: 'Team Target Attainment',
      sub: `Rs. ${Number(stats?.totalAchievedTarget || stats?.totalMonthlyRevenue || 0).toLocaleString()} achieved`,
      clickable: true,
      onClick: () => onNavigateTab?.('team')
    },
    {
      id: 'team',
      icon: Users,
      bg: '#F8FAFC',
      color: '#475569',
      value: String(stats?.totalTeamMembers || 0),
      label: 'Sales Representatives',
      sub: `${stats?.activeTeamMembers || 0} active team members`,
      clickable: true,
      onClick: () => onNavigateTab?.('team')
    },
    {
      id: 'leads',
      icon: TrendingUp,
      bg: '#F5F3FF',
      color: '#7C3AED',
      value: String(stats?.totalLeads || 0),
      label: 'Total Leads & Prospects',
      sub: `${stats?.convertedLeads || 0} converted (${stats?.leadConversionRate || 0}% rate)`,
      clickable: true,
      onClick: () => onNavigateTab?.('leads')
    }
  ];

  const leadSources = stats?.leadSources && stats.leadSources.length > 0
    ? stats.leadSources
    : [
      { name: 'Direct', value: stats?.totalLeads || 1 },
      { name: 'Website', value: 0 }
    ];

  const pipelineStages = stats?.pipelineStages || [];
  const recentActivities = stats?.recentActivities || [];
  const pendingTasks = stats?.pendingTasks || [];

  return (
    <div className="smd-dashboard-container">
      {/* ── TOP HEADER / BANNER ── */}
      <div className="smd-top-banner">
        <div>
          <h1 className="smd-title">Sales Manager Executive Portal</h1>
          <p className="smd-subtitle">Organization sales pipeline, team quotas, performance metrics & live analytics — {todayFormatted}</p>
        </div>
        <div className="smd-actions-row">
          <button className="smd-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Syncing...' : 'Sync Data'}
          </button>
          <button className="smd-primary-btn" onClick={() => onNavigateTab?.('team')}>
            <Users size={16} /> Manage Sales Team
          </button>
        </div>
      </div>

      {/* ── SECTION 1: TOP KPI CARDS ── */}
      <div className="smd-kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className={`smd-kpi-card ${kpi.clickable ? 'clickable' : ''}`}
              onClick={kpi.onClick}
              title={kpi.clickable ? `Click to open ${kpi.label}` : undefined}
            >
              <div className="smd-kpi-header">
                <div className="smd-kpi-icon" style={{ backgroundColor: kpi.bg, color: kpi.color }}>
                  <Icon size={20} />
                </div>
                {kpi.clickable && (
                  <span className="smd-kpi-link-arrow">
                    <ArrowRight size={14} />
                  </span>
                )}
              </div>
              <div className="smd-kpi-body">
                <span className="smd-kpi-val">{kpi.value}</span>
                <span className="smd-kpi-lbl">{kpi.label}</span>
                <span className="smd-kpi-sub">{kpi.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── SECTION 2: LEAD SOURCES DISTRIBUTION ── */}
      <div className="smd-charts-grid" style={{ gridTemplateColumns: '1fr' }}>
        {/* Lead Sources Distribution */}
        <div className="smd-chart-card">
          <div className="smd-chart-header">
            <div>
              <h3 className="smd-chart-title">Lead Acquisition Sources</h3>
              <p className="smd-chart-subtitle">Distribution of leads across marketing & direct channels</p>
            </div>
          </div>
          <div className="smd-donut-container">
            <div style={{ width: 180, height: 180, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {leadSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#FFF' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="smd-donut-center">
                <span className="center-total">{stats?.totalLeads || 0}</span>
                <span className="center-lbl">Leads</span>
              </div>
            </div>
            <div className="smd-donut-legend">
              {leadSources.map((entry, idx) => (
                <div key={entry.name} className="smd-legend-row">
                  <span className="legend-color-dot" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="legend-name">{entry.name}</span>
                  <span className="legend-val">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: REAL SALES PIPELINE STAGES KANBAN ── */}
      <div className="smd-pipeline-section">
        <div className="smd-section-header">
          <div className="smd-section-title-wrap">
            <Briefcase size={20} color="#2563EB" />
            <h2 className="smd-section-heading">Sales Pipeline & Active Deals</h2>
          </div>
          <button className="smd-view-all-link" onClick={() => onNavigateTab?.('deals')}>
            View All Deals <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="smd-kanban-grid">
          {pipelineStages.map((stg) => (
            <div key={stg.id} className="smd-kanban-col">
              <div className="kanban-col-header">
                <div className="kanban-header-top">
                  <span className="kanban-col-title">{stg.label}</span>
                  <span className="kanban-col-count">{stg.count}</span>
                </div>
                <span className="kanban-col-val">{stg.pipelineValue}</span>
              </div>

              <div className="kanban-cards-stack">
                {stg.deals.length === 0 ? (
                  <div className="kanban-empty-col">No deals</div>
                ) : (
                  stg.deals.slice(0, 4).map((deal) => (
                    <div key={deal.id} className="kanban-deal-card">
                      <div className="deal-card-top">
                        <span className="deal-card-name">{deal.title || deal.name}</span>
                        <span className="deal-card-val">{deal.value}</span>
                      </div>
                      <div className="deal-card-meta">
                        <span className="deal-card-company">{deal.company}</span>
                        <div className="deal-card-rep" title={`Assigned to ${deal.assignedTo}`}>
                          <div className="rep-avatar-xs">{deal.initials}</div>
                          <span>{deal.assignedTo}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 4: SALES ACTIVITIES & PENDING TEAM TASKS ── */}
      <div className="smd-bottom-grid">
        {/* Recent Sales Activities */}
        <div className="smd-widget-box">
          <div className="smd-widget-header">
            <div className="widget-header-title">
              <Activity size={18} color="#2563EB" />
              <h3>Recent Sales Team Activities</h3>
            </div>
          </div>
          <div className="smd-activities-list">
            {recentActivities.length === 0 ? (
              <div className="sv-empty">No recent team activities recorded yet.</div>
            ) : (
              recentActivities.map((act) => (
                <div key={act._id} className="smd-act-item">
                  <div className="smd-act-node" />
                  <div className="smd-act-info">
                    <div className="smd-act-header-row">
                      <span className="smd-act-rep">{act.performedBy?.fullName || 'Sales Team Member'}</span>
                      <span className="smd-act-time">{act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <p className="smd-act-desc">{act.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Sales & Team Tasks */}
        <div className="smd-widget-box">
          <div className="smd-widget-header">
            <div className="widget-header-title">
              <CheckCircle size={18} color="#10B981" />
              <h3>Pending Tasks & Action Items</h3>
            </div>
          </div>
          <div className="smd-tasks-list">
            {pendingTasks.length === 0 ? (
              <div className="sv-empty">No pending tasks. All clear!</div>
            ) : (
              pendingTasks.map((t) => (
                <div key={t._id} className="smd-task-item">
                  <div className="smd-task-left">
                    <div className="smd-task-bullet" />
                    <div>
                      <span className="smd-task-title">{t.title}</span>
                      <span className="smd-task-sub">Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Ongoing'} · {t.project || 'Sales'}</span>
                    </div>
                  </div>
                  <span className={`priority-badge ${(t.priority || 'medium').toLowerCase()}`}>
                    {t.priority || 'Medium'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE OVERDUE & RECEIVABLES BREAKDOWN MODAL ── */}
      {breakdownType && (
        <div className="sv-modal-overlay" onClick={() => setBreakdownType(null)}>
          <div
            className="sv-modal"
            style={{ maxWidth: '960px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sv-modal-header" style={{ borderBottom: '1px solid #E2E8F0', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: breakdownType === 'overdue' ? '#FEE2E2' : '#E0F2FE',
                  color: breakdownType === 'overdue' ? '#DC2626' : '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {breakdownType === 'overdue' ? <AlertTriangle size={20} /> : <DollarSign size={20} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                    {breakdownType === 'overdue'
                      ? 'Total Overdue Balances List (Entire Sales Team)'
                      : 'Total Outstanding Receivables List (Entire Sales Team)'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                    {breakdownType === 'overdue'
                      ? 'Showing overdue and past-due unpaid balances across all sales representatives'
                      : 'Showing all active unpaid and outstanding customer balances across all sales representatives'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBreakdownType(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Summary KPI Strip */}
            {(() => {
              const rawList = breakdownType === 'overdue' ? (stats?.overdueList || []) : (stats?.receivablesList || []);
              let list = [...rawList];
              if (breakdownSearch.trim()) {
                const term = breakdownSearch.toLowerCase();
                list = list.filter(it =>
                  (it.invoiceNumber && it.invoiceNumber.toLowerCase().includes(term)) ||
                  (it.clientName && it.clientName.toLowerCase().includes(term)) ||
                  (it.salesRep && it.salesRep.toLowerCase().includes(term)) ||
                  (it.status && it.status.toLowerCase().includes(term))
                );
              }
              const totalSum = list.reduce((sum, it) => sum + (Number(it.remainingBalance) || 0), 0);
              const totalOriginalSum = list.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
              const totalPaidSum = list.reduce((sum, it) => sum + (Number(it.paidAmount) || 0), 0);

              return (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '12px',
                    padding: '14px 20px',
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                        {breakdownType === 'overdue' ? 'Total Overdue Amount' : 'Total Receivables Amount'}
                      </span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: breakdownType === 'overdue' ? '#DC2626' : '#0284C7', marginTop: '2px' }}>
                        Rs. {totalSum.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                        {breakdownType === 'overdue' ? 'Overdue Invoices' : 'Outstanding Invoices'}
                      </span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                        {list.length} records {list.length !== rawList.length ? `(filtered from ${rawList.length})` : ''}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Sales Team Scope</span>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>
                        All Sales Representatives ({stats?.totalTeamMembers || 3} members)
                      </div>
                    </div>
                  </div>

                  {/* Search Filter Box */}
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid #F1F5F9', background: '#FFFFFF' }}>
                    <div className="sv-search-box" style={{ width: '100%', maxWidth: '400px' }}>
                      <Search size={15} />
                      <input
                        placeholder="Search customer, invoice #, sales rep..."
                        value={breakdownSearch}
                        onChange={e => setBreakdownSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <div style={{ padding: '0 20px', overflowY: 'auto', flex: 1, maxHeight: '420px' }}>
                    <table className="sv-table" style={{ marginTop: '8px', width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '36px' }}>#</th>
                          <th>Invoice Ref</th>
                          <th>Customer / Client</th>
                          <th>Sales Representative</th>
                          <th>Due Date</th>
                          <th style={{ textAlign: 'right' }}>Total Value</th>
                          <th style={{ textAlign: 'right' }}>Paid Amount</th>
                          <th style={{ textAlign: 'right' }}>
                            {breakdownType === 'overdue' ? 'Overdue Balance' : 'Remaining Balance'}
                          </th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.length === 0 ? (
                          <tr>
                            <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                              No matching {breakdownType} records found.
                            </td>
                          </tr>
                        ) : (
                          list.map((it, idx) => (
                            <tr key={it._id || idx}>
                              <td style={{ color: '#94A3B8', fontSize: '0.78rem' }}>{idx + 1}</td>
                              <td style={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                                {it.invoiceNumber || '—'}
                              </td>
                              <td style={{ fontWeight: 600, color: '#334155' }}>
                                {it.clientName || 'Client'}
                              </td>
                              <td>
                                <span style={{
                                  background: '#F1F5F9',
                                  color: '#334155',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600
                                }}>
                                  {it.salesRep || 'Sales Team'}
                                </span>
                              </td>
                              <td style={{ color: '#64748B', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                {it.dueDate ? new Date(it.dueDate).toLocaleDateString('en-GB') : '—'}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                                Rs. {Number(it.amount || 0).toLocaleString()}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669', whiteSpace: 'nowrap' }}>
                                Rs. {Number(it.paidAmount || 0).toLocaleString()}
                              </td>
                              <td style={{
                                textAlign: 'right',
                                fontWeight: 800,
                                color: breakdownType === 'overdue' ? '#DC2626' : '#0284C7',
                                whiteSpace: 'nowrap'
                              }}>
                                Rs. {Number(it.remainingBalance || 0).toLocaleString()}
                              </td>
                              <td>
                                <span
                                  className="sv-badge"
                                  style={{
                                    background: breakdownType === 'overdue' ? '#FEE2E2' : (it.status === 'Paid' ? '#ECFDF5' : '#E0F2FE'),
                                    color: breakdownType === 'overdue' ? '#DC2626' : (it.status === 'Paid' ? '#059669' : '#0284C7'),
                                    border: `1px solid ${breakdownType === 'overdue' ? '#FCA5A5' : '#BAE6FD'}`,
                                    fontSize: '0.75rem',
                                    padding: '2px 8px'
                                  }}
                                >
                                  {it.status || (breakdownType === 'overdue' ? 'Overdue' : 'Pending')}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {list.length > 0 && (
                        <tfoot>
                          <tr style={{ background: '#F8FAFC', fontWeight: 800, borderTop: '2px solid #CBD5E1' }}>
                            <td colSpan={5} style={{ textAlign: 'right', color: '#0F172A', padding: '10px 14px' }}>
                              Total Sum ({list.length} Items):
                            </td>
                            <td style={{ textAlign: 'right', color: '#334155', padding: '10px 14px', whiteSpace: 'nowrap' }}>
                              Rs. {totalOriginalSum.toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'right', color: '#059669', padding: '10px 14px', whiteSpace: 'nowrap' }}>
                              Rs. {totalPaidSum.toLocaleString()}
                            </td>
                            <td style={{
                              textAlign: 'right',
                              color: breakdownType === 'overdue' ? '#DC2626' : '#0284C7',
                              padding: '10px 14px',
                              fontSize: '1rem',
                              whiteSpace: 'nowrap'
                            }}>
                              Rs. {totalSum.toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Modal Footer Actions */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 20px',
                    borderTop: '1px solid #E2E8F0',
                    background: '#F8FAFC'
                  }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      Exact total matches dashboard card: <strong style={{ color: breakdownType === 'overdue' ? '#DC2626' : '#0284C7' }}>Rs. {totalSum.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="sv-btn-cancel"
                        onClick={() => setBreakdownType(null)}
                      >
                        Close
                      </button>
                      <button
                        className="sv-btn-primary"
                        onClick={() => {
                          setBreakdownType(null);
                          onNavigateTab?.('invoices');
                        }}
                      >
                        Go to Invoices Manager
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}