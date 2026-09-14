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
  Receipt,
  FileSpreadsheet
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
  amount: '',
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

  // Selected Invoice info for active form
  const selectedInvoice = useMemo(() => {
    if (!form.invoiceId) return null;
    return invoices.find(i => i._id === form.invoiceId) || null;
  }, [form.invoiceId, invoices]);

  const invoiceAmount = Number(selectedInvoice?.amount || 0);
  const invoiceAlreadyPaid = Number(selectedInvoice?.paidAmount || 0);
  const invoiceRemaining = Math.max(0, invoiceAmount - invoiceAlreadyPaid);

  const calculatedRemainingAfterPayment = useMemo(() => {
    if (!selectedInvoice) return null;
    const currentPayAmount = Number(form.amount) || 0;
    return Math.max(0, invoiceRemaining - currentPayAmount);
  }, [selectedInvoice, invoiceRemaining, form.amount]);

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
      amount: p.amount || '',
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
      const invTotal = Number(selected.amount) || 0;
      const invPaid = Number(selected.paidAmount) || 0;
      const invRem = Math.max(0, invTotal - invPaid);

      // Auto-extract linked Sales Order
      let linkedSoId = selected.salesOrderId;
      let linkedSoNum = selected.salesOrderNumber || selected.saleReference || '';
      if (typeof linkedSoId === 'object' && linkedSoId !== null) {
        linkedSoNum = linkedSoId.orderReference || linkedSoId.orderNumber || linkedSoNum;
        linkedSoId = linkedSoId._id;
      }

      setForm(prev => {
        let amt = prev.amount;
        if (prev.paymentType === 'Full' || !amt || Number(amt) === 0) {
          amt = invRem;
        }
        return {
          ...prev,
          invoiceId: invId,
          invoiceNumber: selected.invoiceNumber || '',
          salesOrderId: linkedSoId || prev.salesOrderId || '',
          salesOrderNumber: linkedSoNum || prev.salesOrderNumber || '',
          customerName: selected.clientName || prev.customerName || '',
          amount: amt
        };
      });
    } else {
      setForm(prev => ({ ...prev, invoiceId: '', invoiceNumber: '' }));
    }
  };

  const handlePaymentTypeChange = (newType) => {
    setForm(prev => {
      let updatedAmount = prev.amount;
      if (newType === 'Full' && selectedInvoice) {
        updatedAmount = invoiceRemaining;
      }
      return {
        ...prev,
        paymentType: newType,
        amount: updatedAmount
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    const payNum = Number(form.amount);
    if (!payNum || payNum <= 0) {
      setError('Valid payment amount in PKR is required.');
      return;
    }
    if (selectedInvoice && payNum > invoiceRemaining + 0.01) {
      setError(`Payment amount cannot exceed the invoice's remaining receivable of Rs. ${invoiceRemaining.toLocaleString()}.`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        amount: payNum,
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
        fetchDependencies();
      } else {
        setError(data.message || 'Server error recording payment.');
      }
    } catch (e) {
      setError('Network error recording payment.');
    } finally {
      setSaving(false);
    }
  };

  // ── COMPLETE PAYMENTS LEDGER DOWNLOAD (PDF) WITH TOTALS ──
  const downloadCompleteLedgerPDF = () => {
    const dataset = filteredPayments.length > 0 ? filteredPayments : payments;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const nowStr = new Date().toLocaleDateString('en-GB');

    doc.setFillColor(15, 23, 42); // Navy
    doc.rect(0, 0, 297, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM — CUSTOMER PAYMENTS & COLLECTIONS LEDGER', 14, 12);

    const totalAmt = dataset.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${nowStr} | Total Records: ${dataset.length} | Grand Total: Rs. ${totalAmt.toLocaleString()} PKR`, 14, 19);

    const rows = dataset.map((p, idx) => [
      idx + 1,
      p.paymentRefNumber || '—',
      p.customerName || '—',
      p.salesOrderNumber || '—',
      p.invoiceNumber || '—',
      p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-GB') : '—',
      p.paymentType || 'Partial',
      p.paymentMethod || 'Bank Transfer',
      `Rs. ${Number(p.amount || 0).toLocaleString()}`
    ]);

    try {
      autoTable(doc, {
        startY: 28,
        head: [['#', 'Receipt / Ref #', 'Customer Name', 'Linked SO #', 'Linked Invoice #', 'Payment Date', 'Type', 'Method', 'Amount (PKR)']],
        body: rows,
        foot: [[
          { content: 'GRAND TOTAL / SUMMARY', colSpan: 8, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
          { content: `Rs. ${totalAmt.toLocaleString()}`, styles: { halign: 'left', fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [4, 120, 87] } }
        ]],
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      doc.save(`Customer_Payments_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Customer payments PDF export error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // ── COMPLETE PAYMENTS LEDGER DOWNLOAD (EXCEL / CSV) WITH TOTALS ──
  const downloadCompleteLedgerExcel = () => {
    const dataset = filteredPayments.length > 0 ? filteredPayments : payments;
    const totalAmt = dataset.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const headers = ['#', 'Receipt Number', 'Customer Name', 'Sales Order Number', 'Invoice Number', 'Payment Date', 'Payment Type', 'Payment Method', 'Reference Note', 'Amount (PKR)', 'Notes'];
    const rows = dataset.map((p, idx) => [
      idx + 1,
      `"${p.paymentRefNumber || ''}"`,
      `"${(p.customerName || '').replace(/"/g, '""')}"`,
      `"${p.salesOrderNumber || ''}"`,
      `"${p.invoiceNumber || ''}"`,
      `"${p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-GB') : ''}"`,
      `"${p.paymentType || 'Partial'}"`,
      `"${p.paymentMethod || 'Bank Transfer'}"`,
      `"${(p.referenceNote || '').replace(/"/g, '""')}"`,
      Number(p.amount || 0),
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);

    const summaryRow = [
      'TOTAL',
      `"Total Records: ${dataset.length}"`,
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      totalAmt,
      '""'
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(',')), summaryRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Customer_Payments_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── INDIVIDUAL PAYMENT RECEIPT / SLIP PDF ──
  const handleDownloadPaymentSlip = (payment) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const ref = payment.paymentRefNumber || 'REC-DOC';
    const customer = payment.customerName || 'Valued Customer';
    const dateStr = payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const amount = Number(payment.amount || 0);

    doc.setFillColor(30, 58, 138); // Deep Navy
    doc.rect(0, 0, 210, 36, 'F');
    doc.setFillColor(5, 150, 105); // Emerald Accent
    doc.rect(0, 36, 210, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text('Official Customer Payment Receipt & Settlement Slip', 14, 26);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`Receipt #: ${ref}`, 196, 18, { align: 'right' });
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${dateStr}`, 196, 26, { align: 'right' });

    // Customer / Meta section
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 46, 182, 34, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, 46, 182, 34, 'S');

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIVED FROM (CUSTOMER):', 19, 54);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(customer, 19, 62);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Linked Sales Order: ${payment.salesOrderNumber || '—'}  |  Linked Invoice: ${payment.invoiceNumber || '—'}`, 19, 70);

    const paymentRows = [
      ['Payment Reference ID', ref],
      ['Payer / Organization', customer],
      ['Payment Method / Channel', payment.paymentMethod || 'Bank Transfer'],
      ['Classification / Type', `${payment.paymentType || 'Partial'} Payment`],
      ['Settlement Date', dateStr]
    ];

    autoTable(doc, {
      startY: 88,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [['Payment Ledger Specification', 'Details / Recorded Reference']],
      body: paymentRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
      styles: { fontSize: 8.5, cellPadding: 3.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    let finalY = doc.lastAutoTable.finalY + 8;
    if (finalY > 215) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(14, finalY, 182, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(4, 120, 87);
    doc.text('TOTAL AMOUNT COLLECTED & CREDITED (PKR):', 18, finalY + 8);

    doc.setFontSize(14);
    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${amount.toLocaleString()} PKR`, 18, finalY + 18);

    if (payment.notes) {
      finalY += 30;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, finalY, 182, 16, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Remarks / Reference: ${payment.notes}`, 18, finalY + 10, { maxWidth: 174 });
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
        fetchDependencies();
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

  // KPIs
  const totalCollectedAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const advancePayments = payments.filter(p => p.paymentType === 'Advance');
  const advanceTotal = advancePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const partialPayments = payments.filter(p => p.paymentType === 'Partial');
  const partialTotal = partialPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const fullPayments = payments.filter(p => p.paymentType === 'Full');
  const fullTotal = fullPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="sv-container">
      {/* Header */}
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><CreditCard size={22} color="#059669" /> Customer Payments & Collections</h2>
          <p className="sv-subtitle">Record and audit Advance, Partial, and Full customer payments linked to Invoices and Sales Orders</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button className="sv-btn-secondary" onClick={downloadCompleteLedgerPDF} title="Download Complete Payments (PDF)">
            <Download size={15} color="#DC2626" /> Export PDF
          </button>
          <button className="sv-btn-secondary" onClick={downloadCompleteLedgerExcel} title="Download Complete Payments (Excel)">
            <FileSpreadsheet size={15} color="#059669" /> Export Excel
          </button>
          <button className="sv-btn-primary" style={{ background: '#059669' }} onClick={openCreate}>
            <Plus size={16} /> Record Payment
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <CheckCircle2 size={16} color="#059669" /> {feedback}
        </div>
      )}

      {/* KPI Cards */}
      <div className="sv-grid-4">
        <div className="sv-target-card" style={{ borderLeft: '4px solid #059669' }}>
          <span className="sv-ts-label">Total Collections</span>
          <span className="sv-ts-value" style={{ color: '#059669' }}>Rs. {totalCollectedAmount.toLocaleString()}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{payments.length} payments recorded</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #3B82F6' }}>
          <span className="sv-ts-label">Advance Collections</span>
          <span className="sv-ts-value" style={{ color: '#2563EB' }}>Rs. {advanceTotal.toLocaleString()}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{advancePayments.length} advance receipts</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #F59E0B' }}>
          <span className="sv-ts-label">Partial Collections</span>
          <span className="sv-ts-value" style={{ color: '#D97706' }}>Rs. {partialTotal.toLocaleString()}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{partialPayments.length} partial payments</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #10B981' }}>
          <span className="sv-ts-label">Full Settlements</span>
          <span className="sv-ts-value" style={{ color: '#059669' }}>Rs. {fullTotal.toLocaleString()}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{fullPayments.length} fully paid</span>
        </div>
      </div>

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
                <th>Linked Sales Order</th>
                <th>Linked Invoice #</th>
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

      {/* CREATE / EDIT MODAL */}
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

              {/* INVOICE & AUTO-LINKED SALES ORDER */}
              <div className="sv-form-section" style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Select Invoice (Approved / Pending Payment)</label>
                    <select value={form.invoiceId} onChange={e => handleInvoiceChange(e.target.value)}>
                      <option value="">-- Select Final Invoice --</option>
                      {invoices.map(i => (
                        <option key={i._id} value={i._id}>
                          {i.invoiceNumber} — {i.clientName} (Rs. {Number(i.amount || 0).toLocaleString()} | Outstanding: Rs. {Number(i.outstandingAmount != null ? i.outstandingAmount : i.amount).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sv-field">
                    <label>Linked Sales Order (Auto-Resolved)</label>
                    <input
                      value={form.salesOrderNumber || 'Direct Invoice / None'}
                      readOnly
                      style={{ background: '#F1F5F9', cursor: 'not-allowed', color: '#334155', fontWeight: 600 }}
                    />
                  </div>
                </div>

                {selectedInvoice && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '12px', background: '#FFFFFF', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Invoice Total</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>Rs. {invoiceAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>Already Paid</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669' }}>Rs. {invoiceAlreadyPaid.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 700 }}>Remaining Receivable</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#DC2626' }}>Rs. {invoiceRemaining.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* PAYMENT TYPE & CALCULATORS */}
              <div className="sv-form-section">
                <div className="sv-grid-3">
                  <div className="sv-field">
                    <label>Payment Type</label>
                    <select value={form.paymentType} onChange={e => handlePaymentTypeChange(e.target.value)}>
                      <option value="Advance">Advance Payment</option>
                      <option value="Partial">Partial Payment</option>
                      <option value="Full">Full Payment</option>
                    </select>
                  </div>

                  <div className="sv-field">
                    <label>
                      {form.paymentType === 'Advance' ? 'Advance Amount to Pay *' : (form.paymentType === 'Partial' ? 'Partial Amount Paid *' : 'Full Payment Amount *')}
                    </label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      placeholder="0"
                      min="1"
                      max={selectedInvoice ? invoiceRemaining : undefined}
                      required
                    />
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

                {/* LIVE REMAINING BALANCE INDICATOR */}
                {selectedInvoice && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', background: calculatedRemainingAfterPayment === 0 ? '#ECFDF5' : '#EFF6FF', borderRadius: '6px', border: calculatedRemainingAfterPayment === 0 ? '1px solid #A7F3D0' : '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: calculatedRemainingAfterPayment === 0 ? '#065F46' : '#1E40AF' }}>
                      {calculatedRemainingAfterPayment === 0 ? '✓ Invoice will be fully settled' : 'Remaining Balance after this payment:'}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: calculatedRemainingAfterPayment === 0 ? '#059669' : '#1D4ED8' }}>
                      Rs. {calculatedRemainingAfterPayment.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="sv-field" style={{ marginTop: '12px' }}>
                  <label>Payment Date</label>
                  <input type="date" value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} />
                </div>

                <div className="sv-field">
                  <label>Notes / Transaction Reference</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Bank transaction ID, cheque number, or settlement notes..." />
                </div>
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving} style={{ background: '#059669' }}>
                  <Save size={15} /> {saving ? 'Saving...' : (editPay ? 'Update Payment' : 'Save Payment Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className="sv-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="sv-modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3 style={{ margin: 0, color: '#EF4444' }}>Confirm Deletion</h3>
              <button onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <p style={{ color: '#475569', fontSize: '0.9rem', margin: '12px 0 20px' }}>
              Are you sure you want to delete payment receipt <strong>{deleteTarget.paymentRefNumber}</strong> for <strong>Rs. {Number(deleteTarget.amount || 0).toLocaleString()}</strong>? This will restore the outstanding receivable on the linked invoice.
            </p>
            <div className="sv-modal-actions">
              <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="sv-btn-primary" style={{ background: '#EF4444' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
