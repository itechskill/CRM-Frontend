import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../../utils/api';
import { Plus, FileText, Edit2, X, Save, Eye, Trash2, Search, Calendar, User, Hash, Tag, DollarSign, CheckCircle2, ArrowRight, FileCheck, Layers, Info, Building, Download } from 'lucide-react';
import './SalesViews.css';

const STATUS_COLORS = {
  Quotation: '#2563EB',
  Draft: '#64748B',
  Sent: '#0284C7',
  'Under Review': '#8B5CF6',
  Accepted: '#10B981',
  Rejected: '#EF4444',
  Expired: '#F59E0B'
};

const EMPTY_FORM = {
  orderReference: '',
  clientName: '',
  salePerson: '',
  fileNo: '',
  productSummary: '',
  clientEmail: '',
  clientPhone: '',
  totalAmount: 0,
  netAmount: 0,
  status: 'Quotation',
  creationDate: '',
  validUntil: '',
  notes: ''
};

export default function SalesQuotationsView() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [viewQ, setViewQ] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [recordingPO, setRecordingPO] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchQ = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const { response, data } = await apiRequest(`/api/sales-employee/quotations${params}`);
      if (response.ok && data.success) {
        setQuotations(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchQ();
  }, [fetchQ]);

  // Comprehensive search matching exact PDF columns
  const filteredQuotations = useMemo(() => {
    if (!searchTerm.trim()) return quotations;
    const term = searchTerm.toLowerCase();
    return quotations.filter(q =>
      (q.orderReference && q.orderReference.toLowerCase().includes(term)) ||
      (q.quotationNumber && q.quotationNumber.toLowerCase().includes(term)) ||
      (q.clientName && q.clientName.toLowerCase().includes(term)) ||
      (q.customerName && q.customerName.toLowerCase().includes(term)) ||
      (q.salePerson && q.salePerson.toLowerCase().includes(term)) ||
      (q.createdBy?.fullName && q.createdBy.fullName.toLowerCase().includes(term)) ||
      (q.productSummary && q.productSummary.toLowerCase().includes(term)) ||
      (q.fileNo && q.fileNo.toLowerCase().includes(term))
    );
  }, [quotations, searchTerm]);

  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage) || 1;
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuotations.slice(start, start + itemsPerPage);
  }, [filteredQuotations, currentPage]);

  const openCreate = () => {
    const today = new Date().toISOString().substring(0, 10);
    setForm({ ...EMPTY_FORM, creationDate: today });
    setEditQ(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (q) => {
    setForm({
      orderReference: q.orderReference || q.quotationNumber || '',
      clientName: q.clientName || q.customerName || '',
      salePerson: q.salePerson || q.createdBy?.fullName || '',
      fileNo: q.fileNo || '',
      productSummary: q.productSummary || '',
      clientEmail: q.clientEmail || '',
      clientPhone: q.clientPhone || '',
      totalAmount: q.totalAmount || q.netAmount || 0,
      netAmount: q.netAmount || q.totalAmount || 0,
      status: q.status || 'Quotation',
      creationDate: q.creationDate ? new Date(q.creationDate).toISOString().substring(0, 10) : '',
      validUntil: q.validUntil ? new Date(q.validUntil).toISOString().substring(0, 10) : '',
      notes: q.notes || ''
    });
    setEditQ(q);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.clientName.trim()) {
      setError('Customer / Client name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        totalAmount: Number(form.totalAmount) || Number(form.netAmount) || 0,
        netAmount: Number(form.netAmount) || Number(form.totalAmount) || 0,
        creationDate: form.creationDate || null,
        validUntil: form.validUntil || null
      };
      const url = editQ ? `/api/sales-employee/quotations/${editQ._id}` : '/api/sales-employee/quotations';
      const method = editQ ? 'PATCH' : 'POST';
      const { response, data } = await apiRequest(url, { method, body: JSON.stringify(payload) });
      if (response.ok && data.success) {
        setShowModal(false);
        fetchQ();
      } else {
        setError(data.message || 'Failed to save quotation.');
      }
    } catch (e) {
      setError('Server error.');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordCustomerPO = async (q) => {
    setRecordingPO(true);
    try {
      const poPayload = {
        customerName: q.clientName || q.customerName,
        quotationId: q._id,
        quotationNumber: q.orderReference || q.quotationNumber,
        amount: q.netAmount || q.totalAmount || 0,
        notes: `Customer PO against Quotation: ${q.orderReference || q.quotationNumber}`,
        status: 'Received'
      };
      const { response, data } = await apiRequest('/api/sales-employee/customer-pos', {
        method: 'POST',
        body: JSON.stringify(poPayload)
      });
      if (response.ok && data.success) {
        await apiRequest(`/api/sales-employee/quotations/${q._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'Accepted' })
        });
        setFeedback(`Customer PO "${data.data.poNumber}" recorded and linked to Quotation!`);
        setViewQ(null);
        fetchQ();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        setFeedback(data.message || 'Failed to record Customer PO.');
      }
    } catch (e) {
      setFeedback('Error recording customer PO.');
    } finally {
      setRecordingPO(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/quotations/${deleteTarget._id}`, { method: 'DELETE' });
      if (response.ok && data.success) {
        setFeedback(`Quotation "${deleteTarget.orderReference || deleteTarget.quotationNumber}" deleted.`);
        setDeleteTarget(null);
        fetchQ();
        setTimeout(() => setFeedback(''), 3000);
      } else {
        setFeedback(data.message || 'Failed to delete quotation.');
      }
    } catch (e) {
      setFeedback('Server error.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadSinglePDF = (q) => {
    const doc = new jsPDF();
    const orderRef = q.orderReference || q.quotationNumber || 'QUO-001';
    const customer = q.clientName || q.customerName || 'Client Organization';
    const salePerson = q.salePerson || q.createdBy?.fullName || 'Sales Executive';
    const fileNo = q.fileNo || '—';
    const creationDate = q.creationDate ? new Date(q.creationDate).toLocaleDateString('en-GB') : (q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-GB') : '—');
    const validUntil = q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-GB') : '—';
    const totalAmount = Number(q.totalAmount || q.netAmount || 0);

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FORTLINE CRM - FORMAL QUOTATION', 14, 18);

    // Document Meta Box
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`Quotation Ref #: ${orderRef}`, 14, 38);
    doc.text(`Date Issued: ${creationDate}`, 14, 44);
    doc.text(`Valid Until: ${validUntil}`, 14, 50);

    doc.text(`Customer / Client: ${customer}`, 120, 38);
    doc.text(`Sales Representative: ${salePerson}`, 120, 44);
    doc.text(`Product File: ${fileNo}`, 120, 50);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 56, 196, 56);

    const items = q.items && q.items.length ? q.items : [
      { description: q.productSummary || 'Scope of Supply Items', quantity: 1, unitPrice: totalAmount, total: totalAmount }
    ];

    const tableRows = items.map((it, idx) => [
      idx + 1,
      it.description || it.product || q.productSummary || 'Product Scope',
      it.quantity || 1,
      `Rs. ${Number(it.unitPrice || totalAmount).toLocaleString()}`,
      `Rs. ${Number(it.total || (it.quantity || 1) * (it.unitPrice || totalAmount)).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 62,
      head: [['#', 'Item Description / Scope', 'Qty', 'Unit Price (PKR)', 'Total Amount (PKR)']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.previous.finalY : 120;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`Total Amount (PKR): Rs. ${totalAmount.toLocaleString()}`, 120, finalY + 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Quotation Status: ${q.status || 'Active'}`, 14, finalY + 14);

    if (q.notes) {
      doc.text(`Terms & Conditions / Notes: ${q.notes}`, 14, finalY + 22);
    }

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated by Fortline CRM · Commercial Sales Management System', 14, 285);

    doc.save(`Quotation_${orderRef}.pdf`);
  };

  const statuses = ['all', 'Quotation', 'Draft', 'Sent', 'Under Review', 'Accepted', 'Rejected', 'Expired'];

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><FileText size={20} /> Formal Quotations</h2>
          <p className="sv-subtitle">Complete Quotations log — matching historic file records & connected to Customer PO workflow</p>
        </div>
        <button className="sv-btn-primary" onClick={openCreate}><Plus size={16} /> New Quotation</button>
      </div>

      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#059669" /> {feedback}
        </div>
      )}

      <div className="sv-filters">
        <div className="sv-search-box">
          <Search size={15} />
          <input placeholder="Search Order Reference, Customer, Sale Person, Product Summary, File-No#..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
        </div>
        <div className="sv-status-tabs">
          {statuses.map(s => (
            <button key={s} className={`sv-tab ${filter === s ? 'active' : ''}`} onClick={() => { setFilter(s); setCurrentPage(1); }}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="sv-loading">Loading quotations...</div> : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Order Reference</th>
                <th>Creation Date</th>
                <th>Customer</th>
                <th>Sale Person</th>
                <th>File-No#</th>
                <th>Product Summary</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQuotations.length === 0 ? (
                <tr><td colSpan={9} className="sv-empty">No quotations found. Create your first quotation!</td></tr>
              ) : paginatedQuotations.map(q => {
                const badgeColor = STATUS_COLORS[q.status] || '#64748B';
                const orderRef = q.orderReference || q.quotationNumber || '—';
                const customer = q.clientName || q.customerName || '—';
                const salePerson = q.salePerson || q.createdBy?.fullName || '—';
                const fileNo = q.fileNo || '—';
                const productSummary = q.productSummary || '—';
                const total = q.totalAmount || q.netAmount || 0;

                return (
                  <tr key={q._id}>
                    <td className="sv-name" style={{ fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>{orderRef}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#64748B' }}>
                      {q.creationDate ? new Date(q.creationDate).toLocaleString() : (q.createdAt ? new Date(q.createdAt).toLocaleString() : '—')}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{customer}</td>
                    <td>{salePerson}</td>
                    <td>
                      {fileNo !== '—' ? (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: fileNo.toLowerCase().includes('green') ? '#ECFDF5' : (fileNo.toLowerCase().includes('blue') ? '#EFF6FF' : '#F1F5F9'),
                          color: fileNo.toLowerCase().includes('green') ? '#047857' : (fileNo.toLowerCase().includes('blue') ? '#1D4ED8' : '#334155')
                        }}>
                          {fileNo}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '0.82rem', color: '#334155' }} title={productSummary}>
                      {productSummary}
                    </td>
                    <td style={{ fontWeight: 800, color: '#059669', whiteSpace: 'nowrap' }}>
                      Rs. {Number(total).toLocaleString()}
                    </td>
                    <td>
                      <span className="sv-badge" style={{ background: badgeColor + '18', color: badgeColor, border: `1px solid ${badgeColor}33` }}>
                        {q.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          className="sv-btn-action-icon"
                          style={{ color: '#2563EB', background: '#EFF6FF' }}
                          onClick={() => handleDownloadSinglePDF(q)}
                          title="Download Quotation PDF"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="sv-btn-action-icon"
                          style={{ color: '#059669', background: '#ECFDF5' }}
                          onClick={() => handleRecordCustomerPO(q)}
                          disabled={recordingPO}
                          title="Record Customer PO"
                        >
                          <FileCheck size={14} />
                        </button>
                        <button className="sv-btn-action-icon" onClick={() => setViewQ(q)} title="View Details"><Eye size={14} /></button>
                        <button className="sv-btn-action-icon" onClick={() => openEdit(q)} title="Edit Quotation"><Edit2 size={14} /></button>
                        <button className="sv-btn-action-icon" onClick={() => setDeleteTarget(q)} title="Delete Quotation" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredQuotations.length)} of {filteredQuotations.length} records
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '0.8rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '0.8rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODAL */}
      {viewQ && (
        <div className="sv-modal-overlay" onClick={() => setViewQ(null)}>
          <div className="sv-modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#2563EB" />
                <h3 style={{ margin: 0 }}>Quotation: {viewQ.orderReference || viewQ.quotationNumber}</h3>
              </div>
              <button onClick={() => setViewQ(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{viewQ.clientName || viewQ.customerName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Sale Person: {viewQ.salePerson || viewQ.createdBy?.fullName || 'Sales Rep'}</div>
                </div>
                <span className="sv-badge" style={{ background: (STATUS_COLORS[viewQ.status] || '#64748B') + '22', color: STATUS_COLORS[viewQ.status] || '#64748B', border: `1px solid ${(STATUS_COLORS[viewQ.status] || '#64748B')}44`, fontSize: '0.85rem', padding: '4px 12px' }}>
                  {viewQ.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Total Amount</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>Rs. {Number(viewQ.totalAmount || viewQ.netAmount || 0).toLocaleString()}</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>File-No#</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>{viewQ.fileNo || '—'}</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Creation Date</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                    {viewQ.creationDate ? new Date(viewQ.creationDate).toLocaleDateString() : (viewQ.createdAt ? new Date(viewQ.createdAt).toLocaleDateString() : 'N/A')}
                  </div>
                </div>
              </div>

              {viewQ.productSummary && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>Product Summary</div>
                  <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>{viewQ.productSummary}</div>
                </div>
              )}

              {viewQ.notes && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>Terms & Remarks</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>{viewQ.notes}</div>
                </div>
              )}

              <div className="sv-modal-actions" style={{ marginTop: '16px' }}>
                <button className="sv-btn-cancel" onClick={() => setViewQ(null)}>Close</button>
                <button
                  className="sv-btn-primary"
                  style={{ background: '#2563EB' }}
                  onClick={() => handleDownloadSinglePDF(viewQ)}
                >
                  <Download size={14} /> Download PDF
                </button>
                <button
                  className="sv-btn-primary"
                  style={{ background: '#059669' }}
                  onClick={() => handleRecordCustomerPO(viewQ)}
                  disabled={recordingPO}
                >
                  <FileCheck size={14} /> {recordingPO ? 'Recording PO...' : 'Record Customer PO'}
                </button>
                <button className="sv-btn-primary" onClick={() => { setViewQ(null); openEdit(viewQ); }}>
                  <Edit2 size={14} /> Edit Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL - BEAUTIFUL STRUCTURED CSS */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  {editQ ? `Edit Quotation (${editQ.orderReference || editQ.quotationNumber})` : 'New Quotation'}
                </h3>
                <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                  Enter quotation details matching business format and workflow
                </p>
              </div>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="sv-error" style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #FECACA', marginBottom: '14px' }}>{error}</div>}
            
            <form onSubmit={handleSave} className="sv-form">
              {/* Section 1: Customer & Quotation Details */}
              <div className="sv-form-section">
                <div className="sv-form-section-title"><Building size={14} color="#2563EB" /> Customer & Identification</div>
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Order Reference #</label>
                    <input value={form.orderReference} onChange={e => setForm(p => ({ ...p, orderReference: e.target.value }))} placeholder="e.g. S01724" />
                  </div>
                  <div className="sv-field">
                    <label>Customer Name *</label>
                    <input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Company / Customer name" required />
                  </div>
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Sale Person</label>
                    <input value={form.salePerson} onChange={e => setForm(p => ({ ...p, salePerson: e.target.value }))} placeholder="e.g. Wasim Bhatti LHR" />
                  </div>
                  <div className="sv-field">
                    <label>File-No#</label>
                    <input value={form.fileNo} onChange={e => setForm(p => ({ ...p, fileNo: e.target.value }))} placeholder="e.g. 1016 Green / 1014 Blue" />
                  </div>
                </div>
              </div>

              {/* Section 2: Products & Financials */}
              <div className="sv-form-section">
                <div className="sv-form-section-title"><DollarSign size={14} color="#059669" /> Products & Quotation Value</div>
                <div className="sv-field">
                  <label>Product Summary *</label>
                  <textarea rows={2} value={form.productSummary} onChange={e => setForm(p => ({ ...p, productSummary: e.target.value }))} placeholder="e.g. 512 GB SSD / Dell PowerEdge R760" required />
                </div>

                <div className="sv-grid-3">
                  <div className="sv-field">
                    <label>Total (PKR) *</label>
                    <input type="number" value={form.totalAmount} onChange={e => setForm(p => ({ ...p, totalAmount: e.target.value, netAmount: e.target.value }))} placeholder="0" required />
                  </div>
                  <div className="sv-field">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="Quotation">Quotation</option>
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                  <div className="sv-field">
                    <label>Creation Date</label>
                    <input type="date" value={form.creationDate} onChange={e => setForm(p => ({ ...p, creationDate: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Section 3: Contact & Notes */}
              <div className="sv-form-section">
                <div className="sv-form-section-title"><Info size={14} color="#6366F1" /> Contact Info & Terms</div>
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Client Email</label>
                    <input type="email" value={form.clientEmail} onChange={e => setForm(p => ({ ...p, clientEmail: e.target.value }))} placeholder="procurement@client.com" />
                  </div>
                  <div className="sv-field">
                    <label>Client Phone</label>
                    <input value={form.clientPhone} onChange={e => setForm(p => ({ ...p, clientPhone: e.target.value }))} placeholder="+92 300 0000000" />
                  </div>
                </div>
                <div className="sv-field">
                  <label>Notes & Conditions</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Payment terms, delivery timeline..." />
                </div>
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Quotation'}
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
                <h3 style={{ margin: 0 }}>Delete Quotation</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className="sv-form">
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 16px' }}>
                Are you sure you want to permanently delete quotation <strong>{deleteTarget.orderReference || deleteTarget.quotationNumber}</strong>?
              </p>
              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="sv-btn-primary" onClick={handleDelete} disabled={deleting} style={{ background: '#EF4444' }}>
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Quotation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
