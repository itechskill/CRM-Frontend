import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
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
  let hash = 0;
  for (let i = 0; i < industry.length; i++) {
    hash = industry.charCodeAt(i) + ((hash << 5) - hash);
  }
  return industryPalette[Math.abs(hash) % industryPalette.length];
}

const avatarPalette = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0D9488', '#DC2626', '#6366F1'];

function getInitials(name) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const initialClientsData = [
  {
    id: 1,
    name: 'Carlos Mendez',
    company: 'Orbit Digital',
    industry: 'Digital Marketing',
    health: 'Excellent',
    contractValue: 67,
    revenue: 67,
    progress: 100,
    expires: '2025-12-14',
    owner: 'Priya',
  },
  {
    id: 2,
    name: 'Alex Torres',
    company: 'Streamline Corp',
    industry: 'Logistics',
    health: 'Good',
    contractValue: 156,
    revenue: 156,
    progress: 100,
    expires: '2025-05-31',
    owner: 'Angela',
  },
  {
    id: 3,
    name: 'Natalie Park',
    company: 'Horizon Financial',
    industry: 'Financial Services',
    health: 'Excellent',
    contractValue: 220,
    revenue: 220,
    progress: 100,
    expires: '2025-01-14',
    owner: 'James',
  },
  {
    id: 4,
    name: 'Benjamin Hayes',
    company: 'GreenLeaf Technologies',
    industry: 'Manufacturing',
    health: 'Good',
    contractValue: 98,
    revenue: 91,
    progress: 93,
    expires: '2025-08-22',
    owner: 'Angela',
  },
  {
    id: 5,
    name: 'Diana Miller',
    company: 'Apex Retail Group',
    industry: 'Retail',
    health: 'At Risk',
    contractValue: 145,
    revenue: 102,
    progress: 70,
    expires: '2025-03-09',
    owner: 'Priya',
  },
  {
    id: 6,
    name: 'Ryan Foster',
    company: 'NovaTech Systems',
    industry: 'Technology',
    health: 'Excellent',
    contractValue: 132,
    revenue: 132,
    progress: 100,
    expires: '2025-11-02',
    owner: 'James',
  },
  {
    id: 7,
    name: 'Sophia Chen',
    company: 'Meridian Labs',
    industry: 'Healthcare',
    health: 'Critical',
    contractValue: 85,
    revenue: 46,
    progress: 54,
    expires: '2025-02-18',
    owner: 'Angela',
  },
  {
    id: 8,
    name: 'Marcus Webb',
    company: 'Pioneer Freight',
    industry: 'Logistics',
    health: 'At Risk',
    contractValue: 148,
    revenue: 92,
    progress: 62,
    expires: '2025-04-27',
    owner: 'Priya',
  },
];

function formatK(value) {
  return `$${value}k`;
}

function AddClientModal({ isOpen, onClose, onAddClient }) {
  const emptyForm = {
    name: '',
    company: '',
    industry: '',
    health: 'Good',
    contractValue: '',
    revenue: '',
    expires: '',
    owner: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

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

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    ['name', 'company', 'industry', 'contractValue', 'revenue', 'expires'].forEach((field) => {
      if (!form[field] || !String(form[field]).trim()) newErrors[field] = true;
    });
    if (form.contractValue && isNaN(Number(form.contractValue))) newErrors.contractValue = true;
    if (form.revenue && isNaN(Number(form.revenue))) newErrors.revenue = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const contractValue = Number(form.contractValue);
    const revenue = Number(form.revenue);
    const progress = contractValue > 0 ? Math.min(100, Math.round((revenue / contractValue) * 100)) : 0;

    onAddClient({
      id: Date.now(),
      name: form.name.trim(),
      company: form.company.trim(),
      industry: form.industry.trim(),
      health: form.health,
      contractValue,
      revenue,
      progress,
      expires: form.expires,
      owner: form.owner.trim() || 'Unassigned',
    });

    resetAndClose();
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
                <label>Client Name</label>
                <input
                  type="text"
                  className={`clients-form-input ${errors.name ? 'error' : ''}`}
                  placeholder="e.g. Carlos Mendez"
                  value={form.name}
                  onChange={handleChange('name')}
                />
                {errors.name && <span className="clients-form-error">Client name is required</span>}
              </div>
              <div className="clients-form-group">
                <label>Company</label>
                <input
                  type="text"
                  className={`clients-form-input ${errors.company ? 'error' : ''}`}
                  placeholder="e.g. Orbit Digital"
                  value={form.company}
                  onChange={handleChange('company')}
                />
                {errors.company && <span className="clients-form-error">Company is required</span>}
              </div>
            </div>

            <div className="clients-form-grid">
              <div className="clients-form-group">
                <label>Industry</label>
                <input
                  type="text"
                  className={`clients-form-input ${errors.industry ? 'error' : ''}`}
                  placeholder="e.g. Digital Marketing"
                  value={form.industry}
                  onChange={handleChange('industry')}
                />
                {errors.industry && <span className="clients-form-error">Industry is required</span>}
              </div>
              <div className="clients-form-group">
                <label>Health Status</label>
                <select className="clients-form-input" value={form.health} onChange={handleChange('health')}>
                  {Object.keys(healthStyles).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="clients-form-grid">
              <div className="clients-form-group">
                <label>Contract Value ($k)</label>
                <input
                  type="number"
                  className={`clients-form-input ${errors.contractValue ? 'error' : ''}`}
                  placeholder="e.g. 150"
                  min="0"
                  value={form.contractValue}
                  onChange={handleChange('contractValue')}
                />
                {errors.contractValue && <span className="clients-form-error">Enter a valid contract value</span>}
              </div>
              <div className="clients-form-group">
                <label>Revenue ($k)</label>
                <input
                  type="number"
                  className={`clients-form-input ${errors.revenue ? 'error' : ''}`}
                  placeholder="e.g. 120"
                  min="0"
                  value={form.revenue}
                  onChange={handleChange('revenue')}
                />
                {errors.revenue && <span className="clients-form-error">Enter a valid revenue amount</span>}
              </div>
            </div>

            <div className="clients-form-grid">
              <div className="clients-form-group">
                <label>Contract Expires</label>
                <input
                  type="date"
                  className={`clients-form-input ${errors.expires ? 'error' : ''}`}
                  value={form.expires}
                  onChange={handleChange('expires')}
                />
                {errors.expires && <span className="clients-form-error">Expiry date is required</span>}
              </div>
              <div className="clients-form-group">
                <label>Account Owner</label>
                <input
                  type="text"
                  className="clients-form-input"
                  placeholder="e.g. Priya"
                  value={form.owner}
                  onChange={handleChange('owner')}
                />
              </div>
            </div>
          </div>

          <div className="clients-modal-footer">
            <button type="button" className="clients-btn-secondary" onClick={resetAndClose}>
              Cancel
            </button>
            <button type="submit" className="clients-btn-primary">
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientCard({ client, index, isSelected, onSelect }) {
  const health = healthStyles[client.health] || healthStyles.Good;
  const HealthIcon = health.icon;
  const industryStyle = getIndustryStyle(client.industry);
  const avatarColor = avatarPalette[client.id % avatarPalette.length];

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
          <Building2 size={12} /> {client.industry}
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
          <Calendar size={13} /> Expires: {client.expires}
        </span>
        <span className="client-owner-avatar" style={{ backgroundColor: avatarPalette[(client.id + 3) % avatarPalette.length] }}>
          {getInitials(client.owner)}
        </span>
      </div>
    </div>
  );
}

export default function ClientsView() {
  const [clientsData, setClientsData] = useState(initialClientsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedClientId, setSelectedClientId] = useState(initialClientsData[0].id);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const stats = useMemo(() => {
    const totalRevenue = clientsData.reduce((sum, c) => sum + c.revenue, 0);
    const totalContractValue = clientsData.reduce((sum, c) => sum + c.contractValue, 0);
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
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAddClient = (newClient) => {
    setClientsData((prev) => [newClient, ...prev]);
    setSelectedClientId(newClient.id);
  };

  return (
    <div className="clients-view-container">
      {/* Header */}
      <div className="clients-page-header">
        <div>
          <h1>Converted Clients</h1>
          <p>{stats.totalClients} active clients · {formatK(stats.totalRevenue)} revenue generated</p>
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
                <th>Expires</th>
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
                    <td>{formatK(client.contractValue)}</td>
                    <td className="clients-table-revenue">{formatK(client.revenue)}</td>
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
                    <td className="clients-table-expires">{client.expires}</td>
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

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddClient={handleAddClient}
      />
    </div>
  );
}
