import React, { useState } from 'react';
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

const initialCampaigns = [
  { id: 'CMP-2026-01', name: 'Q3 Enterprise SaaS Launch', channel: 'Google Ads', budget: 20000, spend: 12400, leads: 412, ctr: '5.2%', roi: '380%', status: 'Active', startDate: '2026-08-01' },
  { id: 'CMP-2026-02', name: 'LinkedIn Executive Retargeting', channel: 'LinkedIn', budget: 15000, spend: 8200, leads: 264, ctr: '4.1%', roi: '290%', status: 'Active', startDate: '2026-08-05' },
  { id: 'CMP-2026-03', name: 'Summer Product Webinar Series', channel: 'Webinar', budget: 5000, spend: 3500, leads: 185, ctr: '6.8%', roi: '450%', status: 'Completed', startDate: '2026-07-15' },
  { id: 'CMP-2026-04', name: 'SEO & Content Funnel Boost', channel: 'Organic SEO', budget: 6000, spend: 4400, leads: 320, ctr: '3.9%', roi: '510%', status: 'Active', startDate: '2026-08-02' },
  { id: 'CMP-2026-05', name: 'Fall Tech Summit Sponsorship', channel: 'Event', budget: 12000, spend: 0, leads: 0, ctr: '0.0%', roi: '0%', status: 'Scheduled', startDate: '2026-09-10' },
  { id: 'CMP-2026-06', name: 'Meta Lookalike Prospecting', channel: 'Meta Ads', budget: 8000, spend: 3100, leads: 140, ctr: '2.8%', roi: '180%', status: 'Paused', startDate: '2026-08-10' },
];

export default function MarketingCampaignsView({ isModalOpen, onCloseModal }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('Google Ads');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');

  const handleCreateCampaign = (e) => {
    e.preventDefault();
    if (!name || !budget) return;

    const newCmp = {
      id: `CMP-2026-0${campaigns.length + 1}`,
      name,
      channel,
      budget: parseFloat(budget),
      spend: 0,
      leads: 0,
      ctr: '0.0%',
      roi: '0%',
      status: 'Active',
      startDate: startDate || new Date().toISOString().split('T')[0]
    };

    setCampaigns([newCmp, ...campaigns]);
    setName('');
    setBudget('');
    setStartDate('');
    if (onCloseModal) onCloseModal();
  };

  const filteredCampaigns = campaigns.filter(cmp => {
    const matchesFilter = activeFilter === 'All' || cmp.status.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch =
      cmp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmp.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmp.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
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
          <div className="mkt-kpi-value">${totalSpend.toLocaleString()}</div>
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
                <th>Budget ($)</th>
                <th>Spent ($)</th>
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
                  <td style={{ fontWeight: 600 }}>${cmp.budget.toLocaleString()}</td>
                  <td style={{ color: '#64748B' }}>${cmp.spend.toLocaleString()}</td>
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
                    <label>Budget Allocation ($)</label>
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
