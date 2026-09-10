import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Eye,
  Download,
  Filter,
  X
} from 'lucide-react';
import './AccountantViews.css';

export default function AccountantInvoicesView({ isModalOpen, onCloseModal }) {
  const [internalModal, setInternalModal] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [wonDeals, setWonDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // New Invoice Form state
  const [newClient, setNewClient] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newItems, setNewItems] = useState('');
  const [newDealId, setNewDealId] = useState('');
  const [newDealTitle, setNewDealTitle] = useState('');

  const fetchInvoiceData = async () => {
    setLoading(true);
    try {
      const [invRes, dealsRes] = await Promise.all([
        apiRequest('/api/finance/invoices'),
        apiRequest('/api/crm/deals')
      ]);

      if (invRes.response.ok && invRes.data.success && Array.isArray(invRes.data.data)) {
        setInvoices(invRes.data.data.map(i => ({
          ...i,
          id: i.invoiceNumber || i._id,
          rawId: i._id,
          client: i.clientName,
          clientEmail: `${i.clientName.toLowerCase().replace(/\s+/g, '')}@client.com`,
          issueDate: new Date(i.issueDate || i.createdAt).toISOString().split('T')[0],
          dueDate: i.dueDate ? new Date(i.dueDate).toISOString().split('T')[0] : '2026-09-30',
          amount: i.amount || 0,
          tax: (i.amount || 0) * 0.1,
          items: i.description || 'Professional CRM Services'
        })));
      }

      if (dealsRes.response.ok && dealsRes.data.success && Array.isArray(dealsRes.data.data)) {
        setWonDeals(dealsRes.data.data);
      }
    } catch (err) {
      console.error('Fetch invoices error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, []);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!newClient || !newAmount) return;

    const amt = parseFloat(newAmount);
    const { response, data } = await apiRequest('/api/finance/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientName: newClient.trim(),
        dealId: newDealId || null,
        dealTitle: newDealTitle || '',
        amount: amt,
        dueDate: newDueDate || '2026-09-30',
        description: newItems || 'Enterprise CRM Services',
        status: 'Draft'
      })
    });

    if (response.ok && data.success) {
      fetchInvoiceData();
      setNewClient('');
      setNewEmail('');
      setNewAmount('');
      setNewDueDate('');
      setNewItems('');
      setNewDealId('');
      setNewDealTitle('');
      setInternalModal(false);
      if (onCloseModal) onCloseModal();
    }
  };

  const handleMarkAsPaid = async (rawId) => {
    await apiRequest(`/api/finance/invoices/${rawId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Paid' })
    });
    fetchInvoiceData();
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesFilter =
      activeFilter === 'All' ||
      inv.status.toLowerCase() === activeFilter.toLowerCase();

    const matchesSearch =
      inv.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const totalIssued = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="acc-view-container">
      {/* Header Title */}
      <div className="acc-page-header">
        <div className="acc-page-header-title">
          <h2>Invoices & Receivables</h2>
          <p>Client invoices, billing history, payment tracking, and automated reminders.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="acc-kpi-grid">
        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Total Invoiced</span>
            <div className="acc-kpi-icon blue"><FileText size={18} /></div>
          </div>
          <div className="acc-kpi-value">Rs. {totalIssued.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">{invoices.length} Invoices generated</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Collected / Paid</span>
            <div className="acc-kpi-icon emerald"><CheckCircle size={18} /></div>
          </div>
          <div className="acc-kpi-value">Rs. {totalPaid.toLocaleString()}</div>
          <div className="acc-kpi-subtitle up">
            {Math.round((totalPaid / (totalIssued || 1)) * 100)}% payment collection rate
          </div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Pending Payment</span>
            <div className="acc-kpi-icon amber"><Clock size={18} /></div>
          </div>
          <div className="acc-kpi-value">Rs. {totalPending.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">
            {invoices.filter(i => i.status === 'Pending').length} pending invoices
          </div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Overdue Receivables</span>
            <div className="acc-kpi-icon red"><AlertTriangle size={18} /></div>
          </div>
          <div className="acc-kpi-value">Rs. {totalOverdue.toLocaleString()}</div>
          <div className="acc-kpi-subtitle down">
            Requires payment reminder
          </div>
        </div>
      </div>

      {/* Deals Ready for Invoice Section (Sales Handoff) */}
      {wonDeals.length > 0 && (
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} color="#16A34A" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#166534' }}>
                Deals Ready for Invoice ({wonDeals.length})
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 600 }}>Sales Handoff Pipeline</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {wonDeals.map(deal => (
              <div key={deal._id} style={{ background: '#FFFFFF', border: '1px solid #C6F6D5', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>{deal.clientName}</div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: ['Closed Won', 'Won'].includes(deal.stage) ? '#DCFCE7' : '#DBEAFE',
                      color: ['Closed Won', 'Won'].includes(deal.stage) ? '#15803D' : '#1E40AF'
                    }}>
                      {deal.stage || 'Qualification'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>{deal.title}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803D', marginTop: '6px' }}>
                    Rs. {(deal.value || 0).toLocaleString()}
                  </div>
                </div>
                <button
                  className="acc-btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '0.82rem' }}
                  onClick={() => {
                    setNewClient(deal.clientName || '');
                    setNewAmount(deal.value ? deal.value.toString() : '');
                    setNewItems(`Invoice for deal: ${deal.title}`);
                    setNewDealId(deal._id);
                    setNewDealTitle(deal.title || '');
                    setNewDueDate(new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]);
                    setInternalModal(true);
                  }}
                >
                  <Plus size={14} /> Create Invoice
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="acc-card">
        {/* Filter Controls Bar */}
        <div className="acc-filter-bar">
          <div className="acc-tabs">
            {['All', 'Paid', 'Pending', 'Overdue', 'Draft'].map(tab => (
              <button
                key={tab}
                className={`acc-tab-btn ${activeFilter === tab ? 'active' : ''}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="acc-search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by client or invoice ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="acc-table-wrapper">
          <table className="acc-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Client</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Amount (Rs.)</th>
                <th>Tax (10%)</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{inv.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1E293B' }}>{inv.client}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{inv.clientEmail}</div>
                  </td>
                  <td>{inv.issueDate}</td>
                  <td>{inv.dueDate}</td>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>Rs. {inv.amount.toLocaleString()}</td>
                  <td style={{ color: '#64748B' }}>Rs. {inv.tax.toLocaleString()}</td>
                  <td>
                    <span className={`acc-badge ${inv.status.toLowerCase()}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {inv.status !== 'Paid' && (
                        <button
                          className="acc-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#059669', borderColor: '#A7F3D0' }}
                          onClick={() => handleMarkAsPaid(inv.id)}
                          title="Mark as Paid"
                        >
                          <CheckCircle size={14} /> Paid
                        </button>
                      )}
                      <button
                        className="acc-btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        onClick={() => setSelectedInvoice(inv)}
                        title="View Invoice"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Invoice Modal */}
      {(isModalOpen || internalModal) && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-content">
            <div className="acc-modal-header">
              <h3>Create New Invoice</h3>
              <button className="acc-modal-close" onClick={() => { setInternalModal(false); if (onCloseModal) onCloseModal(); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateInvoice}>
              <div className="acc-modal-body">
                {wonDeals.length > 0 && (
                  <div className="acc-form-group">
                    <label>Select Won Deal (Optional Auto-Fill)</label>
                    <select
                      onChange={(e) => {
                        const deal = wonDeals.find(d => d._id === e.target.value);
                        if (deal) {
                          setNewClient(deal.clientName || '');
                          setNewAmount(deal.value ? deal.value.toString() : '');
                          setNewItems(`Invoice for deal: ${deal.title}`);
                        }
                      }}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    >
                      <option value="">-- Choose Won Deal --</option>
                      {wonDeals.map(d => (
                        <option key={d._id} value={d._id}>
                          {d.clientName} - {d.title} (Rs. {(d.value || 0).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="acc-form-group">
                  <label>Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Proxima Labs"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                  />
                </div>

                <div className="acc-form-group">
                  <label>Client Email</label>
                  <input
                    type="email"
                    placeholder="client@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="acc-form-group">
                    <label>Invoice Amount (Rs.)</label>
                    <input
                      type="number"
                      required
                      placeholder="15000"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                    />
                  </div>

                  <div className="acc-form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      required
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="acc-form-group">
                  <label>Line Items / Service Description</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. ERP Integration phase 1, Software License"
                    value={newItems}
                    onChange={(e) => setNewItems(e.target.value)}
                  />
                </div>
              </div>

              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={onCloseModal}>Cancel</button>
                <button type="submit" className="acc-btn-primary">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal / Preview */}
      {selectedInvoice && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-content">
            <div className="acc-modal-header">
              <h3>Invoice Details - {selectedInvoice.id}</h3>
              <button className="acc-modal-close" onClick={() => setSelectedInvoice(null)}><X size={18} /></button>
            </div>
            <div className="acc-modal-body">
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#0F172A', fontSize: '1.1rem' }}>{selectedInvoice.client}</h4>
                    <p style={{ margin: '2px 0 0 0', color: '#64748B', fontSize: '0.8rem' }}>{selectedInvoice.clientEmail}</p>
                  </div>
                  <span className={`acc-badge ${selectedInvoice.status.toLowerCase()}`}>
                    {selectedInvoice.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Issue Date:</strong> {selectedInvoice.issueDate}</div>
                  <div><strong>Due Date:</strong> {selectedInvoice.dueDate}</div>
                  <div><strong>Services:</strong> {selectedInvoice.items}</div>
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
                    <span>Total Payable:</span>
                    <span>Rs. {(selectedInvoice.amount + selectedInvoice.tax).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="acc-modal-footer">
              <button className="acc-btn-secondary" onClick={() => setSelectedInvoice(null)}>Close</button>
              <button className="acc-btn-primary" onClick={() => { alert(`Invoice ${selectedInvoice.id} sent to ${selectedInvoice.clientEmail}`); setSelectedInvoice(null); }}>
                <Send size={16} /> Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
