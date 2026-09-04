import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Calendar,
  FileText,
  Briefcase,
  Target,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Plus
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
        <p>Loading real-time sales & performance data from MongoDB...</p>
      </div>
    );
  }

  const kpis = [
    {
      id: 'team',
      icon: Users,
      bg: '#EFF6FF',
      color: '#2563EB',
      value: String(stats?.totalTeamMembers || 0),
      label: 'Total Sales Team Members',
      sub: `${stats?.activeTeamMembers || 0} active members`,
      clickable: true,
      onClick: () => onNavigateTab?.('team')
    },
    {
      id: 'leads',
      icon: TrendingUp,
      bg: '#F5F3FF',
      color: '#7C3AED',
      value: String(stats?.totalLeads || 0),
      label: 'Total Leads',
      sub: `${stats?.convertedLeads || 0} converted (${stats?.leadConversionRate || 0}% rate)`,
      clickable: true,
      onClick: () => onNavigateTab?.('leads')
    },
    {
      id: 'deals',
      icon: Briefcase,
      bg: '#ECFDF5',
      color: '#10B981',
      value: String(stats?.wonDealsCount || 0),
      label: 'Won Deals',
      sub: `$${Number(stats?.wonDealsValue || 0).toLocaleString()} won volume`,
      clickable: true,
      onClick: () => onNavigateTab?.('deals')
    },
    {
      id: 'pipeline',
      icon: DollarSign,
      bg: '#EFF6FF',
      color: '#0284C7',
      value: `$${Number(stats?.totalPipelineValue || 0).toLocaleString()}`,
      label: 'Active Pipeline Value',
      sub: `${stats?.totalDeals || 0} active deals in progress`,
      clickable: true,
      onClick: () => onNavigateTab?.('pipeline')
    },
    {
      id: 'revenue',
      icon: DollarSign,
      bg: '#ECFDF5',
      color: '#059669',
      value: `$${Number(stats?.totalMonthlyRevenue || 0).toLocaleString()}`,
      label: 'Total Sales Revenue',
      sub: `$${Number(stats?.totalReceivables || 0).toLocaleString()} receivables`,
      clickable: false
    },
    {
      id: 'target',
      icon: Target,
      bg: '#FFFBEB',
      color: '#D97706',
      value: `${stats?.teamTargetAchievementPct || 0}%`,
      label: 'Team Target Attainment',
      sub: `$${Number(stats?.totalAchievedTarget || 0).toLocaleString()} of $${Number(stats?.totalTargetAmount || 0).toLocaleString()}`,
      clickable: true,
      onClick: () => onNavigateTab?.('team')
    }
  ];

  const revenueData = stats?.revenueTrend && stats.revenueTrend.length > 0
    ? stats.revenueTrend
    : [
        { month: 'Mar', actual: 0, target: 100 },
        { month: 'Apr', actual: 0, target: 100 },
        { month: 'May', actual: 0, target: 100 },
        { month: 'Jun', actual: 0, target: 100 },
        { month: 'Jul', actual: 0, target: 100 },
        { month: 'Aug', actual: 0, target: 100 }
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
          <p className="smd-subtitle">Organization sales pipeline, team quotas, performance metrics & live MongoDB analytics — {todayFormatted}</p>
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

      {/* ── SECTION 1: TOP KPI CARDS (Featuring "Total Sales Team Members" as #1) ── */}
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

      {/* ── SECTION 2: SALES & TEAM PERFORMANCE CHARTS ── */}
      <div className="smd-charts-grid">
        {/* Revenue Performance Trend */}
        <div className="smd-chart-card">
          <div className="smd-chart-header">
            <div>
              <h3 className="smd-chart-title">Revenue & Quota Trend</h3>
              <p className="smd-chart-subtitle">Monthly sales revenue calculated from invoices & delivered orders (in $K)</p>
            </div>
            <div className="smd-chart-legend">
              <span className="legend-item"><span className="dot blue" /> Actual Revenue</span>
              <span className="legend-item"><span className="dot dashed" /> Sales Target</span>
            </div>
          </div>
          <div className="smd-chart-body" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#FFF' }}
                  formatter={(val) => [`$${val}k`, '']}
                />
                <Line type="monotone" dataKey="actual" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="target" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

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
    </div>
  );
}