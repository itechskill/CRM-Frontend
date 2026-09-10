import React from 'react';
import { DollarSign, CreditCard, TrendingUp, ArrowUpRight, TrendingDown, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import './FinanceView.css';

const revenueVsExpensesData = [
  { month: 'Jul', revenue: 420, expenses: 210 },
  { month: 'Aug', revenue: 500, expenses: 220 },
  { month: 'Sep', revenue: 480, expenses: 215 },
  { month: 'Oct', revenue: 600, expenses: 240 },
  { month: 'Nov', revenue: 580, expenses: 245 },
  { month: 'Dec', revenue: 674, expenses: 255 },
];

const netProfitTrendData = [
  { month: 'Jul', profit: 210 },
  { month: 'Aug', profit: 280 },
  { month: 'Sep', profit: 265 },
  { month: 'Oct', profit: 360 },
  { month: 'Nov', profit: 335 },
  { month: 'Dec', profit: 419 },
];

const transactionsData = [
  { id: 'INV-2847', name: 'Proxima Labs', type: 'Invoice', date: 'Dec 14, 2024', amount: '+Rs. 32,500', direction: 'up', status: 'Paid' },
  { id: 'INV-2846', name: 'BuildCo Industries', type: 'Invoice', date: 'Dec 12, 2024', amount: '+Rs. 18,200', direction: 'up', status: 'Pending' },
  { id: 'EXP-0391', name: 'Software Licenses', type: 'Expense', date: 'Dec 10, 2024', amount: 'Rs. 4,800', direction: 'down', status: 'Processed' },
  { id: 'INV-2845', name: 'TechFlow Inc', type: 'Invoice', date: 'Dec 9, 2024', amount: '+Rs. 11,000', direction: 'up', status: 'Overdue' },
  { id: 'EXP-0390', name: 'Cloud Infrastructure', type: 'Expense', date: 'Dec 8, 2024', amount: 'Rs. 9,200', direction: 'down', status: 'Processed' },
  { id: 'INV-2844', name: 'Orion Systems', type: 'Invoice', date: 'Dec 7, 2024', amount: '+Rs. 24,000', direction: 'up', status: 'Paid' },
  { id: 'INV-2843', name: 'CloudBridge', type: 'Invoice', date: 'Dec 5, 2024', amount: '+Rs. 15,600', direction: 'up', status: 'Paid' },
];

const typeStyles = {
  Invoice: { bg: '#EFF6FF', color: '#2563EB' },
  Expense: { bg: '#F1F5F9', color: '#475569' },
};

const statusStyles = {
  Paid: { bg: '#DCFCE7', color: '#15803D' },
  Pending: { bg: '#FEF3C7', color: '#B45309' },
  Processed: { bg: '#F1F5F9', color: '#475569' },
  Overdue: { bg: '#FEE2E2', color: '#DC2626' },
};

function TypeBadge({ type }) {
  const s = typeStyles[type] || typeStyles.Expense;
  return (
    <span style={{
      display: 'inline-block',
      backgroundColor: s.bg,
      color: s.color,
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: 600,
    }}>
      {type}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = statusStyles[status] || statusStyles.Processed;
  return (
    <span style={{
      display: 'inline-block',
      backgroundColor: s.bg,
      color: s.color,
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: 600,
    }}>
      {status}
    </span>
  );
}

export default function FinanceView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top 4 KPI Cards matching exact screenshot */}
      <div className="finance-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {/* Card 1: Monthly Revenue */}
        <div className="finance-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '140px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1rem'
            }}>
              Rs.
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              <TrendingUp size={12} />
              <span>+16.2%</span>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>Rs. 674K</div>
            <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Monthly Revenue</div>
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="finance-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '140px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#FEE2E2',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CreditCard size={20} />
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              <TrendingUp size={12} />
              <span>+5.8%</span>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>Rs. 255K</div>
            <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Total Expenses</div>
          </div>
        </div>

        {/* Card 3: Net Profit */}
        <div className="finance-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '140px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#DCFCE7',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={20} />
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              <TrendingUp size={12} />
              <span>+23.4%</span>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>Rs. 419K</div>
            <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Net Profit</div>
          </div>
        </div>

        {/* Card 4: Outstanding AR */}
        <div className="finance-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '140px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#FEF3C7',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowUpRight size={22} />
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#FEE2E2',
              color: '#EF4444',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              <TrendingDown size={12} />
              <span>-8.1%</span>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>Rs. 89K</div>
            <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Outstanding AR</div>
          </div>
        </div>
      </div>

      {/* 2 Charts Grid */}
      <div className="finance-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Chart: Revenue vs Expenses */}
        <div className="finance-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Revenue vs Expenses</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '2px 0 0 0' }}>H2 2024 (Jul–Dec)</p>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueVsExpensesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  ticks={[200, 400, 600, 800]}
                  tickFormatter={(v) => `Rs. ${v}K`}
                />
                <Tooltip
                  formatter={(val) => [`Rs. ${val}K`, '']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={18} name="Revenue" />
                <Bar dataKey="expenses" fill="#FCA5A5" radius={[4, 4, 0, 0]} barSize={18} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Net Profit Trend */}
        <div className="finance-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Net Profit Trend</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '2px 0 0 0' }}>H2 2024 (Jul–Dec)</p>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netProfitTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  ticks={[150, 300, 450, 600]}
                  tickFormatter={(v) => `Rs. ${v}K`}
                />
                <Tooltip
                  formatter={(val) => [`Rs. ${val}K`, 'Net Profit']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#profitGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="finance-card" style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Recent Transactions</h3>
          <a href="#" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}>
            Export CSV
          </a>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                {['ID', 'Client / Description', 'Type', 'Date', 'Amount', 'Status'].map((header) => (
                  <th
                    key={header}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#64748B',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #E2E8F0',
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactionsData.map((tx, idx) => (
  <tr
    key={tx.id}
    className="transaction-row"
    style={{
      borderBottom: idx === transactionsData.length - 1 ? 'none' : '1px solid #F1F5F9',
    }}
  >
                  <td style={{ padding: '16px', fontSize: '0.875rem', color: '#94A3B8', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                    {tx.id}
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.9rem', color: '#0F172A', fontWeight: 600 }}>
                    {tx.name}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <TypeBadge type={tx.type} />
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748B' }}>
                    {tx.date}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      color: tx.direction === 'up' ? '#16A34A' : '#DC2626',
                    }}>
                      {tx.direction === 'up'
                        ? <ArrowUpRight size={14} />
                        : <ArrowDownRight size={14} />}
                      {tx.amount}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <StatusBadge status={tx.status} />
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
