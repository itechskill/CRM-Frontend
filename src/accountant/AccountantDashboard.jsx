import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Plus,
  Send,
  Download,
  AlertCircle,
  Receipt,
  Briefcase
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
import './AccountantDashboard.css';
import './AccountantViews.css';

const cashflowData = [
  { month: 'Jan', revenue: 42000, expenses: 24000, net: 18000 },
  { month: 'Feb', revenue: 58000, expenses: 29000, net: 29000 },
  { month: 'Mar', revenue: 51000, expenses: 31000, net: 20000 },
  { month: 'Apr', revenue: 67000, expenses: 35000, net: 32000 },
  { month: 'May', revenue: 82000, expenses: 39000, net: 43000 },
  { month: 'Jun', revenue: 75000, expenses: 41000, net: 34000 },
  { month: 'Jul', revenue: 94000, expenses: 45000, net: 49000 },
  { month: 'Aug', revenue: 88000, expenses: 42000, net: 46000 },
];

const categoryExpenses = [
  { category: 'Payroll & Benefits', amount: 28500, percentage: '45%' },
  { category: 'Software & Cloud Services', amount: 12400, percentage: '20%' },
  { category: 'Office & Operations', amount: 9800, percentage: '15%' },
  { category: 'Marketing & Ads', amount: 8200, percentage: '13%' },
  { category: 'Legal & Accounting', amount: 4400, percentage: '7%' },
];

const recentInvoices = [
  { id: 'INV-2026-089', client: 'Proxima Labs', date: 'Aug 18, 2026', amount: '$14,500.00', status: 'Paid', dueDate: 'Aug 30' },
  { id: 'INV-2026-090', client: 'BuildCo Industries', date: 'Aug 16, 2026', amount: '$22,800.00', status: 'Pending', dueDate: 'Sep 02' },
  { id: 'INV-2026-091', client: 'Starlight Ventures', date: 'Aug 12, 2026', amount: '$8,400.00', status: 'Overdue', dueDate: 'Aug 15' },
  { id: 'INV-2026-092', client: 'Apex Software', date: 'Aug 10, 2026', amount: '$19,200.00', status: 'Paid', dueDate: 'Aug 24' },
  { id: 'INV-2026-093', client: 'TechFlow Inc', date: 'Aug 08, 2026', amount: '$11,600.00', status: 'Paid', dueDate: 'Aug 22' },
];

export default function AccountantDashboard({ currentUser, onNavigateTab, onOpenInvoiceModal, onOpenExpenseModal, isModalOpen, onCloseModal }) {
  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'there';
  const [assignedTasks, setAssignedTasks] = useState([]);

  useEffect(() => {
    const fetchAccountantTasks = async () => {
      try {
        const { response, data } = await apiRequest('/api/tasks');
        if (response.ok && data.success && Array.isArray(data.data)) {
          setAssignedTasks(data.data);
        }
      } catch (err) {
        console.error('Fetch accountant tasks error:', err);
      }
    };
    fetchAccountantTasks();
  }, []);


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
          <p style={{ fontWeight: 700, marginBottom: '6px', color: '#94A3B8' }}>{label} Cash Flow</p>
          <p style={{ color: '#3B82F6', fontWeight: 600 }}>
            Revenue: ${payload[0]?.value?.toLocaleString()}
          </p>
          <p style={{ color: '#EF4444', fontWeight: 600, marginTop: '2px' }}>
            Expenses: ${payload[1]?.value?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="acc-dashboard acc-view-container">
      {/* Welcome Banner */}
      <div className="acc-welcome-banner">
        <div className="acc-welcome-left">
          <h2>Good morning, {firstName}! 💼</h2>
          <p>Real-time cash flow monitoring, billing summary, and active accounts ledger.</p>
        </div>
        <div className="acc-welcome-stats">
          <div className="acc-welcome-stat">
            <span className="acc-welcome-stat-value">$315,000</span>
            <span className="acc-welcome-stat-label">Operating Cash Balance</span>
          </div>
          <div className="acc-welcome-stat">
            <span className="acc-welcome-stat-value">$142,200</span>
            <span className="acc-welcome-stat-label">Net Profit (YTD)</span>
          </div>
          <div className="acc-welcome-stat">
            <span className="acc-welcome-stat-value">$38,400</span>
            <span className="acc-welcome-stat-label">Pending Receivables</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="acc-quick-actions">
        <div className="acc-action-card" onClick={onOpenInvoiceModal}>
          <div className="acc-action-icon" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            <FileText size={20} />
          </div>
          <div className="acc-action-info">
            <span className="acc-action-title">Create Invoice</span>
            <span className="acc-action-desc">Issue bill to client</span>
          </div>
        </div>

        <div className="acc-action-card" onClick={onOpenExpenseModal}>
          <div className="acc-action-icon" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
            <Receipt size={20} />
          </div>
          <div className="acc-action-info">
            <span className="acc-action-title">Log Expense</span>
            <span className="acc-action-desc">Record business outlay</span>
          </div>
        </div>

        <div className="acc-action-card" onClick={() => onNavigateTab('payroll')}>
          <div className="acc-action-icon" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            <DollarSign size={20} />
          </div>
          <div className="acc-action-info">
            <span className="acc-action-title">Run Payroll</span>
            <span className="acc-action-desc">Process monthly staff pay</span>
          </div>
        </div>

        <div className="acc-action-card" onClick={() => onNavigateTab('acc_reports')}>
          <div className="acc-action-icon" style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
            <PieChart size={20} />
          </div>
          <div className="acc-action-info">
            <span className="acc-action-title">Financial Reports</span>
            <span className="acc-action-desc">Generate P&L & statements</span>
          </div>
        </div>
      </div>

      {/* CEO Directives & Department Tasks Section */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Briefcase size={20} color="#2563EB" />
          <h3 style={{ margin: 0, color: '#0F172A', fontSize: '1.05rem', fontWeight: 700 }}>
            CEO Directives & Department Tasks ({assignedTasks.length})
          </h3>
        </div>
        {assignedTasks.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {assignedTasks.map((t) => (
              <div key={t._id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{t.title}</span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', background: t.priority === 'Urgent' || t.priority === 'High' ? '#FEE2E2' : '#E0E7FF', color: t.priority === 'Urgent' || t.priority === 'High' ? '#B91C1C' : '#3730A3', fontWeight: 700 }}>
                    {t.priority}
                  </span>
                </div>
                {t.description && (
                  <p style={{ color: '#475569', fontSize: '0.8rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {t.description}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748B', paddingTop: '6px', borderTop: '1px dashed #CBD5E1' }}>
                  <span>By: <strong>{t.assignedByName || 'CEO'}</strong></span>
                  <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#F1F5F9', color: '#1E293B', fontWeight: 600 }}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px', color: '#94A3B8', fontSize: '0.85rem' }}>
            No tasks currently assigned to Finance &amp; Accounting department.
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}

      <div className="acc-kpi-grid">
        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Total Revenue (YTD)</span>
            <div className="acc-kpi-icon emerald"><DollarSign size={18} /></div>
          </div>
          <div className="acc-kpi-value">$557,000</div>
          <div className="acc-kpi-subtitle up">
            <ArrowUpRight size={14} /> +14.2% vs last fiscal year
          </div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Total Expenses (YTD)</span>
            <div className="acc-kpi-icon red"><CreditCard size={18} /></div>
          </div>
          <div className="acc-kpi-value">$284,800</div>
          <div className="acc-kpi-subtitle down">
            <ArrowDownRight size={14} /> +6.1% operating costs
          </div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Net Profit Margin</span>
            <div className="acc-kpi-icon blue"><TrendingUp size={18} /></div>
          </div>
          <div className="acc-kpi-value">48.8%</div>
          <div className="acc-kpi-subtitle up">
            <ArrowUpRight size={14} /> Healthy profit ratio
          </div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Overdue Receivables</span>
            <div className="acc-kpi-icon amber"><AlertCircle size={18} /></div>
          </div>
          <div className="acc-kpi-value">$8,400</div>
          <div className="acc-kpi-subtitle down">
            1 invoice overdue (&gt;15 days)
          </div>
        </div>
      </div>

      {/* Financial Charts Grid */}
      <div className="acc-charts-grid">
        {/* Revenue vs Expenses Area Chart */}
        <div className="acc-chart-card">
          <div className="acc-chart-header">
            <div className="acc-chart-title-group">
              <h3>Monthly Revenue vs. Expense Trend</h3>
              <p>Cash inflow and outflow breakdown for Fiscal Year 2026</p>
            </div>
          </div>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" name="Expenses ($)" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="acc-chart-card">
          <div className="acc-chart-header">
            <div className="acc-chart-title-group">
              <h3>Monthly Expense Distribution</h3>
              <p>Top operational expense categories</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            {categoryExpenses.map((cat, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{cat.category}</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>${cat.amount.toLocaleString()} ({cat.percentage})</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: cat.percentage,
                      backgroundColor: idx === 0 ? '#10B981' : idx === 1 ? '#2563EB' : idx === 2 ? '#8B5CF6' : idx === 3 ? '#F59E0B' : '#64748B',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Invoices & Billing Table */}
      <div className="acc-card">
        <div className="acc-card-header">
          <div>
            <h3 className="acc-card-title">Recent Invoices & Transactions</h3>
            <p className="acc-card-desc">Latest issued client invoices and payment collection status</p>
          </div>
          <button className="acc-btn-secondary" onClick={() => onNavigateTab('invoices')}>
            View All Invoices
          </button>
        </div>

        <div className="acc-table-wrapper">
          <table className="acc-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Client Name</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{inv.id}</td>
                  <td style={{ fontWeight: 600, color: '#334155' }}>{inv.client}</td>
                  <td>{inv.date}</td>
                  <td>{inv.dueDate}</td>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{inv.amount}</td>
                  <td>
                    <span className={`acc-badge ${inv.status.toLowerCase()}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Quick New Transaction Modal */}
      {isModalOpen && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-content" style={{ maxWidth: '500px' }}>
            <div className="acc-modal-header">
              <h3>Create New Transaction</h3>
              <button className="acc-modal-close" onClick={onCloseModal}>×</button>
            </div>
            <div className="acc-modal-body" style={{ gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
                Select the type of transaction you want to log:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className="acc-action-card"
                  style={{ cursor: 'pointer', border: '1px solid #E2E8F0', padding: '14px' }}
                  onClick={() => { if (onCloseModal) onCloseModal(); if (onOpenInvoiceModal) onOpenInvoiceModal(); }}
                >
                  <div className="acc-action-icon" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
                    <FileText size={20} />
                  </div>
                  <div className="acc-action-info" style={{ textAlign: 'left' }}>
                    <span className="acc-action-title">Create Client Invoice</span>
                    <span className="acc-action-desc">Issue bill, payment terms & receivables</span>
                  </div>
                </button>

                <button
                  className="acc-action-card"
                  style={{ cursor: 'pointer', border: '1px solid #E2E8F0', padding: '14px' }}
                  onClick={() => { if (onCloseModal) onCloseModal(); if (onOpenExpenseModal) onOpenExpenseModal(); }}
                >
                  <div className="acc-action-icon" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                    <Receipt size={20} />
                  </div>
                  <div className="acc-action-info" style={{ textAlign: 'left' }}>
                    <span className="acc-action-title">Log Business Expense</span>
                    <span className="acc-action-desc">Record vendor costs, receipts & claims</span>
                  </div>
                </button>

                <button
                  className="acc-action-card"
                  style={{ cursor: 'pointer', border: '1px solid #E2E8F0', padding: '14px' }}
                  onClick={() => { if (onCloseModal) onCloseModal(); if (onNavigateTab) { onNavigateTab('maintenance'); } }}
                >
                  <div className="acc-action-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    <Briefcase size={20} />
                  </div>
                  <div className="acc-action-info" style={{ textAlign: 'left' }}>
                    <span className="acc-action-title">Add Maintenance Charge</span>
                    <span className="acc-action-desc">Track building, equipment or software maintenance</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="acc-modal-footer">
              <button className="acc-btn-secondary" onClick={onCloseModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
