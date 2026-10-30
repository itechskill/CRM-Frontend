import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Target, TrendingUp, Wallet } from 'lucide-react';
import { apiRequest } from '../utils/api';

const money = cents => cents == null ? 'Unavailable' : `PKR ${(Number(cents) / 100).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = value => value ? new Date(value).toLocaleDateString('en-PK') : '—';
const currentMonth = () => new Date().toISOString().slice(0, 7);
const panel = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 };
const th = { padding: 10, textAlign: 'left', color: '#475569', fontSize: 12, background: '#F8FAFC' };
const td = { padding: 10, borderTop: '1px solid #E2E8F0', verticalAlign: 'top', fontSize: 13 };

export default function TargetPerformanceView() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setMessage('');
    apiRequest(`/api/target-performance/me?month=${month}`).then(result => {
      if (!result.success) setMessage(result.data?.message || 'Could not load Target Performance.');
      else setData(result.data?.data || null);
      setLoading(false);
    });
  }, [month]);

  if (loading) return <div style={{ padding: 24, display: 'grid', gap: 18 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}><div><h2 style={{ margin: 0 }}>Target Performance</h2><p style={{ color: '#64748B' }}>Loading your private performance…</p></div><label>Month <input type="month" value={month} disabled style={{ marginLeft: 8, padding: 8 }} /></label></div>
    <div className="target-performance-skeleton" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>{[1, 2, 3, 4].map(item => <div key={item} style={panel}><div style={{ height: 14, width: '55%', background: '#E2E8F0', borderRadius: 6 }} /><div style={{ height: 24, width: '78%', background: '#E2E8F0', borderRadius: 6, marginTop: 12 }} /></div>)}</div>
    <div style={{ ...panel, height: 180 }}><div style={{ height: 14, width: '30%', background: '#E2E8F0', borderRadius: 6 }} /></div>
  </div>;
  if (message) return <div style={{ padding: 24, color: '#B91C1C' }}>{message}</div>;
  if (!data?.visible) return <div style={{ padding: 24, ...panel }}>Target Performance is currently hidden by Admin.</div>;

  const cards = [
    ['Monthly Salary', money(data.salaryCents), Wallet],
    ['Monthly GP Target (Salary × 5)', money(data.targetCents), Target],
    ["This Month's Credited GP", money(data.achievedGrossProfitCents), TrendingUp],
    ['Performance', `${Number(data.performancePercent || 0).toLocaleString()}% · ${data.targetStatus}`, CalendarDays]
  ];

  return <div style={{ padding: 24, display: 'grid', gap: 18 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
      <div><h2 style={{ margin: 0 }}>Target Performance</h2><p style={{ margin: '5px 0', color: '#64748B' }}>Your private salary, gross-profit target, and payment-based performance.</p></div>
      <label>Month <input type="month" value={month} onChange={event => setMonth(event.target.value)} style={{ marginLeft: 8, padding: 8 }} /></label>
    </div>

    <section><h3>Salary and Target</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>{cards.map(([label, value, Icon]) => <div key={label} style={panel}><Icon size={18} color="#7C3AED" /><div style={{ color: '#64748B', fontSize: 12, marginTop: 8 }}>{label}</div><strong style={{ fontSize: 20 }}>{value}</strong></div>)}</div></section>

    <section style={panel}><h3 style={{ marginTop: 0 }}>This Month's Performance</h3><div style={{ height: 12, background: '#E2E8F0', borderRadius: 8, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(100, Math.max(0, data.performancePercent || 0))}%`, background: data.targetStatus === 'Target met' ? '#16A34A' : '#7C3AED' }} /></div><p><strong>{data.performancePercent}%</strong> — {data.targetStatus}. {data.targetStatus === 'Target not met' ? 'Only salary applies; no bonus is calculated.' : 'Target reached.'}</p></section>

    <section><h3>Deals and Payments</h3><div style={{ ...panel, padding: 0, overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1050 }}><thead><tr>{['Invoice','Invoice date','Invoice amount','Gross profit','Payments received / cleared date','Credit','Status'].map(label => <th key={label} style={th}>{label}</th>)}</tr></thead><tbody>
      {(data.invoices || []).map(invoice => <tr key={invoice.invoiceId}><td style={td}><strong>{invoice.invoiceNumber}</strong><div>{invoice.customerName}</div><small>{invoice.salesOrderNumber}</small></td><td style={td}>{date(invoice.invoiceDate)}</td><td style={td}>{money(invoice.invoiceAmountCents)}</td><td style={td}>{money(invoice.grossProfitCents)}{invoice.costChangedAfterCredit && <div style={{ color: '#B45309' }}><AlertTriangle size={13} /> Cost changed after credit; recalculated</div>}{invoice.costGap && <div style={{ color: '#B91C1C' }}>{invoice.costGap}</div>}</td><td style={td}>{invoice.payments.length ? invoice.payments.map(payment => <div key={payment.paymentId}>{money(payment.amountCents)} · {date(payment.clearedAt)}</div>) : 'No cleared payment'}</td><td style={td}>{invoice.payments.length ? invoice.payments.map(payment => <div key={payment.paymentId}>{payment.creditPercent}% · {money(payment.creditedGrossProfitCents)}</div>) : '—'}</td><td style={td}><strong>{invoice.status}</strong><div>30-day deadline: {date(invoice.deadline30)}</div><div>40-day deadline: {date(invoice.deadline40)}</div></td></tr>)}
      {!data.invoices?.length && <tr><td colSpan="7" style={{ ...td, textAlign: 'center', color: '#64748B' }}>No finalized linked invoices found.</td></tr>}
    </tbody></table></div></section>
  </div>;
}
