import React, { useState, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  X,
  Save,
  Calendar,
  User,
  FileText,
  Download,
  Building,
  Check,
  AlertCircle,
  Clock,
  ArrowRight,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import '../employee/sales/SalesViews.css';
import '../accounts/InvoicePaymentForms.css';

export default function FinancePaymentsView({ initialPreFillInvoice, initialInvoice, onClearInitialInvoice, searchQuery }) {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [form, setForm] = useState({
    invoiceId: '',
    invoiceNumber: '',
    customerName: '',
    salesOrderId: '',
    salesOrderNumber: '',
    amount: 0,
    paymentType: 'Partial',
    paymentMethod: 'Bank Transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/payments');
      if (response.ok && data.success) {
        const cutoff = new Date('2026-09-15T00:00:00.000Z');
        setPayments((data.data || []).filter(d => new Date(d.createdAt) > cutoff));
      }
    } catch (e) {
      console.error('[Fetch Payments Error]:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      const { response, data } = await apiRequest('/api/sales-employee/invoices');
      if (response.ok && data.success) {
        setInvoices(data.data || []);
      }
    } catch (e) {
      console.error('[Fetch Invoices for Payments Error]:', e);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchInvoices();
  }, [fetchPayments, fetchInvoices]);

  // AUTO-SELECT INVOICE AND FILL DETAILS
  const handleSelectInvoice = (invOrId) => {
    if (!invOrId) {
      setSelectedInvoice(null);
      return;
    }

    const inv = typeof invOrId === 'object' 
      ? invOrId 
      : invoices.find(i => (i._id === invOrId || i.invoiceNumber === invOrId));
    if (!inv) return;

    setSelectedInvoice(inv);
    const totalAmount = Number(inv.amount) || 0;
    const alreadyPaid = Number(inv.paidAmount) || 0;
    const remaining = Math.max(0, totalAmount - alreadyPaid);

    setForm(prev => ({
      ...prev,
      invoiceId: inv._id || inv.id || '',
      invoiceNumber: inv.invoiceNumber || '',
      customerName: inv.clientName || inv.customerName || '',
      salesOrderId: inv.salesOrderId || null,
      salesOrderNumber: inv.salesOrderNumber || '',
      amount: remaining > 0 ? remaining : totalAmount,
      paymentType: remaining > 0 ? 'Full' : 'Partial',
      notes: `Payment recorded against Invoice ${inv.invoiceNumber || ''}${inv.salesOrderNumber ? ` (Order ${inv.salesOrderNumber})` : ''}`
    }));
  };

  useEffect(() => {
    const targetInv = initialInvoice || initialPreFillInvoice;
    if (targetInv) {
      handleSelectInvoice(targetInv);
      setShowModal(true);
      if (onClearInitialInvoice) onClearInitialInvoice();
    }
  }, [initialInvoice, initialPreFillInvoice]);

  const handleQuickAmount = (type) => {
    if (!selectedInvoice) return;
    const total = Number(selectedInvoice.amount) || 0;
    const paid = Number(selectedInvoice.paidAmount) || 0;
    const rem = Math.max(0, total - paid);

    if (type === 'full') {
      setForm(prev => ({ ...prev, amount: rem, paymentType: 'Full' }));
    } else if (type === 'half') {
      const half = Math.round(rem / 2);
      setForm(prev => ({ ...prev, amount: half, paymentType: 'Partial' }));
    }
  };

  const openCreateModal = () => {
    setSelectedInvoice(null);
    setForm({
      invoiceId: '',
      invoiceNumber: '',
      customerName: '',
      salesOrderId: '',
      salesOrderNumber: '',
      amount: 0,
      paymentType: 'Full',
      paymentMethod: 'Bank Transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowModal(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.amount || Number(form.amount) <= 0) {
      alert('Customer name and a valid payment amount (> 0) are required.');
      return;
    }

    setSaving(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/payments', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      if (response.ok && data.success) {
        setFeedback(`Payment ${data.data?.paymentRefNumber || ''} of PKR ${Number(form.amount).toLocaleString()} recorded successfully!`);
        setShowModal(false);
        fetchPayments();
        fetchInvoices();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(data.message || 'Failed to record payment.');
      }
    } catch (err) {
      alert('Server error recording payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReceipt = (pay) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('OFFICIAL PAYMENT RECEIPT', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('FORTLINE CRM • Finance & Treasury Department', 14, 26);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 30, 196, 30);

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Receipt #: ${pay.paymentRefNumber || 'N/A'}`, 14, 38);
    doc.text(`Receipt Date: ${pay.paymentDate ? new Date(pay.paymentDate).toLocaleDateString() : 'N/A'}`, 14, 44);
    doc.text(`Payment Method: ${pay.paymentMethod || 'Bank Transfer'}`, 14, 50);
    doc.text(`Payment Type: ${pay.paymentType || 'Partial'}`, 14, 56);

    doc.text(`Received From: ${pay.customerName}`, 120, 38);
    doc.text(`Invoice Linked: ${pay.invoiceNumber || '—'}`, 120, 44);
    doc.text(`Sales Order: ${pay.salesOrderNumber || '—'}`, 120, 50);

    autoTable(doc, {
      startY: 64,
      head: [['Transaction Details', 'Reference', 'Amount Settled (PKR)']],
      body: [[
        `Payment against Invoice ${pay.invoiceNumber || 'Direct'}\n${pay.notes || ''}`,
        pay.paymentRefNumber || 'REC',
        `PKR ${Number(pay.amount || 0).toLocaleString()}`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] }
    });

    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`Total Settled: PKR ${Number(pay.amount || 0).toLocaleString()}`, 120, finalY);

    doc.save(`${pay.paymentRefNumber || 'Payment_Receipt'}.pdf`);
  };

  // Full Customer Payments List PDF Export
  const handleExportAllPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(5, 150, 105); // #059669
    doc.rect(0, 0, 297, 26, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM — CUSTOMER PAYMENTS & SETTLEMENTS LEDGER', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 242, 254);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} • All amounts in Pakistani Rupees (PKR)`, 14, 20);

    const rows = filteredPayments.map((pay, idx) => [
      (idx + 1).toString(),
      pay.paymentRefNumber || `PAY-${idx + 1}`,
      pay.customerName || 'Customer',
      pay.invoiceNumber || '—',
      pay.salesOrderNumber || '—',
      `PKR ${(Number(pay.amount) || 0).toLocaleString()}`,
      pay.paymentType || 'Full',
      pay.paymentMethod || 'Bank Transfer',
      pay.paymentDate ? new Date(pay.paymentDate).toLocaleDateString('en-GB') : '—'
    ]);

    autoTable(doc, {
      startY: 32,
      margin: { left: 14, right: 14 },
      head: [['#', 'Receipt #', 'Customer / Client', 'Invoice #', 'Sales Order #', 'Amount (PKR)', 'Type', 'Method', 'Payment Date']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 32, fontStyle: 'bold' },
        2: { cellWidth: 54 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 24, halign: 'center' },
        7: { cellWidth: 30 },
        8: { cellWidth: 23, halign: 'center' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`Total Collections: PKR ${totalCollected.toLocaleString()} (${filteredPayments.length} Receipts)`, 14, finalY > 195 ? 195 : finalY);

    doc.save(`Fortline_Customer_Payments_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Full Customer Payments List Excel CSV Export
  const handleExportAllExcel = () => {
    const headers = ['#', 'Receipt Ref Number', 'Customer / Client', 'Invoice Number', 'Sales Order Number', 'Amount Settled (PKR)', 'Payment Type', 'Payment Method', 'Payment Date', 'Notes'];
    const rows = filteredPayments.map((pay, idx) => [
      idx + 1,
      `"${pay.paymentRefNumber || ''}"`,
      `"${(pay.customerName || '').replace(/"/g, '""')}"`,
      `"${pay.invoiceNumber || ''}"`,
      `"${pay.salesOrderNumber || ''}"`,
      Number(pay.amount) || 0,
      `"${pay.paymentType || 'Full'}"`,
      `"${pay.paymentMethod || 'Bank Transfer'}"`,
      `"${pay.paymentDate ? new Date(pay.paymentDate).toLocaleDateString('en-GB') : ''}"`,
      `"${(pay.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fortline_Customer_Payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPayments = payments.filter(p => {
    const effectiveSearch = (searchQuery || searchTerm || '').trim().toLowerCase();
    if (!effectiveSearch) return true;
    const term = effectiveSearch;
    return (
      (p.paymentRefNumber && p.paymentRefNumber.toLowerCase().includes(term)) ||
      (p.customerName && p.customerName.toLowerCase().includes(term)) ||
      (p.salePerson && p.salePerson.toLowerCase().includes(term)) ||
      (p.salesPerson?.fullName && p.salesPerson.fullName.toLowerCase().includes(term)) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(term)) ||
      (p.salesOrderNumber && p.salesOrderNumber.toLowerCase().includes(term)) ||
      (p.paymentMethod && p.paymentMethod.toLowerCase().includes(term)) ||
      (p.paymentType && p.paymentType.toLowerCase().includes(term)) ||
      (p.notes && p.notes.toLowerCase().includes(term))
    );
  });

  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const bankTransferTotal = payments.filter(p => p.paymentMethod === 'Bank Transfer').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const chequeTotal = payments.filter(p => p.paymentMethod === 'Cheque').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Unsettled / unpaid invoices count
  const unpaidInvoices = invoices.filter(inv => {
    const rem = Math.max(0, (Number(inv.amount) || 0) - (Number(inv.paidAmount) || 0));
    return rem > 0;
  });

  return (
    <div className="sv-container">
      {/* Top Bar */}
      <div className="sv-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="sv-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={22} color="#059669" /> Customer Payments &amp; Remittance
          </h2>
          <p className="sv-subtitle">
            Record customer settlements, bank transfers, cheques, and update invoice receivable balances
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="sv-btn-primary" style={{ background: '#059669' }} onClick={handleExportAllPDF} title="Export Payments PDF">
            <Download size={15} /> Export PDF
          </button>
          <button className="sv-btn-primary" style={{ background: '#2563EB' }} onClick={handleExportAllExcel} title="Export Payments Excel">
            <FileSpreadsheet size={15} /> Export Excel
          </button>
          <button className="sv-btn-primary" style={{ background: '#0F172A' }} onClick={openCreateModal}>
            <Plus size={16} /> Record Payment
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#047857',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '16px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="#059669" /> {feedback}
        </div>
      )}

      {/* KPI Cards */}
      <div className="sv-grid-4" style={{ marginBottom: '20px' }}>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #059669' }}>
          <span className="sv-ts-label">Total Collections</span>
          <span className="sv-ts-value" style={{ color: '#059669' }}>
            PKR {totalCollected.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{payments.length} payment receipts</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #2563EB' }}>
          <span className="sv-ts-label">Bank Transfers</span>
          <span className="sv-ts-value" style={{ color: '#2563EB' }}>
            PKR {bankTransferTotal.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Direct account deposits</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #D97706' }}>
          <span className="sv-ts-label">Cheque Collections</span>
          <span className="sv-ts-value" style={{ color: '#D97706' }}>
            PKR {chequeTotal.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Cleared &amp; deposited</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #6366F1' }}>
          <span className="sv-ts-label">Invoices Pending</span>
          <span className="sv-ts-value" style={{ color: '#6366F1' }}>
            {unpaidInvoices.length}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Awaiting settlement</span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="sv-filters" style={{ marginBottom: '16px' }}>
        <div className="sv-search-box" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            placeholder="Search payment receipt #, customer name, invoice #, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="sv-loading">Loading payment records...</div>
      ) : filteredPayments.length === 0 ? (
        <div className="sv-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <CreditCard size={36} color="#94A3B8" style={{ marginBottom: '10px' }} />
          <p style={{ fontWeight: 600, color: '#334155' }}>No payment records found</p>
          <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Click &quot;Record Payment&quot; to log a customer remittance.</p>
        </div>
      ) : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Customer / Client</th>
                <th>Invoice #</th>
                <th>Sales Order #</th>
                <th>Amount (PKR)</th>
                <th>Payment Type</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th style={{ textAlign: 'center' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{p.paymentRefNumber || 'REC'}</td>
                  <td style={{ fontWeight: 600 }}>{p.customerName}</td>
                  <td>
                    {p.invoiceNumber ? (
                      <span style={{ color: '#2563EB', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={13} /> {p.invoiceNumber}
                      </span>
                    ) : '—'}
                  </td>
                  <td>{p.salesOrderNumber || '—'}</td>
                  <td style={{ fontWeight: 800, color: '#059669' }}>
                    PKR {Number(p.amount || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className="sv-badge" style={{
                      background: p.paymentType === 'Full' ? '#ECFDF5' : '#EFF6FF',
                      color: p.paymentType === 'Full' ? '#047857' : '#1D4ED8',
                      border: `1px solid ${p.paymentType === 'Full' ? '#A7F3D0' : '#BFDBFE'}`
                    }}>
                      {p.paymentType}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      background: '#F1F5F9',
                      color: '#334155',
                      fontWeight: 600
                    }}>
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="sv-btn-action-icon"
                      onClick={() => handleDownloadReceipt(p)}
                      title="Download Payment Slip (PDF)"
                    >
                      <Download size={14} color="#059669" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* BEAUTIFULLY STYLED RECORD PAYMENT MODAL                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* BEAUTIFULLY STYLED RECORD PAYMENT MODAL                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="ip-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="ip-modal-card"
            style={{ maxWidth: '720px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="ip-modal-header payment-theme">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="ip-header-icon-box">
                  <span style={{fontWeight: 600, fontSize: "0.9em", marginRight: "4px"}}>PKR</span>
                </div>
                <div className="ip-header-title-group">
                  <h3>Record Customer Payment</h3>
                  <p>Select an invoice to auto-fill customer, order number &amp; remaining balance</p>
                </div>
              </div>
              <button
                type="button"
                className="ip-close-btn"
                onClick={() => setShowModal(false)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePayment}>
              <div className="ip-modal-body">
                {/* 1. AUTO SELECT INVOICE (HERO CARD) */}
                <div className="ip-section-card hero-selector-card payment-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div className="ip-section-title" style={{ margin: 0, color: '#065F46' }}>
                      <FileText size={16} color="#059669" /> Select Customer Invoice (Auto-Fill Balance)
                    </div>
                    <span className="ip-section-pill green">
                      {unpaidInvoices.length} Unpaid Invoices
                    </span>
                  </div>

                  <select
                    className="ip-input payment-focus"
                    style={{
                      fontWeight: 600,
                      borderColor: form.invoiceId ? '#059669' : '#CBD5E1',
                      marginTop: '6px'
                    }}
                    value={form.invoiceId}
                    onChange={(e) => handleSelectInvoice(e.target.value)}
                  >
                    <option value="">-- Choose Invoice to Settle --</option>
                    {invoices.map(inv => {
                      const total = Number(inv.amount) || 0;
                      const paid = Number(inv.paidAmount) || 0;
                      const rem = Math.max(0, total - paid);
                      return (
                        <option key={inv._id} value={inv._id}>
                          {inv.invoiceNumber} — {inv.clientName} (Total: PKR {total.toLocaleString()} | Remaining: PKR {rem.toLocaleString()})
                        </option>
                      );
                    })}
                  </select>

                  {/* Live Settlement Breakdown Card if invoice is selected */}
                  {selectedInvoice && (
                    <div style={{ marginTop: '14px' }}>
                      <div className="ip-payment-metrics-grid">
                        <div className="ip-payment-metric-card">
                          <div className="ip-payment-metric-label">Invoice Total</div>
                          <div className="ip-payment-metric-value" style={{ color: '#0F172A' }}>
                            PKR {Number(selectedInvoice.amount || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="ip-payment-metric-card">
                          <div className="ip-payment-metric-label" style={{ color: '#059669' }}>Already Paid</div>
                          <div className="ip-payment-metric-value" style={{ color: '#059669' }}>
                            PKR {Number(selectedInvoice.paidAmount || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="ip-payment-metric-card remaining-card">
                          <div className="ip-payment-metric-label" style={{ color: '#DC2626' }}>Remaining Balance</div>
                          <div className="ip-payment-metric-value" style={{ color: '#DC2626' }}>
                            PKR {Math.max(0, (Number(selectedInvoice.amount) || 0) - (Number(selectedInvoice.paidAmount) || 0)).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Quick Amount Buttons */}
                      <div className="ip-quick-amount-group">
                        <button
                          type="button"
                          className="ip-quick-pill full-pill"
                          onClick={() => handleQuickAmount('full')}
                        >
                          ✓ Pay Full Remaining (100%)
                        </button>
                        <button
                          type="button"
                          className="ip-quick-pill half-pill"
                          onClick={() => handleQuickAmount('half')}
                        >
                          ½ Pay Half Balance (50%)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. CUSTOMER NAME & PAYMENT AMOUNT */}
                <div className="ip-section-card">
                  <div className="ip-section-title">
                    <Building size={16} color="#475569" /> Customer &amp; Transaction Details
                  </div>
                  <div className="ip-grid-2" style={{ marginBottom: '14px' }}>
                    <div className="ip-field-group">
                      <label className="ip-label">
                        Customer / Client Name <span className="required-mark">*</span>
                      </label>
                      <input
                        type="text"
                        className="ip-input payment-focus"
                        value={form.customerName}
                        onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                        placeholder="Customer name"
                        required
                      />
                    </div>
                    <div className="ip-field-group">
                      <label className="ip-label">
                        Amount Paid (PKR) <span className="required-mark">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="ip-input payment-focus"
                        style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669' }}
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: Math.max(0, parseFloat(e.target.value) || 0) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="ip-grid-2" style={{ marginBottom: '14px' }}>
                    <div className="ip-field-group">
                      <label className="ip-label">Payment Method</label>
                      <select
                        className="ip-input payment-focus"
                        value={form.paymentMethod}
                        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      >
                        <option value="Bank Transfer">Bank Transfer (Wire / Online)</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Cash">Cash</option>
                        <option value="Online">Online Gateway / Card</option>
                        <option value="Other">Other Method</option>
                      </select>
                    </div>

                    <div className="ip-field-group">
                      <label className="ip-label">Payment Type</label>
                      <select
                        className="ip-input payment-focus"
                        value={form.paymentType}
                        onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                      >
                        <option value="Full">Full Payment</option>
                        <option value="Partial">Partial Payment</option>
                        <option value="Advance">Advance Payment</option>
                      </select>
                    </div>
                  </div>

                  <div className="ip-grid-2">
                    <div className="ip-field-group">
                      <label className="ip-label">Payment Date</label>
                      <input
                        type="date"
                        className="ip-input payment-focus"
                        value={form.paymentDate}
                        onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                      />
                    </div>
                    <div className="ip-field-group">
                      <label className="ip-label">Linked Sales Order (Optional)</label>
                      <input
                        type="text"
                        className="ip-input payment-focus"
                        value={form.salesOrderNumber}
                        onChange={(e) => setForm({ ...form, salesOrderNumber: e.target.value })}
                        placeholder="e.g. SO-001"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. NOTES & REMARKS */}
                <div className="ip-section-card" style={{ marginBottom: '0' }}>
                  <div className="ip-section-title">
                    <Receipt size={16} color="#475569" /> Payment Reference &amp; Remarks
                  </div>
                  <div className="ip-field-group">
                    <label className="ip-label">Payment Notes / Bank Transaction Reference</label>
                    <textarea
                      rows={3}
                      className="ip-input payment-focus"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="e.g. Cheque # 124892 deposited in HBL account / Wire IBAN ref..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="ip-modal-footer">
                <button type="button" className="ip-btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ip-btn-submit-payment"
                  disabled={saving}
                >
                  <Save size={16} /> {saving ? 'Recording Payment...' : 'Confirm & Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
