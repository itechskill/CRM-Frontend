import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { Search, Filter, Plus, Circle, Edit, Trash2, Eye } from 'lucide-react';
import './SalesLeadsView.css';

const priorityColors = {
  High: '#DC2626',
  Medium: '#D97706',
  Low: '#15803D',
};

const statusColors = {
  New: { bg: '#EFF6FF', color: '#1D4ED8' },
  Contacted: { bg: '#EFF6FF', color: '#2563EB' },
  Qualified: { bg: '#F5F3FF', color: '#7C3AED' },
  Converted: { bg: '#F0FDF4', color: '#15803D' },
  Won: { bg: '#F0FDF4', color: '#15803D' },
};

export default function SalesLeadsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [leadsList, setLeadsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/crm/leads');
      if (response.ok && data.success && Array.isArray(data.data)) {
        setLeadsList(data.data.map(l => ({
          ...l,
          id: l._id,
          company: l.company || 'Individual Client',
          priority: (l.value || 0) >= 50000 ? 'High' : 'Medium',
          rawValue: l.value || 0,
          valueFormatted: `Rs. ${(l.value || 0).toLocaleString()}`,
          createdByName: l.createdBy?.fullName || l.assignedTo?.fullName || 'Sales Member',
          createdByEmail: l.createdBy?.email || l.assignedTo?.email || '—',
          rep: l.createdBy?.fullName || l.assignedTo?.fullName || 'Sales Team',
          repInitials: (l.createdBy?.fullName || l.assignedTo?.fullName || 'Sales Team').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          repColor: '#2563EB',
          date: new Date(l.createdAt).toISOString().split('T')[0]
        })));
      }
    } catch (err) {
      console.error('Fetch sales leads error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleConvertLeadToDeal = async (lead) => {
    const rawVal = lead.rawValue || (typeof lead.value === 'number' ? lead.value : Number(String(lead.value || 0).replace(/[^0-9.]/g, '')));
    const dealTitle = lead.company && lead.company !== 'Individual Client' 
      ? `${lead.company} Contract` 
      : `${lead.name} Deal`;

    const { response } = await apiRequest('/api/crm/deals', {
      method: 'POST',
      body: JSON.stringify({
        title: dealTitle,
        clientName: lead.company && lead.company !== 'Individual Client' ? lead.company : lead.name,
        value: rawVal || 50000,
        stage: 'Qualification',
        leadId: lead.id
      })
    });

    if (response.ok) {
      await apiRequest(`/api/crm/leads/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Converted' })
      });
      fetchLeads();
    }
  };

  const filteredLeads = leadsList.filter((lead) => {
    const q = String(searchTerm || '').trim().toLowerCase();

    const matchesSearch =
      String(lead?.name || '').toLowerCase().includes(q) ||
      String(lead?.company || '').toLowerCase().includes(q) ||
      String(lead?.rep || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'All Statuses' ||
      lead?.status === statusFilter;

    const matchesPriority =
      priorityFilter === 'All Priorities' ||
      lead?.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPipelineValue = leadsList.reduce((sum, l) => {
    const raw = typeof l.value === 'string' ? l.value.replace(/[^0-9.]/g, '') : String(l.value || 0);
    return sum + (Number(raw) || 0);
  }, 0);
  const highPriorityCount = leadsList.filter((l) => l.priority === 'High').length;
  const dealsWonCount = leadsList.filter((l) => l.status === 'Won').length;
  const avgDealValue = leadsList.length > 0 ? Math.round(totalPipelineValue / leadsList.length) : 0;

  const formatK = (num) => `Rs. ${Math.round(num / 1000)}k`;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [viewingLead, setViewingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);

  const [leadName, setLeadName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadValue, setLeadValue] = useState('');
  const [leadSource, setLeadSource] = useState('Website');
  const [leadStatus, setLeadStatus] = useState('New');
  const [submitting, setSubmitting] = useState(false);

  const openEditModal = (lead) => {
    setEditingLead(lead);
    setLeadName(lead.name || '');
    setLeadCompany(lead.company === 'Individual Client' ? '' : lead.company || '');
    setLeadEmail(lead.email || '');
    setLeadPhone(lead.phone || '');
    setLeadValue(lead.rawValue || lead.value || '');
    setLeadSource(lead.source || 'Website');
    setLeadStatus(lead.status || 'New');
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!leadName.trim()) return;

    setSubmitting(true);
    try {
      const { response, data } = await apiRequest('/api/crm/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: leadName.trim(),
          company: leadCompany.trim(),
          email: leadEmail.trim(),
          phone: leadPhone.trim(),
          value: Number(leadValue) || 0,
          source: leadSource,
          status: leadStatus
        })
      });

      if (response.ok && data.success) {
        setLeadName('');
        setLeadCompany('');
        setLeadEmail('');
        setLeadPhone('');
        setLeadValue('');
        setIsAddModalOpen(false);
        fetchLeads();
      }
    } catch (err) {
      console.error('Create lead error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    if (!editingLead || !leadName.trim()) return;

    setSubmitting(true);
    try {
      const { response, data } = await apiRequest(`/api/crm/leads/${editingLead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: leadName.trim(),
          company: leadCompany.trim(),
          email: leadEmail.trim(),
          phone: leadPhone.trim(),
          value: Number(leadValue) || 0,
          source: leadSource,
          status: leadStatus
        })
      });

      if (response.ok && data.success) {
        setEditingLead(null);
        setLeadName('');
        setLeadCompany('');
        setLeadEmail('');
        setLeadPhone('');
        setLeadValue('');
        fetchLeads();
      }
    } catch (err) {
      console.error('Update lead error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLeadConfirm = async () => {
    if (!deletingLead) return;
    setSubmitting(true);
    try {
      const { response } = await apiRequest(`/api/crm/leads/${deletingLead.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setDeletingLead(null);
        fetchLeads();
      }
    } catch (err) {
      console.error('Delete lead error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sales-leads-view">
      {/* Page Header */}
      <div className="leads-page-header">
        <div>
          <h1>Lead Management</h1>
          <p>{leadsList.length} total leads · {filteredLeads.length} showing</p>
        </div>
        <div className="leads-header-actions">
          <button className="btn-filter">
            <Filter size={16} />
            Filter
          </button>
          <button className="btn-add-lead" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            Add Lead
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="leads-stats-grid">
        <div className="leads-stat-card">
          <div className="leads-stat-value" style={{ color: '#2563EB' }}>{formatK(totalPipelineValue)}</div>
          <div className="leads-stat-label">Total Pipeline Value</div>
        </div>
        <div className="leads-stat-card">
          <div className="leads-stat-value" style={{ color: '#DC2626' }}>{highPriorityCount}</div>
          <div className="leads-stat-label">High Priority</div>
        </div>
        <div className="leads-stat-card">
          <div className="leads-stat-value" style={{ color: '#15803D' }}>{dealsWonCount}</div>
          <div className="leads-stat-label">Deals Won</div>
        </div>
        <div className="leads-stat-card">
          <div className="leads-stat-value" style={{ color: '#7C3AED' }}>{formatK(avgDealValue)}</div>
          <div className="leads-stat-label">Avg Deal Value</div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="leads-search-row">
        <div className="leads-search-box">
          <Search size={16} className="leads-search-icon" />
          <input
            type="text"
            placeholder="Search leads, companies, reps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select className="leads-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All Statuses</option>
          <option>New</option>
          <option>Contacted</option>
          <option>Qualified</option>
          <option>Won</option>
        </select>

        <select className="leads-filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option>All Priorities</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="leads-table-wrapper">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Lead Name</th>
              <th>Company</th>
              <th>Source</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Deal Value</th>
              <th>Assigned Rep</th>
              <th>Date Added</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => {
              const s = statusColors[lead.status] || statusColors.New;
              return (
                <tr key={lead.id}>
                  <td>
                    <div className="lead-name-cell">
                      <span className="lead-avatar" style={{ backgroundColor: lead.repColor }}>
                        {(lead.name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <div className="lead-name">{lead.name}</div>
                        <div className="lead-email">{lead.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="lead-company">{lead.company}</td>
                  <td>
                    <span className="lead-source-tag">{lead.source}</span>
                  </td>
                  <td>
                    <span className="lead-priority" style={{ color: priorityColors[lead.priority] }}>
                      <Circle size={7} fill={priorityColors[lead.priority]} color={priorityColors[lead.priority]} />
                      {lead.priority}
                    </span>
                  </td>
                  <td>
                    <span className="lead-status-pill" style={{ backgroundColor: s.bg, color: s.color }}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="lead-value">{lead.valueFormatted || lead.value}</td>
                  <td>
                    <div className="lead-rep-cell">
                      <span className="lead-rep-avatar" style={{ backgroundColor: lead.repColor }}>
                        {lead.repInitials}
                      </span>
                      {lead.rep}
                    </div>
                  </td>
                  <td className="lead-date">{lead.date}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      {lead.status !== 'Converted' && (
                        <button
                          className="btn-add-lead"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleConvertLeadToDeal(lead)}
                        >
                          Convert
                        </button>
                      )}
                      <button
                        title="View Lead"
                        style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: '#475569' }}
                        onClick={() => setViewingLead(lead)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        title="Edit Lead"
                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: '#2563EB' }}
                        onClick={() => openEditModal(lead)}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        title="Delete Lead"
                        style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: '#DC2626' }}
                        onClick={() => setDeletingLead(lead)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>Add New Sales Lead</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Lead Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Smith"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Email</label>
                  <input
                    type="email"
                    placeholder="john@acme.com"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Est. Value (PKR / Rs.)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={leadValue}
                    onChange={(e) => setLeadValue(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Source</label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}
                  >
                    <option value="Website">Website</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Outreach">Cold Outreach</option>
                    <option value="Trade Show">Trade Show</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Status</label>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '8px 16px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 16px', background: '#2563EB', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}>{submitting ? 'Saving...' : 'Save Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>Edit Lead</h3>
              <button onClick={() => setEditingLead(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            <form onSubmit={handleUpdateLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Lead Name *</label>
                  <input type="text" required value={leadName} onChange={(e) => setLeadName(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Company</label>
                  <input type="text" value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Email</label>
                  <input type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Phone</label>
                  <input type="text" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Est. Value (PKR / Rs.)</label>
                  <input type="number" value={leadValue} onChange={(e) => setLeadValue(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Source</label>
                  <select value={leadSource} onChange={(e) => setLeadSource(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}>
                    <option value="Website">Website</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Outreach">Cold Outreach</option>
                    <option value="Trade Show">Trade Show</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Status</label>
                  <select value={leadStatus} onChange={(e) => setLeadStatus(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Converted">Converted</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setEditingLead(null)} style={{ padding: '8px 16px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 16px', background: '#2563EB', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}>{submitting ? 'Updating...' : 'Update Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Lead Modal */}
      {viewingLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>Lead Details</h3>
              <button onClick={() => setViewingLead(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 700, textTransform: 'uppercase' }}>Created By Sales Member</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>
                  {viewingLead.createdByName || viewingLead.rep}
                </div>
                {viewingLead.createdByEmail && viewingLead.createdByEmail !== '—' && (
                  <div style={{ fontSize: '0.82rem', color: '#3B82F6' }}>
                    {viewingLead.createdByEmail}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>NAME</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{viewingLead.name}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>COMPANY</div>
                  <div style={{ fontSize: '0.9rem', color: '#334155' }}>{viewingLead.company}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>ESTIMATED VALUE</div>
                  <div style={{ fontSize: '0.9rem', color: '#2563EB', fontWeight: 700 }}>{viewingLead.valueFormatted || viewingLead.value}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>EMAIL</div>
                  <div style={{ fontSize: '0.9rem', color: '#334155' }}>{viewingLead.email || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>PHONE</div>
                  <div style={{ fontSize: '0.9rem', color: '#334155' }}>{viewingLead.phone || '—'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>SOURCE</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>{viewingLead.source}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>PRIORITY</div>
                  <div style={{ fontSize: '0.85rem', color: priorityColors[viewingLead.priority], fontWeight: 700 }}>{viewingLead.priority}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>STATUS</div>
                  <div style={{ fontSize: '0.85rem', color: '#2563EB', fontWeight: 700 }}>{viewingLead.status}</div>
                </div>
              </div>
              {viewingLead.requirements && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Requirements / Inquiry</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px' }}>{viewingLead.requirements}</div>
                </div>
              )}
              {viewingLead.notes && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Notes</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px' }}>{viewingLead.notes}</div>
                </div>
              )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setViewingLead(null)} style={{ padding: '8px 16px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Lead Confirm Modal */}
      {deletingLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#0F172A' }}>Delete Lead?</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '0 0 20px 0' }}>Are you sure you want to delete lead <strong>{deletingLead.name}</strong>? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button onClick={() => setDeletingLead(null)} style={{ padding: '8px 16px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDeleteLeadConfirm} disabled={submitting} style={{ padding: '8px 16px', background: '#DC2626', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}>{submitting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}