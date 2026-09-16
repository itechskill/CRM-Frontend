import React, { useState } from 'react';
import { FileText, Search, X, Clock, Plus, Trash2, Eye, Download } from 'lucide-react';
import './SalesProposalsView.css';

const statusStyles = {
  Draft: { bg: '#F1F5F9', color: '#475569' },
  Sent: { bg: '#DBEAFE', color: '#1D4ED8' },
  'Under Review': { bg: '#FEF3C7', color: '#B45309' },
  Approved: { bg: '#DCFCE7', color: '#15803D' },
  Rejected: { bg: '#FEE2E2', color: '#B91C1C' },
};

const filterTabs = ['All', 'Draft', 'Sent', 'Under Review', 'Approved', 'Rejected'];

const initialProposalsData = [];

function formatMoney(value) {
  return `PKR ${value.toLocaleString()}`;
}

function NewProposalModal({ isOpen, onClose, onAddProposal, nextNumber }) {
  const emptyLineItem = { name: '', qty: 1, amount: '' };

  const [form, setForm] = useState({
    client: '',
    contact: '',
    title: '',
    status: 'Draft',
    sentDate: '',
    expiry: '',
  });
  const [lineItems, setLineItems] = useState([{ ...emptyLineItem }]);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleFieldChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleLineItemChange = (index, field) => (e) => {
    const value = e.target.value;
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [...prev, { ...emptyLineItem }]);
  };

  const handleRemoveLineItem = (index) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const resetForm = () => {
    setForm({ client: '', contact: '', title: '', status: 'Draft', sentDate: '', expiry: '' });
    setLineItems([{ ...emptyLineItem }]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    ['client', 'contact', 'title'].forEach((field) => {
      if (!form[field] || !form[field].trim()) newErrors[field] = true;
    });

    const hasValidLineItem = lineItems.some(
      (item) => item.name.trim() && Number(item.amount) > 0
    );
    if (!hasValidLineItem) newErrors.lineItems = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const cleanedLineItems = lineItems
      .filter((item) => item.name.trim() && Number(item.amount) > 0)
      .map((item) => ({
        name: item.name.trim(),
        qty: Number(item.qty) || 1,
        amount: Number(item.amount),
      }));

    const totalValue = cleanedLineItems.reduce((sum, item) => sum + item.amount, 0);

    const newProposal = {
      id: Date.now(),
      number: nextNumber,
      client: form.client.trim(),
      contact: form.contact.trim(),
      value: totalValue,
      status: form.status,
      sentDate: form.sentDate || '—',
      expiry: form.expiry || '—',
      approvalNote: form.status === 'Draft' ? 'Not sent' : 'Awaiting Response',
      title: form.title.trim(),
      lineItems: cleanedLineItems,
    };

    onAddProposal(newProposal);
    resetForm();
    onClose();
  };

  return (
    <div className="proposal-modal-overlay">
      <div className="proposal-modal-content">
        <div className="proposal-modal-header">
          <h2>New Proposal</h2>
          <button className="proposal-modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form className="proposal-modal-form" onSubmit={handleSubmit}>
          <div className="proposal-modal-body">
            <div className="proposal-modal-form-grid">
              <div className="proposal-form-group">
                <label>Client Name</label>
                <input
                  type="text"
                  className={`proposal-form-input ${errors.client ? 'error' : ''}`}
                  placeholder="e.g. Pinnacle Group"
                  value={form.client}
                  onChange={handleFieldChange('client')}
                />
                {errors.client && <span className="proposal-form-error">Client name is required</span>}
              </div>

              <div className="proposal-form-group">
                <label>Contact Name</label>
                <input
                  type="text"
                  className={`proposal-form-input ${errors.contact ? 'error' : ''}`}
                  placeholder="e.g. Marcus Johnson"
                  value={form.contact}
                  onChange={handleFieldChange('contact')}
                />
                {errors.contact && <span className="proposal-form-error">Contact name is required</span>}
              </div>
            </div>

            <div className="proposal-form-group">
              <label>Proposal Title</label>
              <input
                type="text"
                className={`proposal-form-input ${errors.title ? 'error' : ''}`}
                placeholder="e.g. Enterprise Platform — 2-Year License"
                value={form.title}
                onChange={handleFieldChange('title')}
              />
              {errors.title && <span className="proposal-form-error">Proposal title is required</span>}
            </div>

            <div className="proposal-modal-form-grid">
              <div className="proposal-form-group">
                <label>Status</label>
                <select
                  className="proposal-form-input"
                  value={form.status}
                  onChange={handleFieldChange('status')}
                >
                  {filterTabs
                    .filter((tab) => tab !== 'All')
                    .map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                </select>
              </div>
              <div className="proposal-form-group">
                <label>Sent Date</label>
                <input
                  type="date"
                  className="proposal-form-input"
                  value={form.sentDate}
                  onChange={handleFieldChange('sentDate')}
                />
              </div>
            </div>

            <div className="proposal-form-group">
              <label>Expiry Date</label>
              <input
                type="date"
                className="proposal-form-input"
                value={form.expiry}
                onChange={handleFieldChange('expiry')}
              />
            </div>

            <div className="proposal-line-items-section">
              <div className="proposal-line-items-header">
                <label>Line Items</label>
                <button type="button" className="proposal-add-line-btn" onClick={handleAddLineItem}>
                  <Plus size={14} /> Add Line
                </button>
              </div>

              {errors.lineItems && (
                <span className="proposal-form-error">Add at least one line item with a name and amount</span>
              )}

              <div className="proposal-line-items-form-list">
                {lineItems.map((item, index) => (
                  <div key={index} className="proposal-line-item-row">
                    <input
                      type="text"
                      className="proposal-form-input"
                      placeholder="Item name"
                      value={item.name}
                      onChange={handleLineItemChange(index, 'name')}
                    />
                    <input
                      type="number"
                      className="proposal-form-input proposal-line-qty"
                      placeholder="Qty"
                      min="1"
                      value={item.qty}
                      onChange={handleLineItemChange(index, 'qty')}
                    />
                    <input
                      type="number"
                      className="proposal-form-input proposal-line-amount"
                      placeholder="Amount"
                      min="0"
                      value={item.amount}
                      onChange={handleLineItemChange(index, 'amount')}
                    />
                    <button
                      type="button"
                      className="proposal-remove-line-btn"
                      onClick={() => handleRemoveLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="proposal-modal-footer">
            <button type="button" className="proposal-btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SalesProposalsView() {
  const [proposalsData, setProposalsData] = useState(initialProposalsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(initialProposalsData[0].id);
  const [isNewProposalModalOpen, setIsNewProposalModalOpen] = useState(false);

  const totalPipeline = proposalsData.reduce((sum, p) => sum + p.value, 0);
  const approvedValue = proposalsData
    .filter((p) => p.status === 'Approved')
    .reduce((sum, p) => sum + p.value, 0);
  const pendingReviewCount = proposalsData.filter((p) => p.status === 'Under Review').length;
  const winRate = Math.round(
    (proposalsData.filter((p) => p.status === 'Approved').length /
      proposalsData.filter((p) => p.status !== 'Draft').length) *
      100
  );

  const filteredProposals = proposalsData.filter((p) => {
    const matchesFilter = activeFilter === 'All' || p.status === activeFilter;
    const matchesSearch =
      p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selectedProposal = proposalsData.find((p) => p.id === selectedId);

  const nextProposalNumber = `PRO-2024-${String(proposalsData.length + 41).padStart(4, '0')}`;

  const handleAddProposal = (newProposal) => {
    setProposalsData((prev) => [newProposal, ...prev]);
    setSelectedId(newProposal.id);
  };

  return (
    <div className="proposals-view">
      <div className="proposals-main">
        <div className="proposals-page-header">
          <div>
            <h1>Proposal Management</h1>
            <p>{proposalsData.length} proposals · {formatMoney(totalPipeline / 1000)}k total pipeline</p>
          </div>
          <button className="btn-primary" onClick={() => setIsNewProposalModalOpen(true)}>+ New Proposal</button>
        </div>

        <div className="proposals-stats-grid">
          <div className="stat-card">
            <span className="stat-value" style={{ color: '#2563EB' }}>
              ${(totalPipeline / 1000).toFixed(0)}k
            </span>
            <span className="stat-label">Total Pipeline</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: '#15803D' }}>
              ${(approvedValue / 1000).toFixed(0)}k
            </span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: '#D97706' }}>{pendingReviewCount}</span>
            <span className="stat-label">Pending Review</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: '#7C3AED' }}>{winRate}%</span>
            <span className="stat-label">Win Rate</span>
          </div>
        </div>

        <div className="proposals-toolbar">
          <div className="proposals-search-box">
            <Search size={16} className="proposals-search-icon" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="proposals-filter-row">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                className={`filter-pill ${activeFilter === tab ? 'filter-pill-active' : ''}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="proposals-table-container">
          <div className="proposals-table-header">
            <span>PROPOSAL #</span>
            <span>CLIENT</span>
            <span>VALUE</span>
            <span>STATUS</span>
            <span>SENT DATE</span>
            <span>EXPIRY</span>
            <span>APPROVAL</span>
          </div>

          <div className="proposals-table-body">
            {filteredProposals.map((p) => (
              <div
                key={p.id}
                className={`proposals-table-row ${selectedId === p.id ? 'proposals-table-row-active' : ''}`}
                onClick={() => setSelectedId(p.id)}
              >
                <div className="proposal-number-cell">
                  <FileText size={16} className="proposal-file-icon" />
                  <span>{p.number}</span>
                </div>

                <div className="proposal-client-cell">
                  <h4>{p.client}</h4>
                  <span>{p.contact}</span>
                </div>

                <div className="proposal-value-cell">{formatMoney(p.value)}</div>

                <div className="proposal-status-cell">
                  <span
                    className="status-badge"
                    style={{
                      background: statusStyles[p.status]?.bg,
                      color: statusStyles[p.status]?.color,
                    }}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="proposal-date-cell">{p.sentDate}</div>
                <div className="proposal-date-cell">{p.expiry}</div>
                <div className="proposal-approval-cell">{p.approvalNote}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Proposal Preview */}
      {selectedProposal && (
        <div className="proposal-preview-panel">
          <div className="preview-header">
            <span>PROPOSAL PREVIEW</span>
            <button className="preview-close-btn" onClick={() => setSelectedId(null)}>
              <X size={16} />
            </button>
          </div>

          <div className="preview-title-row">
            <span className="preview-file-icon"><FileText size={18} /></span>
            <div>
              <h3>{selectedProposal.number}</h3>
              <p>{selectedProposal.title}</p>
            </div>
          </div>

          <div
            className="preview-status-banner"
            style={{
              background: statusStyles[selectedProposal.status]?.bg,
              color: statusStyles[selectedProposal.status]?.color,
            }}
          >
            <Clock size={13} /> {selectedProposal.status}
          </div>

          <div className="preview-divider" />

          <div className="preview-section">
            <span className="preview-section-label">CLIENT</span>
            <h4>{selectedProposal.client}</h4>
            <p>{selectedProposal.contact}</p>
          </div>

          <div className="preview-total-box">
            <span className="preview-total-label">TOTAL VALUE</span>
            <span className="preview-total-value">{formatMoney(selectedProposal.value)}</span>
          </div>

          <div className="preview-section">
            <h4 className="preview-line-items-title">Line Items</h4>
            <div className="preview-line-items-list">
              {selectedProposal.lineItems.map((item, i) => (
                <div className="preview-line-item" key={i}>
                  <div>
                    <span className="line-item-name">{item.name}</span>
                    <span className="line-item-qty">Qty: {item.qty}</span>
                  </div>
                  <span className="line-item-amount">{formatMoney(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="preview-meta-row">
            <span className="preview-section-label">Sent Date</span>
            <span className="preview-meta-value">{selectedProposal.sentDate}</span>
          </div>
          <div className="preview-meta-row">
            <span className="preview-section-label">Expiry Date</span>
            <span className="preview-meta-value">{selectedProposal.expiry}</span>
          </div>

          <div className="preview-actions-row">
            <button className="preview-action-btn preview-action-secondary">
              <Eye size={15} /> Preview
            </button>
            <button className="preview-action-btn preview-action-primary">
              <Download size={15} /> Download PDF
            </button>
          </div>
        </div>
      )}

      <NewProposalModal
        isOpen={isNewProposalModalOpen}
        onClose={() => setIsNewProposalModalOpen(false)}
        onAddProposal={handleAddProposal}
        nextNumber={nextProposalNumber}
      />
    </div>
  );
}
