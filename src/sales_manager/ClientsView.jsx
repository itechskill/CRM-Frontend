import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  X,
  Building2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  LayoutGrid,
  List,
  Trash2,
  User,
  Phone,
  Mail
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import './ClientsView.css';

const filterTabs = ['All', 'Excellent', 'Good', 'At Risk', 'Critical'];

const healthStyles = {
  Excellent: { bg: '#DCFCE7', color: '#15803D', icon: CheckCircle2 },
  Good: { bg: '#DCFCE7', color: '#15803D', icon: TrendingUp },
  'At Risk': { bg: '#FEF3C7', color: '#B45309', icon: AlertTriangle },
  Critical: { bg: '#FEE2E2', color: '#B91C1C', icon: AlertOctagon },
};

const industryPalette = [
  { bg: '#EFF6FF', color: '#2563EB' },
  { bg: '#F3E8FF', color: '#7C3AED' },
  { bg: '#ECFDF5', color: '#0D9488' },
  { bg: '#FFFBEB', color: '#D97706' },
  { bg: '#FDF2F8', color: '#DB2777' },
  { bg: '#F1F5F9', color: '#475569' },
];

function getIndustryStyle(industry) {
  if (!industry) return industryPalette[0];
  let hash = 0;
  for (let i = 0; i < industry.length; i++) {
    hash = industry.charCodeAt(i) + ((hash << 5) - hash);
  }
  return industryPalette[Math.abs(hash) % industryPalette.length];
}

const avatarPalette = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0D9488', '#DC2626', '#6366F1'];

function getInitials(name) {
  if (!name) return 'CL';
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatPKR(val) {
  return `Rs. ${Number(val || 0).toLocaleString()}`;
}

function formatK(val) {
  if (val >= 1000000) return `Rs. ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `Rs. ${Math.round(val / 1000)}k`;
  return `Rs. ${Number(val || 0).toLocaleString()}`;
}

function AddClientModal({ isOpen, onClose, onAddSuccess }) {
  const emptyForm = {
    name: '',
    company: '',
    industry: 'Technology',
    email: '',
    phone: '',
    health: 'Good',
    contractValue: '',
    revenue: '',
    expires: '',
    owner: ''
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const resetAndClose = () => {
    setForm(emptyForm);
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!form.name || !form.name.trim()) newErrors.name = true;
    if (!form.company || !form.company.trim()) newErrors.company = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        company: form.company.trim(),
        industry: form.industry.trim() || 'Technology',
        email: form.email.trim(),
        phone: form.phone.trim(),
        totalValue: Number(form.contractValue) || 0,
        status: 'Active'
      };

      const { response, data } = await apiRequest('/api/crm/clients', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok && data.success) {
        onAddSuccess(data.data);
        resetAndClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="clients-modal-overlay">
      <div className="clients-modal-content">
        <div className="clients-modal-header">
          <h2>Add Client</h2>
          <button className="clients-modal-close-btn" onClick={resetAndClose}>
            <X size={20} />
          </button>
        </div>

        <form className="clients-modal-form" onSubmit={handleSubmit}>
          <div className="clients-modal-body">
            <div className="clients-form-grid">
              <div className="clients-form-group">
                <label>Contact Person *</label>
                <input
                  type="text"
                  className={`clients-form-input ${errors.name ? 'error' : ''}`}
                  placeholder="e.g. Asad Malik"
                  value={form.name}
                  onChange={handleChange('name')}
                  required
                />
                {errors.name && <span className="clients-form-error">Contact name is required</span>}
              </div>
              <div className="clients-form-group">
                <label>Company / Organization *</label>
                <input
                  type="text"
                  className={`clients-form-input ${errors.company ? 'error' : ''}`}
                  placeholder="e.g. Systems Ltd"
                  value={form.company}
                  onChange={handleChange('company')}
                  required
                />
                {errors.company && <span className="clients-form-error">Company is required</span>}
              </div>
            </div>

            <div className="clients-form-grid">
              <div className="clients-form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="clients-form-input"
                  placeholder="contact@company.com"
                  value={form.email}
                  onChange={handleChange('email')}
                />
              </div>
              <div className="clients-form-group">
                <label>Phone</label>
                <input
                  type="text"
                  className="clients-form-input"
                  placeholder="+92 300 0000000"
                  value={form.phone}
                  onChange={handleChange('phone')}
                />
              </div>
            </div>

            <div className="clients-form-grid">
              <div className="clients-form-group">
                <label>Industry</label>
                <input
                  type="text"
                  className="clients-form-input"
                  placeholder="e.g. Information Technology"
                  value={form.industry}
                  onChange={handleChange('industry')}
                />
              </div>
              <div className="clients-form-group">
                <label>Relationship Status</label>
                <select className="clients-form-input" value={form.health} onChange={handleChange('health')}>
                  {Object.keys(healthStyles).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="clients-form-grid">
              <div className="clients-form-group">
                <label>Contract Value (PKR)</label>
                <input
                  type="number"
                  className="clients-form-input"
                  placeholder="e.g. 500000"
                  min="0"
                  value={form.contractValue}
                  onChange={handleChange('contractValue')}
                />
              </div>
              <div className="clients-form-group">
                <label>Revenue Achieved (PKR)</label>
                <input
                  type="number"
                  className="clients-form-input"
                  placeholder="e.g. 350000"
                  min="0"
                  value={form.revenue}
                  onChange={handleChange('revenue')}
                />
              </div>
            </div>
          </div>

          <div className="clients-modal-footer">
            <button type="button" className="clients-btn-secondary" onClick={resetAndClose}>
              Cancel
            </button>
            <button type="submit" className="clients-btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientCard({ client, index, isSelected, onSelect, onDelete }) {
  const health = healthStyles[client.health] || healthStyles.Good;
  const HealthIcon = health.icon;
  const industryStyle = getIndustryStyle(client.industry);
  const avatarColor = avatarPalette[index % avatarPalette.length];

  return (
    <div
      className={`client-card ${isSelected ? 'client-card-selected' : ''}`}
      style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
      onClick={() => onSelect(client.id)}
    >
      <div className="client-card-top">
        <div className="client-card-identity">
          <div className="client-avatar" style={{ backgroundColor: avatarColor }}>
            {getInitials(client.name)}
          </div>
          <div>
            <h4>{client.name}</h4>
            <span>{client.company}</span>
          </div>
        </div>
        <span className="health-badge" style={{ backgroundColor: health.bg, color: health.color }}>
          <HealthIcon size={13} /> {client.health}
        </span>
      </div>

      <div className="client-industry-row">
        <span className="industry-tag" style={{ backgroundColor: industryStyle.bg, color: industryStyle.color }}>
          <Building2 size={12} /> {client.industry || 'Business'}
        </span>
      </div>

      <div className="client-stats-row">
        <div>
          <span className="client-stat-label">CONTRACT VALUE</span>
          <span className="client-stat-value">{formatK(client.contractValue)}</span>
        </div>
        <div>
          <span className="client-stat-label">REVENUE</span>
          <span className="client-stat-value client-stat-revenue">{formatK(client.revenue)}</span>
        </div>
      </div>

      <div className="client-progress-section">
        <div className="client-progress-header">
          <span>Revenue Progress</span>
          <span>{client.progress}%</span>
        </div>
        <div className="client-progress-track">
          <div className="client-progress-fill" style={{ width: `${client.progress}%` }}></div>
        </div>
      </div>

      <div className="client-card-footer">
        <span className="client-expires">
          <Calendar size={13} /> {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Active Client'}
        </span>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(client.id); }}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
            title="Delete Client"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ClientsView() {
  const [clientsData, setClientsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/crm/clients');
      if (response.ok && data.success && Array.isArray(data.data)) {
        const formatted = data.data.map((c, idx) => {
          const contractVal = c.totalValue || 0;
          const rev = c.revenue || contractVal;
          const progress = contractVal > 0 ? Math.min(100, Math.round((rev / contractVal) * 100)) : 100;
          return {
            ...c,
            id: c._id,
            health: c.health || (c.status === 'Active' ? 'Excellent' : 'Good'),
            contractValue: contractVal,
            revenue: rev,
            progress: progress,
            owner: c.createdBy?.fullName || 'Sales Team'
          };
        });
        setClientsData(formatted);
        if (formatted.length > 0 && !selectedClientId) {
          setSelectedClientId(formatted[0].id);
        }
      }
    } catch (e) {
      console.error('Fetch clients error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDeleteClient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      const { response } = await apiRequest(`/api/crm/clients/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setClientsData((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stats = useMemo(() => {
    const totalRevenue = clientsData.reduce((sum, c) => sum + (c.revenue || 0), 0);
    const totalContractValue = clientsData.reduce((sum, c) => sum + (c.contractValue || 0), 0);
    const atRiskCount = clientsData.filter((c) => c.health === 'At Risk' || c.health === 'Critical').length;
    return {
      totalClients: clientsData.length,
      totalRevenue,
      totalContractValue,
      atRiskCount,
    };
  }, [clientsData]);

  const filteredClients = clientsData.filter((c) => {
    const matchesFilter = activeFilter === 'All' || c.health === activeFilter;
    const matchesSearch =
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="clients-view-container">
      {/* Header */}
      <div className="clients-page-header">
        <div>
          <h1>Converted Clients</h1>
          <p>{stats.totalClients} active clients · {formatPKR(stats.totalRevenue)} revenue generated</p>
        </div>

        <div className="clients-header-actions">
          <div className="clients-view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={14} /> Grid
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <List size={14} /> Table
            </button>
          </div>
          <button className="clients-btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="clients-stats-grid">
        <div className="client-stat-card">
          <span className="client-stat-card-value" style={{ color: '#2563EB' }}>{stats.totalClients}</span>
          <span className="client-stat-card-label">Total Clients</span>
        </div>
        <div className="client-stat-card">
          <span className="client-stat-card-value" style={{ color: '#16A34A' }}>{formatK(stats.totalRevenue)}</span>
          <span className="client-stat-card-label">Total Revenue</span>
        </div>
        <div className="client-stat-card">
          <span className="client-stat-card-value" style={{ color: '#7C3AED' }}>{formatK(stats.totalContractValue)}</span>
          <span className="client-stat-card-label">Contract Value</span>
        </div>
        <div className="client-stat-card">
          <span className="client-stat-card-value" style={{ color: '#DC2626' }}>{stats.atRiskCount}</span>
          <span className="client-stat-card-label">At Risk</span>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="clients-toolbar">
        <div className="clients-search-box">
          <Search size={16} className="clients-search-icon" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="clients-filter-row">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              className={`clients-filter-pill ${activeFilter === tab ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
          <div className="smd-spinner" style={{ margin: '0 auto 12px' }} />
          <p>Loading Clients...</p>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="clients-grid">
              {filteredClients.map((client, index) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  index={index}
                  isSelected={selectedClientId === client.id}
                  onSelect={setSelectedClientId}
                  onDelete={handleDeleteClient}
                />
              ))}
              {filteredClients.length === 0 && (
                <div className="clients-empty-state">No clients found matching "{searchTerm}".</div>
              )}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="clients-table-container">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Industry</th>
                    <th>Contract Value</th>
                    <th>Revenue</th>
                    <th>Progress</th>
                    <th>Health</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const health = healthStyles[client.health] || healthStyles.Good;
                    const HealthIcon = health.icon;
                    const industryStyle = getIndustryStyle(client.industry);
                    const avatarColor = avatarPalette[client.id % avatarPalette.length];
                    return (
                      <tr
                        key={client.id}
                        className={selectedClientId === client.id ? 'clients-table-row-active' : ''}
                        onClick={() => setSelectedClientId(client.id)}
                      >
                        <td>
                          <div className="clients-table-identity">
                            <div className="client-avatar client-avatar-sm" style={{ backgroundColor: avatarColor }}>
                              {getInitials(client.name)}
                            </div>
                            <div>
                              <span className="clients-table-name">{client.name}</span>
                              <span className="clients-table-company">{client.company}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="industry-tag" style={{ backgroundColor: industryStyle.bg, color: industryStyle.color }}>
                            {client.industry}
                          </span>
                        </td>
                        <td>{formatPKR(client.contractValue)}</td>
                        <td className="clients-table-revenue">{formatPKR(client.revenue)}</td>
                        <td>
                          <div className="clients-table-progress">
                            <div className="client-progress-track">
                              <div className="client-progress-fill" style={{ width: `${client.progress}%` }}></div>
                            </div>
                            <span>{client.progress}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="health-badge" style={{ backgroundColor: health.bg, color: health.color }}>
                            <HealthIcon size={13} /> {client.health}
                          </span>
                        </td>
                        <td className="clients-table-expires">
                          {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                            title="Delete Client"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredClients.length === 0 && (
                <div className="clients-empty-state">No clients found matching "{searchTerm}".</div>
              )}
            </div>
          )}
        </>
      )}

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSuccess={() => fetchClients()}
      />
    </div>
  );
}
