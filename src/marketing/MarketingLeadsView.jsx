import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  Target,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Filter,
  X,
  Mail,
  Building2,
  Award,
  Zap
} from 'lucide-react';
import './MarketingViews.css';

export default function MarketingLeadsView({ isModalOpen, onCloseModal }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('Google Paid Search');
  const [campaign, setCampaign] = useState('Summer Growth 2026');
  const [score, setScore] = useState('80');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/crm/leads');
      if (response.ok && data.success && Array.isArray(data.data)) {
        setLeads(data.data.map(l => ({
          ...l,
          id: l._id || '',
          name: l.name || 'Unnamed Lead',
          email: l.email || 'No email',
          phone: l.phone || '',
          company: l.company || 'Independent Lead',
          source: l.source || 'Unknown',
          campaign: l.campaign || 'General Outreach',
          stage: l.status || 'New',
          score: Number(l.value ?? 80),
          date: l.createdAt && !Number.isNaN(new Date(l.createdAt).getTime())
            ? new Date(l.createdAt).toISOString().split('T')[0]
            : 'N/A'
        })));
      }
    } catch (err) {
      console.error('Fetch leads error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!name || !email) return;

    const { response, data } = await apiRequest('/api/crm/leads', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company ? company.trim() : 'Independent Lead',
        source,
        campaign: campaign ? campaign.trim() : '',
        value: Number(score || 80),
        status: 'New'
      })
    });

    if (response.ok && data.success) {
      fetchLeads();
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      if (onCloseModal) onCloseModal();
    }
  };

  const handleQualifyAndTransfer = async (leadId) => {
    try {
      const { response, data } = await apiRequest(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Qualified' })
      });

      if (response.ok && data.success !== false) {
        fetchLeads();
      } else {
        console.error('Qualify lead error:', data?.message || 'Unable to qualify lead.');
      }
    } catch (err) {
      console.error('Qualify lead error:', err);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const search = searchQuery.trim().toLowerCase();

    const leadName = String(l.name || '').toLowerCase();
    const leadCompany = String(l.company || '').toLowerCase();
    const leadEmail = String(l.email || '').toLowerCase();

    const matchesStage =
      activeStage === 'All' || l.stage === activeStage;

    const matchesSearch =
      !search ||
      leadName.includes(search) ||
      leadCompany.includes(search) ||
      leadEmail.includes(search);

    return matchesStage && matchesSearch;
  });

  const totalMqls = leads.filter(l => l.stage === 'MQL').length;
  const totalSqls = leads.filter(l => l.stage === 'SQL').length;
  const totalConverted = leads.filter(l => l.stage === 'Converted').length;

  return (
    <div className="mkt-view-container">
      {/* Page Header */}
      <div className="mkt-page-header">
        <div className="mkt-page-header-title">
          <h2>Marketing Qualified Leads (MQLs)</h2>
          <p>Track prospect acquisition, lead scoring, channel origin, and sales hand-off pipeline.</p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="mkt-kpi-grid">
        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Active MQLs</span>
            <div className="mkt-kpi-icon pink"><Target size={18} /></div>
          </div>
          <div className="mkt-kpi-value">{totalMqls}</div>
          <div className="mkt-kpi-subtitle">Qualified for sales review</div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Sales Qualified (SQL)</span>
            <div className="mkt-kpi-icon purple"><Zap size={18} /></div>
          </div>
          <div className="mkt-kpi-value">{totalSqls}</div>
          <div className="mkt-kpi-subtitle up">High intent leads</div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Converted Customers</span>
            <div className="mkt-kpi-icon emerald"><CheckCircle size={18} /></div>
          </div>
          <div className="mkt-kpi-value">{totalConverted}</div>
          <div className="mkt-kpi-subtitle up">28.4% conversion rate</div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Avg Cost Per Lead (CPL)</span>
            <div className="mkt-kpi-icon blue"><Award size={18} /></div>
          </div>
          <div className="mkt-kpi-value">Rs. 24.50</div>
          <div className="mkt-kpi-subtitle">Efficient acquisition cost</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="mkt-card">
        {/* Filter Controls */}
        <div className="mkt-filter-bar">
          <div className="mkt-tabs">
            {['All', 'MQL', 'SQL', 'Converted'].map(stage => (
              <button
                key={stage}
                className={`mkt-tab-btn ${activeStage === stage ? 'active' : ''}`}
                onClick={() => setActiveStage(stage)}
              >
                {stage}
              </button>
            ))}
          </div>

          <div className="mkt-search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search lead name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="mkt-table-wrapper">
          <table className="mkt-table">
            <thead>
              <tr>
                <th>Lead ID</th>
                <th>Prospect Name</th>
                <th>Company</th>
                <th>Lead Source</th>
                <th>Score</th>
                <th>Acquired Date</th>
                <th>Stage</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{String(l.id || '').slice(-6) || 'N/A'}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1E293B' }}>{l.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{l.email}</div>
                  </td>
                  <td>{l.company}</td>
                  <td><span className="mkt-badge draft">{l.source}</span></td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: l.score >= 90 ? '#DB2777' : l.score >= 80 ? '#7C3AED' : '#2563EB'
                    }}>
                      {l.score} / 100
                    </span>
                  </td>
                  <td>{l.date}</td>
                  <td>
                    <span className={`mkt-badge ${l.stage.toLowerCase()}`}>
                      {l.stage}
                    </span>
                  </td>
                  <td>
                    {l.stage !== 'SQL' && l.stage !== 'Converted' ? (
                      <button
                        className="mkt-btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => handleQualifyAndTransfer(l.id)}
                      >
                        Qualify & Transfer to Sales
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>Transferred</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="mkt-modal-overlay">
          <div className="mkt-modal-content">
            <div className="mkt-modal-header">
              <h3>Add New Marketing Lead</h3>
              <button className="mkt-modal-close" onClick={onCloseModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddLead}>
              <div className="mkt-modal-body">
                <div className="mkt-form-group">
                  <label>Prospect Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mkt-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="sarah@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="mkt-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 019-2834"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mkt-form-group">
                    <label>Company / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Tech Inc"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <div className="mkt-form-group">
                    <label>Marketing Campaign</label>
                    <input
                      type="text"
                      placeholder="e.g. Q3 Growth Drive"
                      value={campaign}
                      onChange={(e) => setCampaign(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mkt-form-group">
                    <label>Lead Source Channel</label>
                    <select value={source} onChange={(e) => setSource(e.target.value)}>
                      <option value="Google Paid Search">Google Paid Search</option>
                      <option value="LinkedIn Ads">LinkedIn Ads</option>
                      <option value="Organic SEO">Organic SEO</option>
                      <option value="Webinar Series">Webinar Series</option>
                      <option value="Referral">Referral / Organic</option>
                    </select>
                  </div>

                  <div className="mkt-form-group">
                    <label>Initial Score (1-100)</label>
                    <input
                      type="number"
                      placeholder="85"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mkt-modal-footer">
                <button type="button" className="mkt-btn-secondary" onClick={onCloseModal}>Cancel</button>
                <button type="submit" className="mkt-btn-primary">Add Prospect Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
