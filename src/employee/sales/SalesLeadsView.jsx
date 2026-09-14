import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiRequest } from '../../utils/api';
import { Plus, Search, Edit2, Users, X, Save, Eye, Trash2, Mail, Phone, DollarSign, Tag, FileText, ArrowRight, CheckCircle2, Download, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  // Derived metrics
  const totalPipelineValue = useMemo(() => {
    return leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
  }, [leads]);

  const convertedCount = useMemo(() => {
    return leads.filter(l => l.status === 'Converted' || l.status === 'Converted to Deal').length;
  }, [leads]);

  const qualifiedCount = useMemo(() => {
    return leads.filter(l => l.status === 'Qualified').length;
  }, [leads]);

  // Complete PDF Export with Summary Footer
  const downloadCompleteLeadsPDF = () => {
    const doc = new jsPDF('landscape');
    const records = leads;
    const totalFilteredValue = records.reduce((s, l) => s + (Number(l.value) || 0), 0);

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 297, 24, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FORTLINE CRM - SALES LEADS REPORT', 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()} | Total Leads: ${records.length} | Converted: ${convertedCount}`, 14, 31);

    const tableData = records.map(l => [
      l.name || '—',
      l.company || '—',
      l.email || l.phone || '—',
      l.status || 'New',
      l.value ? `Rs. ${Number(l.value).toLocaleString()}` : '—',
      l.source || 'Direct',
      l.followUpDate ? new Date(l.followUpDate).toLocaleDateString() : '—'
    ]);

    try {
      autoTable(doc, {
        head: [['Lead Name', 'Company', 'Contact Info', 'Status', 'Estimated Value (PKR)', 'Source', 'Follow-up Date']],
        body: tableData,
        foot: [[
          { content: 'GRAND TOTAL / SUMMARY', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
          { content: `Rs. ${totalFilteredValue.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], fillColor: [241, 245, 249] } },
          { content: `${records.length} Total Leads`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } }
        ]],
        startY: 36,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
        theme: 'grid'
      });

      doc.save(`Sales_Leads_Report_${new Date().toISOString().substring(0, 10)}.pdf`);
    } catch (err) {
      console.error('Leads PDF export error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Complete Excel Export with Summary Footer
  const downloadCompleteLeadsExcel = () => {
    const records = leads;
    const totalFilteredValue = records.reduce((s, l) => s + (Number(l.value) || 0), 0);

    const headers = ['Lead Name', 'Company', 'Contact Person', 'Email', 'Phone', 'Status', 'Estimated Value (PKR)', 'Source', 'Follow-up Date', 'Notes'];
    const rows = records.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${(l.contactPerson || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${l.status || 'New'}"`,
      Number(l.value || 0),
      `"${l.source || 'Direct'}"`,
      `"${l.followUpDate ? new Date(l.followUpDate).toLocaleDateString() : ''}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const summaryRow = [
      '"TOTAL"',
      `"Total Leads: ${records.length}"`,
      '""',
      '""',
      '""',
      `"Converted: ${convertedCount}"`,
      totalFilteredValue,
      '""',
      '""',
      '""'
    ];

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      summaryRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_Leads_Report_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
  };

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
        value: Number(form.value) || 0,
        followUpDate: form.followUpDate || null
      };
      const url = editLead ? `/api/sales-employee/leads/${editLead._id}` : '/api/sales-employee/leads';
      const method = editLead ? 'PATCH' : 'POST';
      const { response, data } = await apiRequest(url, { method, body: JSON.stringify(payload) });
      if (response.ok && data.success) {
        setShowModal(false);
        setFeedback(editLead ? `Lead "${form.name}" updated.` : `Lead "${form.name}" created.`);
        setTimeout(() => setFeedback(''), 3000);
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
        setFeedback(data.message || 'Failed to delete lead.');
      }
    } catch (e) {
      setFeedback('Server error.');
    } finally {
      setDeleting(false);
    }
  };

  const handleConvertToDeal = async (lead) => {
    if (!window.confirm(`Convert lead "${lead.name}" to a Sales Deal?`)) return;
    try {
      const dealPayload = {
        title: `${lead.name} - Deal`,
        company: lead.company,
        clientName: lead.name,
        contactPerson: lead.contactPerson || lead.name,
        email: lead.email,
        phone: lead.phone,
        value: Number(lead.value) || 0,
        stage: 'Qualification',
        notes: `Converted from Lead. ${lead.notes || ''}`.trim()
      };
      const { response, data } = await apiRequest('/api/sales-employee/deals', {
        method: 'POST',
        body: JSON.stringify(dealPayload)
      });
      if (response.ok && data.success) {
        // Update lead status
        await apiRequest(`/api/sales-employee/leads/${lead._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'Converted to Deal' })
        });
        setFeedback(`Lead "${lead.name}" converted to Deal!`);
        setTimeout(() => setFeedback(''), 3000);
        fetchLeads();
      } else {
        setFeedback(data.message || 'Failed to convert.');
      }
    } catch (e) {
      setFeedback('Server error.');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button className="sv-btn-secondary" onClick={downloadCompleteLeadsPDF} title="Download Complete Leads Report (PDF)">
            <Download size={15} color="#DC2626" /> Export PDF
          </button>
          <button className="sv-btn-secondary" onClick={downloadCompleteLeadsExcel} title="Download Complete Leads Report (Excel)">
            <FileSpreadsheet size={15} color="#059669" /> Export Excel
          </button>
          <button className="sv-btn-primary" onClick={openCreate}><Plus size={16} /> New Lead</button>
        </div>
      </div>

      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#059669" /> {feedback}
        </div>
      )}

      {/* KPI Cards */}
      <div className="sv-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="sv-kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Pipeline Value</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>Rs. {totalPipelineValue.toLocaleString()}</div>
        </div>
        <div className="sv-kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Leads</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{leads.length}</div>
        </div>
        <div className="sv-kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Converted to Deals</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>{convertedCount}</div>
        </div>
        <div className="sv-kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Qualified Prospects</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>{qualifiedCount}</div>
        </div>
      </div>

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
            {leads.length > 0 && (
              <tfoot>
                <tr style={{ background: '#F8FAFC', fontWeight: 700, borderTop: '2px solid #E2E8F0' }}>
                  <td colSpan={4} style={{ textAlign: 'right', padding: '12px', color: '#475569' }}>TOTAL PIPELINE VALUE:</td>
                  <td style={{ color: '#059669', padding: '12px' }}>
                    Rs. {leads.reduce((acc, l) => acc + (Number(l.value) || 0), 0).toLocaleString()}
                  </td>
                  <td colSpan={2} style={{ color: '#64748B', padding: '12px', fontSize: '0.85rem' }}>
                    {leads.length} Leads
                  </td>
                </tr>
              </tfoot>
            )}
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
