import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import './ClientsView.css';

const initialClientsData = [
  {
    id: 1,
    name: 'Proxima Labs',
    country: 'USA',
    initials: 'PL',
    avatarBg: '#2563EB',
    industry: 'Technology',
    contactName: 'Eric Vance',
    contactEmail: 'e.vance@proxima.io',
    revenueYtd: '$148,000',
    dealsCount: 4,
    status: 'Active'
  },
  {
    id: 2,
    name: 'BuildCo Industries',
    country: 'Germany',
    initials: 'BC',
    avatarBg: '#10B981',
    industry: 'Construction',
    contactName: 'Rachel Okafor',
    contactEmail: 'r.okafor@buildco.com',
    revenueYtd: '$112,000',
    dealsCount: 2,
    status: 'Active'
  },
  {
    id: 3,
    name: 'Starlight Ventures',
    country: 'UK',
    initials: 'SV',
    avatarBg: '#F59E0B',
    industry: 'Finance & VC',
    contactName: 'David Miller',
    contactEmail: 'd.miller@starlight.io',
    revenueYtd: '$210,000',
    dealsCount: 7,
    status: 'Active'
  },
  {
    id: 4,
    name: 'Nexus Dynamics',
    country: 'Canada',
    initials: 'NX',
    avatarBg: '#EF4444',
    industry: 'Logistics',
    contactName: 'Sophia Martinez',
    contactEmail: 's.martinez@nexusdyn.com',
    revenueYtd: '$85,000',
    dealsCount: 1,
    status: 'At Risk'
  },
  {
    id: 5,
    name: 'Apex Software',
    country: 'USA',
    initials: 'AS',
    avatarBg: '#8B5CF6',
    industry: 'Cloud Services',
    contactName: 'James Reed',
    contactEmail: 'j.reed@apexsoft.io',
    revenueYtd: '$320,000',
    dealsCount: 5,
    status: 'Active'
  }
];

const industryOptions = [
  'Technology', 'Construction', 'Finance & VC', 'Logistics',
  'Cloud Services', 'Healthcare', 'Retail', 'Manufacturing'
];
const statusOptions = ['Active', 'At Risk'];

function EditClientModal({ client, onClose, onSave }) {
  const [industry, setIndustry] = useState(client.industry);
  const [contactName, setContactName] = useState(client.contactName);
  const [contactEmail, setContactEmail] = useState(client.contactEmail);
  const [status, setStatus] = useState(client.status);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(client.id, { industry, contactName, contactEmail, status });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Client</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="edit-client-identity">
              <span className="edit-client-avatar" style={{ background: client.avatarBg }}>
                {client.initials}
              </span>
              <div>
                <h4>{client.name}</h4>
                <span>{client.country}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Industry</label>
              <select className="form-select" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                {industryOptions.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Primary Contact Name</label>
              <input
                className="form-input"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Primary Contact Email</label>
              <input
                className="form-input"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientsView({ clientsList = initialClientsData, onOpenAddClientModal, onDeleteClient }) {
  const [clients, setClients] = useState(clientsList);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setClients(clientsList.map(c => ({
      ...c,
      initials: c.initials || (c.name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      avatarBg: c.avatarBg || '#10B981',
      industry: c.industry || 'Technology',
      contactName: c.contactName || c.name || 'Primary Contact',
      contactEmail: c.contactEmail || 'contact@client.com',
      revenueYtd: c.revenueYtd || '$0',
      dealsCount: c.dealsCount || 1,
      country: c.country || 'USA',
      status: c.status || 'Active'
    })));
  }, [clientsList]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (clientId) => {
    const confirmed = window.confirm('Are you sure you want to delete this client?');
    if (!confirmed) return;

    setClients(prev => prev.filter(client => client.id !== clientId));
    setOpenMenuId(null);

    if (onDeleteClient) onDeleteClient(clientId);
  };

  const handleSaveEdit = (clientId, updates) => {
    setClients(prev =>
      prev.map(client => (client.id === clientId ? { ...client, ...updates } : client))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 4 Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <div className="client-stat-card" style={{
          backgroundColor: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>284</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginTop: '6px' }}>Total Clients</div>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>8 new this week</div>
        </div>

        <div className="client-stat-card" style={{
          backgroundColor: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>231</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginTop: '6px' }}>Active</div>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>81.3% retention</div>
        </div>

        <div className="client-stat-card" style={{
          backgroundColor: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>27</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginTop: '6px' }}>At Risk</div>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>Needs attention</div>
        </div>

        <div className="client-stat-card" style={{
          backgroundColor: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>$3.2M</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginTop: '6px' }}>Total ARR</div>
          <div style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: 600, marginTop: '2px' }}>↑ 18% YoY</div>
        </div>
      </div>

      {/* Clients Data Table Section */}
      <div className="data-table-container">
        <div className="table-header-toolbar" style={{ padding: '20px 24px' }}>
          <div className="global-search" style={{ width: '280px' }}>
            <Search size={16} className="global-search-icon" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={onOpenAddClientModal}>
            <Plus size={16} /> Add Client
          </button>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: '24px' }}>Client</th>
              <th>Industry</th>
              <th>Primary Contact</th>
              <th>Revenue YTD</th>
              <th>Deals</th>
              <th>Status</th>
              <th style={{ textAlign: 'right', paddingRight: '24px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client, index) => (
                <tr key={client.id}>
                  <td style={{ paddingLeft: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: client.avatarBg,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {client.initials}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{client.name}</span>
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{client.country}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#475569', fontWeight: 500, fontSize: '0.875rem' }}>{client.industry}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>{client.contactName}</span>
                      <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{client.contactEmail}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{client.revenueYtd}</td>
                  <td style={{ color: '#475569', fontWeight: 600, fontSize: '0.875rem' }}>{client.dealsCount}</td>
                  <td>
                    <span style={{
                      backgroundColor: client.status === 'Active' ? '#DCFCE7' : '#FEF3C7',
                      color: client.status === 'Active' ? '#15803D' : '#B45309',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: client.status === 'Active' ? '#16A34A' : '#D97706'
                      }}></span>
                      {client.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '24px', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <button
                        className="icon-btn"
                        style={{ width: '32px', height: '32px', border: 'none', background: 'transparent' }}
                        onClick={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                      >
                        <MoreHorizontal size={16} color="#94A3B8" />
                      </button>

                      {openMenuId === client.id && (
                        <div
                          className={`row-menu ${index === filteredClients.length - 1 ? 'row-menu-up' : ''}`}
                          ref={menuRef}
                        >
                          <button
                            className="row-menu-item"
                            onClick={() => {
                              setEditingClient(client);
                              setOpenMenuId(null);
                            }}
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            className="row-menu-item row-menu-item-danger"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                  No clients found matching "{searchTerm}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}