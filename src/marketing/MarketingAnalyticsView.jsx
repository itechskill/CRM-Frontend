import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  BarChart3,
  TrendingUp,
  Target,
  DollarSign,
  Zap,
  Users,
  Filter,
  ArrowUpRight,
  PieChart
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import './MarketingViews.css';

const trafficData = [
  { month: 'Jan', organic: 34000, paid: 18000, referral: 8000 },
  { month: 'Feb', organic: 41000, paid: 22000, referral: 11000 },
  { month: 'Mar', organic: 48000, paid: 28000, referral: 14000 },
  { month: 'Apr', organic: 45000, paid: 25000, referral: 12000 },
  { month: 'May', organic: 58000, paid: 34000, referral: 18000 },
  { month: 'Jun', organic: 62000, paid: 38000, referral: 21000 },
  { month: 'Jul', organic: 71000, paid: 44000, referral: 24000 },
  { month: 'Aug', organic: 78000, paid: 49000, referral: 28000 },
];

const funnelSteps = [
  { step: '1. Website Visitors', count: '155,000', conv: '100%', color: '#2563EB' },
  { step: '2. Leads / Inquiries', count: '14,200', conv: '9.1%', color: '#8B5CF6' },
  { step: '3. Marketing Qualified (MQL)', count: '2,820', conv: '19.8%', color: '#EC4899' },
  { step: '4. Sales Qualified (SQL)', count: '1,240', conv: '44.0%', color: '#F59E0B' },
  { step: '5. Closed Won Customers', count: '410', conv: '33.0%', color: '#10B981' },
];

export default function MarketingAnalyticsView() {
  const [timeRange, setTimeRange] = useState('2026');
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const handleRunAnalytics = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setLastRun(new Date().toLocaleTimeString());
    }, 2000);
  };

  return (
    <div className="mkt-view-container">
      {/* Page Header */}
      <div className="mkt-page-header">
        <div className="mkt-page-header-title">
          <h2>Marketing Analytics & Conversion Funnels</h2>
          <p>Deep-dive analytics into traffic sources, customer acquisition cost (CAC), and funnel efficiency.{lastRun && <span style={{ marginLeft: '12px', fontSize: '0.8rem', color: '#059669' }}>✓ Last refreshed at {lastRun}</span>}</p>
        </div>
        <button
          className="mkt-btn-primary"
          onClick={handleRunAnalytics}
          disabled={isRunning}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isRunning ? 0.7 : 1 }}
        >
          <RefreshCw size={16} style={{ animation: isRunning ? 'spin 1s linear infinite' : 'none' }} />
          {isRunning ? 'Running...' : 'Run Analytics'}
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="mkt-kpi-grid">
        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Customer Acquisition Cost (CAC)</span>
            <div className="mkt-kpi-icon pink"><DollarSign size={18} /></div>
          </div>
          <div className="mkt-kpi-value">$124.50</div>
          <div className="mkt-kpi-subtitle up">
            <ArrowUpRight size={14} /> -12% vs previous quarter
          </div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Return on Mktg Investment (ROMI)</span>
            <div className="mkt-kpi-icon purple"><TrendingUp size={18} /></div>
          </div>
          <div className="mkt-kpi-value">340%</div>
          <div className="mkt-kpi-subtitle up">High profitability index</div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Monthly Web Traffic</span>
            <div className="mkt-kpi-icon blue"><Users size={18} /></div>
          </div>
          <div className="mkt-kpi-value">155K</div>
          <div className="mkt-kpi-subtitle up">+24% traffic growth</div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Lead Conversion Rate</span>
            <div className="mkt-kpi-icon emerald"><Zap size={18} /></div>
          </div>
          <div className="mkt-kpi-value">3.6%</div>
          <div className="mkt-kpi-subtitle">Industry leading benchmark</div>
        </div>
      </div>

      {/* Traffic Recharts & Funnel Grid */}
      <div className="mkt-charts-grid">
        {/* Web Traffic Bar Chart */}
        <div className="mkt-chart-card">
          <div className="mkt-chart-header">
            <div className="mkt-chart-title-group">
              <h3>Monthly Website Traffic Breakdown</h3>
              <p>Organic search, paid advertising, and referral channel volume</p>
            </div>
          </div>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="organic" name="Organic SEO" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" name="Paid Search & Social" fill="#EC4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="referral" name="Referral & Direct" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Visualizer */}
        <div className="mkt-chart-card">
          <div className="mkt-chart-header">
            <div className="mkt-chart-title-group">
              <h3>Conversion Funnel</h3>
              <p>Stage by stage conversion rates</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            {funnelSteps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{step.step}</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{step.count} ({step.conv})</span>
                </div>
                <div style={{ height: '10px', backgroundColor: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: idx === 0 ? '100%' : idx === 1 ? '75%' : idx === 2 ? '55%' : idx === 3 ? '35%' : '20%',
                      backgroundColor: step.color,
                      borderRadius: '5px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
