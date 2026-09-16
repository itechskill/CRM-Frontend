import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiRequest } from '../../utils/api';
import { Plus, FileCheck, Edit2, Eye, Trash2, X, Save, Search, Calendar, User, DollarSign, UploadCloud, Link2, Download, FileSpreadsheet, FolderPlus, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './SalesViews.css';

const STATUS_COLORS = {
  Draft: '#64748B',
  Received: '#3B82F6',
  Linked: '#10B981',
  Processed: '#8B5CF6'
};

const EMPTY_FORM = {
  poNumber: '',
  customerName: '',
  poDate: '',
  quotationId: '',
  quotationNumber: '',
  amount: 0,
  notes: '',
  uploadedDocument: '',
  documentName: '',
  status: 'Received'
};

export default function SalesCustomerPOsView() {
  const [customerPOs, setCustomerPOs] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editPO, setEditPO] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [viewPO, setViewPO] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Convert to Product File modal state
  const [convertModalPO, setConvertModalPO] = useState(null);
  const [convertFileType, setConvertFileType] = useState('Blue');
  const [convertFileNumber, setConvertFileNumber] = useState('');
  const [convertNotes, setConvertNotes] = useState('');
  const [convertingToFile, setConvertingToFile] = useState(false);

  const fetchPOs = useCallback(async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/customer-pos');
      if (response.ok && data.success) {
        setCustomerPOs(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchQuotations = useCallback(async () => {
    try {
      const { response, data } = await apiRequest('/api/sales-employee/quotations');
      if (response.ok && data.success) {
        setQuotations(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchPOs();
    fetchQuotations();
  }, [fetchPOs, fetchQuotations]);

  const filteredPOs = useMemo(() => {
    return customerPOs.filter(po => {
      const matchesFilter = statusFilter === 'all' || po.status === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        (po.poNumber && po.poNumber.toLowerCase().includes(term)) ||
        (po.customerName && po.customerName.toLowerCase().includes(term)) ||
        (po.quotationNumber && po.quotationNumber.toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
    });
  }, [customerPOs, statusFilter, searchTerm]);

  // Summary totals for customer POs
  const totalPOAmount = useMemo(() => {
    return customerPOs.reduce((sum, po) => sum + (Number(po.amount) || 0), 0);
  }, [customerPOs]);

  const linkedPOsCount = useMemo(() => {
    return customerPOs.filter(po => po.status === 'Linked' || po.quotationNumber).length;
  }, [customerPOs]);

  const receivedPOsCount = useMemo(() => {
    return customerPOs.filter(po => po.status === 'Received').length;
  }, [customerPOs]);

  // Complete PDF Export with Mathematical Footer Totals
  const downloadCompleteCustomerPOsPDF = () => {
    const doc = new jsPDF('landscape');
    const records = filteredPOs;
    const totalFilteredAmount = records.reduce((s, p) => s + (Number(p.amount) || 0), 0);

    // Header styling
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 297, 24, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FORTLINE CRM - CUSTOMER PURCHASE ORDERS LEDGER REPORT', 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()} | Total Records: ${records.length} | Status Filter: ${statusFilter.toUpperCase()}`, 14, 31);

    const tableData = records.map(p => [
      p.poNumber || '—',
      p.customerName || '—',
      p.quotationNumber || '—',
      p.poDate ? new Date(p.poDate).toLocaleDateString() : '—',
      `Rs. ${Number(p.amount || 0).toLocaleString()}`,
      p.status || 'Received',
      p.notes ? (p.notes.length > 30 ? p.notes.substring(0, 30) + '...' : p.notes) : '—'
    ]);

    try {
      autoTable(doc, {
        head: [['PO Number', 'Customer Name', 'Linked Quotation', 'PO Date', 'Amount (PKR)', 'Status', 'Notes']],
        body: tableData,
        foot: [[
          { content: 'GRAND TOTAL / SUMMARY', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
          { content: `Rs. ${totalFilteredAmount.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], fillColor: [241, 245, 249] } },
          { content: `${records.length} POs`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } }
        ]],
        startY: 36,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
        theme: 'grid'
      });

      doc.save(`Customer_POs_Ledger_${new Date().toISOString().substring(0, 10)}.pdf`);
    } catch (err) {
      console.error('Customer POs PDF export error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Complete Excel Export with Summary Footer
  const downloadCompleteCustomerPOsExcel = () => {
    const records = filteredPOs;
    const totalFilteredAmount = records.reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const headers = ['PO Number', 'Customer Name', 'Linked Quotation', 'PO Date', 'Amount (PKR)', 'Status', 'Notes'];
    const rows = records.map(p => [
      `"${p.poNumber || ''}"`,
      `"${(p.customerName || '').replace(/"/g, '""')}"`,
      `"${p.quotationNumber || ''}"`,
      `"${p.poDate ? new Date(p.poDate).toLocaleDateString() : ''}"`,
      Number(p.amount || 0),
      `"${p.status || ''}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);

    const summaryRow = [
      '"TOTAL"',
      `"Total Records: ${records.length}"`,
      '""',
      '""',
      totalFilteredAmount,
      '""',
      '""'
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(',')), summaryRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Customer_POs_Ledger_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openCreate = () => {
    const today = new Date().toISOString().substring(0, 10);
    setForm({ ...EMPTY_FORM, poDate: today });
    setEditPO(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (po) => {
    setForm({
      poNumber: po.poNumber || '',
      customerName: po.customerName || '',
      poDate: po.poDate ? new Date(po.poDate).toISOString().substring(0, 10) : '',
      quotationId: po.quotationId?._id || po.quotationId || '',
      quotationNumber: po.quotationNumber || '',
      amount: po.amount || 0,
      notes: po.notes || '',
      uploadedDocument: po.uploadedDocument || '',
      documentName: po.documentName || '',
      status: po.status || 'Received'
    });
    setEditPO(po);
    setError('');
    setShowModal(true);
  };

  const handleQuotationChange = (qId) => {
    const selected = quotations.find(q => q._id === qId);
    if (selected) {
      setForm(prev => ({
        ...prev,
        quotationId: qId,
        quotationNumber: selected.orderReference || selected.quotationNumber || '',
        customerName: prev.customerName || selected.clientName || '',
        amount: prev.amount || selected.netAmount || selected.totalAmount || 0
      }));
    } else {
      setForm(prev => ({ ...prev, quotationId: '', quotationNumber: '' }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        amount: Number(form.amount) || 0,
        poDate: form.poDate || null
      };
      const url = editPO ? `/api/sales-employee/customer-pos/${editPO._id}` : '/api/sales-employee/customer-pos';
      const method = editPO ? 'PATCH' : 'POST';
      const { response, data } = await apiRequest(url, { method, body: JSON.stringify(payload) });
      if (response.ok && data.success) {
        setShowModal(false);
        setFeedback(editPO ? `Customer PO ${editPO.poNumber} updated.` : 'Customer PO recorded successfully.');
        setTimeout(() => setFeedback(''), 3000);
        fetchPOs();
      } else {
        setError(data.message || 'Failed to save Customer PO.');
      }
    } catch (e) {
      setError('Server error.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenConvertToFile = (po) => {
    setConvertModalPO(po);
    setConvertFileType('Blue');
    setConvertFileNumber('');
    setConvertNotes(po.notes || '');
    setError('');
  };

  const handleConfirmConvertToFile = async (e) => {
    e.preventDefault();
    if (!convertModalPO) return;
    setConvertingToFile(true);
    setError('');
    setFeedback('');
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/customer-pos/${convertModalPO._id}/convert-to-file`, {
        method: 'POST',
        body: JSON.stringify({
          fileType: convertFileType,
          fileNumber: convertFileNumber,
          notes: convertNotes
        })
      });
      if (response.ok && data.success) {
        setFeedback(data.message || `Customer PO successfully converted to ${convertFileType} Product File!`);
        setCustomerPOs(prev => prev.map(p => p._id === convertModalPO._id ? {
          ...p,
          status: 'Processed',
          productFileId: data.data?.file?._id
        } : p));
        setConvertModalPO(null);
        setTimeout(() => setFeedback(''), 4000);
      } else {
        setError(data.message || 'Failed to convert Customer PO to Product File.');
      }
    } catch (err) {
      setError(err.message || 'Server error converting Customer PO to Product File.');
    } finally {
      setConvertingToFile(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/customer-pos/${deleteTarget._id}`, { method: 'DELETE' });
      if (response.ok && data.success) {
        setFeedback(`Customer PO "${deleteTarget.poNumber}" deleted.`);
        setDeleteTarget(null);
        fetchPOs();
        setTimeout(() => setFeedback(''), 3000);
      } else {
        setFeedback(data.message || 'Failed to delete.');
      }
    } catch (e) {
      setFeedback('Server error.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><FileCheck size={20} /> Customer Purchase Orders</h2>
          <p className="sv-subtitle">Formal purchase orders received from customers linked to quotations</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button className="sv-btn-secondary" onClick={downloadCompleteCustomerPOsPDF} title="Download Complete POs Report (PDF)">
            <Download size={15} color="#DC2626" /> Export PDF
          </button>
          <button className="sv-btn-secondary" onClick={downloadCompleteCustomerPOsExcel} title="Download Complete POs Report (Excel)">
            <FileSpreadsheet size={15} color="#059669" /> Export Excel
          </button>
          <button className="sv-btn-primary" onClick={openCreate}><Plus size={16} /> Record Customer PO</button>
        </div>
      </div>

      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '8px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px' }}>
          {feedback}
        </div>
      )}

      {/* KPI Cards */}
      <div className="sv-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="sv-kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Customer POs</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{customerPOs.length}</div>
        </div>
        <div className="sv-kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total PO Value</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>Rs. {totalPOAmount.toLocaleString()}</div>
        </div>
        <div className="sv-kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Linked to Quotations</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>{linkedPOsCount}</div>
        </div>
        <div className="sv-kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Received Status</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8B5CF6', marginTop: '4px' }}>{receivedPOsCount}</div>
        </div>
      </div>

      <div className="sv-filters">
        <div className="sv-search-box">
          <Search size={15} />
          <input placeholder="Search PO #, Customer, Quotation..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="sv-status-tabs">
          {['all', 'Received', 'Linked', 'Processed', 'Draft'].map(s => (
            <button key={s} className={`sv-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="sv-loading">Loading Customer POs...</div> : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Customer</th>
                <th>Linked Quotation</th>
                <th>PO Date</th>
                <th>Amount (PKR)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOs.length === 0 ? (
                <tr><td colSpan={7} className="sv-empty">No Customer POs recorded. Record your first PO after customer sends acceptance!</td></tr>
              ) : filteredPOs.map(po => (
                <tr key={po._id}>
                  <td className="sv-name" style={{ fontWeight: 700, color: '#1E293B' }}>{po.poNumber || '—'}</td>
                  <td>{po.customerName}</td>
                  <td>
                    {po.quotationNumber ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                        <Link2 size={12} /> {po.quotationNumber}
                      </span>
                    ) : '—'}
                  </td>
                  <td>{po.poDate ? new Date(po.poDate).toLocaleDateString() : '—'}</td>
                  <td style={{ fontWeight: 700, color: '#059669' }}>Rs. {Number(po.amount || 0).toLocaleString()}</td>
                  <td>
                    <span className="sv-badge" style={{ background: (STATUS_COLORS[po.status] || '#64748B') + '22', color: STATUS_COLORS[po.status] || '#64748B', border: `1px solid ${(STATUS_COLORS[po.status] || '#64748B')}44` }}>
                      {po.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {po.status !== 'Processed' ? (
                        <button
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#2563EB',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '5px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          onClick={() => handleOpenConvertToFile(po)}
                          title="Convert Customer PO to Product File"
                        >
                          <FolderPlus size={12} /> Convert to File
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#8B5CF6', fontWeight: 600 }}>
                          Processed
                        </span>
                      )}
                      <button className="sv-btn-action-icon" onClick={() => setViewPO(po)} title="View Details"><Eye size={14} /></button>
                      <button className="sv-btn-action-icon" onClick={() => openEdit(po)} title="Edit PO"><Edit2 size={14} /></button>
                      <button className="sv-btn-action-icon" onClick={() => setDeleteTarget(po)} title="Delete PO" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredPOs.length > 0 && (
              <tfoot>
                <tr style={{ background: '#F8FAFC', fontWeight: 700, borderTop: '2px solid #E2E8F0' }}>
                  <td colSpan={4} style={{ textAlign: 'right', padding: '12px', color: '#475569' }}>TOTAL AMOUNT:</td>
                  <td style={{ color: '#059669', padding: '12px' }}>
                    Rs. {filteredPOs.reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString()}
                  </td>
                  <td colSpan={2} style={{ color: '#64748B', padding: '12px', fontSize: '0.85rem' }}>
                    {filteredPOs.length} Records
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewPO && (
        <div className="sv-modal-overlay" onClick={() => setViewPO(null)}>
          <div className="sv-modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={18} color="#3B82F6" />
                <h3 style={{ margin: 0 }}>Customer PO: {viewPO.poNumber}</h3>
              </div>
              <button onClick={() => setViewPO(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>{viewPO.customerName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '2px' }}>
                    PO Date: {viewPO.poDate ? new Date(viewPO.poDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <span className="sv-badge" style={{ background: (STATUS_COLORS[viewPO.status] || '#64748B') + '22', color: STATUS_COLORS[viewPO.status] || '#64748B', border: `1px solid ${(STATUS_COLORS[viewPO.status] || '#64748B')}44`, fontSize: '0.85rem', padding: '5px 12px' }}>
                  {viewPO.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>PO Amount</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>Rs. {Number(viewPO.amount || 0).toLocaleString()}</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>Linked Quotation</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>{viewPO.quotationNumber || 'None'}</div>
                </div>
              </div>

              {viewPO.notes && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>{viewPO.notes}</div>
                </div>
              )}

              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setViewPO(null)}>Close</button>
                {viewPO.status !== 'Processed' && (
                  <button
                    className="sv-btn-primary"
                    style={{ background: '#2563EB' }}
                    onClick={() => {
                      const target = viewPO;
                      setViewPO(null);
                      handleOpenConvertToFile(target);
                    }}
                  >
                    <FolderPlus size={14} /> Convert to Product File
                  </button>
                )}
                <button className="sv-btn-primary" onClick={() => { setViewPO(null); openEdit(viewPO); }}>
                  <Edit2 size={14} /> Edit PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3>{editPO ? 'Edit Customer PO' : 'Record Customer PO'}</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="sv-error">{error}</div>}
            <form onSubmit={handleSave} className="sv-form">
              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Customer PO Number</label>
                  <input value={form.poNumber} onChange={e => setForm(p => ({ ...p, poNumber: e.target.value }))} placeholder="Auto-generated if empty (e.g. CPO-0001)" />
                </div>
                <div className="sv-field">
                  <label>Customer Name *</label>
                  <input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} placeholder="Customer / Company name" required />
                </div>
              </div>

              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Link with Quotation</label>
                  <select value={form.quotationId} onChange={e => handleQuotationChange(e.target.value)}>
                    <option value="">-- Select Quotation --</option>
                    {quotations.map(q => (
                      <option key={q._id} value={q._id}>
                        {q.orderReference || q.quotationNumber} - {q.clientName} (Rs. {Number(q.netAmount || q.totalAmount || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sv-field">
                  <label>PO Date</label>
                  <input type="date" value={form.poDate} onChange={e => setForm(p => ({ ...p, poDate: e.target.value }))} />
                </div>
              </div>

              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Amount (PKR) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" required />
                </div>
                <div className="sv-field">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="Received">Received</option>
                    <option value="Linked">Linked</option>
                    <option value="Processed">Processed</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="sv-field">
                <label>Notes / Scope Details</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Customer PO terms, special conditions, item details..." />
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Customer PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONVERT CUSTOMER PO TO PRODUCT FILE MODAL */}
      {convertModalPO && (
        <div className="sv-modal-overlay" onClick={() => setConvertModalPO(null)}>
          <div className="sv-modal" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderPlus size={20} color="#2563EB" />
                <h3 style={{ margin: 0 }}>Convert to Product File</h3>
              </div>
              <button onClick={() => setConvertModalPO(null)}><X size={18} /></button>
            </div>

            {error && (
              <div className="sv-error" style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #FECACA', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleConfirmConvertToFile} className="sv-form">
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Customer Purchase Order Linkage</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
                  PO #: {convertModalPO.poNumber} — {convertModalPO.customerName}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
                  Amount: Rs. {Number(convertModalPO.amount || 0).toLocaleString()} PKR {convertModalPO.quotationNumber ? `(Quotation: ${convertModalPO.quotationNumber})` : ''}
                </div>
              </div>

              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>File Type *</label>
                  <select value={convertFileType} onChange={e => setConvertFileType(e.target.value)}>
                    <option value="Blue">Blue File (Standard / Routine Scope)</option>
                    <option value="Green">Green File (Special / Custom Requirements)</option>
                    <option value="Yellow">Yellow File (Urgent / Express Track)</option>
                  </select>
                </div>
                <div className="sv-field">
                  <label>File Number</label>
                  <input
                    value={convertFileNumber}
                    onChange={e => setConvertFileNumber(e.target.value)}
                    placeholder="Auto-generated if empty (e.g. 1016 Green)"
                  />
                </div>
              </div>

              <div className="sv-field">
                <label>Production / Job Instructions</label>
                <textarea
                  rows={3}
                  value={convertNotes}
                  onChange={e => setConvertNotes(e.target.value)}
                  placeholder="Job specifications, routing instructions, special packaging..."
                />
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setConvertModalPO(null)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" style={{ background: '#2563EB' }} disabled={convertingToFile}>
                  <FolderPlus size={15} /> {convertingToFile ? 'Converting...' : 'Confirm & Move to Product File'}
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
                <h3 style={{ margin: 0 }}>Delete Customer PO</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className="sv-form">
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 16px' }}>
                Are you sure you want to permanently delete Customer PO <strong>{deleteTarget.poNumber}</strong> for <strong>{deleteTarget.customerName}</strong>?
              </p>
              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="sv-btn-primary" onClick={handleDelete} disabled={deleting} style={{ background: '#EF4444' }}>
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete PO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
