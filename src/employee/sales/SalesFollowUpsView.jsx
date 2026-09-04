import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { Plus, Phone, CheckCircle, Clock, X, Save } from 'lucide-react';
import './SalesViews.css';

const STATUS_COLORS = {
  Pending: '#F59E0B', Completed: '#10B981', Cancelled: '#EF4444', Rescheduled: '#6366F1'
};

const TYPE_ICONS = { Call: '📞', Email: '📧', Meeting: '🤝', Demo: '💻', Proposal: '📄', Other: '📋' };
const EMPTY_FORM = { title: '', description: '', contactName: '', contactEmail: '', contactPhone: '', type: 'Call', status: 'Pending', scheduledAt: '', outcome: '', leadId: '' };

export default function SalesFollowUpsView() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editFU, setEditFU] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchFU = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const { response, data } = await apiRequest(`/api/sales-employee/followups${params}`);
      if (response.ok && data.success) setFollowUps(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchFU(); }, [fetchFU]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditFU(null); setError(''); setShowModal(true); };
  const openEdit = (f) => {
    setForm({ title: f.title, description: f.description, contactName: f.contactName, contactEmail: f.contactEmail, contactPhone: f.contactPhone, type: f.type, status: f.status, scheduledAt: f.scheduledAt ? f.scheduledAt.substring(0, 16) : '', outcome: f.outcome, leadId: f.lead?._id || '' });
    setEditFU(f); setError(''); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError('');
    const payload = { ...form, scheduledAt: form.scheduledAt || null, leadId: form.leadId || null };
    try {
      const url = editFU ? `/api/sales-employee/followups/${editFU._id}` : '/api/sales-employee/followups';
      const { response, data } = await apiRequest(url, { method: editFU ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      if (response.ok && data.success) { setShowModal(false); fetchFU(); }
      else setError(data.message || 'Failed to save.');
    } catch (e) { setError('Server error.'); }
    finally { setSaving(false); }
  };

  const markDone = async (id) => {
    await apiRequest(`/api/sales-employee/followups/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Completed', outcome: 'Completed via quick action' }) });
    fetchFU();
  };

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><Phone size={20} /> Follow-ups</h2>
          <p className="sv-subtitle">Track customer and lead follow-ups</p>
        </div>
        <button className="sv-btn-primary" onClick={openCreate}><Plus size={16} /> New Follow-up</button>
      </div>

      <div className="sv-filters">
        <div className="sv-status-tabs">
          {['all', 'Pending', 'Completed', 'Cancelled', 'Rescheduled'].map(s => (
            <button key={s} className={`sv-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s === 'all' ? 'All' : s}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="sv-loading">Loading follow-ups...</div> : (
        <div className="sv-cards-grid">
          {followUps.length === 0 ? <div className="sv-empty-card">No follow-ups yet. Schedule your first!</div>
            : followUps.map(fu => (
              <div key={fu._id} className={`sv-followup-card ${fu.status === 'Completed' ? 'done' : ''}`}>
                <div className="sv-fu-header">
                  <span className="sv-fu-type">{TYPE_ICONS[fu.type]} {fu.type}</span>
                  <span className="sv-badge" style={{ background: STATUS_COLORS[fu.status] + '22', color: STATUS_COLORS[fu.status], border: `1px solid ${STATUS_COLORS[fu.status]}44` }}>{fu.status}</span>
                </div>
                <h4 className="sv-fu-title">{fu.title}</h4>
                {fu.contactName && <p className="sv-fu-contact">👤 {fu.contactName} {fu.contactPhone ? `· ${fu.contactPhone}` : ''}</p>}
                {fu.scheduledAt && <p className="sv-fu-time">📅 {new Date(fu.scheduledAt).toLocaleString()}</p>}
                {fu.lead && <p className="sv-fu-lead">🔗 Lead: {fu.lead.name}</p>}
                {fu.outcome && <p className="sv-fu-outcome">✅ {fu.outcome}</p>}
                <div className="sv-fu-actions">
                  {fu.status === 'Pending' && <button className="sv-btn-done" onClick={() => markDone(fu._id)}><CheckCircle size={13} /> Mark Done</button>}
                  <button className="sv-edit-btn" onClick={() => openEdit(fu)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                </div>
              </div>
            ))}
        </div>
      )}

      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header"><h3>{editFU ? 'Edit Follow-up' : 'New Follow-up'}</h3><button onClick={() => setShowModal(false)}><X size={18} /></button></div>
            {error && <div className="sv-error">{error}</div>}
            <form onSubmit={handleSave} className="sv-form">
              <div className="sv-field"><label>Title *</label><input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
              <div className="sv-grid-2">
                <div className="sv-field"><label>Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    {['Call', 'Email', 'Meeting', 'Demo', 'Proposal', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="sv-field"><label>Scheduled At</label><input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} /></div>
              </div>
              <div className="sv-grid-2">
                <div className="sv-field"><label>Contact Name</label><input value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} /></div>
                <div className="sv-field"><label>Contact Phone</label><input value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} /></div>
              </div>
              {editFU && (
                <div className="sv-grid-2">
                  <div className="sv-field"><label>Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      {['Pending', 'Completed', 'Cancelled', 'Rescheduled'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="sv-field"><label>Outcome</label><input value={form.outcome} onChange={e => setForm(p => ({ ...p, outcome: e.target.value }))} placeholder="What was the result?" /></div>
                </div>
              )}
              <div className="sv-field"><label>Description</label><textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving}><Save size={15} /> {saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
