import React, { useState } from 'react';
import {
  PieChart,
  Download,
  Printer,
  Calendar,
  FileText,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import './MarketingViews.css';

const reportData = [
  { channel: 'Google Paid Search', spend: '$42,500', mqls: 840, sqls: 380, customers: 112, revenue: '$224,000', cpl: '$50.59', roas: '5.2x', romi: '427%' },
  { channel: 'Organic Search (SEO)', spend: '$14,000', mqls: 620, sqls: 290, customers: 98, revenue: '$196,000', cpl: '$22.58', roas: '14.0x', romi: '1300%' },
  { channel: 'LinkedIn & Social Ads', spend: '$28,000', mqls: 490, sqls: 210, customers: 64, revenue: '$128,000', cpl: '$57.14', roas: '4.5x', romi: '357%' },
  { channel: 'Email Automation Sprints', spend: '$4,500', mqls: 310, sqls: 145, customers: 52, revenue: '$104,000', cpl: '$14.51', roas: '23.1x', romi: '2211%' },
  { channel: 'Webinars & Virtual Summits', spend: '$12,000', mqls: 260, sqls: 115, customers: 42, revenue: '$84,000', cpl: '$46.15', roas: '7.0x', romi: '600%' },
];

export default function MarketingReportsView() {
  const [period, setPeriod] = useState('FY2026');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = (fileName = 'Marketing_Report.csv') => {
    const headers = ['Acquisition Channel', 'Ad Spend', 'MQLs', 'SQLs', 'New Customers', 'Attributed Revenue', 'Cost/MQL', 'ROAS', 'ROMI'];
    const rows = reportData.map(r => [
      `"${r.channel}"`,
      `"${r.spend}"`,
      r.mqls,
      r.sqls,
      r.customers,
      `"${r.revenue}"`,
      `"${r.cpl}"`,
      `"${r.roas}"`,
      `"${r.romi}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mkt-view-container">
      {/* Page Header */}
      <div className="mkt-page-header">
        <div className="mkt-page-header-title">
          <h2>Marketing Growth Reports & ROI</h2>
          <p>Channel attribution models, campaign performance audits, and return on marketing investment.</p>
        </div>
        <div className="mkt-header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="mkt-btn-secondary" onClick={() => handleDownloadCSV('Marketing_Export_Report.csv')}>
            <FileText size={16} /> Export Report
          </button>
          <button className="mkt-btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </button>
          <button className="mkt-btn-primary" onClick={() => handleDownloadCSV('Marketing_Performance_Report.csv')}>
            <Download size={16} /> Download Report
          </button>
        </div>
      </div>

      {/* Date Filter & Control Bar */}
      <div className="mkt-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>
          Executive Channel Performance Summary
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={16} color="#64748B" />
          <select className="mkt-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="FY2026">Fiscal Year 2026 (YTD)</option>
            <option value="Q3-2026">Quarter 3 2026</option>
            <option value="Q2-2026">Quarter 2 2026</option>
            <option value="FY2025">Fiscal Year 2025</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mkt-kpi-grid">
        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Total Marketing Spend</span>
            <div className="mkt-kpi-icon pink"><DollarSign size={18} /></div>
          </div>
          <div className="mkt-kpi-value">$101,000</div>
          <div className="mkt-kpi-subtitle">Across all paid & content channels</div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Attributed Revenue</span>
            <div className="mkt-kpi-icon emerald"><TrendingUp size={18} /></div>
          </div>
          <div className="mkt-kpi-value">$736,000</div>
          <div className="mkt-kpi-subtitle up"><ArrowUpRight size={14} /> 7.2x Overall ROAS</div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Blended Cost per MQL</span>
            <div className="mkt-kpi-icon purple"><PieChart size={18} /></div>
          </div>
          <div className="mkt-kpi-value">$39.92</div>
          <div className="mkt-kpi-subtitle">2,520 Total MQLs acquired</div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Net ROMI Percentage</span>
            <div className="mkt-kpi-icon blue"><CheckCircle2 size={18} /></div>
          </div>
          <div className="mkt-kpi-value">628%</div>
          <div className="mkt-kpi-subtitle up">High revenue attribution ratio</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="mkt-card">
        <div className="mkt-card-header">
          <div>
            <h3 className="mkt-card-title">Channel Attribution & Performance Breakdown ({period})</h3>
            <p className="mkt-card-desc">Audited marketing metrics per acquisition channel</p>
          </div>
        </div>

        <div className="mkt-table-wrapper">
          <table className="mkt-table">
            <thead>
              <tr>
                <th>Acquisition Channel</th>
                <th>Ad Spend</th>
                <th>MQLs</th>
                <th>SQLs</th>
                <th>New Customers</th>
                <th>Attributed Revenue</th>
                <th>Cost / MQL</th>
                <th>ROAS</th>
                <th>ROMI</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{row.channel}</td>
                  <td style={{ color: '#64748B' }}>{row.spend}</td>
                  <td style={{ fontWeight: 600 }}>{row.mqls}</td>
                  <td>{row.sqls}</td>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{row.customers}</td>
                  <td style={{ fontWeight: 700, color: '#059669' }}>{row.revenue}</td>
                  <td>{row.cpl}</td>
                  <td style={{ color: '#2563EB', fontWeight: 600 }}>{row.roas}</td>
                  <td style={{ color: '#BE185D', fontWeight: 700 }}>{row.romi}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 800, fontSize: '0.95rem' }}>
                <td>TOTAL / BLENDED AVERAGE</td>
                <td>$101,000</td>
                <td>2,520</td>
                <td>1,140</td>
                <td>368</td>
                <td style={{ color: '#059669' }}>$736,000</td>
                <td>$39.92</td>
                <td style={{ color: '#2563EB' }}>7.2x</td>
                <td style={{ color: '#BE185D' }}>628%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
