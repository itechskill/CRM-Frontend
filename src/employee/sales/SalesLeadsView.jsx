import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { Plus, Search, Filter, Edit2, Users, CheckCircle, AlertCircle, Clock, X, Save } from 'lucide-react';
import './SalesViews.css';

const STATUS_COLORS = {
  New: '#6366F1', Contacted: '#3B82F6', Qualified: '#10B981',
  Unqualified: '#EF4444', Converted: '#F59E0B'
};

const EMPTY_FORM = { name: '', company: '', email: '', phone: '', status: 'New', value: '', source: 'Direct', notes: '' };

export default function SalesLeadsView() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search) params.set('search', search);
      const { response, data } = await apiRequest(`/api/sales-employee/leads?${params}`);
      if (response.ok && data.success) setLeads(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditLead(null); setError(''); setShowModal(true); };
  const openEdit = (lead) => { setForm({ name: lead.name, company: lead.company, email: lead.email, phone: lead.phone, status: lead.status, value: lead.value || '', source: lead.source, notes: lead.notes }); setEditLead(lead); setError(''); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Lead name is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, value: form.value ? Number(form.value) : 0 };
      const url = editLead ? `/api/sales-employee/leads/${editLead._id}` : '/api/sales-employee/leads';
      const method = editLead ? 'PATCH' : 'POST';
      const { response, data } = await apiRequest(url, { method, body: JSON.stringify(payload) });
      if (response.ok && data.success) { setShowModal(false); fetchLeads(); }
      else setError(data.message || 'Failed to save lead.');
    } catch (e) { setError('Server error.'); }
    finally { setSaving(false); }
  };

  const statuses = ['all', 'New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'];

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><Users size={20} /> My Leads</h2>
          <p className="sv-subtitle">Leads assigned to you — managed privately</p>
        </div>
        <button className="sv-btn-primary" onClick={openCreate}><Plus size={16} /> New Lead</button>
      </div>

      <div className="sv-filters">
        <div className="sv-search-box">
          <Search size={15} />
          <input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="sv-status-tabs">
          {statuses.map(s => (
            <button key={s} className={`sv-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s === 'all' ? 'All' : s}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="sv-loading">Loading leads...</div> : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Status</th><th>Value</th><th>Source</th><th>Actions</th></tr></thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={7} className="sv-empty">No leads found. Create your first lead!</td></tr>
              ) : leads.map(lead => (
                <tr key={lead._id}>
                  <td className="sv-name">{lead.name}</td>
                  <td>{lead.company || '—'}</td>
                  <td>{lead.email || '—'}</td>
                  <td><span className="sv-badge" style={{ background: STATUS_COLORS[lead.status] + '22', color: STATUS_COLORS[lead.status], border: `1px solid ${STATUS_COLORS[lead.status]}44` }}>{lead.status}</span></td>
                  <td>{lead.value ? `$${Number(lead.value).toLocaleString()}` : '—'}</td>
                  <td>{lead.source}</td>
                  <td><button className="sv-edit-btn" onClick={() => openEdit(lead)}><Edit2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3>{editLead ? 'Edit Lead' : 'New Lead'}</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="sv-error">{error}</div>}
            <form onSubmit={handleSave} className="sv-form">
              <div className="sv-grid-2">
                <div className="sv-field"><label>Lead Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Contact name" required /></div>
                <div className="sv-field"><label>Company</label><input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Company name" /></div>
              </div>
              <div className="sv-grid-2">
                <div className="sv-field"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" /></div>
                <div className="sv-field"><label>Phone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555 000 0000" /></div>
              </div>
              <div className="sv-grid-3">
                <div className="sv-field"><label>Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sv-field"><label>Value ($)</label><input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="0" /></div>
                <div className="sv-field"><label>Source</label>
                  <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}>
                    {['Direct', 'Website', 'Referral', 'Social Media', 'Email Campaign', 'Cold Call', 'Event', 'Other'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="sv-field"><label>Notes</label><textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Additional notes..." /></div>
              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving}><Save size={15} /> {saving ? 'Saving...' : 'Save Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
