import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  Megaphone,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Filter,
  X,
  Target,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import './MarketingViews.css';

export default function MarketingCampaignsView({ isModalOpen, onCloseModal }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('Google Ads');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/marketing/campaigns');
      if (response.ok && data.success && Array.isArray(data.data)) {
        setCampaigns(data.data.map(c => ({
          ...c,
          id: c._id,
          spend: c.spend || 0,
          leads: c.leadsGenerated || 0,
          ctr: c.ctr || '0.0%',
          roi: c.roi || '0%',
          startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : ''
        })));
      }
    } catch (err) {
      console.error('Fetch campaigns error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!name || !budget) return;

    const { response, data } = await apiRequest('/api/marketing/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        channel,
        budget: parseFloat(budget),
        status: 'Active',
        startDate: startDate || new Date().toISOString().split('T')[0]
      })
    });

    if (response.ok && data.success) {
      fetchCampaigns();
      setName('');
      setBudget('');
      setStartDate('');
      if (onCloseModal) onCloseModal();
    }
  };

  const filteredCampaigns = campaigns.filter(cmp => {
    const matchesFilter = activeFilter === 'All' || cmp.status?.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch =
      (cmp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cmp.channel || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0);
  const totalLeads = campaigns.reduce((s, c) => s + (c.leads || 0), 0);
  const activeCount = campaigns.filter(c => c.status === 'Active').length;

  return (
    <div className="mkt-view-container">
      {/* Page Header */}
      <div className="mkt-page-header">
        <div className="mkt-page-header-title">
          <h2>Campaign Management</h2>
          <p>Create, monitor, and optimize omni-channel growth campaigns and ad spend.</p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="mkt-kpi-grid">
        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Active Campaigns</span>
            <div className="mkt-kpi-icon pink"><Megaphone size={18} /></div>
          </div>
          <div className="mkt-kpi-value">{activeCount}</div>
          <div className="mkt-kpi-subtitle">{campaigns.length} Total campaigns trackable</div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Total Ad Spend</span>
            <div className="mkt-kpi-icon blue"><DollarSign size={18} /></div>
          </div>
          <div className="mkt-kpi-value">Rs. {totalSpend.toLocaleString()}</div>
          <div className="mkt-kpi-subtitle">Across active ad networks</div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">MQLs Acquired</span>
            <div className="mkt-kpi-icon purple"><Target size={18} /></div>
          </div>
          <div className="mkt-kpi-value">{totalLeads.toLocaleString()}</div>
          <div className="mkt-kpi-subtitle up">High conversion performance</div>
        </div>

        <div className="mkt-kpi-card">
          <div className="mkt-kpi-top">
            <span className="mkt-kpi-title">Avg Return on Marketing</span>
            <div className="mkt-kpi-icon emerald"><TrendingUp size={18} /></div>
          </div>
          <div className="mkt-kpi-value">340%</div>
          <div className="mkt-kpi-subtitle up">Positive ROMI yield</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="mkt-card">
        {/* Filter Controls */}
        <div className="mkt-filter-bar">
          <div className="mkt-tabs">
            {['All', 'Active', 'Scheduled', 'Paused', 'Completed'].map(tab => (
              <button
                key={tab}
                className={`mkt-tab-btn ${activeFilter === tab ? 'active' : ''}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mkt-search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by campaign or channel..."
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
                <th>Campaign ID</th>
                <th>Campaign Name</th>
                <th>Channel</th>
                <th>Start Date</th>
                <th>Budget (Rs.)</th>
                <th>Spent (Rs.)</th>
                <th>MQLs</th>
                <th>CTR</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((cmp) => (
                <tr key={cmp.id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{cmp.id}</td>
                  <td style={{ fontWeight: 600, color: '#1E293B' }}>{cmp.name}</td>
                  <td><span className="mkt-badge draft">{cmp.channel}</span></td>
                  <td>{cmp.startDate}</td>
                  <td style={{ fontWeight: 600 }}>Rs. {cmp.budget.toLocaleString()}</td>
                  <td style={{ color: '#64748B' }}>Rs. {cmp.spend.toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{cmp.leads}</td>
                  <td style={{ color: '#2563EB', fontWeight: 600 }}>{cmp.ctr}</td>
                  <td>
                    <span className={`mkt-badge ${cmp.status.toLowerCase()}`}>
                      {cmp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {isModalOpen && (
        <div className="mkt-modal-overlay">
          <div className="mkt-modal-content">
            <div className="mkt-modal-header">
              <h3>Create New Campaign</h3>
              <button className="mkt-modal-close" onClick={onCloseModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateCampaign}>
              <div className="mkt-modal-body">
                <div className="mkt-form-group">
                  <label>Campaign Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q4 Product Release Growth Sprint"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="mkt-form-group">
                  <label>Primary Channel</label>
                  <select value={channel} onChange={(e) => setChannel(e.target.value)}>
                    <option value="Google Ads">Google Ads (Paid Search)</option>
                    <option value="LinkedIn">LinkedIn Sponsored Content</option>
                    <option value="Organic SEO">Organic Content & SEO</option>
                    <option value="Meta Ads">Meta Ads (Facebook & IG)</option>
                    <option value="Email">Email Marketing Automation</option>
                    <option value="Webinar">Webinar & Virtual Event</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mkt-form-group">
                    <label>Budget Allocation (PKR / Rs.)</label>
                    <input
                      type="number"
                      required
                      placeholder="10000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>

                  <div className="mkt-form-group">
                    <label>Launch Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mkt-modal-footer">
                <button type="button" className="mkt-btn-secondary" onClick={onCloseModal}>Cancel</button>
                <button type="submit" className="mkt-btn-primary">Launch Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
