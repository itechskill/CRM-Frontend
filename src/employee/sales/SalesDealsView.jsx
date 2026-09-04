import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { Plus, Search, DollarSign, TrendingUp, CheckCircle, Edit2, X, Save, FileText, ArrowRight } from 'lucide-react';
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

const EMPTY_DEAL = {
  title: '',
  clientName: '',
  value: '',
  stage: 'Qualification',
  probability: 50,
  closingDate: ''
};

export default function SalesDealsView({ onNavigateInvoices }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [form, setForm] = useState(EMPTY_DEAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Invoice creation modal from won deal
  const [invoiceModalDeal, setInvoiceModalDeal] = useState(null);
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [invoiceMsg, setInvoiceMsg] = useState({ type: '', text: '' });

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
    setForm({
      title: deal.title || '',
      clientName: deal.clientName || '',
      value: deal.value || '',
      stage: deal.stage || 'Qualification',
      probability: deal.probability !== undefined ? deal.probability : 50,
      closingDate: deal.closingDate ? new Date(deal.closingDate).toISOString().split('T')[0] : ''
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
      const payload = {
        ...form,
        value: Number(form.value) || 0,
        probability: Number(form.probability) || 50,
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
      setError('Server error saving deal.');
    } finally {
      setSaving(false);
    }
  };

  const openInvoiceModal = (deal) => {
    setInvoiceModalDeal(deal);
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setInvoiceDueDate(in30Days);
    setInvoiceDescription(`Invoice for completed deal: ${deal.title}`);
    setInvoiceMsg({ type: '', text: '' });
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceModalDeal) return;
    setInvoiceSaving(true);
    setInvoiceMsg({ type: '', text: '' });
    try {
      const payload = {
        clientName: invoiceModalDeal.clientName,
        dealId: invoiceModalDeal._id,
        dealTitle: invoiceModalDeal.title,
        amount: Number(invoiceModalDeal.value) || 0,
        dueDate: invoiceDueDate,
        description: invoiceDescription,
        status: 'Pending Review'
      };
      const { response, data } = await apiRequest('/api/sales-employee/invoices', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (response.ok && data.success) {
        setInvoiceMsg({ type: 'success', text: `Invoice generated & submitted to Sales Manager for review.` });
        setTimeout(() => {
          setInvoiceModalDeal(null);
          if (onNavigateInvoices) onNavigateInvoices();
        }, 1500);
      } else {
        setInvoiceMsg({ type: 'error', text: data.message || 'Failed to generate invoice.' });
      }
    } catch (e) {
      setInvoiceMsg({ type: 'error', text: 'Server error generating invoice.' });
    } finally {
      setInvoiceSaving(false);
    }
  };

  const stagesList = ['all', 'Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Closed Lost'];

  const totalDealsValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const wonDeals = deals.filter(d => ['Won', 'Closed Won'].includes(d.stage));
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="sv-container">
      {/* Header */}
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><TrendingUp size={20} color="#2563EB" /> Deals Pipeline & Won Transactions</h2>
          <p className="sv-subtitle">Manage your personal sales deals from prospecting to won transactions and invoice generation</p>
        </div>
        <button className="sv-btn-primary" onClick={openCreate}><Plus size={16} /> New Deal</button>
      </div>

      {/* Stats Cards */}
      <div className="sv-grid-3">
        <div className="sv-target-card" style={{ borderLeft: '4px solid #2563EB' }}>
          <span className="sv-ts-label">Total Deals in Pipeline</span>
          <span className="sv-ts-value">{deals.length}</span>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Value: ${totalDealsValue.toLocaleString()}</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #10B981' }}>
          <span className="sv-ts-label">Won Transactions</span>
          <span className="sv-ts-value" style={{ color: '#059669' }}>{wonDeals.length}</span>
          <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>Won Revenue: ${wonValue.toLocaleString()}</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #8B5CF6' }}>
          <span className="sv-ts-label">Eligible for Invoicing</span>
          <span className="sv-ts-value">{wonDeals.length} Won Deals</span>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Click "Generate Invoice" below</span>
        </div>
      </div>

      {/* Filters */}
      <div className="sv-filters">
        <div className="sv-search-box">
          <Search size={15} />
          <input placeholder="Search deals by title or client..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="sv-status-tabs">
          {stagesList.map(s => (
            <button key={s} className={`sv-tab ${stageFilter === s ? 'active' : ''}`} onClick={() => setStageFilter(s)}>
              {s === 'all' ? 'All Stages' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Deals Table */}
      {loading ? (
        <div className="sv-loading">Loading sales deals from MongoDB...</div>
      ) : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Deal Title</th>
                <th>Client Name</th>
                <th>Deal Value</th>
                <th>Stage</th>
                <th>Win Probability</th>
                <th>Closing Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="sv-empty">No deals found. Create a new deal to start tracking!</td>
                </tr>
              ) : (
                deals.map(deal => {
                  const style = STAGE_COLORS[deal.stage] || { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
                  const isWon = ['Won', 'Closed Won'].includes(deal.stage);
                  return (
                    <tr key={deal._id}>
                      <td className="sv-name">{deal.title}</td>
                      <td>{deal.clientName}</td>
                      <td className="sv-amount">${Number(deal.value || 0).toLocaleString()}</td>
                      <td>
                        <span className="sv-badge" style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                          {deal.stage}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${deal.probability || 0}%`, height: '100%', background: isWon ? '#10B981' : '#2563EB' }} />
                          </div>
                          <span>{deal.probability || 0}%</span>
                        </div>
                      </td>
                      <td>{deal.closingDate ? new Date(deal.closingDate).toLocaleDateString() : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button className="sv-edit-btn" onClick={() => openEdit(deal)} title="Edit Deal">
                            <Edit2 size={14} />
                          </button>
                          {isWon && (
                            <button
                              onClick={() => openInvoiceModal(deal)}
                              className="sv-btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#059669' }}
                              title="Create Invoice for this Won Deal"
                            >
                              <FileText size={13} /> Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Deal Create / Edit Modal */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3>{editDeal ? 'Edit Sales Deal' : 'New Sales Deal'}</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="sv-error">{error}</div>}
            <form onSubmit={handleSaveDeal} className="sv-form">
              <div className="sv-field">
                <label>Deal Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Enterprise Cloud License"
                  required
                />
              </div>
              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Client Name *</label>
                  <input
                    value={form.clientName}
                    onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))}
                    placeholder="Company or contact name"
                    required
                  />
                </div>
                <div className="sv-field">
                  <label>Deal Value ($) *</label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                    placeholder="e.g. 50000"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="sv-grid-3">
                <div className="sv-field">
                  <label>Stage</label>
                  <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}>
                    {['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Closed Lost'].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="sv-field">
                  <label>Probability (%)</label>
                  <input
                    type="number"
                    value={form.probability}
                    onChange={e => setForm(p => ({ ...p, probability: e.target.value }))}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="sv-field">
                  <label>Expected Closing Date</label>
                  <input
                    type="date"
                    value={form.closingDate}
                    onChange={e => setForm(p => ({ ...p, closingDate: e.target.value }))}
                  />
                </div>
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

      {/* Generate Invoice Modal for Won Deal */}
      {invoiceModalDeal && (
        <div className="sv-modal-overlay" onClick={() => setInvoiceModalDeal(null)}>
          <div className="sv-modal" onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3><FileText size={18} color="#059669" /> Generate Invoice for Won Deal</h3>
              <button onClick={() => setInvoiceModalDeal(null)}><X size={18} /></button>
            </div>
            {invoiceMsg.text && (
              <div className={invoiceMsg.type === 'success' ? 'sv-target-card' : 'sv-error'} style={invoiceMsg.type === 'success' ? { background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '12px' } : {}}>
                {invoiceMsg.text}
              </div>
            )}
            <form onSubmit={handleGenerateInvoice} className="sv-form">
              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Client</label>
                  <input value={invoiceModalDeal.clientName} disabled style={{ background: '#F1F5F9' }} />
                </div>
                <div className="sv-field">
                  <label>Deal Amount ($)</label>
                  <input value={`$${Number(invoiceModalDeal.value || 0).toLocaleString()}`} disabled style={{ background: '#F1F5F9', fontWeight: 'bold' }} />
                </div>
              </div>
              <div className="sv-field">
                <label>Payment Due Date *</label>
                <input
                  type="date"
                  value={invoiceDueDate}
                  onChange={e => setInvoiceDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="sv-field">
                <label>Invoice Description / Terms</label>
                <textarea
                  rows={3}
                  value={invoiceDescription}
                  onChange={e => setInvoiceDescription(e.target.value)}
                  placeholder="Terms, payment methods, delivery details..."
                />
              </div>
              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setInvoiceModalDeal(null)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" style={{ background: '#059669' }} disabled={invoiceSaving}>
                  <CheckCircle size={15} /> {invoiceSaving ? 'Creating...' : 'Issue Invoice to Finance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
