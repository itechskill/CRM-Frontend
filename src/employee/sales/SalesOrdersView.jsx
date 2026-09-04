import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { Plus, ShoppingCart, Edit2, X, Save } from 'lucide-react';
import './SalesViews.css';

const STATUS_COLORS = {
  Pending: '#F59E0B', Confirmed: '#6366F1', Processing: '#3B82F6',
  Shipped: '#EC4899', Delivered: '#10B981', Cancelled: '#EF4444'
};

const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: 0, total: 0 };
const EMPTY_FORM = { clientName: '', clientEmail: '', clientPhone: '', items: [{ ...EMPTY_ITEM }], discount: 0, tax: 0, status: 'Pending', deliveryDate: '', notes: '' };

function calcTotals(items, discount = 0, tax = 0) {
  const total = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice)), 0);
  const after = total - Number(discount);
  return { totalAmount: total, netAmount: after + after * (Number(tax) / 100) };
}

export default function SalesOrdersView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editO, setEditO] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const { response, data } = await apiRequest(`/api/sales-employee/orders${params}`);
      if (response.ok && data.success) setOrders(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditO(null); setError(''); setShowModal(true); };
  const openEdit = (o) => {
    setForm({ clientName: o.clientName, clientEmail: o.clientEmail, clientPhone: o.clientPhone, items: o.items?.length ? o.items : [{ ...EMPTY_ITEM }], discount: o.discount, tax: o.tax, status: o.status, deliveryDate: o.deliveryDate ? o.deliveryDate.substring(0, 10) : '', notes: o.notes });
    setEditO(o); setError(''); setShowModal(true);
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
    const payload = { ...form, totalAmount, netAmount, deliveryDate: form.deliveryDate || null };
    try {
      const url = editO ? `/api/sales-employee/orders/${editO._id}` : '/api/sales-employee/orders';
      const { response, data } = await apiRequest(url, { method: editO ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      if (response.ok && data.success) { setShowModal(false); fetchOrders(); }
      else setError(data.message || 'Failed to save.');
    } catch (e) { setError('Server error.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><ShoppingCart size={20} /> My Sales Orders</h2>
          <p className="sv-subtitle">Sales orders you've created and managed</p>
        </div>
        <button className="sv-btn-primary" onClick={openCreate}><Plus size={16} /> New Order</button>
      </div>

      <div className="sv-filters">
        <div className="sv-status-tabs">
          {['all', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
            <button key={s} className={`sv-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s === 'all' ? 'All' : s}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="sv-loading">Loading orders...</div> : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead><tr><th>Order #</th><th>Client</th><th>Net Amount</th><th>Status</th><th>Delivery Date</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {orders.length === 0 ? <tr><td colSpan={7} className="sv-empty">No sales orders yet.</td></tr>
                : orders.map(o => (
                  <tr key={o._id}>
                    <td className="sv-name">{o.orderNumber}</td>
                    <td>{o.clientName}</td>
                    <td className="sv-amount">${Number(o.netAmount || 0).toLocaleString()}</td>
                    <td><span className="sv-badge" style={{ background: STATUS_COLORS[o.status] + '22', color: STATUS_COLORS[o.status], border: `1px solid ${STATUS_COLORS[o.status]}44` }}>{o.status}</span></td>
                    <td>{o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : '—'}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td><button className="sv-edit-btn" onClick={() => openEdit(o)}><Edit2 size={14} /></button></td>
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
              <h3>{editO ? `Edit ${editO.orderNumber}` : 'New Sales Order'}</h3>
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
                <div className="sv-field"><label>Delivery Date</label><input type="date" value={form.deliveryDate} onChange={e => setForm(p => ({ ...p, deliveryDate: e.target.value }))} /></div>
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
                    {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="sv-field"><label>Notes</label><textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
              <div className="sv-total-line"><span>Net Total: </span><strong className="sv-total-value">${calcTotals(form.items, form.discount, form.tax).netAmount.toLocaleString()}</strong></div>
              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving}><Save size={15} /> {saving ? 'Saving...' : 'Save Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
