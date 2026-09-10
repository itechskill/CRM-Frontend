import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { Plus, MoreHorizontal, DollarSign, User, Calendar, CheckCircle, X, AlertCircle } from 'lucide-react';
import './SalesDealsView.css';

export default function SalesDealsView() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form state for new deal
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState('Qualification');
  const [probability, setProbability] = useState(50);
  const [closingDate, setClosingDate] = useState('');

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/crm/deals');
      if (response.ok && data.success && Array.isArray(data.data)) {
        setDeals(data.data.map(d => ({
          ...d,
          id: d._id,
          client: d.clientName,
          valueFormatted: `Rs. ${(d.value || 0).toLocaleString()}`,
          date: d.closingDate ? new Date(d.closingDate).toLocaleDateString() : 'Dec 2026',
          rep: d.createdBy?.fullName || 'Sales Team'
        })));
      }
    } catch (err) {
      console.error('Fetch deals error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const moveDealStage = async (dealId, targetStage) => {
    setDeals(deals.map(d => d.id === dealId ? { ...d, stage: targetStage } : d));
    try {
      await apiRequest(`/api/crm/deals/${dealId}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage: targetStage })
      });
      fetchDeals();
    } catch (err) {
      console.error('Move deal stage error:', err);
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim() || !clientName.trim()) {
      setErrorMessage('Please fill in both Deal Title and Client Organization.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        clientName: clientName.trim(),
        value: value !== '' ? Number(value) : 0,
        stage: stage || 'Qualification',
        probability: Number(probability) || 50,
        closingDate: closingDate || null
      };

      const { response, data } = await apiRequest('/api/crm/deals', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok && data.success) {
        // Clear form
        setTitle('');
        setClientName('');
        setValue('');
        setProbability(50);
        setClosingDate('');
        setIsModalOpen(false);
        // Refresh deals list immediately from DB
        await fetchDeals();
      } else {
        setErrorMessage(data.message || 'Failed to create deal.');
      }
    } catch (err) {
      setErrorMessage('Server error submitting deal. Please check network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const qualificationDeals = deals.filter(d => ['Qualification', 'Prospecting'].includes(d.stage));
  const proposalDeals = deals.filter(d => d.stage === 'Proposal');
  const negotiationDeals = deals.filter(d => d.stage === 'Negotiation');
  const closedWonDeals = deals.filter(d => ['Closed Won', 'Won'].includes(d.stage));

  const totalPipelineValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const avgDealSize = deals.length > 0 ? Math.round(totalPipelineValue / deals.length) : 0;

  return (
    <div className="sales-sm-deals-view">
      {/* Deals Header Stats */}
      <div className="deals-top-bar">
        <div className="deals-stat">
          <span className="stat-label">Total Active Pipeline</span>
          <span className="stat-val">Rs. {totalPipelineValue.toLocaleString()}</span>
        </div>
        <div className="deals-stat">
          <span className="stat-label">Deals Won</span>
          <span className="stat-val">{closedWonDeals.length}</span>
        </div>
        <div className="deals-stat">
          <span className="stat-label">Average Deal Size</span>
          <span className="stat-val">Rs. {avgDealSize.toLocaleString()}</span>
        </div>
        <button className="new-deal-btn" onClick={() => { setIsModalOpen(true); setErrorMessage(''); }}>
          <Plus size={16} />
          <span>New Deal</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading deals pipeline...</div>
      ) : (
        /* Kanban Board */
        <div className="kanban-board">
          {/* Column 1: Qualification */}
          <div className="kanban-col">
            <div className="col-header qualification">
              <span className="col-title">1. Qualification</span>
              <span className="col-count">{qualificationDeals.length}</span>
            </div>
            <div className="col-cards">
              {qualificationDeals.map((deal) => (
                <div key={deal.id} className="kanban-card">
                  <div className="card-top">
                    <span className="card-client">{deal.client}</span>
                  </div>
                  <h4 className="card-title">{deal.title}</h4>
                  <div className="card-val">{deal.valueFormatted}</div>
                  <div className="card-meta">
                    <span className="card-rep"><User size={12} /> {deal.rep}</span>
                    <span className="card-date"><Calendar size={12} /> {deal.date}</span>
                  </div>
                  <button
                    style={{ marginTop: '8px', padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#2563EB', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => moveDealStage(deal.id, 'Proposal')}
                  >
                    Move to Proposal →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Proposal */}
          <div className="kanban-col">
            <div className="col-header proposal">
              <span className="col-title">2. Proposal</span>
              <span className="col-count">{proposalDeals.length}</span>
            </div>
            <div className="col-cards">
              {proposalDeals.map((deal) => (
                <div key={deal.id} className="kanban-card">
                  <div className="card-top">
                    <span className="card-client">{deal.client}</span>
                  </div>
                  <h4 className="card-title">{deal.title}</h4>
                  <div className="card-val">{deal.valueFormatted}</div>
                  <div className="card-meta">
                    <span className="card-rep"><User size={12} /> {deal.rep}</span>
                    <span className="card-date"><Calendar size={12} /> {deal.date}</span>
                  </div>
                  <button
                    style={{ marginTop: '8px', padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', backgroundColor: '#FAF5FF', color: '#9333EA', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => moveDealStage(deal.id, 'Negotiation')}
                  >
                    Move to Negotiation →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Negotiation */}
          <div className="kanban-col">
            <div className="col-header negotiation">
              <span className="col-title">3. Negotiation</span>
              <span className="col-count">{negotiationDeals.length}</span>
            </div>
            <div className="col-cards">
              {negotiationDeals.map((deal) => (
                <div key={deal.id} className="kanban-card">
                  <div className="card-top">
                    <span className="card-client">{deal.client}</span>
                  </div>
                  <h4 className="card-title">{deal.title}</h4>
                  <div className="card-val">{deal.valueFormatted}</div>
                  <div className="card-meta">
                    <span className="card-rep"><User size={12} /> {deal.rep}</span>
                    <span className="card-date"><Calendar size={12} /> {deal.date}</span>
                  </div>
                  <button
                    style={{ marginTop: '8px', padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', backgroundColor: '#F0FDF4', color: '#16A34A', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => moveDealStage(deal.id, 'Closed Won')}
                  >
                    Mark Closed Won 🎉
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: Closed Won */}
          <div className="kanban-col">
            <div className="col-header closed-won">
              <span className="col-title">4. Closed Won</span>
              <span className="col-count">{closedWonDeals.length}</span>
            </div>
            <div className="col-cards">
              {closedWonDeals.map((deal) => (
                <div key={deal.id} className="kanban-card won">
                  <div className="card-top">
                    <span className="card-client">{deal.client}</span>
                    <CheckCircle size={14} color="#16A34A" />
                  </div>
                  <h4 className="card-title">{deal.title}</h4>
                  <div className="card-val">{deal.valueFormatted}</div>
                  <div className="card-meta">
                    <span className="card-rep"><User size={12} /> {deal.rep}</span>
                    <span className="card-date"><Calendar size={12} /> {deal.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', width: '420px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Create New Deal</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDeal}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Deal Title *</label>
                <input
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Enterprise Software License"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Client Organization *</label>
                <input
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  placeholder="e.g. Acme Corporation"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Value (PKR / Rs.)</label>
                  <input
                    type="number"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    value={probability}
                    onChange={(e) => setProbability(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Initial Stage</label>
                  <select
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                  >
                    <option value="Qualification">Qualification</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed Won">Closed Won</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Closing Date</label>
                  <input
                    type="date"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                  />
                </div>
              </div>

              {errorMessage && (
                <div style={{ marginBottom: '14px', padding: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', background: '#2563EB', color: '#FFF', fontWeight: 600, cursor: 'pointer' }}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
