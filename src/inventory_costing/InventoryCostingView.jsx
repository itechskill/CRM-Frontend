import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../utils/api';

const money = cents => cents == null ? 'Cost not recorded' : `PKR ${(Number(cents) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const dateText = value => value ? new Date(value).toLocaleDateString() : '—';

export default function InventoryCostingView({ currentUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ unitCostPKR: '', note: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [stockAction, setStockAction] = useState(null);
  const [stockForm, setStockForm] = useState({ name: '', sku: '', partNumber: '', quantity: 1, unitCostPKR: '', costNote: '', reference: '' });
  const role = String(currentUser?.role || '').toLowerCase();
  const canSet = role === 'finance' || role === 'admin';
  const isAdmin = role === 'admin';

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const { response, data } = await apiRequest('/api/inventory-costing');
    if (!response.ok) setError(data.message || 'Could not load inventory costing.');
    else setItems(data.data || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const missingCount = useMemo(() => items.reduce((sum, item) => sum + (item.batches || []).filter(batch => batch.costStatus === 'not recorded').length, 0), [items]);

  const openCost = (item, batch) => {
    setEditing({ item, batch });
    setForm({ unitCostPKR: batch.liveUnitCostPKRCents == null ? '' : String(batch.liveUnitCostPKRCents / 100), note: batch.note || '', reason: '' });
  };
  const save = async event => {
    event.preventDefault(); setSaving(true); setError('');
    const { response, data } = await apiRequest(`/api/inventory-costing/items/${editing.item._id}/batches/${editing.batch._id}/cost`, {
      method: 'PATCH', body: JSON.stringify(form)
    });
    setSaving(false);
    if (!response.ok) return setError(data.message || 'Could not save batch cost.');
    setEditing(null); await load();
  };
  const saveStock = async event => {
    event.preventDefault(); setSaving(true); setError('');
    const isNew = stockAction?.type === 'new';
    const path = isNew ? '/api/sales-employee/inventory' : `/api/sales-employee/inventory/${stockAction.item._id}/in`;
    const body = isNew
      ? { name: stockForm.name, sku: stockForm.sku, partNumber: stockForm.partNumber, quantityOnHand: Number(stockForm.quantity), unitCostPKR: stockForm.unitCostPKR, costNote: stockForm.costNote }
      : { quantity: Number(stockForm.quantity), unitCostPKR: stockForm.unitCostPKR, costNote: stockForm.costNote, reference: stockForm.reference, remarks: stockForm.costNote };
    const { response, data } = await apiRequest(path, { method: 'POST', body: JSON.stringify(body) });
    setSaving(false);
    if (!response.ok) return setError(data.message || 'Could not save inventory stock.');
    setStockAction(null); await load();
  };

  return <div style={{ padding: 24, color: '#0f172a' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end', marginBottom: 18, flexWrap: 'wrap' }}>
      <div><h1 style={{ margin: 0 }}>Inventory Costing</h1><p style={{ color: '#64748b', margin: '6px 0 0' }}>FIFO stock batches by item and part number</p></div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ background: missingCount ? '#fff7ed' : '#ecfdf5', color: missingCount ? '#9a3412' : '#047857', padding: '10px 14px', borderRadius: 999, fontWeight: 700 }}>{missingCount} batch{missingCount === 1 ? '' : 'es'} need cost</div>
        {canSet && <button type="button" onClick={() => { setStockAction({ type: 'new' }); setStockForm({ name: '', sku: '', partNumber: '', quantity: 1, unitCostPKR: '', costNote: '', reference: '' }); }} style={{ background: '#0f766e', color: '#fff', border: 0, borderRadius: 9, padding: '10px 14px', fontWeight: 700 }}>Add Product Stock</button>}
      </div>
    </div>
    {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 12, borderRadius: 10, marginBottom: 12 }}>{error}</div>}
    {loading ? <p>Loading…</p> : items.map(item => <section key={item._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, marginBottom: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(15,23,42,.05)' }}>
      <header style={{ padding: '14px 16px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <strong>{item.name} {item.partNumber && <span style={{ color: '#475569' }}>· {item.partNumber}</span>}</strong>
        <span>On hand {item.quantityOnHand} · Reserved {item.reservedQuantity} {canSet && <button type="button" onClick={() => { setStockAction({ type: 'in', item }); setStockForm({ name: '', sku: '', partNumber: '', quantity: 1, unitCostPKR: '', costNote: '', reference: '' }); }} style={{ marginLeft: 10 }}>Inventory IN</button>}</span>
      </header>
      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
        <thead><tr>{['Date', 'Source', 'GRN / PO ref', 'Qty received', 'Qty remaining', 'Unit cost', 'Status', 'Action'].map(label => <th key={label} style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #e2e8f0', fontSize: 12, color: '#475569' }}>{label}</th>)}</tr></thead>
        <tbody>{(item.batches || []).map(batch => <tr key={batch._id}>
          <td style={{ padding: 12 }}>{dateText(batch.receivedAt)}</td><td style={{ padding: 12 }}>{batch.source}</td>
          <td style={{ padding: 12 }}>{batch.grnNumber || batch.supplierPONumber || '—'}</td>
          <td style={{ padding: 12 }}>{batch.quantityReceived}</td><td style={{ padding: 12 }}>{batch.quantityRemaining}</td>
          <td style={{ padding: 12, fontWeight: 700 }}>{money(batch.liveUnitCostPKRCents)}</td>
          <td style={{ padding: 12 }}><span style={{ padding: '5px 9px', borderRadius: 999, background: batch.costStatus === 'recorded' ? '#dcfce7' : '#ffedd5', color: batch.costStatus === 'recorded' ? '#166534' : '#9a3412', fontWeight: 700, fontSize: 12 }}>{batch.costStatus}</span></td>
          <td style={{ padding: 12 }}>{canSet && (batch.costStatus === 'not recorded' || isAdmin) ? <button type="button" onClick={() => openCost(item, batch)} style={{ border: 0, borderRadius: 8, background: '#2563eb', color: '#fff', padding: '8px 12px', cursor: 'pointer' }}>{batch.costStatus === 'not recorded' ? 'Set cost' : 'Change cost'}</button> : 'View only'}</td>
        </tr>)}</tbody>
      </table></div>
    </section>)}
    {editing && <div onMouseDown={event => event.target === event.currentTarget && setEditing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 20 }}>
      <form onSubmit={save} style={{ background: '#fff', width: 'min(520px, 100%)', borderRadius: 16, padding: 22 }}>
        <h2 style={{ marginTop: 0 }}>{editing.batch.costStatus === 'not recorded' ? 'Set cost' : 'Change cost'}</h2>
        <p>{editing.item.name} · {editing.batch.source}</p>
        <label style={{ display: 'grid', gap: 6, marginBottom: 14 }}>Unit Cost (PKR)<input required min="0" step="0.01" type="number" value={form.unitCostPKR} onChange={event => setForm({ ...form, unitCostPKR: event.target.value })} style={{ padding: 11, border: '1px solid #cbd5e1', borderRadius: 8 }} /></label>
        <label style={{ display: 'grid', gap: 6, marginBottom: 14 }}>Note<input value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} style={{ padding: 11, border: '1px solid #cbd5e1', borderRadius: 8 }} /></label>
        {editing.batch.costStatus === 'recorded' && <label style={{ display: 'grid', gap: 6, marginBottom: 14 }}>Reason (required)<textarea required value={form.reason} onChange={event => setForm({ ...form, reason: event.target.value })} style={{ padding: 11, border: '1px solid #cbd5e1', borderRadius: 8 }} /></label>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><button type="button" onClick={() => setEditing(null)}>Cancel</button><button disabled={saving} style={{ background: '#2563eb', color: '#fff', border: 0, borderRadius: 8, padding: '10px 16px' }}>{saving ? 'Saving…' : 'Save'}</button></div>
      </form>
    </div>}
    {stockAction && <div onMouseDown={event => event.target === event.currentTarget && setStockAction(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 20 }}>
      <form onSubmit={saveStock} style={{ background: '#fff', width: 'min(560px, 100%)', borderRadius: 16, padding: 22 }}>
        <h2 style={{ marginTop: 0 }}>{stockAction.type === 'new' ? 'Add Product Stock' : `Inventory IN · ${stockAction.item.name}`}</h2>
        {stockAction.type === 'new' && <><label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>Product name<input required value={stockForm.name} onChange={event => setStockForm({ ...stockForm, name: event.target.value })} /></label><label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>SKU<input value={stockForm.sku} onChange={event => setStockForm({ ...stockForm, sku: event.target.value })} /></label><label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>Part number<input value={stockForm.partNumber} onChange={event => setStockForm({ ...stockForm, partNumber: event.target.value })} /></label></>}
        <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>Quantity<input required min="0.01" step="0.01" type="number" value={stockForm.quantity} onChange={event => setStockForm({ ...stockForm, quantity: event.target.value })} /></label>
        {stockAction.type === 'in' && <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>Reference<input value={stockForm.reference} onChange={event => setStockForm({ ...stockForm, reference: event.target.value })} /></label>}
        <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>Unit Cost (PKR)<input min="0" step="0.01" type="number" value={stockForm.unitCostPKR} onChange={event => setStockForm({ ...stockForm, unitCostPKR: event.target.value })} /></label>
        <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>Cost note<input value={stockForm.costNote} onChange={event => setStockForm({ ...stockForm, costNote: event.target.value })} /></label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><button type="button" onClick={() => setStockAction(null)}>Cancel</button><button disabled={saving} style={{ background: '#0f766e', color: '#fff', border: 0, borderRadius: 8, padding: '10px 16px' }}>{saving ? 'Saving…' : 'Save stock'}</button></div>
      </form>
    </div>}
  </div>;
}
