import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { Plus, Search, Edit2, Users, X, Save, Eye, Trash2, Mail, Phone, DollarSign, Tag, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import './SalesViews.css';

const STATUS_COLORS = {
  New: '#6366F1',
  Contacted: '#3B82F6',
  Interested: '#8B5CF6',
  Qualified: '#10B981',
  'Converted to Deal': '#F59E0B',
  Converted: '#F59E0B',
  Unqualified: '#EF4444',
  Lost: '#EF4444'
};

const EMPTY_FORM = {
  name: '',
  company: '',
  contactPerson: '',
  email: '',
  phone: '',
  status: 'New',
  value: '',
  source: 'Direct',
  requirements: '',
  notes: '',
  followUpDate: ''
};

export default function SalesLeadsView({ onNavigateDeals }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [viewLead, setViewLead] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [converting, setConverting] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search) params.set('search', search);
      const { response, data } = await apiRequest(`/api/sales-employee/leads?${params}`);
      if (response.ok && data.success) setLeads(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditLead(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (lead) => {
    setForm({
      name: lead.name || '',
      company: lead.company || '',
      contactPerson: lead.contactPerson || '',
      email: lead.email || '',
      phone: lead.phone || '',
      status: lead.status || 'New',
      value: lead.value || '',
      source: lead.source || 'Direct',
      requirements: lead.requirements || '',
      notes: lead.notes || '',
      followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().substring(0, 10) : ''
    });
    setEditLead(lead);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Lead name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        value: form.value ? Number(form.value) : 0,
        followUpDate: form.followUpDate || null
      };
      const url = editLead ? `/api/sales-employee/leads/${editLead._id}` : '/api/sales-employee/leads';
      const method = editLead ? 'PATCH' : 'POST';
      const { response, data } = await apiRequest(url, { method, body: JSON.stringify(payload) });
      if (response.ok && data.success) {
        setShowModal(false);
        fetchLeads();
      } else {
        setError(data.message || 'Failed to save lead.');
      }
    } catch (e) {
      setError('Server error.');
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToDeal = async (lead) => {
    setConverting(true);
    try {
      // 1. Create a deal in the sales employee pipeline
      const dealPayload = {
        title: `Deal - ${lead.company || lead.name}`,
        clientName: lead.name,
        company: lead.company || '',
        contactPerson: lead.contactPerson || lead.name,
        value: lead.value ? Number(lead.value) : 0,
        stage: 'Prospecting',
        probability: 60,
        requirements: lead.requirements || '',
        notes: `Converted from Lead: ${lead.name}. Source: ${lead.source || 'Direct'}. ${lead.notes || ''}`
      };
      const { response: dRes, data: dData } = await apiRequest('/api/sales-employee/deals', {
        method: 'POST',
        body: JSON.stringify(dealPayload)
      });

      if (dRes.ok && dData.success) {
        // 2. Mark lead status as Converted to Deal
        await apiRequest(`/api/sales-employee/leads/${lead._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'Converted to Deal' })
        });
        setFeedback(`Lead "${lead.name}" successfully converted to Deal!`);
        setViewLead(null);
        fetchLeads();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        setFeedback(dData.message || 'Failed to convert lead.');
      }
    } catch (e) {
      setFeedback('Error converting lead to deal.');
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/leads/${deleteTarget._id}`, { method: 'DELETE' });
      if (response.ok && data.success) {
        setFeedback(`Lead "${deleteTarget.name}" deleted.`);
        setDeleteTarget(null);
        fetchLeads();
        setTimeout(() => setFeedback(''), 3000);
      } else {
        setFeedback(data.message || 'Failed to delete.');
      }
    } catch (e) {
      setFeedback('Server error.');
    } finally {
      setDeleting(false);
    }
  };

  const statuses = ['all', 'New', 'Contacted', 'Interested', 'Qualified', 'Converted to Deal', 'Lost'];

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><Users size={20} /> My Leads</h2>
          <p className="sv-subtitle">Capture and qualify prospects, then convert to Deals</p>
        </div>
        <button className="sv-btn-primary" onClick={openCreate}><Plus size={16} /> New Lead</button>
      </div>

      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#059669" /> {feedback}
        </div>
      )}

      <div className="sv-filters">
        <div className="sv-search-box">
          <Search size={15} />
          <input placeholder="Search leads, company, requirements..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="sv-status-tabs">
          {statuses.map(s => (
            <button key={s} className={`sv-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="sv-loading">Loading leads...</div> : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Estimated Value</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={7} className="sv-empty">No leads found. Create your first lead!</td></tr>
              ) : leads.map(lead => (
                <tr key={lead._id}>
                  <td className="sv-name">{lead.name}</td>
                  <td>{lead.company || '—'}</td>
                  <td>{lead.email || lead.phone || '—'}</td>
                  <td>
                    <span className="sv-badge" style={{ background: (STATUS_COLORS[lead.status] || '#6366F1') + '22', color: STATUS_COLORS[lead.status] || '#6366F1', border: `1px solid ${(STATUS_COLORS[lead.status] || '#6366F1')}44` }}>
                      {lead.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#059669' }}>
                    {lead.value ? `Rs. ${Number(lead.value).toLocaleString()}` : '—'}
                  </td>
                  <td>{lead.source}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {lead.status !== 'Converted to Deal' && lead.status !== 'Converted' && (
                        <button
                          className="sv-btn-action-icon"
                          style={{ color: '#F59E0B', background: '#FEF3C7' }}
                          onClick={() => handleConvertToDeal(lead)}
                          disabled={converting}
                          title="Convert to Deal"
                        >
                          <ArrowRight size={14} />
                        </button>
                      )}
                      <button className="sv-btn-action-icon" onClick={() => setViewLead(lead)} title="View Details"><Eye size={14} /></button>
                      <button className="sv-btn-action-icon" onClick={() => openEdit(lead)} title="Edit Lead"><Edit2 size={14} /></button>
                      <button className="sv-btn-action-icon" onClick={() => setDeleteTarget(lead)} title="Delete Lead" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW LEAD MODAL */}
      {viewLead && (
        <div className="sv-modal-overlay" onClick={() => setViewLead(null)}>
          <div className="sv-modal" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#6366F1" />
                <h3 style={{ margin: 0 }}>Lead Details</h3>
              </div>
              <button onClick={() => setViewLead(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{viewLead.name}</div>
                  {viewLead.company && <div style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '2px' }}>{viewLead.company}</div>}
                </div>
                <span className="sv-badge" style={{ background: (STATUS_COLORS[viewLead.status] || '#6366F1') + '22', color: STATUS_COLORS[viewLead.status] || '#6366F1', border: `1px solid ${(STATUS_COLORS[viewLead.status] || '#6366F1')}44`, fontSize: '0.82rem', padding: '5px 12px' }}>
                  {viewLead.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '5px' }}>Contact</div>
                  {viewLead.contactPerson && <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, marginBottom: '4px' }}>Person: {viewLead.contactPerson}</div>}
                  {viewLead.email && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#334155', marginBottom: '4px' }}><Mail size={13} />{viewLead.email}</div>}
                  {viewLead.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#334155' }}><Phone size={13} />{viewLead.phone}</div>}
                  {!viewLead.email && !viewLead.phone && <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>No contact info</div>}
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '5px' }}>Value & Source</div>
                  <div style={{ fontSize: '1rem', color: '#059669', fontWeight: 800, marginBottom: '4px' }}>
                    {viewLead.value ? `Rs. ${Number(viewLead.value).toLocaleString()}` : 'No estimate'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#334155' }}>
                    <Tag size={13} />Source: {viewLead.source}
                  </div>
                </div>
              </div>

              {viewLead.requirements && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '5px' }}>Customer Requirements / Inquiries</div>
                  <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>{viewLead.requirements}</div>
                </div>
              )}

              {viewLead.notes && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '5px' }}>Notes</div>
                  <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>{viewLead.notes}</div>
                </div>
              )}

              <div className="sv-modal-actions" style={{ marginTop: '16px' }}>
                <button className="sv-btn-cancel" onClick={() => setViewLead(null)}>Close</button>
                {viewLead.status !== 'Converted to Deal' && viewLead.status !== 'Converted' && (
                  <button
                    className="sv-btn-primary"
                    style={{ background: '#F59E0B' }}
                    onClick={() => handleConvertToDeal(viewLead)}
                    disabled={converting}
                  >
                    <ArrowRight size={14} /> {converting ? 'Converting...' : 'Convert to Deal'}
                  </button>
                )}
                <button className="sv-btn-primary" onClick={() => { setViewLead(null); openEdit(viewLead); }}>
                  <Edit2 size={14} /> Edit Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3>{editLead ? 'Edit Lead' : 'New Lead'}</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="sv-error">{error}</div>}
            <form onSubmit={handleSave} className="sv-form">
              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Lead / Company Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Lead or organization" required />
                </div>
                <div className="sv-field">
                  <label>Company</label>
                  <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Company name" />
                </div>
              </div>

              <div className="sv-grid-3">
                <div className="sv-field">
                  <label>Contact Person</label>
                  <input value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} placeholder="Key person name" />
                </div>
                <div className="sv-field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
                </div>
                <div className="sv-field">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+92 300 0000000" />
                </div>
              </div>

              <div className="sv-grid-3">
                <div className="sv-field">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {['New', 'Contacted', 'Interested', 'Qualified', 'Converted to Deal', 'Lost'].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="sv-field">
                  <label>Estimated Value (PKR)</label>
                  <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="0" />
                </div>
                <div className="sv-field">
                  <label>Source</label>
                  <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}>
                    {['Direct', 'Website', 'Referral', 'Social Media', 'Email Campaign', 'Cold Call', 'Event', 'Other'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="sv-field">
                <label>Customer Requirements / Inquiries</label>
                <textarea value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} rows={2} placeholder="Products required, technical specs, quantity..." />
              </div>

              <div className="sv-field">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Internal observations..." />
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Lead'}
                </button>
              </div>
            </form>
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
                <h3 style={{ margin: 0 }}>Delete Lead</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className="sv-form">
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 16px' }}>
                Are you sure you want to permanently delete lead <strong>{deleteTarget.name}</strong>?
              </p>
              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="sv-btn-primary" onClick={handleDelete} disabled={deleting} style={{ background: '#EF4444' }}>
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
