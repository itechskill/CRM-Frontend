import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { Plus, FileText, Edit2, X, Save, DollarSign } from 'lucide-react';
import './SalesViews.css';

const STATUS_COLORS = {
  Draft: '#64748B', Sent: '#3B82F6', Accepted: '#10B981',
  Rejected: '#EF4444', Expired: '#F59E0B'
};

const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: 0, total: 0 };
const EMPTY_FORM = { clientName: '', clientEmail: '', clientPhone: '', items: [{ ...EMPTY_ITEM }], discount: 0, tax: 0, status: 'Draft', validUntil: '', notes: '' };

function calcTotals(items, discount = 0, tax = 0) {
  const total = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice)), 0);
  const afterDiscount = total - Number(discount);
  const taxAmt = afterDiscount * (Number(tax) / 100);
  return { totalAmount: total, netAmount: afterDiscount + taxAmt };
}

export default function SalesQuotationsView() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchQ = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const { response, data } = await apiRequest(`/api/sales-employee/quotations${params}`);
      if (response.ok && data.success) setQuotations(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchQ(); }, [fetchQ]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditQ(null); setError(''); setShowModal(true); };
  const openEdit = (q) => {
    setForm({ clientName: q.clientName, clientEmail: q.clientEmail, clientPhone: q.clientPhone, items: q.items?.length ? q.items : [{ ...EMPTY_ITEM }], discount: q.discount, tax: q.tax, status: q.status, validUntil: q.validUntil ? q.validUntil.substring(0, 10) : '', notes: q.notes });
    setEditQ(q); setError(''); setShowModal(true);
  };

  const updateItem = (idx, field, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    items[idx].total = Number(items[idx].quantity) * Number(items[idx].unitPrice);
    setForm(p => ({ ...p, items }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.clientName.trim()) { setError('Client name is required.'); return; }
    setSaving(true); setError('');
    const { totalAmount, netAmount } = calcTotals(form.items, form.discount, form.tax);
    const payload = { ...form, totalAmount, netAmount, validUntil: form.validUntil || null };
    try {
      const url = editQ ? `/api/sales-employee/quotations/${editQ._id}` : '/api/sales-employee/quotations';
      const { response, data } = await apiRequest(url, { method: editQ ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      if (response.ok && data.success) { setShowModal(false); fetchQ(); }
      else setError(data.message || 'Failed to save.');
    } catch (e) { setError('Server error.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><FileText size={20} /> My Quotations</h2>
          <p className="sv-subtitle">Quotations you've created for clients</p>
        </div>
        <button className="sv-btn-primary" onClick={openCreate}><Plus size={16} /> New Quotation</button>
      </div>

      <div className="sv-filters">
        <div className="sv-status-tabs">
          {['all', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'].map(s => (
            <button key={s} className={`sv-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s === 'all' ? 'All' : s}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="sv-loading">Loading quotations...</div> : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead><tr><th>Quotation #</th><th>Client</th><th>Net Amount</th><th>Status</th><th>Valid Until</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {quotations.length === 0 ? <tr><td colSpan={7} className="sv-empty">No quotations yet. Create your first!</td></tr>
                : quotations.map(q => (
                  <tr key={q._id}>
                    <td className="sv-name">{q.quotationNumber}</td>
                    <td>{q.clientName}</td>
                    <td className="sv-amount">${Number(q.netAmount || 0).toLocaleString()}</td>
                    <td><span className="sv-badge" style={{ background: STATUS_COLORS[q.status] + '22', color: STATUS_COLORS[q.status], border: `1px solid ${STATUS_COLORS[q.status]}44` }}>{q.status}</span></td>
                    <td>{q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}</td>
                    <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                    <td><button className="sv-edit-btn" onClick={() => openEdit(q)}><Edit2 size={14} /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal sv-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3>{editQ ? `Edit ${editQ.quotationNumber}` : 'New Quotation'}</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="sv-error">{error}</div>}
            <form onSubmit={handleSave} className="sv-form">
              <div className="sv-grid-2">
                <div className="sv-field"><label>Client Name *</label><input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} required /></div>
                <div className="sv-field"><label>Client Email</label><input type="email" value={form.clientEmail} onChange={e => setForm(p => ({ ...p, clientEmail: e.target.value }))} /></div>
              </div>
              <div className="sv-grid-2">
                <div className="sv-field"><label>Phone</label><input value={form.clientPhone} onChange={e => setForm(p => ({ ...p, clientPhone: e.target.value }))} /></div>
                <div className="sv-field"><label>Valid Until</label><input type="date" value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))} /></div>
              </div>

              <div className="sv-section-title">Line Items</div>
              {form.items.map((item, idx) => (
                <div key={idx} className="sv-line-item">
                  <input className="sv-item-desc" placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                  <input type="number" className="sv-item-qty" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} min={1} />
                  <input type="number" className="sv-item-price" placeholder="Unit Price" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} />
                  <span className="sv-item-total">${(Number(item.quantity) * Number(item.unitPrice)).toLocaleString()}</span>
                  {form.items.length > 1 && <button type="button" className="sv-remove-item" onClick={() => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}><X size={13} /></button>}
                </div>
              ))}
              <button type="button" className="sv-add-item" onClick={() => setForm(p => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }))}><Plus size={13} /> Add Item</button>

              <div className="sv-grid-3">
                <div className="sv-field"><label>Discount ($)</label><input type="number" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} /></div>
                <div className="sv-field"><label>Tax (%)</label><input type="number" value={form.tax} onChange={e => setForm(p => ({ ...p, tax: e.target.value }))} /></div>
                <div className="sv-field"><label>Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="sv-field"><label>Notes</label><textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
              <div className="sv-total-line">
                <span>Net Total: </span>
                <strong className="sv-total-value">${calcTotals(form.items, form.discount, form.tax).netAmount.toLocaleString()}</strong>
              </div>
              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving}><Save size={15} /> {saving ? 'Saving...' : 'Save Quotation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
