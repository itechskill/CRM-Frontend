import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import {
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Edit2,
  X,
  Save,
  FileText,
  Eye,
  Trash2,
  Calendar,
  Target,
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  List,
  Building,
  User,
  ArrowUpRight
} from 'lucide-react';
import './SalesViews.css';

const STAGE_COLORS = {
  Prospecting: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  Qualification: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  Proposal: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  Negotiation: { bg: '#FEF3C7', color: '#B45309', border: '#FCD34D' },
  Won: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  'Closed Won': { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  'Closed Lost': { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' }
};

const getStageProbability = (stg) => {
  switch (stg) {
    case 'Prospecting': return 20;
    case 'Qualification': return 40;
    case 'Proposal': return 60;
    case 'Negotiation': return 80;
    case 'Won':
    case 'Closed Won': return 100;
    case 'Closed Lost': return 0;
    default: return 50;
  }
};

const EMPTY_DEAL = {
  title: '',
  clientName: '',
  company: '',
  contactPerson: '',
  value: '',
  stage: 'Qualification',
  probability: 40,
  closingDate: '',
  requirements: '',
  notes: ''
};

export default function SalesDealsView({ onNavigateInvoices, onNavigateQuotations }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' (default) | 'pipeline'
  const [showModal, setShowModal] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [form, setForm] = useState(EMPTY_DEAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [viewDeal, setViewDeal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [creatingQuote, setCreatingQuote] = useState(false);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stageFilter !== 'all') params.set('stage', stageFilter);
      if (search) params.set('search', search);
      const { response, data } = await apiRequest(`/api/sales-employee/deals?${params}`);
      if (response.ok && data.success) {
        setDeals(data.data);
      }
    } catch (e) {
      console.error('Fetch deals error:', e);
    } finally {
      setLoading(false);
    }
  }, [stageFilter, search]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const openCreate = () => {
    setForm(EMPTY_DEAL);
    setEditDeal(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (deal) => {
    const isWon = ['Won', 'Closed Won'].includes(deal.stage);
    setForm({
      title: deal.title || '',
      clientName: deal.clientName || '',
      company: deal.company || '',
      contactPerson: deal.contactPerson || '',
      value: deal.value || '',
      stage: deal.stage || 'Qualification',
      probability: isWon ? 100 : (deal.probability !== undefined ? deal.probability : getStageProbability(deal.stage)),
      closingDate: deal.closingDate ? new Date(deal.closingDate).toISOString().split('T')[0] : '',
      requirements: deal.requirements || '',
      notes: deal.notes || ''
    });
    setEditDeal(deal);
    setError('');
    setShowModal(true);
  };

  const handleSaveDeal = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.clientName.trim()) {
      setError('Title and Client Name are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const isWon = ['Won', 'Closed Won'].includes(form.stage);
      const finalProb = isWon ? 100 : (form.stage === 'Closed Lost' ? 0 : Number(form.probability));
      const payload = {
        ...form,
        value: form.value ? Number(form.value) : 0,
        probability: finalProb,
        closingDate: form.closingDate || null
      };
      const url = editDeal ? `/api/sales-employee/deals/${editDeal._id}` : '/api/sales-employee/deals';
      const method = editDeal ? 'PATCH' : 'POST';
      const { response, data } = await apiRequest(url, { method, body: JSON.stringify(payload) });
      if (response.ok && data.success) {
        setShowModal(false);
        fetchDeals();
      } else {
        setError(data.message || 'Failed to save deal.');
      }
    } catch (e) {
      setError('Server error.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateQuotation = async (deal) => {
    setCreatingQuote(true);
    try {
      const quotePayload = {
        clientName: deal.clientName,
        dealId: deal._id,
        productSummary: deal.requirements || deal.title || 'Quotation per Customer Requirement',
        totalAmount: deal.value ? Number(deal.value) : 0,
        netAmount: deal.value ? Number(deal.value) : 0,
        status: 'Draft',
        notes: `Created from Deal: ${deal.title}. ${deal.notes || ''}`
      };
      const { response, data } = await apiRequest('/api/sales-employee/quotations', {
        method: 'POST',
        body: JSON.stringify(quotePayload)
      });
      if (response.ok && data.success) {
        // Update deal stage to Proposal
        await apiRequest(`/api/sales-employee/deals/${deal._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ stage: 'Proposal', probability: 60 })
        });
        setFeedback(`Quotation "${data.data.orderReference || data.data.quotationNumber || 'created'}" generated from Deal!`);
        setViewDeal(null);
        fetchDeals();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        setFeedback(data.message || 'Failed to create quotation.');
      }
    } catch (e) {
      setFeedback('Error generating quotation.');
    } finally {
      setCreatingQuote(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/deals/${deleteTarget._id}`, { method: 'DELETE' });
      if (response.ok && data.success) {
        setFeedback(`Deal "${deleteTarget.title}" deleted.`);
        setDeleteTarget(null);
        fetchDeals();
        setTimeout(() => setFeedback(''), 3000);
      } else {
        setFeedback(data.message || 'Failed to delete deal.');
      }
    } catch (e) {
      setFeedback('Server error.');
    } finally {
      setDeleting(false);
    }
  };

  // Pipeline Metrics
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const wonDeals = deals.filter(d => ['Won', 'Closed Won'].includes(d.stage));
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const activePipeline = deals.filter(d => !['Won', 'Closed Won', 'Closed Lost'].includes(d.stage));
  const activeValue = activePipeline.reduce((sum, d) => sum + (d.value || 0), 0);
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;

  const stages = ['all', 'Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Closed Lost'];
  const pipelineStages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won'];

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><TrendingUp size={20} /> Deals & Requirements</h2>
          <p className="sv-subtitle">Manage customer requirements and move deals through the pipeline to Quotation</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Mode Switcher */}
          <div style={{
            display: 'inline-flex',
            background: '#F1F5F9',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid #E2E8F0'
          }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'table' ? '#2563EB' : '#64748B',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <List size={14} /> Data Table
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'pipeline' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'pipeline' ? '#2563EB' : '#64748B',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'pipeline' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <LayoutGrid size={14} /> Pipeline Board
            </button>
          </div>

          <button className="sv-btn-primary" onClick={openCreate}><Plus size={16} /> New Deal</button>
        </div>
      </div>

      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#059669" /> {feedback}
        </div>
      )}

      {/* ── PREMIUM KPI CARDS GRID ── */}
      <div className="deal-kpi-grid">
        <div className="deal-kpi-card active-pipeline">
          <div className="deal-kpi-icon active-pipeline">
            <TrendingUp size={22} />
          </div>
          <div className="deal-kpi-content">
            <div className="deal-kpi-label">Active Pipeline</div>
            <div className="deal-kpi-value">Rs. {activeValue.toLocaleString()}</div>
            <div className="deal-kpi-sub active-pipeline">
              <ArrowUpRight size={13} /> {activePipeline.length} Open Deals in Funnel
            </div>
          </div>
        </div>

        <div className="deal-kpi-card won-deals">
          <div className="deal-kpi-icon won-deals">
            <CheckCircle2 size={22} />
          </div>
          <div className="deal-kpi-content">
            <div className="deal-kpi-label">Won Deals Value</div>
            <div className="deal-kpi-value" style={{ color: '#059669' }}>Rs. {wonValue.toLocaleString()}</div>
            <div className="deal-kpi-sub won-deals">
              <CheckCircle size={13} /> {wonDeals.length} Won Deals (100% Won)
            </div>
          </div>
        </div>

        <div className="deal-kpi-card win-rate">
          <div className="deal-kpi-icon win-rate">
            <Target size={22} />
          </div>
          <div className="deal-kpi-content">
            <div className="deal-kpi-label">Win Conversion Rate</div>
            <div className="deal-kpi-value">{winRate}%</div>
            <div className="deal-kpi-sub win-rate">
              {wonDeals.length} won of {deals.length} total deals
            </div>
          </div>
        </div>

        <div className="deal-kpi-card total-pipeline">
          <div className="deal-kpi-icon total-pipeline">
            <DollarSign size={22} />
          </div>
          <div className="deal-kpi-content">
            <div className="deal-kpi-label">Total Pipeline Tracked</div>
            <div className="deal-kpi-value">Rs. {totalValue.toLocaleString()}</div>
            <div className="deal-kpi-sub total-pipeline">
              {deals.length} total requirements recorded
            </div>
          </div>
        </div>
      </div>

      <div className="sv-filters">
        <div className="sv-search-box">
          <Search size={15} />
          <input placeholder="Search deals, clients, requirements..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="sv-status-tabs">
          {stages.map(s => (
            <button key={s} className={`sv-tab ${stageFilter === s ? 'active' : ''}`} onClick={() => setStageFilter(s)}>
              {s === 'all' ? 'All Stages' : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="sv-loading">Loading deals...</div>
      ) : viewMode === 'pipeline' ? (
        /* ── PIPELINE KANBAN CARDS VIEW WITH WHITE BACKGROUND & ANIMATIONS ── */
        <div className="deals-pipeline-board">
          {(stageFilter === 'all' ? pipelineStages : [stageFilter]).map((stageName) => {
            const stageDeals = deals.filter(d => {
              if (stageName === 'Won') return ['Won', 'Closed Won'].includes(d.stage);
              return d.stage === stageName;
            });
            const stageTotal = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
            const colors = STAGE_COLORS[stageName] || { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };

            return (
              <div key={stageName} className="deals-stage-col" style={{ borderTop: `3px solid ${colors.color}` }}>
                <div className="deals-stage-header">
                  <div className="deals-stage-title-wrap">
                    <span
                      className="deals-stage-dot"
                      style={{ backgroundColor: colors.color }}
                    />
                    <span className="deals-stage-name">{stageName}</span>
                    <span className="deals-stage-count">{stageDeals.length}</span>
                  </div>
                  <span className="deals-stage-val">Rs. {stageTotal.toLocaleString()}</span>
                </div>

                <div className="deals-card-list">
                  {stageDeals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 10px', color: '#94A3B8', fontSize: '0.8rem' }}>
                      No deals in {stageName}
                    </div>
                  ) : (
                    stageDeals.map((d) => {
                      const isWon = ['Won', 'Closed Won'].includes(d.stage);
                      const prob = isWon ? 100 : (d.probability !== undefined ? d.probability : getStageProbability(d.stage));
                      const clientLabel = d.clientName || d.company || 'Client';
                      const clientInitial = clientLabel.charAt(0).toUpperCase() || 'C';

                      return (
                        <div
                          key={d._id}
                          className={`deals-card ${isWon ? 'is-won' : ''}`}
                          style={{ borderLeftColor: isWon ? '#10B981' : colors.color }}
                          onClick={() => setViewDeal(d)}
                        >
                          <div className="deals-card-header">
                            <h4 className="deals-card-title">{d.title}</h4>
                            {isWon ? (
                              <span className="deals-won-ribbon">
                                <CheckCircle2 size={11} /> Won
                              </span>
                            ) : (
                              <span
                                className="sv-badge"
                                style={{
                                  background: colors.bg,
                                  color: colors.color,
                                  border: `1px solid ${colors.border}`,
                                  fontSize: '0.7rem',
                                  padding: '2px 8px'
                                }}
                              >
                                {d.stage}
                              </span>
                            )}
                          </div>

                          <div className="deals-card-client">
                            <div className="deals-card-client-avatar">{clientInitial}</div>
                            <span>{clientLabel}</span>
                          </div>

                          <div className="deals-card-value-wrap">
                            <div className="deals-card-value">
                              Rs. {Number(d.value || 0).toLocaleString()}
                            </div>
                          </div>

                          {/* Probability Indicator */}
                          <div className="deals-card-prob-wrap">
                            <div className="deals-card-prob-header">
                              <span>Win Probability</span>
                              <span style={{ color: isWon ? '#059669' : colors.color, fontWeight: 700 }}>
                                {prob}%
                              </span>
                            </div>
                            <div className="deals-card-prob-bar">
                              <div
                                className="deals-card-prob-fill"
                                style={{
                                  width: `${prob}%`,
                                  background: isWon
                                    ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                                    : `linear-gradient(90deg, ${colors.border} 0%, ${colors.color} 100%)`
                                }}
                              />
                            </div>
                          </div>

                          <div className="deals-card-footer">
                            <div className="deals-card-date">
                              <Calendar size={12} color="#94A3B8" />
                              <span>
                                {d.closingDate ? new Date(d.closingDate).toLocaleDateString('en-GB') : 'Ongoing'}
                              </span>
                            </div>

                            <div className="deals-card-actions" onClick={e => e.stopPropagation()}>
                              <button
                                className="deals-btn-quote"
                                onClick={() => handleCreateQuotation(d)}
                                disabled={creatingQuote}
                                title="Generate Quotation from this Deal"
                              >
                                <FileText size={11} />
                                <span>Quote</span>
                              </button>
                              <button
                                className="sv-btn-action-icon"
                                onClick={() => openEdit(d)}
                                title="Edit Deal"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                className="sv-btn-action-icon"
                                onClick={() => setDeleteTarget(d)}
                                title="Delete Deal"
                                style={{ color: '#EF4444' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── DATA TABLE LIST VIEW ── */
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Deal Title</th>
                <th>Client / Company</th>
                <th>Value (PKR)</th>
                <th>Stage</th>
                <th>Probability</th>
                <th>Target Close</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.length === 0 ? (
                <tr><td colSpan={7} className="sv-empty">No deals found. Create a deal to start tracking customer requirements!</td></tr>
              ) : deals.map(d => {
                const colors = STAGE_COLORS[d.stage] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
                const isWon = ['Won', 'Closed Won'].includes(d.stage);
                const prob = isWon ? 100 : (d.probability !== undefined ? d.probability : getStageProbability(d.stage));

                return (
                  <tr key={d._id}>
                    <td className="sv-name" style={{ fontWeight: 700, color: '#1E293B' }}>{d.title}</td>
                    <td>{d.clientName || d.company || '—'}</td>
                    <td style={{ fontWeight: 800, color: '#059669' }}>
                      Rs. {Number(d.value || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className="sv-badge" style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                        {d.stage}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '45px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${prob}%`, height: '100%', background: isWon ? '#059669' : '#2563EB', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isWon ? '#059669' : '#1E293B' }}>{prob}%</span>
                      </div>
                    </td>
                    <td>{d.closingDate ? new Date(d.closingDate).toLocaleDateString('en-GB') : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          className="sv-btn-action-icon"
                          style={{ color: '#2563EB', background: '#EFF6FF' }}
                          onClick={() => handleCreateQuotation(d)}
                          disabled={creatingQuote}
                          title="Generate Quotation"
                        >
                          <ArrowRight size={14} />
                        </button>
                        <button className="sv-btn-action-icon" onClick={() => setViewDeal(d)} title="View Deal"><Eye size={14} /></button>
                        <button className="sv-btn-action-icon" onClick={() => openEdit(d)} title="Edit Deal"><Edit2 size={14} /></button>
                        <button className="sv-btn-action-icon" onClick={() => setDeleteTarget(d)} title="Delete Deal" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewDeal && (
        <div className="sv-modal-overlay" onClick={() => setViewDeal(null)}>
          <div className="sv-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="#2563EB" />
                <h3 style={{ margin: 0 }}>Deal: {viewDeal.title}</h3>
              </div>
              <button onClick={() => setViewDeal(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>{viewDeal.clientName}</div>
                  {viewDeal.company && <div style={{ fontSize: '0.85rem', color: '#64748B' }}>{viewDeal.company}</div>}
                </div>
                <span className="sv-badge" style={{ background: (STAGE_COLORS[viewDeal.stage]?.bg || '#F1F5F9'), color: (STAGE_COLORS[viewDeal.stage]?.color || '#475569'), border: `1px solid ${STAGE_COLORS[viewDeal.stage]?.border || '#E2E8F0'}`, fontSize: '0.85rem', padding: '4px 12px' }}>
                  {viewDeal.stage}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>Deal Value (PKR)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>Rs. {Number(viewDeal.value || 0).toLocaleString()}</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>Probability & Target Date</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                    {viewDeal.probability || 0}% | {viewDeal.closingDate ? new Date(viewDeal.closingDate).toLocaleDateString() : 'No date'}
                  </div>
                </div>
              </div>

              {viewDeal.requirements && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>Customer Requirements / Specifications</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>{viewDeal.requirements}</div>
                </div>
              )}

              {viewDeal.notes && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>{viewDeal.notes}</div>
                </div>
              )}

              <div className="sv-modal-actions" style={{ marginTop: '16px' }}>
                <button className="sv-btn-cancel" onClick={() => setViewDeal(null)}>Close</button>
                <button
                  className="sv-btn-primary"
                  style={{ background: '#2563EB' }}
                  onClick={() => handleCreateQuotation(viewDeal)}
                  disabled={creatingQuote}
                >
                  <ArrowRight size={14} /> {creatingQuote ? 'Generating...' : 'Create Quotation'}
                </button>
                <button className="sv-btn-primary" onClick={() => { setViewDeal(null); openEdit(viewDeal); }}>
                  <Edit2 size={14} /> Edit Deal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3>{editDeal ? 'Edit Deal' : 'New Deal'}</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="sv-error">{error}</div>}
            <form onSubmit={handleSaveDeal} className="sv-form">
              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Deal Title *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Annual Equipment Supply" required />
                </div>
                <div className="sv-field">
                  <label>Client / Customer Name *</label>
                  <input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Client name" required />
                </div>
              </div>

              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Company</label>
                  <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Company / Organization" />
                </div>
                <div className="sv-field">
                  <label>Contact Person</label>
                  <input value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} placeholder="Key contact" />
                </div>
              </div>

              <div className="sv-grid-3">
                <div className="sv-field">
                  <label>Deal Value (PKR)</label>
                  <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="0" />
                </div>
                <div className="sv-field">
                  <label>Stage</label>
                  <select
                    value={form.stage}
                    onChange={e => {
                      const newStage = e.target.value;
                      setForm(p => ({
                        ...p,
                        stage: newStage,
                        probability: getStageProbability(newStage)
                      }));
                    }}
                  >
                    {['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Closed Lost'].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="sv-field">
                  <label>Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.probability}
                    onChange={e => setForm(p => ({ ...p, probability: e.target.value }))}
                  />
                </div>
              </div>

              <div className="sv-field">
                <label>Target Closing Date</label>
                <input type="date" value={form.closingDate} onChange={e => setForm(p => ({ ...p, closingDate: e.target.value }))} />
              </div>

              <div className="sv-field">
                <label>Customer Requirements & Scope</label>
                <textarea rows={2} value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} placeholder="Product specifications, quantity, timeline requirements..." />
              </div>

              <div className="sv-field">
                <label>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal deal notes..." />
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className="sv-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="sv-modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={18} color="#EF4444" />
                <h3 style={{ margin: 0 }}>Delete Deal</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className="sv-form">
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 16px' }}>
                Are you sure you want to permanently delete deal <strong>{deleteTarget.title}</strong>?
              </p>
              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="sv-btn-primary" onClick={handleDelete} disabled={deleting} style={{ background: '#EF4444' }}>
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Deal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
