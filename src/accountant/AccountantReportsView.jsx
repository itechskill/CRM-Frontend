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
import './AccountantViews.css';

const pnlData = {
  revenue: [
    { item: 'Software License Revenue', amount: 384000 },
    { item: 'Consulting & Implementation', amount: 125000 },
    { item: 'Support & SLA Subscriptions', amount: 48000 },
  ],
  cogs: [
    { item: 'Cloud Server Infrastructure', amount: 34500 },
    { item: 'Third-party API & Licenses', amount: 14000 },
  ],
  operatingExpenses: [
    { item: 'Salaries, Wages & Benefits', amount: 185400 },
    { item: 'Sales & Marketing Campaigns', amount: 28200 },
    { item: 'Office Rent & Facilities', amount: 19800 },
    { item: 'Legal, Audit & Accounting', amount: 11400 },
  ]
};

export default function AccountantReportsView() {
  const [reportType, setReportType] = useState('pnl');
  const [period, setPeriod] = useState('FY2026');

  const totalRevenue = pnlData.revenue.reduce((s, r) => s + r.amount, 0);
  const totalCogs = pnlData.cogs.reduce((s, c) => s + c.amount, 0);
  const grossProfit = totalRevenue - totalCogs;
  const totalOpex = pnlData.operatingExpenses.reduce((s, o) => s + o.amount, 0);
  const netIncomeBeforeTax = grossProfit - totalOpex;
  const estimatedTax = netIncomeBeforeTax * 0.15;
  const netProfit = netIncomeBeforeTax - estimatedTax;

  return (
    <div className="acc-view-container">
      {/* Page Header */}
      <div className="acc-page-header">
        <div className="acc-page-header-title">
          <h2>Financial Reports & Statements</h2>
          <p>Generate auditable financial statements, tax liabilities, and executive summary reports.</p>
        </div>
        <div className="acc-header-actions">
          <button className="acc-btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print Report
          </button>
          <button className="acc-btn-primary" onClick={() => alert(`Exporting ${reportType.toUpperCase()} report as PDF...`)}>
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* Report Type Selector Strip */}
      <div className="acc-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div className="acc-tabs">
          <button className={`acc-tab-btn ${reportType === 'pnl' ? 'active' : ''}`} onClick={() => setReportType('pnl')}>
            Profit & Loss (P&L)
          </button>
          <button className={`acc-tab-btn ${reportType === 'balance' ? 'active' : ''}`} onClick={() => setReportType('balance')}>
            Balance Sheet
          </button>
          <button className={`acc-tab-btn ${reportType === 'cashflow' ? 'active' : ''}`} onClick={() => setReportType('cashflow')}>
            Cash Flow Statement
          </button>
          <button className={`acc-tab-btn ${reportType === 'tax' ? 'active' : ''}`} onClick={() => setReportType('tax')}>
            Tax Summary
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={16} color="#64748B" />
          <select className="acc-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="FY2026">Fiscal Year 2026 (YTD)</option>
            <option value="Q3-2026">Quarter 3 2026</option>
            <option value="Q2-2026">Quarter 2 2026</option>
            <option value="FY2025">Fiscal Year 2025</option>
          </select>
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="acc-kpi-grid">
        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Gross Revenue</span>
            <div className="acc-kpi-icon emerald"><DollarSign size={18} /></div>
          </div>
          <div className="acc-kpi-value">${totalRevenue.toLocaleString()}</div>
          <div className="acc-kpi-subtitle up"><ArrowUpRight size={14} /> Total operating sales</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Gross Profit</span>
            <div className="acc-kpi-icon blue"><TrendingUp size={18} /></div>
          </div>
          <div className="acc-kpi-value">${grossProfit.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">{Math.round((grossProfit / totalRevenue) * 100)}% gross margin</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Operating Expenses</span>
            <div className="acc-kpi-icon red"><PieChart size={18} /></div>
          </div>
          <div className="acc-kpi-value">${totalOpex.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">Fixed & variable costs</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Net Profit After Tax</span>
            <div className="acc-kpi-icon teal"><CheckCircle2 size={18} /></div>
          </div>
          <div className="acc-kpi-value">${netProfit.toLocaleString()}</div>
          <div className="acc-kpi-subtitle up">Bottom line earnings</div>
        </div>
      </div>

      {/* P&L Financial Statement Card */}
      <div className="acc-card">
        <div className="acc-card-header">
          <div>
            <h3 className="acc-card-title">Statement of Profit and Loss ({period})</h3>
            <p className="acc-card-desc">Amounts in USD • Audited internal ledger figures</p>
          </div>
        </div>

        <div className="acc-table-wrapper">
          <table className="acc-table">
            <thead>
              <tr>
                <th style={{ width: '60%' }}>Line Item / Account Description</th>
                <th style={{ textAlign: 'right' }}>Amount ($)</th>
              </tr>
            </thead>
            <tbody>
              {/* REVENUE SECTION */}
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                <td style={{ fontWeight: 700, color: '#0F172A' }}>1. OPERATING REVENUE</td>
                <td></td>
              </tr>
              {pnlData.revenue.map((r, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: '32px' }}>{r.item}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${r.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid #CBD5E1', fontWeight: 700 }}>
                <td style={{ paddingLeft: '20px', color: '#059669' }}>TOTAL OPERATING REVENUE</td>
                <td style={{ textAlign: 'right', color: '#059669', fontSize: '1rem' }}>${totalRevenue.toLocaleString()}</td>
              </tr>

              {/* COGS SECTION */}
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                <td style={{ fontWeight: 700, color: '#0F172A' }}>2. COST OF GOODS SOLD (COGS)</td>
                <td></td>
              </tr>
              {pnlData.cogs.map((c, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: '32px' }}>{c.item}</td>
                  <td style={{ textAlign: 'right', color: '#DC2626' }}>-${c.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid #CBD5E1', fontWeight: 700, backgroundColor: '#EFF6FF' }}>
                <td style={{ color: '#1E40AF' }}>GROSS PROFIT</td>
                <td style={{ textAlign: 'right', color: '#1E40AF', fontSize: '1rem' }}>${grossProfit.toLocaleString()}</td>
              </tr>

              {/* OPEX SECTION */}
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                <td style={{ fontWeight: 700, color: '#0F172A' }}>3. OPERATING EXPENSES (OPEX)</td>
                <td></td>
              </tr>
              {pnlData.operatingExpenses.map((o, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: '32px' }}>{o.item}</td>
                  <td style={{ textAlign: 'right', color: '#DC2626' }}>-${o.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid #CBD5E1', fontWeight: 700 }}>
                <td style={{ paddingLeft: '20px', color: '#DC2626' }}>TOTAL OPERATING EXPENSES</td>
                <td style={{ textAlign: 'right', color: '#DC2626' }}>-${totalOpex.toLocaleString()}</td>
              </tr>

              {/* NET INCOME BEFORE TAX */}
              <tr style={{ borderTop: '2px solid #0F172A', fontWeight: 700 }}>
                <td>NET OPERATING INCOME BEFORE TAX</td>
                <td style={{ textAlign: 'right', fontSize: '1rem' }}>${netIncomeBeforeTax.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: '32px', color: '#64748B' }}>Corporate Income Tax Provision (15%)</td>
                <td style={{ textAlign: 'right', color: '#DC2626' }}>-${estimatedTax.toLocaleString()}</td>
              </tr>

              {/* NET PROFIT */}
              <tr style={{ backgroundColor: '#DCFCE7', fontWeight: 800, fontSize: '1.05rem' }}>
                <td style={{ color: '#15803D' }}>NET PROFIT AFTER TAX</td>
                <td style={{ textAlign: 'right', color: '#15803D' }}>${netProfit.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
