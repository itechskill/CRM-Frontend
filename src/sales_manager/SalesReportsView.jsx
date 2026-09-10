import React from 'react';
import { Download, Calendar, DollarSign, Users, Target, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './SalesReportsView.css';

const weeklyActivityData = [
  { week: 'W45', calls: 62, emails: 78, meetings: 12 },
  { week: 'W46', calls: 58, emails: 88, meetings: 10 },
  { week: 'W47', calls: 68, emails: 92, meetings: 14 },
  { week: 'W48', calls: 72, emails: 100, meetings: 16 },
  { week: 'W49', calls: 55, emails: 82, meetings: 13 },
  { week: 'W50', calls: 80, emails: 108, meetings: 15 },
];

const leadSourcesData = [
  { name: 'LinkedIn', value: 34, color: '#2563EB' },
  { name: 'Referral', value: 24, color: '#10B981' },
  { name: 'Website', value: 18, color: '#F59E0B' },
  { name: 'Cold Outreach', value: 14, color: '#8B5CF6' },
  { name: 'Trade Show', value: 10, color: '#EF4444' },
];

const leaderboardData = [
  {
    rank: 1,
    medal: '🥇',
    name: 'Angela Torres',
    initials: 'AT',
    avatarBg: '#2563EB',
    leads: 42,
    dealsClosed: 8,
    revenue: 'Rs. 620k',
    quota: 'Rs. 700k',
    attainment: 89,
    attainmentColor: '#D97706',
    progressColor: '#F59E0B',
  },
  {
    rank: 2,
    medal: '🥈',
    name: 'James Carter',
    initials: 'JC',
    avatarBg: '#8B5CF6',
    leads: 38,
    dealsClosed: 6,
    revenue: 'Rs. 445k',
    quota: 'Rs. 500k',
    attainment: 89,
    attainmentColor: '#D97706',
    progressColor: '#F59E0B',
  },
  {
    rank: 3,
    medal: '🥉',
    name: 'Priya Sharma',
    initials: 'PS',
    avatarBg: '#10B981',
    leads: 35,
    dealsClosed: 7,
    revenue: 'Rs. 512k',
    quota: 'Rs. 550k',
    attainment: 93,
    attainmentColor: '#16A34A',
    progressColor: '#10B981',
  },
];

const quarterlyData = [
  { quarter: 'Q1 2024', revenue: 520, leads: 104 },
  { quarter: 'Q2 2024', revenue: 640, leads: 128 },
  { quarter: 'Q3 2024', revenue: 590, leads: 118 },
  { quarter: 'Q4 2024', revenue: 760, leads: 152 },
];

const monthlyTrendData = [
  { month: 'Jul', revenue: 155 },
  { month: 'Aug', revenue: 168 },
  { month: 'Sep', revenue: 172 },
  { month: 'Oct', revenue: 195 },
  { month: 'Nov', revenue: 205 },
  { month: 'Dec', revenue: 225 },
];

const statCards = [
  {
    label: 'Total Revenue',
    value: 'Rs. 2.51M',
    change: '+23%',
    icon: DollarSign,
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    label: 'Total Leads',
    value: '470',
    change: '+15%',
    icon: Users,
    iconBg: '#F3E8FF',
    iconColor: '#8B5CF6',
  },
  {
    label: 'Deals Closed',
    value: '58',
    change: '+18%',
    icon: Target,
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
  },
  {
    label: 'Avg Deal Size',
    value: 'Rs. 43.3k',
    change: '+9%',
    icon: TrendingUp,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
];

export default function SalesReportsView() {
  const handleExportCSV = () => {
    const headers = ['Quarter', 'Revenue (Rs. k)', 'Leads'];
    const rows = quarterlyData.map(q => [q.quarter, q.revenue, q.leads]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Sales_Performance_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="sales-sm-reports-view">
      {/* Header */}
      <div className="reports-page-header">
        <div>
          <h1 className="reports-page-title">Reports & Analytics</h1>
          <p className="reports-page-sub">Performance insights · Q4 2024</p>
        </div>
        <div className="reports-page-actions">
          <button className="reports-range-btn">
            <Calendar size={16} />
            <span>Q4 2024</span>
          </button>
          <button className="export-btn" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="reports-stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="reports-stat-card" key={card.label}>
              <div className="reports-stat-top">
                <div
                  className="reports-stat-icon"
                  style={{ backgroundColor: card.iconBg, color: card.iconColor }}
                >
                  <Icon size={20} />
                </div>
                <span className="reports-stat-badge">{card.change}</span>
              </div>
              <div className="reports-stat-value">{card.value}</div>
              <div className="reports-stat-label">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* 2 Charts Grid */}
      <div className="reports-charts-grid">
        {/* Quarterly Revenue Bar Chart */}
        <div className="reports-chart-card">
          <div className="reports-chart-header">
            <h3>Quarterly Revenue</h3>
            <p>Revenue and leads by quarter</p>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  tickFormatter={(v) => `Rs. ${v}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="left"
                  iconType="square"
                  wrapperStyle={{ fontSize: '0.8rem', fontWeight: 500, paddingTop: '12px' }}
                />
                <Bar yAxisId="left" dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={22} name="Revenue" />
                <Bar yAxisId="right" dataKey="leads" fill="#BFDBFE" radius={[4, 4, 0, 0]} barSize={22} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Trend Area Chart */}
        <div className="reports-chart-card">
          <div className="reports-chart-header">
            <h3>Monthly Revenue Trend</h3>
            <p>Revenue vs target (Jul–Dec 2024)</p>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  tickFormatter={(v) => `Rs. ${v}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="left"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '0.8rem', fontWeight: 500, paddingTop: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#salesRevenueGradient)"
                  dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Activity Breakdown + Lead Sources */}
      <div className="reports-charts-grid">
        {/* Weekly Activity Breakdown Stacked Bar Chart */}
        <div className="reports-chart-card">
          <div className="reports-chart-header">
            <h3>Weekly Activity Breakdown</h3>
            <p>Calls, emails, and meetings per week</p>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  ticks={[0, 55, 110, 165, 220]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="left"
                  iconType="square"
                  wrapperStyle={{ fontSize: '0.8rem', fontWeight: 500, paddingTop: '12px' }}
                />
                <Bar dataKey="calls" stackId="activity" fill="#2563EB" name="Calls" barSize={38} />
                <Bar dataKey="emails" stackId="activity" fill="#BFDBFE" name="Emails" barSize={38} />
                <Bar dataKey="meetings" stackId="activity" fill="#10B981" name="Meetings" barSize={38} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources Donut Chart */}
        <div className="reports-chart-card">
          <div className="reports-chart-header">
            <h3>Lead Sources</h3>
            <p>Channel distribution</p>
          </div>

          <div className="lead-sources-body">
            <div className="lead-sources-donut">
              <PieChart width={200} height={200}>
                <Pie
                  data={leadSourcesData}
                  dataKey="value"
                  nameKey="name"
                  cx={100}
                  cy={100}
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  startAngle={90}
                  endAngle={-270}
                >
                  {leadSourcesData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </div>

            <div className="lead-sources-legend">
              {leadSourcesData.map((src) => (
                <div className="lead-source-row" key={src.name}>
                  <div className="lead-source-left">
                    <span className="lead-source-dot" style={{ backgroundColor: src.color }}></span>
                    <span className="lead-source-name">{src.name}</span>
                  </div>
                  <span className="lead-source-percent">{src.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance Leaderboard */}
      <div className="reports-chart-card">
        <div className="reports-chart-header">
          <h3>Team Performance Leaderboard</h3>
          <p>Q4 2024 performance against quota</p>
        </div>

        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Sales Rep</th>
                <th>Leads</th>
                <th>Deals Closed</th>
                <th>Revenue</th>
                <th>Quota</th>
                <th>Attainment</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((rep) => (
                <tr key={rep.rank}>
                  <td className="leaderboard-medal">{rep.medal}</td>
                  <td>
                    <div className="leaderboard-rep">
                      <span
                        className="leaderboard-avatar"
                        style={{ backgroundColor: rep.avatarBg }}
                      >
                        {rep.initials}
                      </span>
                      <span className="leaderboard-name">{rep.name}</span>
                    </div>
                  </td>
                  <td className="leaderboard-cell">{rep.leads}</td>
                  <td className="leaderboard-cell">{rep.dealsClosed}</td>
                  <td className="leaderboard-revenue">{rep.revenue}</td>
                  <td className="leaderboard-cell">{rep.quota}</td>
                  <td className="leaderboard-attainment" style={{ color: rep.attainmentColor }}>
                    {rep.attainment}%
                  </td>
                  <td>
                    <div className="leaderboard-progress-track">
                      <div
                        className="leaderboard-progress-fill"
                        style={{ width: `${rep.attainment}%`, backgroundColor: rep.progressColor }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
