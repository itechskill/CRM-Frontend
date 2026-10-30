import React, { useMemo, useState } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { calculateInvoiceTotals } from '../utils/documentFinancials';
import { resolveDocumentLines } from '../utils/documentPartNumbers';
import '../accounts/InvoicePaymentForms.css';

export default function InvoiceEditModal({ invoice, apiPath, onClose, onSaved }) {
  const initialItems = useMemo(() => {
    const resolved = resolveDocumentLines(invoice);
    return resolved.length ? resolved : [{ partNumber: '', description: 'Item', quantity: 1, unitPrice: Number(invoice.amount || 0), total: Number(invoice.amount || 0) }];
  }, [invoice]);
  const [form, setForm] = useState(() => ({
    items: initialItems,
    discount: Number(invoice.discount || 0),
    taxRate: Number(invoice.taxRate || 0),
    notes: invoice.notes || '',
    poReference: invoice.poReference || '',
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : ''
  }));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const totals = calculateInvoiceTotals(form);

  const updateItem = (index, field, value) => setForm(current => ({
    ...current,
    items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)
  }));
  const addItem = () => setForm(current => ({ ...current, items: [...current.items, { partNumber: '', description: '', quantity: 1, unitPrice: 0, total: 0 }] }));
  const removeItem = index => setForm(current => ({ ...current, items: current.items.length === 1 ? current.items : current.items.filter((_, itemIndex) => itemIndex !== index) }));

  const save = async event => {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      const payload = { ...form, items: totals.items, discount: totals.discount, taxRate: totals.taxRate };
      const { response, data } = await apiRequest(apiPath, { method: 'PATCH', body: JSON.stringify(payload) });
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to save invoice.');
      onSaved(data.data);
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  };

  return <div className="ip-modal-overlay" onClick={onClose}>
    <div className="ip-modal-card" style={{ maxWidth: 900, width: '96%' }} onClick={event => event.stopPropagation()}>
      <div className="ip-modal-header invoice-theme"><div><h3>Edit Invoice {invoice.invoiceNumber}</h3><p>Server-calculated totals and persisted part numbers</p></div><button type="button" className="ip-close-btn" onClick={onClose}><X size={18} /></button></div>
      <form onSubmit={save}><div className="ip-modal-body">
        {message && <div style={{ padding: 10, borderRadius: 8, background: '#FEF2F2', color: '#991B1B', marginBottom: 12 }}>{message}</div>}
        <div style={{ overflowX: 'auto' }}><table className="sv-table" style={{ minWidth: 760 }}><thead><tr><th>Part Number</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Line Total</th><th /></tr></thead><tbody>{form.items.map((item, index) => <tr key={index}><td><input value={item.partNumber || ''} onChange={event => updateItem(index, 'partNumber', event.target.value)} /></td><td><input value={item.description || ''} onChange={event => updateItem(index, 'description', event.target.value)} required /></td><td><input type="number" min="1" value={item.quantity} onChange={event => updateItem(index, 'quantity', event.target.value)} /></td><td><input type="number" min="0" value={item.unitPrice} onChange={event => updateItem(index, 'unitPrice', event.target.value)} /></td><td>PKR {Number(totals.items[index]?.total || 0).toLocaleString()}</td><td><button type="button" onClick={() => removeItem(index)} className="sv-btn-action-icon"><Trash2 size={14} /></button></td></tr>)}</tbody></table></div>
        <button type="button" onClick={addItem} className="sv-btn-cancel" style={{ marginTop: 10 }}><Plus size={14} /> Add line</button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 18 }}>
          <label>Discount (PKR)<input type="number" min="0" value={form.discount} onChange={event => setForm(current => ({ ...current, discount: event.target.value }))} /></label>
          <label>Tax rate (%)<input type="number" min="0" step="0.01" value={form.taxRate} onChange={event => setForm(current => ({ ...current, taxRate: event.target.value }))} /></label>
          <label>PO Reference<input value={form.poReference} maxLength={60} onChange={event => setForm(current => ({ ...current, poReference: event.target.value }))} /></label>
          <label>Due date<input type="date" value={form.dueDate} onChange={event => setForm(current => ({ ...current, dueDate: event.target.value }))} /></label>
        </div>
        <label style={{ display: 'block', marginTop: 12 }}>Notes<textarea rows="3" value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} /></label>
        <div style={{ marginTop: 16, textAlign: 'right', fontWeight: 800 }}>Subtotal: PKR {totals.subtotal.toLocaleString()} · Discount: PKR {totals.discount.toLocaleString()} · Tax: PKR {totals.tax.toLocaleString()} · Total: PKR {totals.amount.toLocaleString()}</div>
      </div><div className="sv-modal-actions" style={{ padding: 16 }}><button type="button" className="sv-btn-cancel" onClick={onClose}>Cancel</button><button type="submit" className="sv-btn-primary" disabled={saving}><Save size={15} /> {saving ? 'Saving…' : 'Save Invoice'}</button></div></form>
    </div>
  </div>;
}
