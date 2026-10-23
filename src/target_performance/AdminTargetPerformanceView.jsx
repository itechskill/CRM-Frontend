import React, { useEffect, useState } from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { getUser } from '../utils/authStorage';

const money = cents => cents == null ? 'Private' : `PKR ${(Number(cents) / 100).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const currentMonth = () => new Date().toISOString().slice(0, 7);
const cell = { padding: 10, borderTop: '1px solid #E2E8F0', textAlign: 'left', fontSize: 13 };

export default function AdminTargetPerformanceView() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState('');
  const role = getUser()?.role;
  const isAdmin = role === 'admin';

  const load = async () => {
    const result = await apiRequest(`/api/target-performance/admin?month=${month}`);
    if (!result.success) return setMessage(result.data?.message || 'Could not load Target Performance.');
    const next = result.data?.data;
    setData(next);
    setDrafts(Object.fromEntries((next?.salespeople || []).map(row => [row.userId, row.salaryCents == null ? '' : Number(row.salaryCents) / 100])));
  };
  useEffect(() => { load(); }, [month]);

  const saveSalary = async userId => {
    const cents = Math.round(Number(drafts[userId] || 0) * 100);
    const result = await apiRequest(`/api/target-performance/users/${userId}/salary`, 'PATCH', { monthlySalaryCents: cents });
    setMessage(result.success ? 'Monthly salary saved.' : (result.data?.message || 'Could not save salary.'));
    if (result.success) load();
  };
  const setVisibility = async showToSalespeople => {
    const result = await apiRequest('/api/target-performance/settings', 'PATCH', { showToSalespeople });
    setMessage(result.success ? `Salesperson visibility turned ${showToSalespeople ? 'ON' : 'OFF'}.` : (result.data?.message || 'Could not update visibility.'));
    if (result.success) load();
  };
  const financeRecords = (data?.salespeople || []).flatMap(row => (row.invoices || [])
    .filter(invoice => invoice.needsFinance)
    .map(invoice => ({ ...invoice, salespersonName: row.fullName })));

  return <div style={{ padding: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 15, flexWrap: 'wrap', alignItems: 'end' }}><div><h2 style={{ margin: 0 }}>Target Performance</h2><p style={{ color: '#64748B' }}>Monthly salaries, GP targets, credited GP and invoices needing Finance.</p></div><label>Month <input type="month" value={month} onChange={event => setMonth(event.target.value)} style={{ marginLeft: 8, padding: 8 }} /></label></div>
    {message && <div style={{ margin: '12px 0', padding: 10, background: '#EFF6FF', color: '#1E40AF', borderRadius: 8 }}>{message}</div>}
    <div style={{ margin: '16px 0', padding: 15, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, display: 'flex', justifyContent: 'space-between', gap: 15, alignItems: 'center' }}><div><strong>Show Target Performance to salespeople</strong><div style={{ color: '#64748B', fontSize: 13 }}>Default is OFF. When off, private Sales and Sales Manager navigation is hidden.</div></div><input type="checkbox" disabled={!isAdmin} checked={Boolean(data?.setting?.showToSalespeople)} onChange={event => setVisibility(event.target.checked)} style={{ width: 22, height: 22 }} /></div>
    {!data?.salaryVisible && <div style={{ padding: 12, background: '#FFF7ED', color: '#9A3412', borderRadius: 8 }}>CEO read-only view: salaries and salary-derived targets/percentages are hidden.</div>}
    <div style={{ marginTop: 16, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}><thead><tr style={{ background: '#F8FAFC' }}>{['Salesperson','Monthly salary','GP target','Achieved GP','Performance','Payment status','Overdue deals','Cost changes'].map(label => <th key={label} style={{ ...cell, borderTop: 0 }}>{label}</th>)}</tr></thead><tbody>
      {(data?.salespeople || []).map(row => <tr key={row.userId}><td style={cell}><strong>{row.fullName}</strong><div>{row.email}</div></td><td style={cell}>{isAdmin ? <div style={{ display: 'flex', gap: 6 }}><input type="number" min="0" step="0.01" value={drafts[row.userId] ?? ''} onChange={event => setDrafts({ ...drafts, [row.userId]: event.target.value })} style={{ width: 125, padding: 7 }} /><button title="Save salary" onClick={() => saveSalary(row.userId)}><Save size={14} /></button></div> : money(row.salaryCents)}</td><td style={cell}>{money(row.targetCents)}</td><td style={cell}>{money(row.achievedGrossProfitCents)}</td><td style={cell}>{row.performancePercent == null ? 'Private' : `${row.performancePercent}% · ${row.targetStatus}`}</td><td style={cell}>{row.invoices.some(invoice => invoice.needsFinance) ? 'Needs Finance' : 'Current'}</td><td style={cell}>{row.overdueDeals}</td><td style={cell}>{row.costRecalculationFlags ? <span style={{ color: '#B45309' }}><AlertTriangle size={13} /> {row.costRecalculationFlags} recalculated</span> : 'None'}</td></tr>)}
    </tbody></table></div>
    <h3 style={{ marginTop: 24 }}>Records needing Finance</h3>
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}><thead><tr style={{ background: '#F8FAFC' }}>{['Invoice','Salesperson','Invoice amount','GP','Status / cost flag'].map(label => <th key={label} style={{ ...cell, borderTop: 0 }}>{label}</th>)}</tr></thead><tbody>{financeRecords.map(invoice => <tr key={invoice.invoiceId}><td style={cell}><strong>{invoice.invoiceNumber}</strong><div>{invoice.customerName}</div></td><td style={cell}>{invoice.salespersonName}</td><td style={cell}>{money(invoice.invoiceAmountCents)}</td><td style={cell}>{money(invoice.grossProfitCents)}</td><td style={cell}>{invoice.status}{invoice.costChangedAfterCredit && <div style={{ color: '#B45309' }}>Cost changed after payment credit; values recalculated.</div>}{invoice.costGap && <div style={{ color: '#B91C1C' }}>{invoice.costGap}</div>}</td></tr>)}{!financeRecords.length && <tr><td colSpan="5" style={{ ...cell, textAlign: 'center', color: '#64748B' }}>No records currently need Finance.</td></tr>}</tbody></table></div>
  </div>;
}
