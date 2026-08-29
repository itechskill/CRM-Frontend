import React from 'react';
import { TrendingUp, Users, DollarSign, Target, Globe, Award } from 'lucide-react';
import './AnalyticsView.css';

export default function AnalyticsView() {
  const topPerformers = [
    { name: 'Sarah Jenkins', deals: 42, revenue: '$284,000', quota: '124%' },
    { name: 'Emma Field', deals: 38, revenue: '$245,000', quota: '115%' },
    { name: 'Daniel Torres', deals: 31, revenue: '$198,000', quota: '102%' },
    { name: 'Joshua Reed', deals: 29, revenue: '$175,000', quota: '94%' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Deep Analytics & Performance</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Revenue attribution, conversion funnels, and sales team leaders</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div className="widget-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Average Deal Size</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>$24,850</div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>+8.4% growth vs Q1</span>
        </div>

        <div className="widget-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#DCFCE7', color: '#16A34A' }}>
              <Target size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Sales Velocity</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>18 Days</div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>-3 days faster close cycle</span>
        </div>

        <div className="widget-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#F3E8FF', color: '#9333EA' }}>
              <Globe size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Win Rate</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>42.6%</div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>+4.2% above benchmark</span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="widget-card">
        <div className="widget-header">
          <div className="widget-title-group">
            <h3>Sales Rep Leaderboard</h3>
            <p>Quota attainment for current quarter</p>
          </div>
          <Award size={20} color="#F59E0B" />
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Representative</th>
              <th>Deals Closed</th>
              <th>Total Revenue</th>
              <th>Quota Attainment</th>
            </tr>
          </thead>
          <tbody>
            {topPerformers.map((rep, idx) => (
              <tr key={rep.name}>
                <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: idx === 0 ? '#F59E0B' : '#E2E8F0',
                    color: idx === 0 ? 'white' : '#475569',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {idx + 1}
                  </span>
                  {rep.name}
                </td>
                <td style={{ fontWeight: 600 }}>{rep.deals}</td>
                <td style={{ fontWeight: 700, color: '#2563EB' }}>{rep.revenue}</td>
                <td>
                  <span style={{
                    backgroundColor: parseInt(rep.quota) >= 100 ? '#DCFCE7' : '#FEF3C7',
                    color: parseInt(rep.quota) >= 100 ? '#15803D' : '#B45309',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: '12px'
                  }}>
                    {rep.quota}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
