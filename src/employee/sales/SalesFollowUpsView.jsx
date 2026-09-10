import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { Plus, Phone, CheckCircle, Clock, X, Save, Eye, Trash2, Edit2, Mail, Calendar, User } from 'lucide-react';
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

  // View & Delete Modal States
  const [viewFU, setViewFU] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');

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
    setForm({
      title: f.title,
      description: f.description || '',
      contactName: f.contactName || '',
      contactEmail: f.contactEmail || '',
      contactPhone: f.contactPhone || '',
      type: f.type || 'Call',
      status: f.status || 'Pending',
      scheduledAt: f.scheduledAt ? f.scheduledAt.substring(0, 16) : '',
      outcome: f.outcome || '',
      leadId: f.lead?._id || ''
    });
    setEditFU(f);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError('');
    const payload = { ...form, scheduledAt: form.scheduledAt || null, leadId: form.leadId || null };
    try {
      const url = editFU ? `/api/sales-employee/followups/${editFU._id}` : '/api/sales-employee/followups';
      const method = editFU ? 'PATCH' : 'POST';
      const { response, data } = await apiRequest(url, { method, body: JSON.stringify(payload) });
      if (response.ok && data.success) {
        setShowModal(false);
        setFeedback(editFU ? `Follow-up updated.` : 'Follow-up scheduled.');
        setTimeout(() => setFeedback(''), 3000);
        fetchFU();
      } else {
        setError(data.message || 'Failed to save.');
      }
    } catch (e) { setError('Server error.'); }
    finally { setSaving(false); }
  };

  const markDone = async (id) => {
    await apiRequest(`/api/sales-employee/followups/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Completed', outcome: 'Completed via quick action' }) });
    setFeedback('Follow-up marked as completed.');
    setTimeout(() => setFeedback(''), 3000);
    fetchFU();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/followups/${deleteTarget._id}`, { method: 'DELETE' });
      if (response.ok && data.success) {
        setFeedback(`Follow-up "${deleteTarget.title}" deleted.`);
        setDeleteTarget(null);
        fetchFU();
        setTimeout(() => setFeedback(''), 3000);
      } else {
        setFeedback(data.message || 'Failed to delete.');
      }
    } catch (e) { setFeedback('Server error.'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><Phone size={20} /> Follow-ups</h2>
          <p className="sv-subtitle">Track customer and lead follow-ups and interactions</p>
        </div>
        <button className="sv-btn-primary" onClick={openCreate}><Plus size={16} /> New Follow-up</button>
      </div>

      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '14px' }}>
          {feedback}
        </div>
      )}

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
                  <span className="sv-fu-type">{TYPE_ICONS[fu.type] || '📋'} {fu.type}</span>
                  <span className="sv-badge" style={{ background: STATUS_COLORS[fu.status] + '22', color: STATUS_COLORS[fu.status], border: `1px solid ${STATUS_COLORS[fu.status]}44` }}>{fu.status}</span>
                </div>
                <h4 className="sv-fu-title">{fu.title}</h4>
                {fu.contactName && <p className="sv-fu-contact">👤 {fu.contactName} {fu.contactPhone ? `· ${fu.contactPhone}` : ''}</p>}
                {fu.scheduledAt && <p className="sv-fu-time">📅 {new Date(fu.scheduledAt).toLocaleString()}</p>}
                {fu.lead && <p className="sv-fu-lead">🔗 Lead: {fu.lead.name}</p>}
                {fu.outcome && <p className="sv-fu-outcome">✅ {fu.outcome}</p>}
                <div className="sv-fu-actions">
                  {fu.status === 'Pending' && <button className="sv-btn-done" onClick={() => markDone(fu._id)}><CheckCircle size={13} /> Mark Done</button>}
                  <button className="sv-btn-action-icon" onClick={() => setViewFU(fu)} title="View Details"><Eye size={14} /></button>
                  <button className="sv-edit-btn" onClick={() => openEdit(fu)} title="Edit Follow-up"><Edit2 size={14} /></button>
                  <button className="sv-btn-action-icon" onClick={() => setDeleteTarget(fu)} title="Delete Follow-up" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* VIEW FOLLOW-UP MODAL */}
      {viewFU && (
        <div className="sv-modal-overlay" onClick={() => setViewFU(null)}>
          <div className="sv-modal" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={18} color="#2563EB" />
                <h3 style={{ margin: 0 }}>Follow-up Details</h3>
              </div>
              <button onClick={() => setViewFU(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>{viewFU.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '3px' }}>{TYPE_ICONS[viewFU.type] || '📋'} Type: {viewFU.type}</div>
                </div>
                <span className="sv-badge" style={{ background: STATUS_COLORS[viewFU.status] + '22', color: STATUS_COLORS[viewFU.status], border: `1px solid ${STATUS_COLORS[viewFU.status]}44`, fontSize: '0.82rem', padding: '5px 12px' }}>
                  {viewFU.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#F8FAFC', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Contact Person</div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 600, marginTop: '2px' }}>{viewFU.contactName || '—'}</div>
                  {viewFU.contactPhone && <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>📞 {viewFU.contactPhone}</div>}
                  {viewFU.contactEmail && <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>✉ {viewFU.contactEmail}</div>}
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Schedule & Date</div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 600, marginTop: '2px' }}>
                    {viewFU.scheduledAt ? new Date(viewFU.scheduledAt).toLocaleString() : 'Not scheduled'}
                  </div>
                </div>
              </div>

              {viewFU.description && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>Description</div>
                  <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>{viewFU.description}</div>
                </div>
              )}

              {viewFU.outcome && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#065F46', marginBottom: '4px' }}>Outcome / Result</div>
                  <div style={{ fontSize: '0.875rem', color: '#065F46', fontWeight: 600 }}>{viewFU.outcome}</div>
                </div>
              )}

              <div className="sv-modal-actions" style={{ marginTop: '16px' }}>
                <button className="sv-btn-cancel" onClick={() => setViewFU(null)}>Close</button>
                <button className="sv-btn-primary" onClick={() => { setViewFU(null); openEdit(viewFU); }}><Edit2 size={14} /> Edit Follow-up</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div className="sv-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="sv-modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={18} color="#EF4444" />
                <h3 style={{ margin: 0 }}>Delete Follow-up</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className="sv-form">
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 16px' }}>
                Are you sure you want to delete follow-up <strong>"{deleteTarget.title}"</strong>? This action cannot be undone.
              </p>
              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="sv-btn-primary" onClick={handleDelete} disabled={deleting} style={{ background: '#EF4444' }}>
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
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
