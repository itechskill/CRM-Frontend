import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Edit3, Plus, Trash2, X } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { getUser } from '../utils/authStorage';

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

export function ExpenseDraftPanel({ value = [], onChange }) {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    apiRequest('/api/purchaser/expense-categories').then(result => {
      if (result.success) setCategories((result.data?.data || []).filter(item => item.isActive));
    });
  }, []);
  const update = (index, changes) => onChange(value.map((item, i) => i === index ? { ...item, ...changes } : item));
  return (
    <section style={{ border: '1px solid #C4B5FD', background: '#FAF5FF', borderRadius: 10, padding: 14, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div><strong>Optional supplier purchase expenses</strong><div style={{ fontSize: 12, color: '#64748B' }}>Saved against this Supplier PO and linked to the GRN created by this receipt.</div></div>
        <button type="button" onClick={() => onChange([...value, emptyExpense()])} style={{ ...inputStyle, width: 'auto', cursor: 'pointer', background: '#6D28D9', color: '#fff', border: 0 }}><Plus size={14} /> Add expense</button>
      </div>
      {value.map((expense, index) => (
        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.5fr .8fr .8fr .8fr .8fr auto', gap: 8, marginTop: 12, alignItems: 'end' }}>
          <label style={{ fontSize: 11 }}>Category<input list="purchase-expense-categories" required style={inputStyle} value={expense.category} onChange={e => update(index, { category: e.target.value })} /></label>
          <label style={{ fontSize: 11 }}>Description<input style={inputStyle} value={expense.description} onChange={e => update(index, { description: e.target.value })} /></label>
          <label style={{ fontSize: 11 }}>Type<select style={inputStyle} value={expense.calculationType} onChange={e => update(index, { calculationType: e.target.value })}><option>Fixed</option><option>Percentage</option></select></label>
          <label style={{ fontSize: 11 }}>{expense.calculationType === 'Percentage' ? 'Percent' : 'Amount'}<input type="number" min="0" step="0.01" required style={inputStyle} value={expense.calculationType === 'Percentage' ? expense.percentage : expense.amount} onChange={e => update(index, expense.calculationType === 'Percentage' ? { percentage: e.target.value } : { amount: e.target.value })} /></label>
          <label style={{ fontSize: 11 }}>Currency<input disabled={expense.calculationType === 'Percentage'} style={inputStyle} value={expense.currency} onChange={e => update(index, { currency: e.target.value.toUpperCase() })} /></label>
          <label style={{ fontSize: 11 }}>Rate to PKR<input type="number" min="0.000001" step="0.000001" disabled={expense.currency === 'PKR' || expense.calculationType === 'Percentage'} style={inputStyle} value={expense.exchangeRateToPKR} onChange={e => update(index, { exchangeRateToPKR: e.target.value })} /></label>
          <button type="button" title="Remove draft line" onClick={() => onChange(value.filter((_, i) => i !== index))} style={{ border: 0, background: '#FEE2E2', color: '#B91C1C', padding: 9, borderRadius: 7, cursor: 'pointer' }}><Trash2 size={15} /></button>
          <label style={{ fontSize: 11, gridColumn: 'span 2' }}>Remarks<input style={inputStyle} value={expense.remarks} onChange={e => update(index, { remarks: e.target.value })} /></label>
          <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}><input type="checkbox" checked={expense.taxable} onChange={e => update(index, { taxable: e.target.checked })} /> Taxable</label>
          <label style={{ fontSize: 11, gridColumn: 'span 3' }}>Attachments (max 3 files, 3 MB each)<input type="file" multiple style={inputStyle} onChange={async e => { try { update(index, { attachments: await filesToAttachments(e.target.files) }); } catch (error) { alert(error.message); e.target.value = ''; } }} /></label>
        </div>
      ))}
      <datalist id="purchase-expense-categories">{categories.map(category => <option key={category.key} value={category.name} />)}</datalist>
    </section>
  );
}

export default function SupplierPOExpensesModal({ po, onClose, canAdd: canAddProp, canEditDelete: canEditDeleteProp, onChanged }) {
  const [record, setRecord] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyExpense());
  const [editingId, setEditingId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const role = getUser()?.role;
  const canAdd = canAddProp ?? ['support', 'finance', 'purchaser', 'admin'].includes(role);
  const canEditDelete = canEditDeleteProp ?? ['finance', 'admin'].includes(role);

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
  const active = useMemo(() => (record?.expenses || []).filter(item => !item.isDeleted), [record]);
  const history = useMemo(() => (record?.expenses || []).flatMap(item => (item.editHistory || []).map(entry => ({ ...entry, category: item.category }))).sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt)), [record]);

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
  const remove = async expense => {
    if (!window.confirm(`Remove ${expense.category}? The line and its history will be retained.`)) return;
    const result = await apiRequest(`/api/purchaser/pos/${po._id}/expenses/${expense._id}`, 'DELETE');
    if (result.success) { setRecord(result.data?.data); setMessage('Expense removed; Admin notified.'); onChanged?.(); }
    else setMessage(result.message || 'Could not remove expense.');
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
          <label>Currency<input disabled={form.calculationType === 'Percentage'} style={inputStyle} value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></label>
          <label>Exchange rate to PKR<input disabled={form.currency === 'PKR' || form.calculationType === 'Percentage'} required type="number" min="0.000001" step="0.000001" style={inputStyle} value={form.exchangeRateToPKR} onChange={e => setForm({ ...form, exchangeRateToPKR: e.target.value })} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 22 }}><input type="checkbox" checked={form.taxable} onChange={e => setForm({ ...form, taxable: e.target.checked })} /> Taxable</label>
          <label>Remarks<input style={inputStyle} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></label>
          <label style={{ gridColumn: 'span 2' }}>Attachments (max 3 files, 3 MB each)<input type="file" multiple style={inputStyle} onChange={async e => { try { setForm({ ...form, attachments: await filesToAttachments(e.target.files) }); } catch (error) { alert(error.message); e.target.value = ''; } }} />{form.attachments?.length > 0 && <button type="button" onClick={() => setForm({ ...form, attachments: [] })}>Clear {form.attachments.length} attachment(s)</button>}</label>
        </div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 11 }}>{editingId && <button type="button" onClick={() => { setEditingId(''); setForm(emptyExpense()); }}>Cancel edit</button>}<button disabled={busy} style={{ border: 0, background: '#6D28D9', color: '#fff', borderRadius: 7, padding: '9px 15px', cursor: 'pointer' }}><DollarSign size={14} /> {busy ? 'Saving…' : 'Save expense'}</button></div></form>}
        {role === 'admin' && <details style={{ marginTop: 14 }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Admin: manage expense categories</summary><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>{categories.map(category => <div key={category.key} style={{ border: '1px solid #E2E8F0', padding: 7, borderRadius: 7, opacity: category.isActive ? 1 : .55 }}><strong>{category.name}</strong> <button type="button" onClick={() => { const name = window.prompt('New category name', category.name); if (name?.trim()) updateCategory(category, { name: name.trim() }); }}>Rename</button> <button type="button" onClick={() => updateCategory(category, { isActive: !category.isActive })}>{category.isActive ? 'Deactivate' : 'Activate'}</button></div>)}</div></details>}
        <details style={{ marginTop: 14 }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Edit and removal history ({history.length})</summary>{history.map((entry, index) => <div key={index} style={{ padding: 8, borderBottom: '1px solid #E2E8F0', fontSize: 12 }}><strong>{new Date(entry.changedAt).toLocaleString()} · {entry.changedByName || 'User'} · {entry.action}</strong><div>{historyValue(entry.oldValues)} → {historyValue(entry.newValues)}</div></div>)}</details>
      </div>
    </div>
  );
}
