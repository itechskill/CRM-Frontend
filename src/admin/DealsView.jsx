import React, { useState } from 'react';
import { Search, Plus, Filter, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import './DealsView.css';

export default function DealsView({ deals, onOpenNewDealModal }) {
  const [filterTab, setFilterTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDeals = deals.filter(deal => {
    const matchesTab = filterTab === 'all' || deal.stage.toLowerCase() === filterTab;
    const matchesSearch = deal.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          deal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          deal.owner.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusClass = (stage) => {
    switch (stage.toLowerCase()) {
      case 'won': return 'status-tag won';
      case 'in progress':
      case 'negotiation': return 'status-tag progress';
      case 'proposal': return 'status-tag proposal';
      default: return 'status-tag lost';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>All Pipeline Deals</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Manage and track all active sales opportunities</p>
        </div>
        <button className="btn-primary" onClick={onOpenNewDealModal}>
          <Plus size={16} /> New Deal
        </button>
      </div>

      <div className="data-table-container">
        <div className="table-header-toolbar">
          <div className="table-tabs">
            {['all', 'won', 'in progress', 'proposal', 'lost'].map(tab => (
              <button 
                key={tab}
                className={`table-tab ${filterTab === tab ? 'active' : ''}`}
                onClick={() => setFilterTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="global-search" style={{ width: '220px' }}>
              <Search size={14} className="global-search-icon" />
              <input 
                type="text" 
                placeholder="Search deals..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="icon-btn" title="Filter options">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Deal Name</th>
              <th>Company</th>
              <th>Value</th>
              <th>Stage</th>
              <th>Deal Owner</th>
              <th>Target Close</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeals.length > 0 ? (
              filteredDeals.map(deal => (
                <tr key={deal.id}>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{deal.name}</td>
                  <td style={{ color: '#475569' }}>{deal.company}</td>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>${deal.value.toLocaleString()}</td>
                  <td>{deal.stage}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {deal.owner.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ fontSize: '0.85rem' }}>{deal.owner}</span>
                    </div>
                  </td>
                  <td style={{ color: '#64748B' }}>{deal.closeDate}</td>
                  <td>
                    <span className={getStatusClass(deal.stage)}>
                      {deal.stage}
                    </span>
                  </td>
                  <td>
                    <button className="icon-btn" style={{ width: '32px', height: '32px' }}>
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                  No deals found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
