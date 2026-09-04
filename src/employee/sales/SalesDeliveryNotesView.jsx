import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { Plus, Truck, X, Save } from 'lucide-react';
import './SalesViews.css';

const STATUS_COLORS = {
  Pending: '#F59E0B', 'In Transit': '#3B82F6', Delivered: '#10B981', Returned: '#EF4444'
};

const EMPTY_ITEM = { description: '', quantity: 1, unit: 'pcs' };
const EMPTY_FORM = { clientName: '', deliveryAddress: '', items: [{ ...EMPTY_ITEM }], status: 'Pending', deliveryDate: '', receivedBy: '', notes: '' };

export default function SalesDeliveryNotesView() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const { response, data } = await apiRequest(`/api/sales-employee/delivery-notes${params}`);
      if (response.ok && data.success) setNotes(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const updateItem = (idx, field, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    setForm(p => ({ ...p, items }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.clientName.trim()) { setError('Client name is required.'); return; }
    setSaving(true); setError('');
    const payload = { ...form, deliveryDate: form.deliveryDate || null };
    try {
      const { response, data } = await apiRequest('/api/sales-employee/delivery-notes', { method: 'POST', body: JSON.stringify(payload) });
      if (response.ok && data.success) { setShowModal(false); fetchNotes(); }
      else setError(data.message || 'Failed to save.');
    } catch (e) { setError('Server error.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><Truck size={20} /> Delivery Notes</h2>
          <p className="sv-subtitle">Track deliveries for your sales orders</p>
        </div>
        <button className="sv-btn-primary" onClick={() => { setForm(EMPTY_FORM); setError(''); setShowModal(true); }}><Plus size={16} /> New Delivery Note</button>
      </div>

      <div className="sv-filters">
        <div className="sv-status-tabs">
          {['all', 'Pending', 'In Transit', 'Delivered', 'Returned'].map(s => (
            <button key={s} className={`sv-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s === 'all' ? 'All' : s}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="sv-loading">Loading delivery notes...</div> : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead><tr><th>Note #</th><th>Client</th><th>Status</th><th>Delivery Date</th><th>Received By</th><th>Created</th></tr></thead>
            <tbody>
              {notes.length === 0 ? <tr><td colSpan={6} className="sv-empty">No delivery notes yet.</td></tr>
                : notes.map(n => (
                  <tr key={n._id}>
                    <td className="sv-name">{n.deliveryNumber}</td>
                    <td>{n.clientName}</td>
                    <td><span className="sv-badge" style={{ background: STATUS_COLORS[n.status] + '22', color: STATUS_COLORS[n.status], border: `1px solid ${STATUS_COLORS[n.status]}44` }}>{n.status}</span></td>
                    <td>{n.deliveryDate ? new Date(n.deliveryDate).toLocaleDateString() : '—'}</td>
                    <td>{n.receivedBy || '—'}</td>
                    <td>{new Date(n.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header"><h3>New Delivery Note</h3><button onClick={() => setShowModal(false)}><X size={18} /></button></div>
            {error && <div className="sv-error">{error}</div>}
            <form onSubmit={handleSave} className="sv-form">
              <div className="sv-grid-2">
                <div className="sv-field"><label>Client Name *</label><input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} required /></div>
                <div className="sv-field"><label>Delivery Address</label><input value={form.deliveryAddress} onChange={e => setForm(p => ({ ...p, deliveryAddress: e.target.value }))} /></div>
              </div>
              <div className="sv-section-title">Items</div>
              {form.items.map((item, idx) => (
                <div key={idx} className="sv-line-item">
                  <input className="sv-item-desc" placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                  <input type="number" className="sv-item-qty" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} min={1} />
                  <input className="sv-item-price" placeholder="Unit" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} style={{ width: '70px' }} />
                  {form.items.length > 1 && <button type="button" className="sv-remove-item" onClick={() => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}><X size={13} /></button>}
                </div>
              ))}
              <button type="button" className="sv-add-item" onClick={() => setForm(p => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }))}><Plus size={13} /> Add Item</button>
              <div className="sv-grid-3">
                <div className="sv-field"><label>Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {['Pending', 'In Transit', 'Delivered', 'Returned'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sv-field"><label>Delivery Date</label><input type="date" value={form.deliveryDate} onChange={e => setForm(p => ({ ...p, deliveryDate: e.target.value }))} /></div>
                <div className="sv-field"><label>Received By</label><input value={form.receivedBy} onChange={e => setForm(p => ({ ...p, receivedBy: e.target.value }))} /></div>
              </div>
              <div className="sv-field"><label>Notes</label><textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving}><Save size={15} /> {saving ? 'Saving...' : 'Save Note'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
