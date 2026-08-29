import React, { useState } from 'react';
import { Search, Filter, Plus, Circle } from 'lucide-react';
import './SalesLeadsView.css';

const initialLeads = [
  { id: 1, name: 'Rachel Kim', email: 'rkim@futurepath.com', company: 'FuturePath Inc', source: 'Trade Show', priority: 'Medium', status: 'New', value: '$35,000', rep: 'Priya Sharma', repInitials: 'PS', repColor: '#10B981', date: '2024-12-05' },
  { id: 2, name: 'Tom Rivera', email: 'trviera@alphatech.io', company: 'AlphaTech Systems', source: 'Webinar', priority: 'Low', status: 'Contacted', value: '$28,000', rep: 'James Carter', repInitials: 'JC', repColor: '#8B5CF6', date: '2024-12-03' },
  { id: 3, name: 'Alex Freeman', email: 'afreeman@digitalhorizon.co', company: 'Digital Horizon', source: 'Trade Show', priority: 'Medium', status: 'Qualified', value: '$48,000', rep: 'Angela Torres', repInitials: 'AT', repColor: '#2563EB', date: '2024-12-02' },
  { id: 4, name: 'Sarah Mitchell', email: 'sarah.m@techcorp.io', company: 'TechCorp Solutions', source: 'LinkedIn', priority: 'High', status: 'Contacted', value: '$85,000', rep: 'James Carter', repInitials: 'JC', repColor: '#8B5CF6', date: '2024-12-01' },
  { id: 5, name: 'Emily Chen', email: 'emily@bluewave.com', company: 'BlueWave Analytics', source: 'Referral', priority: 'Medium', status: 'New', value: '$42,000', rep: 'James Carter', repInitials: 'JC', repColor: '#8B5CF6', date: '2024-11-30' },
  { id: 6, name: 'Lisa Wong', email: 'lisa@meridiancap.com', company: 'Meridian Capital', source: 'Website', priority: 'High', status: 'Qualified', value: '$95,000', rep: 'Angela Torres', repInitials: 'AT', repColor: '#2563EB', date: '2024-11-29' },
  { id: 7, name: 'David Park', email: 'david@nexusdyn.com', company: 'Nexus Dynamics', source: 'Trade Show', priority: 'High', status: 'Contacted', value: '$120,000', rep: 'Priya Sharma', repInitials: 'PS', repColor: '#10B981', date: '2024-11-28' },
  { id: 8, name: 'Jennifer Walsh', email: 'jwalsh@summitent.com', company: 'Summit Enterprises', source: 'Referral', priority: 'High', status: 'Qualified', value: '$145,000', rep: 'Angela Torres', repInitials: 'AT', repColor: '#2563EB', date: '2024-11-27' },
  { id: 9, name: 'Marcus Johnson', email: 'mjohnson@pinnacle.com', company: 'Pinnacle Group', source: 'LinkedIn', priority: 'High', status: 'Won', value: '$83,000', rep: 'Angela Torres', repInitials: 'AT', repColor: '#2563EB', date: '2024-11-25' },
  { id: 10, name: 'Natasha Brown', email: 'nbrown@cloudfirst.com', company: 'CloudFirst Solutions', source: 'Webinar', priority: 'Medium', status: 'Contacted', value: '$110,000', rep: 'Priya Sharma', repInitials: 'PS', repColor: '#10B981', date: '2024-11-24' },
  { id: 11, name: 'James Carter', email: 'jcarter2@techcorp.io', company: 'TechCorp Solutions', source: 'Website', priority: 'Low', status: 'New', value: '$22,000', rep: 'James Carter', repInitials: 'JC', repColor: '#8B5CF6', date: '2024-11-22' },
  { id: 12, name: 'Priya Sharma', email: 'psharma2@cloudfirst.com', company: 'CloudFirst Solutions', source: 'Referral', priority: 'High', status: 'New', value: '$67,000', rep: 'Priya Sharma', repInitials: 'PS', repColor: '#10B981', date: '2024-11-20' },
];

const priorityColors = {
  High: '#DC2626',
  Medium: '#D97706',
  Low: '#15803D',
};

const statusColors = {
  New: { bg: '#EFF6FF', color: '#1D4ED8' },
  Contacted: { bg: '#EFF6FF', color: '#2563EB' },
  Qualified: { bg: '#F5F3FF', color: '#7C3AED' },
  Won: { bg: '#F0FDF4', color: '#15803D' },
};

export default function SalesLeadsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [leadsList] = useState(initialLeads);

  const filteredLeads = leadsList.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.rep.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'All Priorities' || lead.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPipelineValue = leadsList.reduce((sum, l) => sum + Number(l.value.replace(/[^0-9]/g, '')), 0);
  const highPriorityCount = leadsList.filter((l) => l.priority === 'High').length;
  const dealsWonCount = leadsList.filter((l) => l.status === 'Won').length;
  const avgDealValue = Math.round(totalPipelineValue / leadsList.length);

  const formatK = (num) => `$${Math.round(num / 1000)}k`;

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
          <button className="btn-add-lead">
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
                        {lead.name.split(' ').map((n) => n[0]).join('')}
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
                  <td className="lead-value">{lead.value}</td>
                  <td>
                    <div className="lead-rep-cell">
                      <span className="lead-rep-avatar" style={{ backgroundColor: lead.repColor }}>
                        {lead.repInitials}
                      </span>
                      {lead.rep}
                    </div>
                  </td>
                  <td className="lead-date">{lead.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}