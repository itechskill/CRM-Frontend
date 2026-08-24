import React, { useState } from 'react';
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

const initialInvoices = [
  { id: 'INV-2026-089', client: 'Proxima Labs', clientEmail: 'e.vance@proxima.io', issueDate: '2026-08-18', dueDate: '2026-08-30', amount: 14500, tax: 1450, status: 'Paid', items: 'Platform Migration Service Phase 1' },
  { id: 'INV-2026-090', client: 'BuildCo Industries', clientEmail: 'r.okafor@buildco.com', issueDate: '2026-08-16', dueDate: '2026-09-02', amount: 22800, tax: 2280, status: 'Pending', items: 'ERP Module Integration & Testing' },
  { id: 'INV-2026-091', client: 'Starlight Ventures', clientEmail: 'd.miller@starlight.io', issueDate: '2026-08-01', dueDate: '2026-08-15', amount: 8400, tax: 840, status: 'Overdue', items: 'Security & Compliance Audit' },
  { id: 'INV-2026-092', client: 'Apex Software', clientEmail: 's.martinez@apex.io', issueDate: '2026-08-10', dueDate: '2026-08-24', amount: 19200, tax: 1920, status: 'Paid', items: 'Infrastructure Scaling Sprint' },
  { id: 'INV-2026-093', client: 'TechFlow Inc', clientEmail: 'm.chen@techflow.com', issueDate: '2026-08-08', dueDate: '2026-08-22', amount: 11600, tax: 1160, status: 'Paid', items: 'Analytics Dashboard Customization' },
  { id: 'INV-2026-094', client: 'CyberShield Systems', clientEmail: 'info@cybershield.io', issueDate: '2026-08-19', dueDate: '2026-09-10', amount: 34000, tax: 3400, status: 'Pending', items: 'Enterprise License Renewal 2026' },
  { id: 'INV-2026-095', client: 'Quantum Cloud Ltd', clientEmail: 'contact@quantum.io', issueDate: '2026-08-20', dueDate: '2026-09-15', amount: 7500, tax: 750, status: 'Draft', items: 'Cloud Maintenance Advisory' },
];

export default function AccountantInvoicesView({ isModalOpen, onCloseModal }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // New Invoice Form state
  const [newClient, setNewClient] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newItems, setNewItems] = useState('');

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!newClient || !newAmount) return;

    const amt = parseFloat(newAmount);
    const newInv = {
      id: `INV-2026-0${invoices.length + 90}`,
      client: newClient,
      clientEmail: newEmail || `${newClient.toLowerCase().replace(/\s+/g, '')}@client.com`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate || '2026-09-15',
      amount: amt,
      tax: amt * 0.1,
      status: 'Pending',
      items: newItems || 'Professional CRM Services'
    };

    setInvoices([newInv, ...invoices]);
    setNewClient('');
    setNewEmail('');
    setNewAmount('');
    setNewDueDate('');
    setNewItems('');
    if (onCloseModal) onCloseModal();
  };

  const handleMarkAsPaid = (id) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'Paid' } : inv));
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
          <div className="acc-kpi-value">${totalIssued.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">{invoices.length} Invoices generated</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Collected / Paid</span>
            <div className="acc-kpi-icon emerald"><CheckCircle size={18} /></div>
          </div>
          <div className="acc-kpi-value">${totalPaid.toLocaleString()}</div>
          <div className="acc-kpi-subtitle up">
            {Math.round((totalPaid / (totalIssued || 1)) * 100)}% payment collection rate
          </div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Pending Payment</span>
            <div className="acc-kpi-icon amber"><Clock size={18} /></div>
          </div>
          <div className="acc-kpi-value">${totalPending.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">
            {invoices.filter(i => i.status === 'Pending').length} pending invoices
          </div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Overdue Receivables</span>
            <div className="acc-kpi-icon red"><AlertTriangle size={18} /></div>
          </div>
          <div className="acc-kpi-value">${totalOverdue.toLocaleString()}</div>
          <div className="acc-kpi-subtitle down">
            Requires payment reminder
          </div>
        </div>
      </div>

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
                <th>Amount ($)</th>
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
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>${inv.amount.toLocaleString()}</td>
                  <td style={{ color: '#64748B' }}>${inv.tax.toLocaleString()}</td>
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
      {isModalOpen && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-content">
            <div className="acc-modal-header">
              <h3>Create New Invoice</h3>
              <button className="acc-modal-close" onClick={onCloseModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateInvoice}>
              <div className="acc-modal-body">
                <div className="acc-form-group">
                  <label>Client Name</label>
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
                    <label>Invoice Amount ($)</label>
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
                    <span>${(selectedInvoice.amount + selectedInvoice.tax).toLocaleString()}</span>
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
