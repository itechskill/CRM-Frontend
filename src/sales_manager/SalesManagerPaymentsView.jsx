import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiRequest } from '../utils/api';
import { CreditCard, Search, User, Eye, Download, FileSpreadsheet, Plus, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './SalesManagerDashboard.css';

const TYPE_COLORS = {
  Advance: '#3B82F6',
  Partial: '#F59E0B',
  Full: '#10B981',
  Pending: '#64748B'
};

export default function SalesManagerPaymentsView() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewPayment, setViewPayment] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    invoiceNumber: '',
    salesOrderNumber: '',
    customerName: '',
    amount: '',
    paymentType: 'Partial',
    paymentMethod: 'Bank Transfer',
    paymentDate: new Date().toISOString().substring(0, 10),
    notes: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [payRes, tmRes, invRes] = await Promise.all([
        apiRequest('/api/sales-manager/all-payments'),
        apiRequest('/api/sales-manager/team-members'),
        apiRequest('/api/sales-manager/all-invoices')
      ]);
      if (payRes.response.ok && payRes.data.success) setPayments(payRes.data.data);
      if (tmRes.response.ok && tmRes.data.success) setTeamMembers(tmRes.data.data || []);
      if (invRes.response.ok && invRes.data.success) {
        // Only invoices that are approved or eligible for payment
        const approvedInvs = (invRes.data.data || []).filter(i => ['Approved', 'Sent', 'Partially Paid', 'Paid'].includes(i.status));
        setInvoices(approvedInvs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesMember = selectedMember === 'all' || (p.createdBy?._id === selectedMember || p.createdBy === selectedMember);
      const matchesType = typeFilter === 'all' || p.paymentType === typeFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        (p.paymentRefNumber && p.paymentRefNumber.toLowerCase().includes(term)) ||
        (p.customerName && p.customerName.toLowerCase().includes(term)) ||
        (p.salesOrderNumber && p.salesOrderNumber.toLowerCase().includes(term)) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(term));
      return matchesMember && matchesType && matchesSearch;
    });
  }, [payments, selectedMember, typeFilter, searchTerm]);

  const totalCollected = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // ── GENERATE INDIVIDUAL PAYMENT SLIP PDF ──
  const downloadPaymentSlip = (p) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const memberName = p.createdBy?.fullName || 'Sales Department';
    const amountVal = Number(p.amount || 0);

    // Header Background
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, 210, 40, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM', 16, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Official Customer Payment Receipt / Slip', 16, 28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(p.paymentRefNumber || 'RECEIPT', 194, 20, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Date: ${p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : new Date().toLocaleDateString()}`, 194, 28, { align: 'right' });

    // Amount Banner
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(16, 48, 178, 26, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(6, 95, 70);
    doc.text('AMOUNT RECEIVED (PKR)', 22, 56);

    doc.setFontSize(18);
    doc.text(`Rs. ${amountVal.toLocaleString()}`, 22, 66);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Status: ${p.paymentType} Payment Received`, 188, 62, { align: 'right' });

    // Details Grid
    const details = [
      ['Payment Reference #', p.paymentRefNumber || '—'],
      ['Customer / Client', p.customerName || '—'],
      ['Invoice Number', p.invoiceNumber || '—'],
      ['Sales Order Reference', p.salesOrderNumber || '—'],
      ['Payment Type', p.paymentType || 'Partial'],
      ['Payment Method', p.paymentMethod || 'Bank Transfer'],
      ['Payment Date', p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'],
      ['Recorded By', memberName],
      ['Currency', 'PKR (Pakistani Rupee)']
    ];

    autoTable(doc, {
      startY: 82,
      head: [['Payment Information Field', 'Details']],
      body: details,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 16, right: 16 }
    });

    if (p.notes) {
      const finalY = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Remarks / Notes:', 16, finalY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(p.notes, 16, finalY + 6);
    }

    // Signatures
    const signY = 240;
    doc.setDrawColor(203, 213, 225);
    doc.line(16, signY, 80, signY);
    doc.line(130, signY, 194, signY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Received By / Authorized Signature', 16, signY + 5);
    doc.text('Customer Acceptance Signature', 130, signY + 5);

    doc.save(`${p.paymentRefNumber || 'Receipt'}-${p.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  // ── GENERATE COMPLETE PAYMENTS REPORT (PDF) ──
  const downloadCompleteReportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const nowStr = new Date().toLocaleDateString();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM — PAYMENTS & COLLECTIONS MASTER REPORT', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on: ${nowStr} | Total Records: ${filteredPayments.length} | Total Volume: Rs. ${totalCollected.toLocaleString()}`, 14, 22);

    const rows = filteredPayments.map((p, idx) => [
      idx + 1,
      p.paymentRefNumber || '—',
      p.customerName || '—',
      p.createdBy?.fullName || 'Sales Member',
      p.salesOrderNumber || p.invoiceNumber || '—',
      p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—',
      p.paymentMethod || 'Bank Transfer',
      p.paymentType || 'Partial',
      `Rs. ${Number(p.amount || 0).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 34,
      head: [['#', 'Receipt #', 'Customer', 'Sales Person', 'Linked Order/Inv', 'Date', 'Method', 'Type', 'Amount (PKR)']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });

    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text(`Total Collections: Rs. ${totalCollected.toLocaleString()}`, 283, finalY, { align: 'right' });

    doc.save(`Payments-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ── GENERATE COMPLETE PAYMENTS REPORT (EXCEL / CSV) ──
  const downloadCompleteReportExcel = () => {
    const headers = ['#', 'Payment Ref', 'Customer Name', 'Sales Representative', 'Linked Order #', 'Linked Invoice #', 'Payment Date', 'Payment Method', 'Payment Type', 'Amount (PKR)', 'Notes'];
    const csvRows = [
      headers.join(','),
      ...filteredPayments.map((p, idx) => [
        idx + 1,
        `"${p.paymentRefNumber || ''}"`,
        `"${p.customerName || ''}"`,
        `"${p.createdBy?.fullName || ''}"`,
        `"${p.salesOrderNumber || ''}"`,
        `"${p.invoiceNumber || ''}"`,
        `"${p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : ''}"`,
        `"${p.paymentMethod || ''}"`,
        `"${p.paymentType || ''}"`,
        Number(p.amount || 0),
        `"${(p.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payments-Report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleInvoiceSelect = (invId) => {
    const selected = invoices.find(i => i._id === invId);
    if (selected) {
      const remaining = Number(selected.outstandingAmount || selected.amount || 0);
      setPaymentForm(prev => ({
        ...prev,
        invoiceId: selected._id,
        invoiceNumber: selected.invoiceNumber || '',
        salesOrderNumber: selected.salesOrderNumber || '',
        customerName: selected.clientName || '',
        amount: remaining > 0 ? remaining : selected.amount
      }));
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.customerName || !paymentForm.amount || Number(paymentForm.amount) <= 0) {
      setError('Please provide customer name and valid payment amount.');
      return;
    }
    setSavingPayment(true);
    setError('');
    try {
      const payload = {
        ...paymentForm,
        amount: Number(paymentForm.amount)
      };
      const { response, data } = await apiRequest('/api/sales-employee/payments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (response.ok && data.success) {
        setShowAddModal(false);
        setFeedback(`Payment of Rs. ${Number(payload.amount).toLocaleString()} recorded successfully.`);
        fetchData();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        setError(data.message || 'Failed to record payment.');
      }
    } catch (err) {
      setError('Server connection error.');
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div className="smd-section-container" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={24} color="#059669" /> Team Payments & Collections
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.85rem' }}>
            Audit trail of all advance, partial, and full customer payments with live MongoDB receipts and exports
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={downloadCompleteReportPDF}
            className="sv-btn-primary"
            style={{ background: '#059669', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} /> Export PDF Report
          </button>
          <button
            onClick={downloadCompleteReportExcel}
            className="sv-btn-primary"
            style={{ background: '#0D9488', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={15} /> Export Excel
          </button>
          <button
            onClick={() => {
              setPaymentForm({
                invoiceId: '',
                invoiceNumber: '',
                salesOrderNumber: '',
                customerName: '',
                amount: '',
                paymentType: 'Partial',
                paymentMethod: 'Bank Transfer',
                paymentDate: new Date().toISOString().substring(0, 10),
                notes: ''
              });
              setShowAddModal(true);
            }}
            className="sv-btn-primary"
            style={{ background: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Record Payment
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#059669" /> {feedback}
        </div>
      )}

      {/* Summary KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Collections (PKR)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>Rs. {totalCollected.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>Across {filteredPayments.length} recorded payments</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search payment ref, customer, order #, invoice #..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.875rem' }}
          />
        </div>

        <select
          value={selectedMember}
          onChange={e => setSelectedMember(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', fontSize: '0.875rem' }}
        >
          <option value="all">All Team Members</option>
          {teamMembers.map(m => (
            <option key={m._id} value={m._id}>{m.fullName || m.email}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', fontSize: '0.875rem' }}
        >
          <option value="all">All Payment Types</option>
          <option value="Advance">Advance</option>
          <option value="Partial">Partial</option>
          <option value="Full">Full</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading payments from database...</div>
      ) : (
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '12px 16px' }}>Payment Ref</th>
                <th style={{ padding: '12px 16px' }}>Customer</th>
                <th style={{ padding: '12px 16px' }}>Sales Member</th>
                <th style={{ padding: '12px 16px' }}>Order / Invoice</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Method</th>
                <th style={{ padding: '12px 16px' }}>Amount (PKR)</th>
                <th style={{ padding: '12px 16px' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Slip / Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
                    No payments found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => {
                  const memberName = p.createdBy?.fullName || 'Sales Member';
                  const typeColor = TYPE_COLORS[p.paymentType] || '#64748B';

                  return (
                    <tr key={p._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1E293B' }}>{p.paymentRefNumber || '—'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>{p.customerName}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} color="#94A3B8" /> {memberName}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '0.8rem' }}>
                        {p.salesOrderNumber && <div>SO: {p.salesOrderNumber}</div>}
                        {p.invoiceNumber && <div>INV: {p.invoiceNumber}</div>}
                        {!p.salesOrderNumber && !p.invoiceNumber && '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                          {p.paymentMethod || 'Bank Transfer'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#059669' }}>
                        Rs. {Number(p.amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: typeColor + '18', color: typeColor }}>
                          {p.paymentType}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => downloadPaymentSlip(p)}
                            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#2563EB', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Download Official Slip"
                          >
                            <Download size={13} /> Slip
                          </button>
                          <button
                            onClick={() => setViewPayment(p)}
                            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#334155' }}
                            title="View Details"
                          >
                            <Eye size={13} />
                          </button>
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

      {/* RECORD PAYMENT MODAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={() => setShowAddModal(false)}>
          <div style={{ background: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '560px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="#059669" /> Record Customer Payment
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94A3B8' }}>✕</button>
            </div>

            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Select Approved Invoice (Optional)</label>
                <select
                  value={paymentForm.invoiceId}
                  onChange={e => handleInvoiceSelect(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                >
                  <option value="">-- Direct Payment / No Invoice Linked --</option>
                  {invoices.map(inv => (
                    <option key={inv._id} value={inv._id}>
                      {inv.invoiceNumber} — {inv.clientName} (Total: Rs. {Number(inv.amount || 0).toLocaleString()} | Outstanding: Rs. {Number(inv.outstandingAmount || inv.amount || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Customer Name *</label>
                  <input
                    value={paymentForm.customerName}
                    onChange={e => setPaymentForm(p => ({ ...p, customerName: e.target.value }))}
                    placeholder="Customer / Company"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Payment Amount (PKR) *</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                    placeholder="Amount in PKR"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Payment Type</label>
                  <select
                    value={paymentForm.paymentType}
                    onChange={e => setPaymentForm(p => ({ ...p, paymentType: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  >
                    <option value="Advance">Advance Payment</option>
                    <option value="Partial">Partial Payment</option>
                    <option value="Full">Full Payment</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={e => setPaymentForm(p => ({ ...p, paymentMethod: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Payment Notes & Reference</label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Bank Ref #, cheque clearing details, or transaction ID..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  style={{ background: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {savingPayment ? 'Saving Payment...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {viewPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={() => setViewPayment(null)}>
          <div style={{ background: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                  Receipt: {viewPayment.paymentRefNumber}
                </h3>
                <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.85rem' }}>
                  Customer: {viewPayment.customerName}
                </p>
              </div>
              <button onClick={() => setViewPayment(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94A3B8' }}>✕</button>
            </div>

            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '16px', textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Amount Collected</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#065F46', marginTop: '4px' }}>Rs. {Number(viewPayment.amount || 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '4px' }}>Method: <strong>{viewPayment.paymentMethod}</strong> ({viewPayment.paymentType})</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Sales Member</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>{viewPayment.createdBy?.fullName || 'Sales Member'}</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Date</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>{viewPayment.paymentDate ? new Date(viewPayment.paymentDate).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>

            {viewPayment.notes && (
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Notes</div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>{viewPayment.notes}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <button
                onClick={() => downloadPaymentSlip(viewPayment)}
                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> Download Slip (PDF)
              </button>
              <button
                onClick={() => setViewPayment(null)}
                style={{ background: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

