import React from 'react';
import { Target, TrendingUp, Users, Star, Download, ChevronDown } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import './ProjectReportsView.css';

/* ---------------- Data ---------------- */

const reportKpis = [
  {
    id: 1,
    icon: Target,
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    value: '$1.065M',
    label: 'Total Portfolio Value',
    subtext: 'Across 6 projects',
  },
  {
    id: 2,
    icon: TrendingUp,
    iconBg: '#ECFDF5',
    iconColor: '#16A34A',
    value: '83%',
    label: 'On-Time Delivery Rate',
    subtext: '+4% vs Q1',
  },
  {
    id: 3,
    icon: Users,
    iconBg: '#FDF4FF',
    iconColor: '#C026D3',
    value: '72%',
    label: 'Team Utilization',
    subtext: 'Optimal range',
  },
  {
    id: 4,
    icon: Star,
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    value: '94%',
    label: 'Client Satisfaction',
    subtext: '4.7 avg rating',
  },
];

const budgetVsActualData = [
  { month: 'Jan', budget: 75, actual: 95 },
  { month: 'Feb', budget: 65, actual: 80 },
  { month: 'Mar', budget: 90, actual: 85 },
  { month: 'Apr', budget: 105, actual: 120 },
  { month: 'May', budget: 95, actual: 110 },
  { month: 'Jun', budget: 120, actual: 100 },
  { month: 'Jul', budget: 110, actual: 130 },
  { month: 'Aug', budget: 130, actual: 125 },
];

const teamProductivityData = [
  { name: 'Sarah', assigned: 14, completed: 8 },
  { name: 'Daniel', assigned: 11, completed: 7 },
  { name: 'Aisha', assigned: 9, completed: 5 },
  { name: 'Marcus', assigned: 15, completed: 13 },
  { name: 'Elena', assigned: 7, completed: 4 },
];

const projectSummaryData = [
  { id: 1, name: 'Nexus Platform Redesign', client: 'TechCorp', budget: '$185,000', progress: 68, health: 'Good', status: 'In Progress' },
  { id: 2, name: 'DataSync Integration Suite', client: 'FinanceHub', budget: '$95,000', progress: 42, health: 'At Risk', status: 'In Progress' },
  { id: 3, name: 'Mobile Commerce App', client: 'RetailMax', budget: '$220,000', progress: 85, health: 'Good', status: 'Review' },
  { id: 4, name: 'Cloud Migration v2.0', client: 'GlobalBank', budget: '$340,000', progress: 31, health: 'At Risk', status: 'In Progress' },
  { id: 5, name: 'AI Analytics Dashboard', client: 'MetaInsights', budget: '$150,000', progress: 100, health: 'Good', status: 'Completed' },
  { id: 6, name: 'Security Audit System', client: 'SecureVault', budget: '$75,000', progress: 15, health: 'Good', status: 'Planning' },
];

const summaryStatusStyles = {
  'In Progress': { bg: '#DBEAFE', color: '#2563EB' },
  'Review': { bg: '#F3E8FF', color: '#7C3AED' },
  'Completed': { bg: '#DCFCE7', color: '#15803D' },
  'Planning': { bg: '#F1F5F9', color: '#475569' },
};

const summaryHealthDotColor = {
  Good: '#10B981',
  'At Risk': '#F59E0B',
};

/* ---------------- Component ---------------- */

export default function ProjectReportsView() {
  return (
    <div className="project-reports-container">
      {/* Page Header */}
      <div className="reports-page-header">
        <div>
          <h1 className="reports-page-title">Reports & Analytics</h1>
          <p className="reports-page-subtitle">Executive summary and project performance metrics</p>
        </div>

        <div className="reports-page-actions">
          <div className="reports-quarter-select">
            <span>Q2 2025</span>
            <ChevronDown size={16} />
          </div>
          <button className="reports-export-btn">
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="reports-kpi-grid">
        {reportKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.id} className="reports-kpi-card">
              <div className="reports-kpi-icon" style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}>
                <Icon size={22} />
              </div>
              <div className="reports-kpi-value">{kpi.value}</div>
              <div className="reports-kpi-label">{kpi.label}</div>
              <div className="reports-kpi-subtext">{kpi.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="reports-charts-grid">
        {/* Budget vs Actual Spend */}
        <div className="reports-chart-widget">
          <div className="reports-chart-header">
            <h3 className="reports-chart-title">Budget vs Actual Spend</h3>
            <p className="reports-chart-subtitle">Monthly budget tracking across all projects</p>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActualData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  ticks={[35, 70, 105, 140]}
                  tickFormatter={(v) => `$${v}k`}
                />
                <Tooltip
                  formatter={(val) => [`$${val}k`, '']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="budget" fill="#BFDBFE" radius={[3, 3, 0, 0]} barSize={16} name="Budget" />
                <Bar dataKey="actual" fill="#2563EB" radius={[3, 3, 0, 0]} barSize={16} name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Productivity */}
        <div className="reports-chart-widget">
          <div className="reports-chart-header">
            <h3 className="reports-chart-title">Team Productivity</h3>
            <p className="reports-chart-subtitle">Tasks assigned vs completed per team member</p>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamProductivityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  ticks={[4, 8, 12, 16]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="assigned" fill="#CBD5E1" radius={[3, 3, 0, 0]} barSize={16} name="Assigned" />
                <Bar dataKey="completed" fill="#10B981" radius={[3, 3, 0, 0]} barSize={16} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Project Performance Summary */}
      <div className="reports-summary-widget">
        <div className="reports-summary-header">
          <h3 className="reports-summary-title">Project Performance Summary</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="reports-summary-table">
            <thead>
              <tr>
                <th>PROJECT</th>
                <th>CLIENT</th>
                <th>BUDGET</th>
                <th>PROGRESS</th>
                <th>HEALTH</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {projectSummaryData.map((proj) => {
                const statusStyle = summaryStatusStyles[proj.status] || summaryStatusStyles['In Progress'];
                return (
                  <tr key={proj.id}>
                    <td className="reports-summary-project-name">{proj.name}</td>
                    <td className="reports-summary-client">{proj.client}</td>
                    <td className="reports-summary-budget">{proj.budget}</td>
                    <td>
                      <div className="reports-summary-progress">
                        <div className="reports-summary-progress-track">
                          <div
                            className="reports-summary-progress-fill"
                            style={{ width: `${proj.progress}%` }}
                          ></div>
                        </div>
                        <span className="reports-summary-progress-pct">{proj.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="reports-summary-health">
                        <span
                          className="reports-summary-health-dot"
                          style={{ backgroundColor: summaryHealthDotColor[proj.health] || '#94A3B8' }}
                        ></span>
                        <span
                          className="reports-summary-health-label"
                          style={{ color: proj.health === 'Good' ? '#15803D' : '#B45309' }}
                        >
                          {proj.health}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="reports-summary-status-pill"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                      >
                        {proj.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

