import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';

const money = cents => cents == null ? 'Unavailable' : `PKR ${(Number(cents) / 100).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = value => value ? new Date(value).toLocaleDateString('en-PK') : '—';
const currentMonth = () => new Date().toISOString().slice(0, 7);
const cell = { padding: 10, borderTop: '1px solid #E2E8F0', textAlign: 'left', fontSize: 13 };

export default function FinanceTargetPerformanceView() {
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('');
  useEffect(() => {
    apiRequest(`/api/target-performance/finance-overdue?month=${month}`).then(result => {
      if (!result.success) setMessage(result.data?.message || 'Could not load late invoices.');
      else { setRows(result.data?.data?.invoices || []); setMessage(''); }
    });
  }, [month]);
  return <div style={{ padding: 24 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 15, flexWrap: 'wrap', alignItems: 'end' }}><div><h2 style={{ margin: 0 }}>Invoices Beyond 40 Days</h2><p style={{ color: '#64748B' }}>Read-only list for Finance. Sales salaries are never included.</p></div><label>Payment month <input type="month" value={month} onChange={event => setMonth(event.target.value)} style={{ marginLeft: 8, padding: 8 }} /></label></div>{message && <p style={{ color: '#B91C1C' }}>{message}</p>}<div style={{ marginTop: 16, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 950 }}><thead><tr style={{ background: '#F8FAFC' }}>{['Invoice','Salesperson','Invoice date','Amount','GP','Paid / outstanding','40-day deadline','Reason'].map(label => <th key={label} style={{ ...cell, borderTop: 0 }}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.invoiceId}><td style={cell}><strong>{row.invoiceNumber}</strong><div>{row.customerName}</div></td><td style={cell}>{row.salespersonName}</td><td style={cell}>{date(row.invoiceDate)}</td><td style={cell}>{money(row.invoiceAmountCents)}</td><td style={cell}>{money(row.grossProfitCents)}</td><td style={cell}>{money(row.paidCents)} / {money(row.outstandingCents)}</td><td style={cell}>{date(row.deadline40)}</td><td style={cell}>{row.payments.some(payment => payment.daysAfterInvoice > 40) ? 'Payment cleared after day 40' : 'Outstanding after day 40'}{row.costGap && <div style={{ color: '#B91C1C' }}>{row.costGap}</div>}</td></tr>)}{!rows.length && <tr><td colSpan="8" style={{ ...cell, textAlign: 'center', color: '#64748B' }}>No invoices currently require Finance review.</td></tr>}</tbody></table></div></div>;
}
