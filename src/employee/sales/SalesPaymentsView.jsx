import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../../utils/api';
import {
  Plus,
  CreditCard,
  Edit2,
  Eye,
  Trash2,
  X,
  Save,
  Search,
  Calendar,
  User,
  DollarSign,
  FileText,
  CheckCircle2,
  Download,
  Receipt
} from 'lucide-react';
import './SalesViews.css';

const TYPE_COLORS = {
  Advance: '#3B82F6',
  Partial: '#F59E0B',
  Full: '#10B981',
  Pending: '#64748B'
};

const EMPTY_FORM = {
  paymentRefNumber: '',
  customerName: '',
  salesOrderId: '',
  salesOrderNumber: '',
  invoiceId: '',
  invoiceNumber: '',
  paymentDate: '',
  amount: 0,
  paymentType: 'Advance',
  paymentMethod: 'Bank Transfer',
  notes: ''
};

export default function SalesPaymentsView() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editPay, setEditPay] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [viewPay, setViewPay] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/payments');
      if (response.ok && data.success) {
        setPayments(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDependencies = useCallback(async () => {
    try {
      const [ordRes, invRes] = await Promise.all([
        apiRequest('/api/sales-employee/orders'),
        apiRequest('/api/sales-employee/invoices')
      ]);
      if (ordRes.response.ok && ordRes.data.success) setOrders(ordRes.data.data || []);
      if (invRes.response.ok && invRes.data.success) setInvoices(invRes.data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchDependencies();
  }, [fetchPayments, fetchDependencies]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesType = typeFilter === 'all' || p.paymentType === typeFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        (p.paymentRefNumber && p.paymentRefNumber.toLowerCase().includes(term)) ||
        (p.customerName && p.customerName.toLowerCase().includes(term)) ||
        (p.salesOrderNumber && p.salesOrderNumber.toLowerCase().includes(term)) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(term)) ||
        (p.paymentMethod && p.paymentMethod.toLowerCase().includes(term));
      return matchesType && matchesSearch;
    });
  }, [payments, typeFilter, searchTerm]);

  const openCreate = () => {
    const today = new Date().toISOString().substring(0, 10);
    const defaultRef = `PAY-${String(payments.length + 1).padStart(4, '0')}`;
    setForm({ ...EMPTY_FORM, paymentRefNumber: defaultRef, paymentDate: today });
    setEditPay(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setForm({
      paymentRefNumber: p.paymentRefNumber || '',
      customerName: p.customerName || '',
      salesOrderId: p.salesOrderId?._id || p.salesOrderId || '',
      salesOrderNumber: p.salesOrderNumber || '',
      invoiceId: p.invoiceId?._id || p.invoiceId || '',
      invoiceNumber: p.invoiceNumber || '',
      paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString().substring(0, 10) : '',
      amount: p.amount || 0,
      paymentType: p.paymentType || 'Advance',
      paymentMethod: p.paymentMethod || 'Bank Transfer',
      notes: p.notes || ''
    });
    setEditPay(p);
    setError('');
    setShowModal(true);
  };

  const handleOrderChange = (soId) => {
    const selected = orders.find(o => o._id === soId);
    if (selected) {
      setForm(prev => ({
        ...prev,
        salesOrderId: soId,
        salesOrderNumber: selected.orderReference || selected.orderNumber || '',
        customerName: prev.customerName || selected.clientName || selected.customerName || '',
        amount: prev.amount || selected.netAmount || selected.totalAmount || 0
      }));
    } else {
      setForm(prev => ({ ...prev, salesOrderId: '', salesOrderNumber: '' }));
    }
  };

  const handleInvoiceChange = (invId) => {
    const selected = invoices.find(i => i._id === invId);
    if (selected) {
      setForm(prev => ({
        ...prev,
        invoiceId: invId,
        invoiceNumber: selected.invoiceNumber || '',
        customerName: prev.customerName || selected.clientName || '',
        amount: prev.amount || selected.outstandingAmount || selected.amount || 0
      }));
    } else {
      setForm(prev => ({ ...prev, invoiceId: '', invoiceNumber: '' }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!Number(form.amount) || Number(form.amount) <= 0) {
      setError('Valid payment amount in PKR is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        salesOrderId: form.salesOrderId || null,
        invoiceId: form.invoiceId || null,
        paymentDate: form.paymentDate || null
      };

      const url = editPay ? `/api/sales-employee/payments/${editPay._id}` : '/api/sales-employee/payments';
      const method = editPay ? 'PATCH' : 'POST';
      const { response, data } = await apiRequest(url, { method, body: JSON.stringify(payload) });

      if (response.ok && data.success) {
        setShowModal(false);
        setFeedback(editPay ? 'Payment record updated successfully.' : 'Payment recorded successfully.');
        setTimeout(() => setFeedback(''), 3500);
        fetchPayments();
      } else {
        setError(data.message || 'Server error recording payment.');
      }
    } catch (e) {
      setError('Network error recording payment.');
    } finally {
      setSaving(false);
    }
  };

  // ── INDIVIDUAL PAYMENT RECEIPT / SLIP PDF ──
  const handleDownloadPaymentSlip = (payment) => {
    const doc = new jsPDF();
    const ref = payment.paymentRefNumber || 'REC-DOC';
    const customer = payment.customerName || 'Valued Customer';
    const dateStr = payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const amount = Number(payment.amount || 0);

    // Green receipt header
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('Fortline CRM - Official Payment Slip', 14, 20);

    doc.setFontSize(10);
    doc.text(`Receipt Ref: ${ref}`, 140, 15);
    doc.text(`Date: ${dateStr}`, 140, 23);

    // Receipt details card
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text('Received From:', 14, 45);
    doc.setFontSize(13);
    doc.text(customer, 14, 53);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Sales Order #: ${payment.salesOrderNumber || '—'}`, 14, 62);
    doc.text(`Invoice Reference #: ${payment.invoiceNumber || '—'}`, 14, 68);
    doc.text(`Payment Method: ${payment.paymentMethod || 'Bank Transfer'}`, 120, 53);
    doc.text(`Payment Type: ${payment.paymentType || 'Full'} Payment`, 120, 60);

    // Amount Table
    const tableData = [
      ['Payment Reference', ref],
      ['Customer / Client', customer],
      ['Linked Sales Order', payment.salesOrderNumber || '—'],
      ['Linked Invoice', payment.invoiceNumber || '—'],
      ['Payment Method', payment.paymentMethod || 'Bank Transfer'],
      ['Payment Type', `${payment.paymentType || 'Full'} Payment`],
      ['Payment Date', dateStr],
      ['Amount Received (PKR)', `Rs. ${amount.toLocaleString()}`],
      ['Status', 'Confirmed / Verified']
    ];

    autoTable(doc, {
      startY: 78,
      head: [['Field', 'Transaction Details']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9.5, textColor: [15, 23, 42] }
    });

    const finalY = doc.lastAutoTable.finalY + 14;

    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105);
    doc.text(`Total Amount Collected: Rs. ${amount.toLocaleString()}`, 14, finalY);

    if (payment.notes) {
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Remarks / Transaction Details: ${payment.notes}`, 14, finalY + 8);
    }

    doc.save(`Payment_Slip_${ref}.pdf`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/payments/${deleteTarget._id}`, { method: 'DELETE' });
      if (response.ok && data.success) {
        setFeedback(`Payment record "${deleteTarget.paymentRefNumber}" deleted.`);
        setDeleteTarget(null);
        fetchPayments();
        setTimeout(() => setFeedback(''), 3000);
      } else {
        setFeedback(data.message || 'Failed to delete payment.');
      }
    } catch (e) {
      setFeedback('Server error.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="sv-container">
      {/* Header */}
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><CreditCard size={22} color="#059669" /> Customer Payments</h2>
          <p className="sv-subtitle">Record and verify Advance, Partial, and Full payments with downloadable payment slips</p>
        </div>
        <button className="sv-btn-primary" style={{ background: '#059669' }} onClick={openCreate}>
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#059669" /> {feedback}
        </div>
      )}

      {/* Filters */}
      <div className="sv-filters">
        <div className="sv-search-box">
          <Search size={16} />
          <input placeholder="Search Receipt #, Customer, SO #, Invoice #..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="sv-status-tabs">
          {['all', 'Advance', 'Partial', 'Full'].map(t => (
            <button key={t} className={`sv-tab ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All Payments' : `${t} Payments`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <div className="sv-loading">Loading payment records from database...</div> : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Receipt / Ref #</th>
                <th>Customer Name</th>
                <th>Sales Order Ref</th>
                <th>Invoice #</th>
                <th>Payment Date</th>
                <th>Amount (PKR)</th>
                <th>Type</th>
                <th>Method</th>
                <th style={{ textAlign: 'center' }}>Slip</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr><td colSpan={10} className="sv-empty">No payments recorded. Click "Record Payment" to log client collection!</td></tr>
              ) : filteredPayments.map(p => (
                <tr key={p._id}>
                  <td className="sv-name" style={{ fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>
                    {p.paymentRefNumber || '—'}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{p.customerName}</td>
                  <td>{p.salesOrderNumber || '—'}</td>
                  <td>{p.invoiceNumber || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#64748B' }}>
                    {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-GB') : (p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : '—')}
                  </td>
                  <td style={{ fontWeight: 800, color: '#059669', whiteSpace: 'nowrap' }}>
                    Rs. {Number(p.amount || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className="sv-badge" style={{ background: (TYPE_COLORS[p.paymentType] || '#64748B') + '22', color: TYPE_COLORS[p.paymentType] || '#64748B', border: `1px solid ${(TYPE_COLORS[p.paymentType] || '#64748B')}44` }}>
                      {p.paymentType || 'Full'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#475569' }}>{p.paymentMethod || 'Bank Transfer'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleDownloadPaymentSlip(p)}
                      className="sv-btn-action-icon"
                      title="Download Payment Slip (PDF)"
                      style={{ color: '#059669' }}
                    >
                      <Download size={14} />
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <button className="sv-btn-action-icon" onClick={() => setViewPay(p)} title="View Receipt Details"><Eye size={14} /></button>
                      <button className="sv-btn-action-icon" onClick={() => openEdit(p)} title="Edit Record"><Edit2 size={14} /></button>
                      <button className="sv-btn-action-icon" onClick={() => setDeleteTarget(p)} title="Delete Record" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewPay && (
        <div className="sv-modal-overlay" onClick={() => setViewPay(null)}>
          <div className="sv-modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} color="#059669" />
                <h3 style={{ margin: 0 }}>Payment Slip: {viewPay.paymentRefNumber}</h3>
              </div>
              <button onClick={() => setViewPay(null)}><X size={18} /></button>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{viewPay.customerName}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                    Date: {viewPay.paymentDate ? new Date(viewPay.paymentDate).toLocaleDateString('en-GB') : 'N/A'}
                  </div>
                </div>
                <span className="sv-badge" style={{ background: (TYPE_COLORS[viewPay.paymentType] || '#64748B') + '22', color: TYPE_COLORS[viewPay.paymentType] || '#64748B', border: `1px solid ${(TYPE_COLORS[viewPay.paymentType] || '#64748B')}44`, fontSize: '0.85rem', padding: '4px 12px' }}>
                  {viewPay.paymentType || 'Full'} Payment
                </span>
              </div>

              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Amount Received</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#065F46', marginTop: '4px' }}>Rs. {Number(viewPay.amount || 0).toLocaleString()}</div>
                <div style={{ fontSize: '0.82rem', color: '#047857', marginTop: '4px' }}>Payment Method: <strong>{viewPay.paymentMethod || 'Bank Transfer'}</strong></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Sales Order Ref</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>{viewPay.salesOrderNumber || 'None'}</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Invoice Ref</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>{viewPay.invoiceNumber || 'None'}</div>
                </div>
              </div>

              {viewPay.notes && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>Transaction Notes</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>{viewPay.notes}</div>
                </div>
              )}

              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setViewPay(null)}>Close</button>
                <button className="sv-btn-cancel" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => handleDownloadPaymentSlip(viewPay)}>
                  <Download size={14} color="#059669" /> Download Slip (PDF)
                </button>
                <button className="sv-btn-primary" onClick={() => { setViewPay(null); openEdit(viewPay); }}>
                  <Edit2 size={14} /> Edit Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL - FULLY ALIGNED */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  {editPay ? 'Edit Payment Record' : 'Record New Customer Payment'}
                </h3>
                <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                  Log customer advance, partial or full payment in PKR
                </p>
              </div>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {error && <div className="sv-error">{error}</div>}

            <form onSubmit={handleSave} className="sv-form">
              <div className="sv-form-section">
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Payment Receipt #</label>
                    <input value={form.paymentRefNumber} onChange={e => setForm(p => ({ ...p, paymentRefNumber: e.target.value }))} placeholder="Auto-generated" />
                  </div>
                  <div className="sv-field">
                    <label>Customer Name *</label>
                    <input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} placeholder="Customer name" required />
                  </div>
                </div>
              </div>

              <div className="sv-form-section">
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Link Sales Order</label>
                    <select value={form.salesOrderId} onChange={e => handleOrderChange(e.target.value)}>
                      <option value="">-- Select Sales Order --</option>
                      {orders.map(o => (
                        <option key={o._id} value={o._id}>
                          {o.orderReference || o.orderNumber} - {o.clientName} (Rs. {Number(o.netAmount || o.totalAmount || 0).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sv-field">
                    <label>Link Invoice</label>
                    <select value={form.invoiceId} onChange={e => handleInvoiceChange(e.target.value)}>
                      <option value="">-- Select Invoice --</option>
                      {invoices.map(i => (
                        <option key={i._id} value={i._id}>
                          {i.invoiceNumber} - {i.clientName} (Rs. {Number(i.amount || 0).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="sv-form-section">
                <div className="sv-grid-3">
                  <div className="sv-field">
                    <label>Amount (PKR) *</label>
                    <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" min="1" required />
                  </div>
                  <div className="sv-field">
                    <label>Payment Type</label>
                    <select value={form.paymentType} onChange={e => setForm(p => ({ ...p, paymentType: e.target.value }))}>
                      <option value="Advance">Advance Payment</option>
                      <option value="Partial">Partial Payment</option>
                      <option value="Full">Full Payment</option>
                    </select>
                  </div>
                  <div className="sv-field">
                    <label>Payment Method</label>
                    <select value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online">Online</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="sv-field">
                  <label>Payment Date</label>
                  <input type="date" value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} />
                </div>
              </div>

              <div className="sv-form-section">
                <div className="sv-field">
                  <label>Transaction Notes / Deposit Slip Reference</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Cheque number, bank deposit slip, etc." />
                </div>
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Payment'}
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
                <h3 style={{ margin: 0 }}>Delete Payment</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className="sv-form">
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 16px' }}>
                Are you sure you want to delete payment record <strong>{deleteTarget.paymentRefNumber}</strong> (Rs. {Number(deleteTarget.amount || 0).toLocaleString()})?
              </p>
              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="sv-btn-primary" onClick={handleDelete} disabled={deleting} style={{ background: '#EF4444' }}>
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
