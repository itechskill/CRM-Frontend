import React from 'react';
import {
  Target,
  Globe,
  Building2,
  Users,
  DollarSign,
  FolderKanban,
  Megaphone,
  Calculator
} from 'lucide-react';
import './BusinessOverviewView.css';

export default function BusinessOverviewView() {
  const departmentSummaries = [
    {
      domain: 'HR Manager',
      icon: Users,
      color: '#0EA5E9',
      metrics: [
        { label: 'Active Headcount', value: '384 employees' },
        { label: 'Recruitment Summary', value: '24 Q3 active hires' },
        { label: 'Attendance Summary', value: '98.2% monthly rate' },
        { label: 'Org Performance Rating', value: '4.8 / 5.0' }
      ]
    },
    {
      domain: 'Sales Manager',
      icon: DollarSign,
      color: '#16A34A',
      metrics: [
        { label: 'Active Enterprise Clients', value: '142 accounts' },
        { label: 'Sales Pipeline Value', value: '$2.85M' },
        { label: 'Quarterly Deals Closed', value: '38 deals' },
        { label: 'Win Rate', value: '68.4%' }
      ]
    },
    {
      domain: 'Project Manager',
      icon: FolderKanban,
      color: '#6366F1',
      metrics: [
        { label: 'Active Projects', value: '18 client projects' },
        { label: 'On-Time Delivery Rate', value: '92.5%' },
        { label: 'Sprint Tasks Completed', value: '342 tasks' },
        { label: 'Client Quality Rating', value: '96.0%' }
      ]
    },
    {
      domain: 'Marketing',
      icon: Megaphone,
      color: '#D97706',
      metrics: [
        { label: 'Active Campaigns', value: '14 live campaigns' },
        { label: 'Qualified Leads (MQLs)', value: '1,280 leads/mo' },
        { label: 'Customer Acquisition Cost (CAC)', value: '$420 / account' },
        { label: 'Marketing ROI', value: '385%' }
      ]
    },
    {
      domain: 'Accounting / Finance',
      icon: Calculator,
      color: '#DB2777',
      metrics: [
        { label: 'Quarterly Revenue', value: '$1.25M' },
        { label: 'Operating Expenses', value: '$410K' },
        { label: 'Payroll Summary', value: '$620K / mo' },
        { label: 'Net Profit Margin', value: '34.2%' }
      ]
    },
    {
      domain: 'Administration',
      icon: Building2,
      color: '#9333EA',
      metrics: [
        { label: 'Managed Departments', value: '8 units' },
        { label: 'Employee Overview', value: '384 total headcount' },
        { label: 'Company Resource Assets', value: '98.5% allocated' },
        { label: 'Admin Compliance Score', value: '100%' }
      ]
    }
  ];

  return (
    <div className="ceo-view-container">
      {/* Top High Level Stat Cards */}
      <div className="ceo-grid-3">
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Market Share (Enterprise CRM)</span>
          <span className="ceo-stat-num">28.4%</span>
          <span style={{ color: '#16A34A', fontSize: '0.8rem', fontWeight: 600 }}>+4.2% YoY growth</span>
        </div>
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Net Promoter Score (NPS)</span>
          <span className="ceo-stat-num">72 / 100</span>
          <span style={{ color: '#6366F1', fontSize: '0.8rem', fontWeight: 600 }}>World Class Tier</span>
        </div>
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Customer Retention Rate</span>
          <span className="ceo-stat-num">96.8%</span>
          <span style={{ color: '#16A34A', fontSize: '0.8rem', fontWeight: 600 }}>Top 5% in SaaS</span>
        </div>
      </div>

      {/* Executive Company-Wide Visibility Panel */}
      <div className="ceo-card-panel">
        <div className="ceo-card-title">
          <span>Company-Wide Departmental Summaries (Executive Read Access)</span>
          <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 500 }}>Live Cross-Functional Metrics</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
          {departmentSummaries.map((dept, idx) => {
            const Icon = dept.icon;
            return (
              <div key={idx} className="ceo-dept-card">
                <div className="ceo-dept-card-top">
                  <div className="ceo-dept-identity">
                    <div className="ceo-dept-icon-box" style={{ backgroundColor: `${dept.color}1A`, color: dept.color }}>
                      <Icon size={20} />
                    </div>
                    <span className="ceo-dept-name">{dept.domain}</span>
                  </div>
                  <span className="ceo-access-badge">READ ACCESS</span>
                </div>

                <div className="ceo-dept-metrics">
                  {dept.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="ceo-metric-row">
                      <span className="ceo-metric-label">{m.label}:</span>
                      <span className="ceo-metric-value">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategic Goals Panel */}
      <div className="ceo-card-panel">
        <div className="ceo-card-title">
          <span>Strategic Pillars & Organizational Goals (2025 - 2026)</span>
        </div>
        <div className="ceo-goals-grid" style={{ marginTop: '16px' }}>
          <div className="ceo-goal-card">
            <div className="ceo-goal-header" style={{ color: '#6366F1' }}>
              <Globe size={18} /> Global Regional Expansion
            </div>
            <p className="ceo-goal-text">Establish regional operational hubs in Frankfurt & Singapore to support enterprise client scaling.</p>
          </div>
          <div className="ceo-goal-card">
            <div className="ceo-goal-header" style={{ color: '#16A34A' }}>
              <Target size={18} /> Product Innovation & AI Integration
            </div>
            <p className="ceo-goal-text">Launch automated lead scoring engines and AI predictive sales forecasting by Q4.</p>
          </div>
        </div>
      </div>
    </div>
  );
}