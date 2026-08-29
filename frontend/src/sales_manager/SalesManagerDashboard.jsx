import React from 'react';
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
import './SalesManagerDashboard.css';

const kpiData = [
  { icon: Users, bg: '#EFF6FF', color: '#2563EB', value: '142', label: 'Total Leads', change: '+18%', positive: true },
  { icon: TrendingUp, bg: '#F5F3FF', color: '#7C3AED', value: '67', label: 'Qualified Leads', change: '+12%', positive: true },
  { icon: Calendar, bg: '#ECFDF5', color: '#10B981', value: '23', label: 'Meetings Scheduled', change: '+8%', positive: true },
  { icon: FileText, bg: '#FEF3C7', color: '#D97706', value: '41', label: 'Proposals Sent', change: '-3%', positive: false },
  { icon: Briefcase, bg: '#ECFDF5', color: '#10B981', value: '18', label: 'Won Clients', change: '+22%', positive: true },
  { icon: Target, bg: '#FEE2E2', color: '#EF4444', value: '12.7%', label: 'Conversion Rate', change: '+1.4%', positive: true },
  { icon: DollarSign, bg: '#EFF6FF', color: '#2563EB', value: '$267K', label: 'Monthly Revenue', change: '+17%', positive: true },
  { icon: Target, bg: '#F5F3FF', color: '#7C3AED', value: '87%', label: 'Sales Target', change: '+5%', positive: true },
];

const revenueData = [
  { month: 'Mar', actual: 195, target: 210 },
  { month: 'Apr', actual: 215, target: 210 },
  { month: 'May', actual: 208, target: 215 },
  { month: 'Jun', actual: 230, target: 220 },
  { month: 'Jul', actual: 242, target: 220 },
  { month: 'Aug', actual: 267, target: 230 },
];

const leadSourcesData = [
  { name: 'Website', value: 35, color: '#2563EB' },
  { name: 'Referral', value: 25, color: '#10B981' },
  { name: 'Social Media', value: 20, color: '#F59E0B' },
  { name: 'Email', value: 12, color: '#EC4899' },
  { name: 'Other', value: 8, color: '#8B5CF6' },
];

const pipelineStages = [
  {
    id: 'new-lead',
    label: 'NEW LEAD',
    count: 3,
    pipelineValue: '$148k',
    headerBg: '#F8FAFC',
    headerColor: '#334155',
    badgeBg: '#0F172A',
    deals: [
      { name: 'Sarah Mitchell', priority: 'High', company: 'TechCorp Solutions', value: '$85k', initials: 'JC' },
      { name: 'Rachel Kim', priority: 'Medium', company: 'FuturePath Inc', value: '$35k', initials: 'PS' },
      { name: 'Tom Rivera', priority: 'Low', company: 'AlphaTech Systems', value: '$28k', initials: 'JC' },
    ],
  },
  {
    id: 'contacted',
    label: 'CONTACTED',
    count: 2,
    pipelineValue: '$137k',
    headerBg: '#EFF6FF',
    headerColor: '#1D4ED8',
    badgeBg: '#2563EB',
    deals: [
      { name: 'Emily Chen', priority: 'Medium', company: 'BlueWave Analytics', value: '$42k', initials: 'JC' },
      { name: 'Lisa Wong', priority: 'High', company: 'Meridian Capital', value: '$95k', initials: 'AT' },
    ],
  },
  {
    id: 'meeting-scheduled',
    label: 'MEETING SCHEDULED',
    count: 2,
    pipelineValue: '$265k',
    headerBg: '#F5F3FF',
    headerColor: '#7C3AED',
    badgeBg: '#8B5CF6',
    deals: [
      { name: 'David Park', priority: 'High', company: 'Nexus Dynamics', value: '$120k', initials: 'PS' },
      { name: 'Jennifer Walsh', priority: 'High', company: 'Summit Enterprises', value: '$145k', initials: 'AT' },
    ],
  },
  {
    id: 'proposal-sent',
    label: 'PROPOSAL SENT',
    count: 2,
    pipelineValue: '$310k',
    headerBg: '#FFFBEB',
    headerColor: '#B45309',
    badgeBg: '#F59E0B',
    deals: [
      { name: 'Marcus Johnson', priority: 'High', company: 'Pinnacle Group', value: '$200k', initials: 'AT' },
      { name: 'Natasha Brown', priority: 'High', company: 'CloudFirst Solutions', value: '$110k', initials: 'PS' },
    ],
  },
  {
    id: 'negotiation',
    label: 'NEGOTIATION',
    count: 1,
    pipelineValue: '$48k',
    headerBg: '#F0FDF4',
    headerColor: '#68bf88',
    badgeBg: '#22C55E',
    deals: [
      { name: 'Alex Freeman', priority: 'Medium', company: 'Digital Horizon', value: '$48k', initials: 'AT' },
    ],
  },
  {
    id: 'won',
    label: 'WON CLIENT',
    count: 1,
    pipelineValue: '$135k',
    headerBg: '#F0FDF4',
    headerColor: '#15803D',
    badgeBg: '#18bc54',
    deals: [
      { name: 'James Carter', priority: 'High', company: 'BuildCo Group', value: '$135k', initials: 'PS' },
    ],
  },
];

const priorityColors = {
  High: { bg: '#FEE2E2', color: '#DC2626' },
  Medium: { bg: '#FEF3C7', color: '#D97706' },
  Low: { bg: '#DCFCE7', color: '#15803D' },
};

const upcomingMeetings = [
  { day: '12', month: 'DEC', title: 'Nexus Dynamics — Platform Demo', time: '10:00 AM · 90 min', tag: 'Demo', tagColor: '#7C3AED', tagBg: '#F5F3FF' },
  { day: '11', month: 'DEC', title: 'Pinnacle Group — Contract Negotiation', time: '2:00 PM · 60 min', tag: 'Negotiation', tagColor: '#2563EB', tagBg: '#EFF6FF' },
  { day: '13', month: 'DEC', title: 'Summit Enterprises — Discovery Call', time: '11:00 AM · 45 min', tag: 'Discovery', tagColor: '#7C3AED', tagBg: '#F5F3FF' },
];

const activityTimeline = [
  { icon: '🏆', text: 'Priya Sharma closed Orbit Digital deal', amount: '$67,000', time: '2 hours ago' },
  { icon: '📅', text: 'Angela Torres scheduled demo with Pinnacle Group', amount: null, time: '4 hours ago' },
  { icon: '📄', text: 'Angela Torres sent proposal to Summit Enterprises', amount: '$145,000', time: '6 hours ago' },
  { icon: '👤', text: 'James Carter added TechCorp Solutions contact', amount: null, time: 'Yesterday' },
  { icon: '⭐', text: 'Priya Sharma qualified CloudFirst Solutions lead', amount: '$110,000', time: 'Yesterday' },
];

const teamPerformance = [
  { initials: 'AT', name: 'Angela', deals: '8 deals closed', pct: 89, closed: '$620k', quota: '$700k', avatarBg: '#2563EB', barColor: '#F59E0B' },
  { initials: 'JC', name: 'James', deals: '6 deals closed', pct: 89, closed: '$445k', quota: '$500k', avatarBg: '#8B5CF6', barColor: '#F59E0B' },
  { initials: 'PS', name: 'Priya', deals: '7 deals closed', pct: 93, closed: '$512k', quota: '$550k', avatarBg: '#10B981', barColor: '#10B981' },
];

export default function SalesManagerDashboard({ currentUser, onNavigateTab }) {
  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'there';
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="sales-sm-dash">
      {/* Welcome Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        padding: '20px 24px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
      }}>
        <h2 style={{ color: '#0F172A', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
          Good morning, {firstName} 📈
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '4px', margin: '4px 0 0 0' }}>
          Here's your sales pipeline and deal performance overview — {todayFormatted}
        </p>
      </div>

      {/* 8 KPI Cards */}
      <div className="sales-sm-kpi-grid">
        {kpiData.map((k, i) => {
          const Icon = k.icon;
          return (
            <div className="sales-sm-kpi-card" key={i}>
              <div className="kpi-card-top">
                <div className="kpi-icon-box" style={{ backgroundColor: k.bg, color: k.color }}>
                  <Icon size={20} />
                </div>
                <span className={`kpi-change-badge ${k.positive ? 'positive' : 'negative'}`}>
                  {k.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {k.change}
                </span>
              </div>
              <div className="kpi-card-value">{k.value}</div>
              <div className="kpi-card-label">{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart & Lead Sources */}
      <div className="sales-sm-grid-main">
        <div className="sales-sm-card chart-card">
          <div className="sales-sm-card-header">
            <div>
              <h3 className="sales-sm-card-title">Revenue vs Target</h3>
              <p className="sales-sm-card-sub">Last 6 months performance</p>
            </div>
            <span className="chart-trend-badge">↑ 17% vs last period</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v) => `$${v}k`} />
                <Tooltip
                  formatter={(val) => [`$${val}k`, '']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="actual" stroke="#2563EB" strokeWidth={2.5} dot={false} name="Actual Revenue" />
                <Line type="monotone" dataKey="target" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend-row">
            <span className="legend-item"><span className="legend-dot" style={{ background: '#2563EB' }}></span>Actual Revenue</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#10B981' }}></span>Target</span>
          </div>
        </div>

        <div className="sales-sm-card funnel-card">
          <div className="sales-sm-card-header">
            <div>
              <h3 className="sales-sm-card-title">Lead Sources</h3>
              <p className="sales-sm-card-sub">Distribution by channel</p>
            </div>
          </div>

          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leadSourcesData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {leadSourcesData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="lead-source-legend">
            {leadSourcesData.map((s, i) => (
              <div className="legend-row" key={i}>
                <span className="legend-dot" style={{ background: s.color }}></span>
                <span className="legend-label">{s.name}</span>
                <span className="legend-value">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Pipeline Board */}
      <div className="sales-sm-card pipeline-board-card">
        <div className="sales-sm-card-header">
          <div>
            <h3 className="sales-sm-card-title">Sales Pipeline</h3>
            <p className="sales-sm-card-sub">Active deals across all stages</p>
          </div>
          <button className="pipeline-view-all-btn" onClick={() => onNavigateTab && onNavigateTab('pipeline')}>
            View All <ArrowRight size={14} />
          </button>
        </div>

        <div className="pipeline-columns-scroll">
          {pipelineStages.map((stage) => (
            <div className="pipeline-column" key={stage.id}>
              <div
                className="pipeline-column-header"
                style={{ backgroundColor: stage.headerBg, borderColor: stage.headerBg }}
              >
                <div className="pipeline-column-header-top">
                  <span className="pipeline-stage-label" style={{ color: stage.headerColor }}>
                    {stage.label}
                  </span>
                  <span className="pipeline-count-badge" style={{ backgroundColor: stage.badgeBg }}>
                    {stage.count}
                  </span>
                </div>
                <span className="pipeline-stage-value" style={{ color: stage.headerColor }}>
                  {stage.pipelineValue} pipeline
                </span>
              </div>

              <div className="pipeline-deals-list">
                {stage.deals.map((deal, i) => {
                  const p = priorityColors[deal.priority] || priorityColors.Medium;
                  return (
                    <div className="pipeline-deal-card" key={i}>
                      <div className="pipeline-deal-top">
                        <span className="pipeline-deal-name">{deal.name}</span>
                        <span
                          className="pipeline-priority-tag"
                          style={{ backgroundColor: p.bg, color: p.color }}
                        >
                          {deal.priority}
                        </span>
                      </div>
                      <div className="pipeline-deal-company">
                        <Briefcase size={13} />
                        {deal.company}
                      </div>
                      <div className="pipeline-deal-bottom">
                        <span className="pipeline-deal-value">
                          <DollarSign size={13} />
                          {deal.value.replace('$', '')}
                        </span>
                        <span className="pipeline-deal-avatar">{deal.initials}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meetings / Activity / Team Performance */}
      <div className="sales-sm-grid-triple">
        {/* Upcoming Meetings */}
        <div className="sales-sm-card">
          <div className="sales-sm-card-header">
            <h3 className="sales-sm-card-title">Upcoming Meetings</h3>
            <button className="sales-sm-link-btn">View all</button>
          </div>

          <div className="meetings-list">
            {upcomingMeetings.map((m, i) => (
              <div className="meeting-row" key={i}>
                <div className="meeting-date-box">
                  <span className="meeting-day">{m.day}</span>
                  <span className="meeting-month">{m.month}</span>
                </div>
                <div className="meeting-info">
                  <span className="meeting-title">{m.title}</span>
                  <span className="meeting-time">{m.time}</span>
                  <span className="meeting-tag" style={{ backgroundColor: m.tagBg, color: m.tagColor }}>
                    {m.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="sales-sm-card">
          <div className="sales-sm-card-header">
            <h3 className="sales-sm-card-title">Activity Timeline</h3>
            <span className="live-badge">Live</span>
          </div>

          <div className="activity-list">
            {activityTimeline.map((a, i) => (
              <div className="activity-row" key={i}>
                <span className="activity-icon">{a.icon}</span>
                <div className="activity-info">
                  <span className="activity-text">
                    {a.text}
                    {a.amount && <span className="activity-amount"> {a.amount}</span>}
                  </span>
                  <span className="activity-time">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Performance */}
        <div className="sales-sm-card">
          <div className="sales-sm-card-header">
            <h3 className="sales-sm-card-title">Team Performance</h3>
            <button className="sales-sm-link-btn">Details</button>
          </div>

          <div className="team-perf-list">
            {teamPerformance.map((t, i) => (
              <div className="team-perf-row" key={i}>
                <div className="team-perf-top">
                  <div className="team-perf-left">
                    <span className="team-perf-avatar" style={{ backgroundColor: t.avatarBg }}>{t.initials}</span>
                    <div className="team-perf-names">
                      <span className="team-perf-name">{t.name}</span>
                      <span className="team-perf-deals">{t.deals}</span>
                    </div>
                  </div>
                  <span className="team-perf-pct" style={{ color: t.barColor }}>{t.pct}%</span>
                </div>
                <div className="team-perf-bar-track">
                  <div className="team-perf-bar-fill" style={{ width: `${t.pct}%`, backgroundColor: t.barColor }}></div>
                </div>
                <span className="team-perf-quota">{t.closed} / {t.quota} quota</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}