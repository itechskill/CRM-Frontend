import React, { useState } from 'react';
import { BarChart2, Download, TrendingUp, Users, Calendar, Star } from 'lucide-react';
import './HRViews.css';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const hiringData = [4, 7, 5, 10, 8, 12, 6, 9];
const attritionData = [1, 2, 1, 3, 2, 1, 2, 2];
const maxHiring = 14;

const deptStats = [
  { dept: 'Engineering', headcount: 50, avgPerf: 91, turnover: '3.2%', avgTenure: '2.8y' },
  { dept: 'Sales', headcount: 31, avgPerf: 85, turnover: '6.1%', avgTenure: '1.9y' },
  { dept: 'Operations', headcount: 26, avgPerf: 88, turnover: '2.8%', avgTenure: '3.2y' },
  { dept: 'Design', headcount: 20, avgPerf: 90, turnover: '4.0%', avgTenure: '2.4y' },
  { dept: 'Analytics', headcount: 15, avgPerf: 87, turnover: '3.5%', avgTenure: '2.1y' },
];

const reportCards = [
  { label: 'Workforce Summary', icon: Users, desc: 'Headcount, departments, and demographics', color: 'purple' },
  { label: 'Attendance Report', icon: Calendar, desc: 'Monthly attendance rates and leave statistics', color: 'blue' },
  { label: 'Performance Report', icon: TrendingUp, desc: 'Q2 2026 review scores and goal completion', color: 'green' },
  { label: 'Recruitment Report', icon: BarChart2, desc: 'Hiring pipeline, applicants and conversion rates', color: 'amber' },
  { label: 'Turnover Analysis', icon: Users, desc: 'Attrition rates and exit interview insights', color: 'red' },
  { label: 'Payroll Summary', icon: Star, desc: 'Monthly payroll breakdown by department', color: 'teal' },
];

export default function HRReportsView() {
  const [activeReport, setActiveReport] = useState('overview');

  return (
    <div className="hr-view-container">
      {/* Report Quick-download Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} style={{
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14,
              padding: '18px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 18px rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'; }}
            >
              <div className={`hr-summary-icon ${card.color}`}>
                <Icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{card.label}</div>
                <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>{card.desc}</div>
              </div>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                borderRadius: 8, border: 'none', background: '#F3E8FF', color: '#7C3AED',
                fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0
              }}>
                <Download size={13} /> Export
              </button>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        {/* Hiring vs Attrition Bar Chart */}
        <div className="hr-chart-card">
          <div className="hr-chart-header">
            <div>
              <h3 className="hr-chart-title">Hiring vs. Attrition (2026)</h3>
              <p className="hr-chart-sub">Monthly new hires and exits</p>
            </div>
            <div className="hr-chart-badge">
              <TrendingUp size={13} />
              <span>Net +60 YTD</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, paddingTop: 8 }}>
            {monthLabels.map((m, i) => (
              <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 130 }}>
                  <div style={{
                    width: 14, borderRadius: '4px 4px 0 0',
                    background: 'linear-gradient(180deg, #7C3AED, #A78BFA)',
                    height: Math.round((hiringData[i] / maxHiring) * 130)
                  }} title={`Hired: ${hiringData[i]}`} />
                  <div style={{
                    width: 14, borderRadius: '4px 4px 0 0',
                    background: '#FCA5A5',
                    height: Math.round((attritionData[i] / maxHiring) * 130)
                  }} title={`Exits: ${attritionData[i]}`} />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>{m}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
            <div className="hr-legend-dot-item">
              <div className="hr-legend-dot" style={{ backgroundColor: '#7C3AED' }} />
              <span>New Hires</span>
            </div>
            <div className="hr-legend-dot-item">
              <div className="hr-legend-dot" style={{ backgroundColor: '#FCA5A5' }} />
              <span>Exits</span>
            </div>
          </div>
        </div>

        {/* Department Performance Donut */}
        <div className="hr-chart-card">
          <div className="hr-chart-header">
            <div>
              <h3 className="hr-chart-title">Headcount by Dept.</h3>
              <p className="hr-chart-sub">142 total employees</p>
            </div>
          </div>
          <div className="hr-donut-container">
            <div className="hr-donut-graphic">
              <svg viewBox="0 0 100 100" className="hr-donut-svg">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#7C3AED" strokeWidth="14"
                  strokeDasharray="83.5 155" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#2563EB" strokeWidth="14"
                  strokeDasharray="52.4 185.9" strokeDashoffset="-86" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="14"
                  strokeDasharray="43 195.3" strokeDashoffset="-141" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="14"
                  strokeDasharray="33.4 204.9" strokeDashoffset="-186" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EC4899" strokeWidth="14"
                  strokeDasharray="26.2 212.1" strokeDashoffset="-221" />
              </svg>
              <div className="hr-donut-center">
                <span className="hr-donut-total">142</span>
                <span className="hr-donut-lbl">Staff</span>
              </div>
            </div>
            <div className="hr-donut-legend">
              {[
                { label: 'Engineering', count: 50, color: '#7C3AED' },
                { label: 'Sales', count: 31, color: '#2563EB' },
                { label: 'Operations', count: 26, color: '#10B981' },
                { label: 'Design', count: 20, color: '#F59E0B' },
                { label: 'Other', count: 15, color: '#EC4899' },
              ].map((item) => (
                <div className="hr-legend-row" key={item.label}>
                  <div className="hr-legend-left">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
                    <span className="hr-legend-name">{item.label}</span>
                  </div>
                  <span className="hr-legend-count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Department Stats Table */}
      <div className="hr-data-card">
        <div className="hr-data-card-header">
          <div className="hr-data-card-title">
            <BarChart2 size={17} color="#7C3AED" />
            Department Performance Summary
            <span className="hr-count-badge">5 departments</span>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#FFFFFF',
            border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer'
          }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
        <div className="hr-table-wrapper">
          <table className="hr-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Headcount</th>
                <th>Avg. Performance</th>
                <th>Turnover Rate</th>
                <th>Avg. Tenure</th>
              </tr>
            </thead>
            <tbody>
              {deptStats.map(d => (
                <tr key={d.dept}>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{d.dept}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#7C3AED', background: '#F3E8FF', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem' }}>
                      {d.headcount}
                    </span>
                  </td>
                  <td>
                    <div className="hr-progress-bar-wrap">
                      <div className="hr-progress-bar">
                        <div className="hr-progress-fill" style={{ width: `${d.avgPerf}%` }} />
                      </div>
                      <span className="hr-progress-val">{d.avgPerf}%</span>
                    </div>
                  </td>
                  <td style={{ color: '#EF4444', fontWeight: 600 }}>{d.turnover}</td>
                  <td style={{ color: '#64748B' }}>{d.avgTenure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
