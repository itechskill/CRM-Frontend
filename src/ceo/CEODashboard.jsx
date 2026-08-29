import React from 'react';
import { TrendingUp, DollarSign, Users, Award, ArrowRight } from 'lucide-react';
import './CEODashboard.css';

export default function CEODashboard({ onNavigateTab, currentUser }) {
  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'Chief Executive Officer';

  const kpis = [
    { title: 'Annual Recurring Revenue', value: '$4.28M', change: '+18.4%', icon: DollarSign, iconClass: 'icon-blue' },
    { title: 'Active Enterprise Clients', value: '142', change: '+12 clients', icon: Award, iconClass: 'icon-purple' },
    { title: 'Total Headcount', value: '384', change: '+24 Q3 hires', icon: Users, iconClass: 'icon-green' },
    { title: 'Profit Margin', value: '34.2%', change: '+3.1%', icon: TrendingUp, iconClass: 'icon-amber' },
  ];

  const strategicInitiatives = [
    { name: 'Global Market Expansion (EMEA)', owner: 'Sarah Mitchell', progress: '85%', status: 'On Track', tag: 'active' },
    { name: 'Enterprise CRM Platform v4.0', owner: 'Daniel Torres', progress: '62%', status: 'On Track', tag: 'active' },
    { name: 'AI Analytics Integration', owner: 'Alex Vance', progress: '40%', status: 'Review Needed', tag: 'warning' },
    { name: 'ISO 27001 Security Audit', owner: 'Elena Rostova', progress: '95%', status: 'Final Stage', tag: 'active' },
  ];

  return (
    <div className="ceo-dashboard-container">
      {/* Welcome Banner */}
      <div style={{ marginBottom: '12px' }}>
        <h1 style={{ color: '#0F172A', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
          Good morning, {firstName} 👑
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '4px' }}>
          Executive Business Performance &amp; Strategic Operations
        </p>
      </div>

      {/* Executive KPIs */}
      <div className="ceo-kpi-grid">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="ceo-kpi-card">
              <div className="ceo-kpi-header">
                <span className="ceo-kpi-title">{kpi.title}</span>
                <div className={`ceo-kpi-icon ${kpi.iconClass}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="ceo-kpi-value">{kpi.value}</div>
              <div className="ceo-kpi-footer">
                <span className="ceo-badge-pos">{kpi.change}</span>
                <span className="ceo-kpi-subtext">vs last quarter</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Strategic Overview */}
      <div className="ceo-charts-row">
        <div className="ceo-card-panel">
          <div className="ceo-card-title">
            <span>Strategic Growth &amp; Revenue Target</span>
            <button
              className="ceo-card-title-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => onNavigateTab('sales_finance')}
            >
              View Financial Detail <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
            </button>
          </div>
          <div
            style={{
              height: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F8FAFC',
              border: '1px dashed #E2E8F0',
              borderRadius: '10px',
              color: '#94A3B8',
              fontSize: '0.85rem',
            }}
          >
            [ Interactive ARR vs Forecast Chart Placeholder ]
          </div>
        </div>

        <div className="ceo-card-panel">
          <div className="ceo-card-title">
            <span>Quarterly Executive Summary</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="ceo-summary-highlight">
              <div className="ceo-summary-highlight-title">Revenue Milestone Exceeded</div>
              <div className="ceo-summary-highlight-desc">
                Q3 targets met 12 days ahead of schedule driven by Sales expansion.
              </div>
            </div>
            <div className="ceo-summary-highlight" style={{ borderLeftColor: '#2563EB' }}>
              <div className="ceo-summary-highlight-title">Engineering Velocity</div>
              <div className="ceo-summary-highlight-desc">
                Release pipeline delivery velocity increased by 22%.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Initiatives Table */}
      <div className="ceo-card-panel">
        <div className="ceo-card-title">
          <span>Key Strategic Initiatives</span>
          <button
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#2563EB',
              padding: '7px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
            onClick={() => onNavigateTab('business_overview')}
          >
            Full Strategic Roadmap
          </button>
        </div>
        <table className="ceo-table">
          <thead>
            <tr>
              <th>Initiative</th>
              <th>Executive Lead</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {strategicInitiatives.map((item, index) => (
              <tr key={index}>
                <td style={{ fontWeight: 700, color: '#0F172A' }}>{item.name}</td>
                <td>{item.owner}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: item.progress, height: '100%', background: '#2563EB' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>{item.progress}</span>
                  </div>
                </td>
                <td>
                  <span className={`ceo-status-tag ${item.tag}`}>{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
