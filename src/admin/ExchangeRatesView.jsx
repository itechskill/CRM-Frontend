import React, { useEffect, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { apiRequest } from '../utils/api';

const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 7 };

export default function ExchangeRatesView() {
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    const result = await apiRequest('/api/exchange-rates');
    const nextRows = result.data?.data || [];
    setRows(nextRows);
    setDrafts(Object.fromEntries(nextRows.map(row => [row.currency, { rateToPKR: row.rateToPKR ?? '', note: '' }])));
    if (!result.success) setMessage(result.data?.message || 'Unable to load exchange rates.');
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async currency => {
    setBusy(currency);
    setMessage('');
    const result = await apiRequest(`/api/exchange-rates/${currency}`, 'PATCH', drafts[currency]);
    setMessage(result.data?.message || (result.success ? 'Exchange rate updated.' : 'Unable to update exchange rate.'));
    if (result.success) await load();
    setBusy('');
  };

  return <div style={{ padding: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18 }}>
      <div><h2 style={{ margin: 0 }}>Exchange Rates</h2><p style={{ color: '#64748B', margin: '5px 0 0' }}>Admin rates copied onto new Supplier POs and foreign-currency expense lines.</p></div>
      <button onClick={load} style={{ border: '1px solid #CBD5E1', background: '#FFF', padding: '8px 12px', borderRadius: 8 }}><RefreshCw size={15} /> Refresh</button>
    </div>
    {message && <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: '#EFF6FF', color: '#1E40AF' }}>{message}</div>}
    <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}><thead><tr style={{ background: '#F8FAFC' }}>{['Currency','Rate to PKR','Last changed by','Last changed at','Optional note','Action'].map(label => <th key={label} style={{ padding: 12, textAlign: 'left' }}>{label}</th>)}</tr></thead><tbody>
        {rows.map(row => <React.Fragment key={row.currency}>
          <tr style={{ borderTop: '1px solid #E2E8F0' }}>
            <td style={{ padding: 12, fontWeight: 800 }}>{row.currency}</td>
            <td><input type="number" min="0.000001" step="0.000001" disabled={row.currency === 'PKR'} value={drafts[row.currency]?.rateToPKR ?? ''} onChange={e => setDrafts(current => ({ ...current, [row.currency]: { ...current[row.currency], rateToPKR: e.target.value } }))} placeholder="Not set" style={inputStyle} /></td>
            <td>{row.lastChangedByName || (row.source === 'default' ? 'System default' : '—')}</td>
            <td>{row.lastChangedAt ? new Date(row.lastChangedAt).toLocaleString() : '—'}</td>
            <td><input disabled={row.currency === 'PKR'} value={drafts[row.currency]?.note || ''} onChange={e => setDrafts(current => ({ ...current, [row.currency]: { ...current[row.currency], note: e.target.value } }))} maxLength={500} style={inputStyle} /></td>
            <td><button disabled={row.currency === 'PKR' || busy === row.currency} onClick={() => save(row.currency)} style={{ border: 0, background: '#2563EB', color: '#FFF', padding: '8px 12px', borderRadius: 7 }}><Save size={14} /> {busy === row.currency ? 'Saving…' : 'Save'}</button></td>
          </tr>
          {row.history?.length > 0 && <tr><td colSpan={6} style={{ padding: '0 12px 12px', color: '#64748B', fontSize: 12 }}><details><summary>History ({row.history.length})</summary>{[...row.history].reverse().map((entry, index) => <div key={index} style={{ padding: '5px 0' }}>{new Date(entry.changedAt).toLocaleString()} · {entry.changedByName || 'Admin'} · {entry.oldRate ?? 'not set'} → {entry.newRate}{entry.note ? ` · ${entry.note}` : ''}</div>)}</details></td></tr>}
        </React.Fragment>)}
        {!loading && !rows.length && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center' }}>No supported currencies found.</td></tr>}
        {loading && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center' }}>Loading…</td></tr>}
      </tbody></table>
    </div>
  </div>;
}
