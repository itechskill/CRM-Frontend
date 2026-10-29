import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Edit3, Trash2, X } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { getUser } from '../utils/authStorage';
import useExchangeRates from '../hooks/useExchangeRates';
import { exchangeRateFor, SUPPORTED_CURRENCIES } from '../utils/exchangeRates';

const emptyExpense = () => ({
  category: 'Freight', description: '', calculationType: 'Fixed', amount: '', percentage: '',
  taxable: false, currency: 'PKR', exchangeRateToPKR: 1, remarks: '', attachments: []
});
const money = cents => `PKR ${(Number(cents) / 100 || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const historyValue = value => value ? `${value.category || '—'} · ${money(value.amountPKRCents)}${value.isDeleted ? ' · removed' : ''}` : '—';
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 9px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13 };

async function filesToAttachments(fileList) {
  const files = Array.from(fileList || []);
  if (files.length > 3) throw new Error('Attach at most 3 files to one expense.');
  return Promise.all(files.map(file => new Promise((resolve, reject) => {
    if (file.size > 3 * 1024 * 1024) return reject(new Error(`${file.name} is larger than 3 MB.`));
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size, data: reader.result });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  })));
}

export default function SupplierPOExpensesModal({ po, onClose, canAdd: canAddProp, canEditDelete: canEditDeleteProp, onChanged }) {
  const exchangeRates = useExchangeRates();
  const [record, setRecord] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyExpense());
  const [editingId, setEditingId] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [message, setMessage] = useState('');
  const role = getUser()?.role;
  const costingStatus = record?.costingStatus || 'Incomplete';
  const costingCompleted = costingStatus === 'Completed';
  const baseCanAdd = canAddProp ?? ['finance', 'admin'].includes(role);
  const baseCanEditDelete = canEditDeleteProp ?? ['finance', 'admin'].includes(role);
  const canAdd = baseCanAdd && (!costingCompleted || role === 'admin');
  const canEditDelete = baseCanEditDelete && (!costingCompleted || role === 'admin');
  const selectedAdminRate = exchangeRateFor(exchangeRates, form.currency);

  const load = async () => {
    const [poResult, categoryResult] = await Promise.all([
      apiRequest(`/api/purchaser/pos/${po._id}/expenses`),
      apiRequest('/api/purchaser/expense-categories')
    ]);
    if (!poResult.success) throw new Error(poResult.message || 'Could not load expenses.');
    setRecord(poResult.data?.data);
    if (categoryResult.success) setCategories(categoryResult.data?.data || []);
  };
  useEffect(() => { load().catch(error => setMessage(error.message)); }, [po._id]);
  useEffect(() => {
    if (!confirmComplete) return undefined;
    const onKeyDown = event => {
      if (event.key === 'Escape') setConfirmComplete(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmComplete]);
  const active = useMemo(() => (record?.expenses || []).filter(item => !item.isDeleted), [record]);
  const history = useMemo(() => [
    ...(record?.expenses || []).flatMap(item => (item.editHistory || []).map(entry => ({ ...entry, category: item.category, historyType: 'expense' }))),
    ...(record?.costingHistory || []).map(entry => ({ ...entry, historyType: 'costing' }))
  ].sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt)), [record]);

  const save = async e => {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const path = editingId ? `/api/purchaser/pos/${po._id}/expenses/${editingId}` : `/api/purchaser/pos/${po._id}/expenses`;
      const result = await apiRequest(path, editingId ? 'PATCH' : 'POST', form);
      if (!result.success) throw new Error(result.message || 'Could not save expense.');
      setRecord(result.data?.data); setForm(emptyExpense()); setEditingId(''); setMessage('Expense saved; Admin notified.'); onChanged?.();
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const edit = expense => {
    setEditingId(expense._id);
    setForm({ ...expense, amount: Number(expense.amountCents || 0) / 100, attachments: expense.attachments || [] });
  };
  const changeCurrency = currency => {
    const normalized = String(currency || 'PKR').toUpperCase();
    const rate = normalized === 'PKR' ? 1 : exchangeRateFor(exchangeRates, normalized);
    setForm({ ...form, currency: normalized, exchangeRateToPKR: rate ?? '' });
  };
  const remove = async expense => {
    if (!window.confirm(`Remove ${expense.category}? The line and its history will be retained.`)) return;
    const result = await apiRequest(`/api/purchaser/pos/${po._id}/expenses/${expense._id}`, 'DELETE');
    if (result.success) { setRecord(result.data?.data); setMessage('Expense removed; Admin notified.'); onChanged?.(); }
    else setMessage(result.message || 'Could not remove expense.');
  };
  const setCostingStatus = async (status, confirmed = false) => {
    if (!['finance', 'admin'].includes(role) || status === costingStatus) return;
    if (status === 'Completed' && !confirmed) {
      setConfirmComplete(true);
      return;
    }
    let reason = '';
    if (status === 'Incomplete') {
      if (role !== 'admin') return setMessage('Costing is Completed and locked. Admin must authorize a change.');
      reason = window.prompt('Reason for re-opening costing')?.trim() || '';
      if (!reason) return setMessage('A short reason is required to re-open costing.');
    }
    setConfirmComplete(false); setStatusBusy(true); setMessage('');
    try {
      const result = await apiRequest(`/api/purchaser/pos/${po._id}/expenses/costing-status`, 'PATCH', { status, reason });
      if (!result.success) throw new Error(result.message || 'Could not update costing status.');
      setRecord(result.data?.data);
      setEditingId(''); setForm(emptyExpense());
      setMessage(status === 'Completed' ? 'Costing marked Completed and locked.' : 'Costing re-opened as Incomplete.');
      onChanged?.();
    } catch (error) { setMessage(error.message); } finally { setStatusBusy(false); }
  };
  const totals = record?.expenseTotals || {};
  const updateCategory = async (category, changes) => {
    const result = await apiRequest(`/api/purchaser/expense-categories/${encodeURIComponent(category.key)}`, 'PATCH', changes);
    if (!result.success) return setMessage(result.message || 'Could not update category.');
    const categoryResult = await apiRequest('/api/purchaser/expense-categories');
    if (categoryResult.success) setCategories(categoryResult.data?.data || []);
    setMessage('Expense category updated. Existing expense lines keep their recorded category.');
  };
  return (
    <div className="sv-modal-overlay" onClick={onClose}>
      <div className="sv-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 1180, maxHeight: '94vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
          <div><h3 style={{ margin: 0 }}>Supplier purchase expenses</h3><div style={{ color: '#64748B', fontSize: 13 }}>{record?.poNumber || po.poNumber} · {record?.supplierName || po.supplierName} · Order {record?.salesOrderNumber || '—'}</div></div>
          <button onClick={onClose} style={{ border: 0, background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        {message && <div style={{ padding: 10, marginTop: 12, borderRadius: 8, background: '#EFF6FF', color: '#1E40AF' }}>{message}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 14, padding: 12, border: '1px solid #CBD5E1', borderRadius: 10, background: '#F8FAFC' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>GRN number(s)</div>
            <div style={{ marginTop: 3, fontWeight: 700 }}>{[...new Set(active.map(item => item.grnNumber).filter(Boolean))].join(', ') || 'Not linked yet'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 5 }}>Costing status</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Incomplete', 'Completed'].map(status => {
                const selected = costingStatus === status;
                const canSelect = ['finance', 'admin'].includes(role) && !statusBusy && (status === 'Completed' || role === 'admin');
                return <button key={status} type="button" disabled={!canSelect} onClick={() => setCostingStatus(status)} style={{ minWidth: 120, padding: '10px 16px', borderRadius: 8, border: `2px solid ${selected ? (status === 'Completed' ? '#059669' : '#D97706') : '#CBD5E1'}`, background: selected ? (status === 'Completed' ? '#ECFDF5' : '#FFFBEB') : '#FFFFFF', color: selected ? (status === 'Completed' ? '#047857' : '#92400E') : '#64748B', fontWeight: 800, cursor: canSelect ? 'pointer' : 'default', opacity: canSelect || selected ? 1 : .65 }}>{status}</button>;
              })}
            </div>
          </div>
        </div>
        {costingCompleted && role !== 'admin' && <div style={{ padding: 10, marginTop: 10, borderRadius: 8, background: '#FEF2F2', color: '#991B1B', fontWeight: 700 }}>Costing is Completed and locked. Admin must authorize a change.</div>}
        <div style={{ overflowX: 'auto', marginTop: 14 }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: '#F8FAFC' }}>{['Category','Description','Basis','Taxable','PKR amount','GRN','Added by','Actions'].map(label => <th key={label} style={{ textAlign: 'left', padding: 9 }}>{label}</th>)}</tr></thead><tbody>
          {active.map(expense => <tr key={expense._id} style={{ borderTop: '1px solid #E2E8F0' }}><td style={{ padding: 9 }}>{expense.category}</td><td>{expense.description || '—'}{(expense.attachments || []).map(file => <div key={file.name}><a href={file.data} download={file.name} style={{ fontSize: 11 }}>{file.name}</a></div>)}</td><td>{expense.calculationType === 'Percentage' ? `${expense.percentage}% of PO subtotal` : `${expense.currency} ${(Number(expense.amountCents) / 100).toLocaleString()} @ ${expense.exchangeRateToPKR}`}</td><td>{expense.taxable ? 'Yes' : 'No'}</td><td>{money(expense.amountPKRCents)}</td><td>{expense.grnNumber || 'Later entry'}</td><td>{expense.addedByName || '—'}</td><td>{canEditDelete && <div style={{ display: 'flex', gap: 5 }}><button onClick={() => edit(expense)} title="Edit"><Edit3 size={14} /></button><button onClick={() => remove(expense)} title="Soft delete"><Trash2 size={14} /></button></div>}</td></tr>)}
          {!active.length && <tr><td colSpan="8" style={{ padding: 20, textAlign: 'center', color: '#64748B' }}>No supplier purchase expenses recorded.</td></tr>}
        </tbody></table></div>
        <div style={{ marginTop: 14, marginLeft: 'auto', maxWidth: 430, border: '1px solid #CBD5E1', borderRadius: 10, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>PO subtotal</span><strong>{money(totals.subtotalPKRCents)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Taxable expense subtotal</span><strong>{money(totals.taxableExpensesPKRCents)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total expenses</span><strong>{money(totals.totalExpensesPKRCents)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #CBD5E1', marginTop: 7, paddingTop: 7, color: '#6D28D9' }}><span>Landed cost = PO total in PKR + expenses</span><strong>{money(totals.landedCostPKRCents)}</strong></div>
        </div>
        {(editingId ? canEditDelete : canAdd) && <form onSubmit={save} style={{ marginTop: 16, padding: 14, background: '#F8FAFC', borderRadius: 10 }}><h4 style={{ margin: '0 0 10px' }}>{editingId ? 'Edit expense' : 'Add expense'}</h4><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 9 }}>
          <label>Category<input required list="expense-categories" style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label><datalist id="expense-categories">{categories.filter(item => item.isActive).map(item => <option key={item.key} value={item.name} />)}</datalist>
          <label>Description<input style={inputStyle} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
          <label>Calculation<select style={inputStyle} value={form.calculationType} onChange={e => setForm({ ...form, calculationType: e.target.value })}><option>Fixed</option><option>Percentage</option></select></label>
          <label>{form.calculationType === 'Percentage' ? 'Percentage' : 'Amount'}<input required type="number" min="0" step="0.01" style={inputStyle} value={form.calculationType === 'Percentage' ? form.percentage : form.amount} onChange={e => setForm({ ...form, [form.calculationType === 'Percentage' ? 'percentage' : 'amount']: e.target.value })} /></label>
          <label>Currency<select disabled={form.calculationType === 'Percentage'} style={inputStyle} value={form.currency} onChange={e => changeCurrency(e.target.value)}>{SUPPORTED_CURRENCIES.map(currency => <option key={currency} value={currency}>{currency}</option>)}</select></label>
          <label>Exchange rate to PKR<input disabled={form.currency === 'PKR' || form.calculationType === 'Percentage' || role !== 'admin' || !editingId} required type="number" min="0.000001" step="0.000001" style={inputStyle} value={form.exchangeRateToPKR || (selectedAdminRate ?? '')} onChange={e => setForm({ ...form, exchangeRateToPKR: e.target.value })} /><small style={{ color: '#64748B' }}>{form.currency === 'PKR' ? 'Fixed at 1' : editingId && role === 'admin' ? 'Admin correction is recorded in history.' : selectedAdminRate ? 'Copied from the current Admin rate when added.' : `Exchange rate for ${form.currency} is not set by Admin.`}</small></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 22 }}><input type="checkbox" checked={form.taxable} onChange={e => setForm({ ...form, taxable: e.target.checked })} /> Taxable</label>
          <label>Remarks<input style={inputStyle} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></label>
          <label style={{ gridColumn: 'span 2' }}>Attachments (max 3 files, 3 MB each)<input type="file" multiple style={inputStyle} onChange={async e => { try { setForm({ ...form, attachments: await filesToAttachments(e.target.files) }); } catch (error) { alert(error.message); e.target.value = ''; } }} />{form.attachments?.length > 0 && <button type="button" onClick={() => setForm({ ...form, attachments: [] })}>Clear {form.attachments.length} attachment(s)</button>}</label>
        </div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 11 }}>{editingId && <button type="button" onClick={() => { setEditingId(''); setForm(emptyExpense()); }}>Cancel edit</button>}<button disabled={busy} style={{ border: 0, background: '#6D28D9', color: '#fff', borderRadius: 7, padding: '9px 15px', cursor: 'pointer' }}><DollarSign size={14} /> {busy ? 'Saving…' : 'Save expense'}</button></div></form>}
        {role === 'admin' && <details style={{ marginTop: 14 }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Admin: manage expense categories</summary><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>{categories.map(category => <div key={category.key} style={{ border: '1px solid #E2E8F0', padding: 7, borderRadius: 7, opacity: category.isActive ? 1 : .55 }}><strong>{category.name}</strong> <button type="button" onClick={() => { const name = window.prompt('New category name', category.name); if (name?.trim()) updateCategory(category, { name: name.trim() }); }}>Rename</button> <button type="button" onClick={() => updateCategory(category, { isActive: !category.isActive })}>{category.isActive ? 'Deactivate' : 'Activate'}</button></div>)}</div></details>}
        <details style={{ marginTop: 14 }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Expense and costing history ({history.length})</summary>{history.map((entry, index) => <div key={index} style={{ padding: 8, borderBottom: '1px solid #E2E8F0', fontSize: 12 }}><strong>{new Date(entry.changedAt).toLocaleString()} · {entry.changedByName || 'User'} · {entry.action}</strong>{entry.historyType === 'costing' ? <div>{entry.previousStatus} → {entry.newStatus}{entry.reason ? ` · ${entry.reason}` : ''}</div> : <div>{historyValue(entry.oldValues)} → {historyValue(entry.newValues)}</div>}</div>)}</details>
      </div>
      {confirmComplete && <div
        role="presentation"
        onClick={event => { event.stopPropagation(); setConfirmComplete(false); }}
        style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15, 23, 42, .55)', display: 'grid', placeItems: 'center', padding: 20 }}
      >
        <div role="dialog" aria-modal="true" aria-labelledby="costing-confirm-title" onClick={event => event.stopPropagation()} style={{ width: 'min(520px, 100%)', background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 24px 60px rgba(15, 23, 42, .25)' }}>
          <h3 id="costing-confirm-title" style={{ margin: '0 0 10px' }}>Complete costing</h3>
          <p style={{ margin: 0, color: '#334155', lineHeight: 1.55 }}>Are you sure you want to mark this GRN as Completed? Once completed, it will be locked against further changes.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 20 }}>
            <button type="button" onClick={() => setConfirmComplete(false)} disabled={statusBusy}>Cancel</button>
            <button type="button" onClick={() => setCostingStatus('Completed', true)} disabled={statusBusy} style={{ border: 0, borderRadius: 7, padding: '8px 14px', background: '#059669', color: '#fff', fontWeight: 700 }}>{statusBusy ? 'Completingâ€¦' : 'Confirm'}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
