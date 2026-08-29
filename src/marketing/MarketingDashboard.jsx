import React from 'react';
import {
  Megaphone,
  Target,
  Share2,
  TrendingUp,
  ArrowUpRight,
  Users,
  DollarSign,
  PieChart,
  Plus,
  Zap,
  Eye,
  BarChart3,
  Award
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import './MarketingDashboard.css';
import './MarketingViews.css';

const leadTrendData = [
  { month: 'Jan', mqls: 180, sqls: 65, converted: 24 },
  { month: 'Feb', mqls: 240, sqls: 90, converted: 38 },
  { month: 'Mar', mqls: 310, sqls: 125, converted: 52 },
  { month: 'Apr', mqls: 280, sqls: 110, converted: 45 },
  { month: 'May', mqls: 390, sqls: 160, converted: 68 },
  { month: 'Jun', mqls: 420, sqls: 185, converted: 79 },
  { month: 'Jul', mqls: 480, sqls: 210, converted: 94 },
  { month: 'Aug', mqls: 520, sqls: 235, converted: 108 },
];

const channelShare = [
  { channel: 'Google Paid Search', mqls: 540, pct: '36%' },
  { channel: 'Organic Search (SEO)', mqls: 380, pct: '26%' },
  { channel: 'LinkedIn & Social Ads', mqls: 290, pct: '20%' },
  { channel: 'Email Marketing', mqls: 160, pct: '11%' },
  { channel: 'Webinars & Events', mqls: 110, pct: '7%' },
];

const topCampaigns = [
  { id: 'CMP-2026-01', name: 'Q3 Enterprise SaaS Launch', channel: 'Google Ads', spend: '$12,400', leads: 412, ctr: '5.2%', roi: '380%', status: 'Active' },
  { id: 'CMP-2026-02', name: 'LinkedIn Executive Retargeting', channel: 'LinkedIn', spend: '$8,200', leads: 264, ctr: '4.1%', roi: '290%', status: 'Active' },
  { id: 'CMP-2026-03', name: 'Summer Product Webinar Series', channel: 'Webinar', spend: '$3,500', leads: 185, ctr: '6.8%', roi: '450%', status: 'Completed' },
  { id: 'CMP-2026-04', name: 'SEO & Content Funnel Boost', channel: 'Organic SEO', spend: '$4,400', leads: 320, ctr: '3.9%', roi: '510%', status: 'Active' },
];

export default function MarketingDashboard({ currentUser, onNavigateTab, onOpenCampaignModal, onOpenLeadModal }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#0F172A',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
          fontSize: '0.82rem',
          border: '1px solid #334155'
        }}>
          <p style={{ fontWeight: 700, marginBottom: '6px', color: '#94A3B8' }}>{label} Lead Metrics</p>
          <p style={{ color: '#2563EB', fontWeight: 600 }}>
            MQLs: {payload[0]?.value}
          </p>
          <p style={{ color: '#8B5CF6', fontWeight: 600, marginTop: '2px' }}>
            SQLs: {payload[1]?.value}
          </p>
        </div>
      );
    }
    return null;
  };

  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'there';
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="mkt-dashboard mkt-view-container">
      {/* Welcome Banner */}
      <div className="mkt-welcome-banner">
        <div className="mkt-welcome-left">
          <h2>Good morning, {firstName}! 🚀</h2>
          <p>Here's your marketing performance overview for today — {todayFormatted}</p>
        </div>
        <div className="mkt-welcome-stats">
          <div className="mkt-welcome-stat">
            <span className="mkt-welcome-stat-value">1,480</span>
            <span className="mkt-welcome-stat-label">Total MQLs</span>
          </div>
          <div className="mkt-welcome-stat">
            <span className="mkt-welcome-stat-value">12</span>
            <span className="mkt-welcome-stat-label">Active Campaigns</span>
          </div>
          <div className="mkt-welcome-stat">
            <span className="mkt-welcome-stat-value">340%</span>
            <span className="mkt-welcome-stat-label">Avg Return (ROMI)</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="mkt-quick-actions">
        <div className="mkt-action-card" onClick={onOpenCampaignModal}>
          <div className="mkt-action-icon" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            <Megaphone size={20} />
          </div>
          <div className="mkt-action-info">
            <span className="mkt-action-title">Create Campaign</span>
            <span className="mkt-action-desc">Launch ad or email sprint</span>
          </div>
        </div>

        <div className="mkt-action-card" onClick={onOpenLeadModal}>
          <div className="mkt-action-icon" style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
            <Target size={20} />
          </div>
          <div className="mkt-action-info">
            <span className="mkt-action-title">Add Lead (MQL)</span>
            <span className="mkt-action-desc">Record prospect contact</span>
          </div>
        </div>

        <div className="mkt-action-card" onClick={() => onNavigateTab('content')}>
          <div className="mkt-action-icon" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            <Share2 size={20} />
          </div>
          <div className="mkt-action-info">
            <span className="mkt-action-title">Schedule Post</span>
            <span className="mkt-action-desc">Publish social media content</span>
          </div>
        </div>

        <div className="mkt-action-card" onClick={() => onNavigateTab('analytics')}>
          <div className="mkt-action-icon" style={{ backgroundColor: '#DCFCE7', color: '#059669' }}>
            <BarChart3 size={20} />
          </div>
          <div className="mkt-action-info">
            <span className="mkt-action-title">Marketing Analytics</span>
            <span className="mkt-action-desc">Inspect traffic & funnels</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="mkt-kpi-grid">
        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Total MQLs (YTD)</span>
            <div className="mkt-kpi-icon pink"><Target size={18} /></div>
          </div>
          <div className="mkt-kpi-value">2,820</div>
          <div className="mkt-kpi-subtitle up">
            <ArrowUpRight size={14} /> +18.4% vs last quarter
          </div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Active Campaigns</span>
            <div className="mkt-kpi-icon purple"><Megaphone size={18} /></div>
          </div>
          <div className="mkt-kpi-value">12</div>
          <div className="mkt-kpi-subtitle">Across 4 major channels</div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Avg. Click-Through Rate (CTR)</span>
            <div className="mkt-kpi-icon blue"><Zap size={18} /></div>
          </div>
          <div className="mkt-kpi-value">4.8%</div>
          <div className="mkt-kpi-subtitle up">
            <ArrowUpRight size={14} /> +1.2% above benchmark
          </div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Return on Ad Spend (ROAS)</span>
            <div className="mkt-kpi-icon emerald"><Award size={18} /></div>
          </div>
          <div className="mkt-kpi-value">4.2x</div>
          <div className="mkt-kpi-subtitle up">High performing campaigns</div>
        </div>
      </div>

      {/* Financial & Lead Charts Grid */}
      <div className="mkt-charts-grid">
        {/* Lead Trend Area Chart */}
        <div className="mkt-chart-card">
          <div className="mkt-chart-header">
            <div className="mkt-chart-title-group">
              <h3>Lead Acquisition & Qualification Trend</h3>
              <p>Monthly MQL and SQL trajectory for Fiscal Year 2026</p>
            </div>
          </div>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMql" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorSql" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="mqls" name="Marketing Qualified (MQL)" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMql)" />
                <Area type="monotone" dataKey="sqls" name="Sales Qualified (SQL)" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorSql)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Breakdown */}
        <div className="mkt-chart-card">
          <div className="mkt-chart-header">
            <div className="mkt-chart-title-group">
              <h3>Acquisition by Channel</h3>
              <p>Top MQL generating acquisition channels</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            {channelShare.map((cat, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{cat.channel}</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{cat.mqls} ({cat.pct})</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: cat.pct,
                      backgroundColor: idx === 0 ? '#EC4899' : idx === 1 ? '#8B5CF6' : idx === 2 ? '#2563EB' : idx === 3 ? '#F59E0B' : '#10B981',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Active Campaigns Table */}
      <div className="mkt-card">
        <div className="mkt-card-header">
          <div>
            <h3 className="mkt-card-title">Top Active Marketing Campaigns</h3>
            <p className="mkt-card-desc">Live campaign metrics, ad expenditure, and conversion yields</p>
          </div>
          <button className="mkt-btn-secondary" onClick={() => onNavigateTab('campaigns')}>
            View All Campaigns
          </button>
        </div>

        <div className="mkt-table-wrapper">
          <table className="mkt-table">
            <thead>
              <tr>
                <th>Campaign ID</th>
                <th>Campaign Name</th>
                <th>Channel</th>
                <th>Ad Spend</th>
                <th>MQLs Generated</th>
                <th>Avg. CTR</th>
                <th>ROI</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {topCampaigns.map((cmp) => (
                <tr key={cmp.id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{cmp.id}</td>
                  <td style={{ fontWeight: 600, color: '#1E293B' }}>{cmp.name}</td>
                  <td><span className="mkt-badge draft">{cmp.channel}</span></td>
                  <td style={{ fontWeight: 600 }}>{cmp.spend}</td>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{cmp.leads}</td>
                  <td style={{ color: '#2563EB', fontWeight: 600 }}>{cmp.ctr}</td>
                  <td style={{ color: '#BE185D', fontWeight: 700 }}>{cmp.roi}</td>
                  <td>
                    <span className={`mkt-badge ${cmp.status.toLowerCase()}`}>
                      {cmp.status}
                    </span>
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
