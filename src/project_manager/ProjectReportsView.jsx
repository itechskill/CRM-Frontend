import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Users, Star, Download, ChevronDown } from 'lucide-react';
import { apiRequest } from '../utils/api';
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
    value: 'Rs. 1.065M',
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
  { id: 1, name: 'Nexus Platform Redesign', client: 'TechCorp', budget: 'Rs. 185,000', progress: 68, health: 'Good', status: 'In Progress' },
  { id: 2, name: 'DataSync Integration Suite', client: 'FinanceHub', budget: 'Rs. 95,000', progress: 42, health: 'At Risk', status: 'In Progress' },
  { id: 3, name: 'Mobile Commerce App', client: 'RetailMax', budget: 'Rs. 220,000', progress: 85, health: 'Good', status: 'Review' },
  { id: 4, name: 'Cloud Migration v2.0', client: 'GlobalBank', budget: 'Rs. 340,000', progress: 31, health: 'At Risk', status: 'In Progress' },
  { id: 5, name: 'AI Analytics Dashboard', client: 'MetaInsights', budget: 'Rs. 150,000', progress: 100, health: 'Good', status: 'Completed' },
  { id: 6, name: 'Security Audit System', client: 'SecureVault', budget: 'Rs. 75,000', progress: 15, health: 'Good', status: 'Planning' },
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
  const [workUpdates, setWorkUpdates] = useState([]);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const { response, data } = await apiRequest('/api/work-updates');
        if (response.ok && data.success && Array.isArray(data.data)) {
          setWorkUpdates(data.data);
        }
      } catch (err) {
        console.error('Fetch work updates error in ProjectReportsView:', err);
      }
    };
    fetchUpdates();
  }, []);

  return (
    <div className="project-reports-container">
      {/* Page Header */}
      <div className="reports-page-header">
        <div>
          <h1 className="reports-page-title">Project Reports & Performance</h1>
          <p className="reports-page-sub">Comprehensive portfolio metrics, financial budget tracking, and team productivity logs.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="reports-kpi-grid">
        {reportKpis.map((kpi) => {
          const IconComponent = kpi.icon;
          return (
            <div className="reports-kpi-card" key={kpi.id}>
              <div className="reports-kpi-top">
                <div
                  className="reports-kpi-icon"
                  style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}
                >
                  <IconComponent size={20} />
                </div>
              </div>
              <div className="reports-kpi-value">{kpi.value}</div>
              <div className="reports-kpi-label">{kpi.label}</div>
              <div className="reports-kpi-subtext">{kpi.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Employee Work Updates Widget */}
      <div className="reports-summary-widget" style={{ marginBottom: '24px' }}>
        <div className="reports-summary-header">
          <h3 className="reports-summary-title">Employee Work Updates & Standups ({workUpdates.length})</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="reports-summary-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>DATE</th>
                <th>HOURS</th>
                <th>ACCOMPLISHMENTS</th>
                <th>PLANNED NEXT</th>
                <th>BLOCKERS</th>
              </tr>
            </thead>
            <tbody>
              {workUpdates.map((up) => (
                <tr key={up._id}>
                  <td className="reports-summary-project-name">{up.userName || up.user?.fullName || 'Employee'}</td>
                  <td>{new Date(up.date || up.createdAt).toLocaleDateString()}</td>
                  <td><strong>{up.hoursSpent || 0} hrs</strong></td>
                  <td style={{ maxWidth: '260px', fontSize: '0.85rem' }}>{up.summary || '—'}</td>
                  <td style={{ maxWidth: '200px', fontSize: '0.85rem', color: '#2563EB' }}>{up.planned || '—'}</td>
                  <td style={{ maxWidth: '180px', fontSize: '0.85rem', color: up.blockers ? '#DC2626' : '#64748B' }}>{up.blockers || 'None'}</td>
                </tr>
              ))}
              {workUpdates.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: '24px' }}>No work updates submitted yet.</td>
                </tr>
              )}
            </tbody>
          </table>
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

