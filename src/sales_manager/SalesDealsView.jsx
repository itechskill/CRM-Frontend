import React, { useState } from 'react';
import { Plus, MoreHorizontal, DollarSign, User, Calendar, CheckCircle } from 'lucide-react';
import './SalesDealsView.css';

const initialPipeline = {
  qualification: [
    { id: 'd1', title: 'Healthcare ERP Modernization', client: 'Zenith Health', value: '$210,000', rep: 'Sarah Mitchell', date: 'Sep 15' },
    { id: 'd2', title: 'E-commerce API Integration', client: 'RetailPlus', value: '$85,000', rep: 'David Miller', date: 'Oct 02' }
  ],
  proposal: [
    { id: 'd3', title: 'Enterprise Cloud Migration', client: 'Acme Corp', value: '$180,000', rep: 'Aisha Nkosi', date: 'Aug 28' },
    { id: 'd4', title: 'Data Warehouse Scale', client: 'Starlight Tech', value: '$340,000', rep: 'Sarah Mitchell', date: 'Sep 10' }
  ],
  negotiation: [
    { id: 'd5', title: 'AI Analytics Platform', client: 'Proxima Labs', value: '$290,000', rep: 'Elena Rostova', date: 'Aug 24' }
  ],
  closed_won: [
    { id: 'd6', title: 'Security Audit & Compliance', client: 'BuildCo Group', value: '$135,000', rep: 'Aisha Nkosi', date: 'Aug 14' },
    { id: 'd7', title: 'Global Operations Portal', client: 'Nexus Logistics', value: '$195,000', rep: 'David Miller', date: 'Aug 10' }
  ]
};

export default function SalesDealsView() {
  const [pipeline, setPipeline] = useState(initialPipeline);

  return (
    <div className="sales-sm-deals-view">
      {/* Deals Header Stats */}
      <div className="deals-top-bar">
        <div className="deals-stat">
          <span className="stat-label">Total Active Pipeline</span>
          <span className="stat-val">$1,435,000</span>
        </div>
        <div className="deals-stat">
          <span className="stat-label">Weighted Forecast</span>
          <span className="stat-val">$980,000</span>
        </div>
        <div className="deals-stat">
          <span className="stat-label">Average Deal Size</span>
          <span className="stat-val">$205,000</span>
        </div>
        <button className="new-deal-btn">
          <Plus size={16} />
          <span>New Deal</span>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {/* Column 1: Qualification */}
        <div className="kanban-col">
          <div className="col-header qualification">
            <span className="col-title">1. Qualification</span>
            <span className="col-count">{pipeline.qualification.length}</span>
          </div>
          <div className="col-cards">
            {pipeline.qualification.map((deal) => (
              <div key={deal.id} className="kanban-card">
                <div className="card-top">
                  <span className="card-client">{deal.client}</span>
                  <MoreHorizontal size={14} className="card-opt" />
                </div>
                <h4 className="card-title">{deal.title}</h4>
                <div className="card-val">{deal.value}</div>
                <div className="card-meta">
                  <span className="card-rep"><User size={12} /> {deal.rep}</span>
                  <span className="card-date"><Calendar size={12} /> {deal.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Proposal */}
        <div className="kanban-col">
          <div className="col-header proposal">
            <span className="col-title">2. Proposal Sent</span>
            <span className="col-count">{pipeline.proposal.length}</span>
          </div>
          <div className="col-cards">
            {pipeline.proposal.map((deal) => (
              <div key={deal.id} className="kanban-card">
                <div className="card-top">
                  <span className="card-client">{deal.client}</span>
                  <MoreHorizontal size={14} className="card-opt" />
                </div>
                <h4 className="card-title">{deal.title}</h4>
                <div className="card-val">{deal.value}</div>
                <div className="card-meta">
                  <span className="card-rep"><User size={12} /> {deal.rep}</span>
                  <span className="card-date"><Calendar size={12} /> {deal.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Negotiation */}
        <div className="kanban-col">
          <div className="col-header negotiation">
            <span className="col-title">3. Negotiation</span>
            <span className="col-count">{pipeline.negotiation.length}</span>
          </div>
          <div className="col-cards">
            {pipeline.negotiation.map((deal) => (
              <div key={deal.id} className="kanban-card highlighted">
                <div className="card-top">
                  <span className="card-client">{deal.client}</span>
                  <MoreHorizontal size={14} className="card-opt" />
                </div>
                <h4 className="card-title">{deal.title}</h4>
                <div className="card-val">{deal.value}</div>
                <div className="card-meta">
                  <span className="card-rep"><User size={12} /> {deal.rep}</span>
                  <span className="card-date"><Calendar size={12} /> {deal.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 4: Closed Won */}
        <div className="kanban-col">
          <div className="col-header won">
            <span className="col-title">4. Closed Won</span>
            <span className="col-count">{pipeline.closed_won.length}</span>
          </div>
          <div className="col-cards">
            {pipeline.closed_won.map((deal) => (
              <div key={deal.id} className="kanban-card won-card">
                <div className="card-top">
                  <span className="card-client">{deal.client}</span>
                  <CheckCircle size={14} className="won-icon" />
                </div>
                <h4 className="card-title">{deal.title}</h4>
                <div className="card-val">{deal.value}</div>
                <div className="card-meta">
                  <span className="card-rep"><User size={12} /> {deal.rep}</span>
                  <span className="card-date"><Calendar size={12} /> {deal.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
