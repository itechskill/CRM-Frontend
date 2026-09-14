import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiRequest } from '../../utils/api';
import {
  Plus,
  FolderPlus,
  Edit2,
  Eye,
  Trash2,
  X,
  Save,
  Search,
  FileText,
  Link2,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  ShoppingCart,
  CheckCircle2,
  Building,
  Package,
  FileCheck,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './SalesViews.css';

const STATUS_COLORS = {
  Active: '#10B981',
  'In Progress': '#3B82F6',
  Completed: '#6366F1',
  Cancelled: '#EF4444'
};

const EMPTY_PRODUCT = { name: '', quantity: 1, unit: 'pcs', description: '' };

const EMPTY_FORM = {
  fileNumber: '',
  fileType: 'Blue',
  customerName: '',
  quotationId: '',
  quotationNumber: '',
  customerPOId: '',
  customerPONumber: '',
  salesOrderId: '',
  salesOrderNumber: '',
  products: [{ ...EMPTY_PRODUCT }],
  notes: '',
  status: 'Active'
};

export default function SalesProductFilesView({ onNavigateToSalesOrders }) {
  const [productFiles, setProductFiles] = useState([]);
  const [customerPOs, setCustomerPOs] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editFile, setEditFile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [viewFile, setViewFile] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Quick Create Sales Order pre-fill modal state
  const [soPreFillModal, setSoPreFillModal] = useState(null);
  const [creatingSO, setCreatingSO] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/product-files');
      if (response.ok && data.success) {
        setProductFiles(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching product files:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDependencies = useCallback(async () => {
    try {
      const [poRes, qRes, ordRes] = await Promise.all([
        apiRequest('/api/sales-employee/customer-pos'),
        apiRequest('/api/sales-employee/quotations'),
        apiRequest('/api/sales-employee/orders')
      ]);
      if (poRes.response.ok && poRes.data.success) setCustomerPOs(poRes.data.data || []);
      if (qRes.response.ok && qRes.data.success) setQuotations(qRes.data.data || []);
      if (ordRes.response.ok && ordRes.data.success) setOrders(ordRes.data.data || []);
    } catch (e) {
      console.error('Error fetching dependencies:', e);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
    fetchDependencies();
  }, [fetchFiles, fetchDependencies]);

  const filteredFiles = useMemo(() => {
    return productFiles.filter(pf => {
      const matchesType = typeFilter === 'all' || pf.fileType === typeFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        (pf.fileNumber && pf.fileNumber.toLowerCase().includes(term)) ||
        (pf.customerName && pf.customerName.toLowerCase().includes(term)) ||
        (pf.customerPONumber && pf.customerPONumber.toLowerCase().includes(term)) ||
        (pf.quotationNumber && pf.quotationNumber.toLowerCase().includes(term)) ||
        (pf.salesOrderNumber && pf.salesOrderNumber.toLowerCase().includes(term));
      return matchesType && matchesSearch;
    });
  }, [productFiles, typeFilter, searchTerm]);

  // Derived metrics
  const blueFilesCount = useMemo(() => productFiles.filter(f => f.fileType === 'Blue').length, [productFiles]);
  const greenFilesCount = useMemo(() => productFiles.filter(f => f.fileType === 'Green').length, [productFiles]);
  const totalProductsCount = useMemo(() => {
    return productFiles.reduce((sum, pf) => sum + (pf.products?.length || 0), 0);
  }, [productFiles]);

  // Complete PDF Export with Mathematical Footer Totals
  const downloadCompleteProductFilesPDF = () => {
    const doc = new jsPDF('landscape');
    const records = filteredFiles;
    const totalFilteredItems = records.reduce((s, pf) => s + (pf.products?.length || 0), 0);

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 297, 24, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FORTLINE CRM - PRODUCT FILES LEDGER REPORT (BLUE & GREEN)', 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()} | Total Files: ${records.length} | Blue: ${blueFilesCount} | Green: ${greenFilesCount}`, 14, 31);

    const tableData = records.map(pf => [
      pf.fileNumber || '—',
      `${pf.fileType} File`,
      pf.customerName || '—',
      pf.customerPONumber || '—',
      pf.quotationNumber || '—',
      pf.salesOrderNumber || '—',
      `${pf.products?.length || 0} items`,
      pf.status || 'Active'
    ]);

    try {
      autoTable(doc, {
        head: [['File #', 'Type', 'Customer Name', 'Customer PO #', 'Quotation Ref', 'Sales Order #', 'Items Count', 'Status']],
        body: tableData,
        foot: [[
          { content: 'GRAND TOTAL / SUMMARY', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
          { content: `${totalFilteredItems} Items`, styles: { halign: 'center', fontStyle: 'bold', textColor: [5, 150, 105], fillColor: [241, 245, 249] } },
          { content: `${records.length} Files`, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } }
        ]],
        startY: 36,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
        theme: 'grid'
      });

      doc.save(`Product_Files_Ledger_${new Date().toISOString().substring(0, 10)}.pdf`);
    } catch (err) {
      console.error('Product Files PDF export error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Complete Excel Export with Summary Footer
  const downloadCompleteProductFilesExcel = () => {
    const records = filteredFiles;
    const totalFilteredItems = records.reduce((s, pf) => s + (pf.products?.length || 0), 0);

    const headers = ['File Number', 'File Type', 'Customer Name', 'Customer PO #', 'Quotation Ref', 'Sales Order #', 'Items Count', 'Status', 'Notes'];
    const rows = records.map(pf => [
      `"${pf.fileNumber || ''}"`,
      `"${pf.fileType || ''}"`,
      `"${(pf.customerName || '').replace(/"/g, '""')}"`,
      `"${pf.customerPONumber || ''}"`,
      `"${pf.quotationNumber || ''}"`,
      `"${pf.salesOrderNumber || ''}"`,
      pf.products?.length || 0,
      `"${pf.status || ''}"`,
      `"${(pf.notes || '').replace(/"/g, '""')}"`
    ]);

    const summaryRow = [
      '"TOTAL"',
      `"Total Files: ${records.length}"`,
      '""',
      '""',
      '""',
      '""',
      totalFilteredItems,
      '""',
      '""'
    ];

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      summaryRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Product_Files_Ledger_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
  };

  const openCreate = (fileType = 'Blue') => {
    const defaultNum = `${fileType === 'Blue' ? 'BF' : 'GF'}-${String(productFiles.length + 1).padStart(4, '0')}`;
    setForm({
      ...EMPTY_FORM,
      fileType,
      fileNumber: defaultNum,
      products: [{ ...EMPTY_PRODUCT }]
    });
    setEditFile(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (pf) => {
    setForm({
      fileNumber: pf.fileNumber || '',
      fileType: pf.fileType || 'Blue',
      customerName: pf.customerName || '',
      quotationId: pf.quotationId?._id || pf.quotationId || '',
      quotationNumber: pf.quotationNumber || '',
      customerPOId: pf.customerPOId?._id || pf.customerPOId || '',
      customerPONumber: pf.customerPONumber || '',
      salesOrderId: pf.salesOrderId?._id || pf.salesOrderId || '',
      salesOrderNumber: pf.salesOrderNumber || '',
      products: pf.products && pf.products.length ? pf.products.map(p => ({
        name: p.name || '',
        quantity: p.quantity || 1,
        unit: p.unit || 'pcs',
        description: p.description || ''
      })) : [{ ...EMPTY_PRODUCT }],
      notes: pf.notes || '',
      status: pf.status || 'Active'
    });
    setEditFile(pf);
    setError('');
    setShowModal(true);
  };

  const handlePOChange = (poId) => {
    const selected = customerPOs.find(p => p._id === poId);
    if (selected) {
      setForm(prev => ({
        ...prev,
        customerPOId: poId,
        customerPONumber: selected.poNumber || '',
        customerName: selected.customerName || prev.customerName || '',
        quotationId: selected.quotationId?._id || selected.quotationId || prev.quotationId || '',
        quotationNumber: selected.quotationNumber || prev.quotationNumber || ''
      }));
    } else {
      setForm(prev => ({ ...prev, customerPOId: '', customerPONumber: '' }));
    }
  };

  const handleQuotationChange = (qId) => {
    const selected = quotations.find(q => q._id === qId);
    if (selected) {
      const qProducts = selected.items && selected.items.length ? selected.items.map(item => ({
        name: item.description || '',
        quantity: item.quantity || 1,
        unit: 'pcs',
        description: item.description || ''
      })) : [{ ...EMPTY_PRODUCT }];

      setForm(prev => ({
        ...prev,
        quotationId: qId,
        quotationNumber: selected.orderReference || selected.quotationNumber || '',
        customerName: selected.clientName || prev.customerName || '',
        products: qProducts
      }));
    } else {
      setForm(prev => ({ ...prev, quotationId: '', quotationNumber: '' }));
    }
  };

  const addProductRow = () => {
    setForm(prev => ({ ...prev, products: [...prev.products, { ...EMPTY_PRODUCT }] }));
  };

  const removeProductRow = (idx) => {
    if (form.products.length <= 1) return;
    setForm(prev => ({ ...prev, products: prev.products.filter((_, i) => i !== idx) }));
  };

  const updateProductRow = (idx, field, val) => {
    const list = [...form.products];
    list[idx] = { ...list[idx], [field]: val };
    setForm(prev => ({ ...prev, products: list }));
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
        quotationId: form.quotationId || null,
        customerPOId: form.customerPOId || null,
        salesOrderId: form.salesOrderId || null
      };

      const url = editFile ? `/api/sales-employee/product-files/${editFile._id}` : '/api/sales-employee/product-files';
      const method = editFile ? 'PATCH' : 'POST';
      const { response, data } = await apiRequest(url, { method, body: JSON.stringify(payload) });
      
      if (response.ok && data.success) {
        setShowModal(false);
        setFeedback(editFile ? `Product File ${form.fileNumber || ''} updated successfully.` : 'Product File created successfully.');
        setTimeout(() => setFeedback(''), 3500);
        fetchFiles();
      } else {
        setError(data.message || 'Server error saving product file.');
      }
    } catch (e) {
      setError('Network error saving product file.');
    } finally {
      setSaving(false);
    }
  };

  // ── WORKFLOW: AUTOMATICALLY CREATE SALES ORDER FROM PRODUCT FILE ──
  const handleTriggerCreateSO = async (pf) => {
    const summary = pf.products && pf.products.length
      ? pf.products.map(p => `${p.quantity}x ${p.name}`).join(', ')
      : 'Product Items';

    const items = pf.products && pf.products.length
      ? pf.products.map(p => ({
          description: p.name + (p.description ? ` (${p.description})` : ''),
          quantity: Number(p.quantity) || 1,
          unitPrice: 0,
          total: 0
        }))
      : [{ description: 'Product Items', quantity: 1, unitPrice: 0, total: 0 }];

    setSoPreFillModal({
      productFile: pf,
      orderReference: `SO-${String(orders.length + 1).padStart(4, '0')}`,
      clientName: pf.customerName,
      fileNo: pf.fileNumber || '',
      fileType: pf.fileType || 'Blue',
      customerPONumber: pf.customerPONumber || '',
      customerPOId: pf.customerPOId?._id || pf.customerPOId || null,
      quotationId: pf.quotationId?._id || pf.quotationId || null,
      productSummary: summary,
      totalAmount: '',
      items: items
    });
  };

  const handleConfirmCreateSO = async (e) => {
    e.preventDefault();
    if (!soPreFillModal) return;
    setCreatingSO(true);
    try {
      const net = Number(soPreFillModal.totalAmount) || 0;
      const payload = {
        orderReference: soPreFillModal.orderReference,
        clientName: soPreFillModal.clientName,
        fileNo: soPreFillModal.fileNo,
        fileType: soPreFillModal.fileType,
        customerPONumber: soPreFillModal.customerPONumber,
        customerPOId: soPreFillModal.customerPOId || null,
        quotationId: soPreFillModal.quotationId || null,
        productFileId: soPreFillModal.productFile._id,
        productSummary: soPreFillModal.productSummary,
        items: soPreFillModal.items.map(item => ({
          ...item,
          unitPrice: net > 0 && soPreFillModal.items.length === 1 ? net : item.unitPrice,
          total: net > 0 && soPreFillModal.items.length === 1 ? net : (item.quantity * item.unitPrice)
        })),
        totalAmount: net,
        netAmount: net,
        stockStatus: 'Available',
        deliveryStatus: 'Not Delivered',
        invoiceStatus: 'Not Invoiced',
        paymentStatus: 'Pending',
        status: 'Sales Order'
      };

      const { response, data } = await apiRequest('/api/sales-employee/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok && data.success) {
        setFeedback(`Sales Order ${data.data?.orderReference || data.data?.orderNumber} created from Product File.`);
        setSoPreFillModal(null);
        fetchFiles();
        setTimeout(() => setFeedback(''), 3500);
      } else {
        alert(data.message || 'Failed to create Sales Order.');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating Sales Order.');
    } finally {
      setCreatingSO(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/product-files/${deleteTarget._id}`, { method: 'DELETE' });
      if (response.ok && data.success) {
        setFeedback(`Product File "${deleteTarget.fileNumber}" deleted.`);
        setDeleteTarget(null);
        fetchFiles();
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
      {/* Top Header */}
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><FolderPlus size={22} color="#2563EB" /> Product Files (Blue & Green)</h2>
          <p className="sv-subtitle">Job folders created per Customer PO to route through sales order, stock check, delivery, and billing</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button className="sv-btn-secondary" onClick={downloadCompleteProductFilesPDF} title="Download Complete Product Files (PDF)">
            <Download size={15} color="#DC2626" /> Export PDF
          </button>
          <button className="sv-btn-secondary" onClick={downloadCompleteProductFilesExcel} title="Download Complete Product Files (Excel)">
            <FileSpreadsheet size={15} color="#059669" /> Export Excel
          </button>
          <button className="sv-btn-primary" style={{ background: '#2563EB' }} onClick={() => openCreate('Blue')}>
            <Plus size={16} /> New Blue File
          </button>
          <button className="sv-btn-primary" style={{ background: '#059669' }} onClick={() => openCreate('Green')}>
            <Plus size={16} /> New Green File
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <CheckCircle2 size={16} color="#059669" /> {feedback}
        </div>
      )}

      {/* KPI Cards */}
      <div className="sv-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="sv-kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Product Files</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{productFiles.length}</div>
        </div>
        <div className="sv-kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Blue Files (Regular)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>{blueFilesCount}</div>
        </div>
        <div className="sv-kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Green Files (Special)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>{greenFilesCount}</div>
        </div>
        <div className="sv-kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Scope Items</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8B5CF6', marginTop: '4px' }}>{totalProductsCount}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="sv-filters">
        <div className="sv-search-box">
          <Search size={16} />
          <input placeholder="Search File #, Customer, PO #, Order #..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="sv-status-tabs">
          {['all', 'Blue', 'Green'].map(t => (
            <button key={t} className={`sv-tab ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All Files' : `${t} Files`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <div className="sv-loading">Loading Product Files from database...</div> : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>File Number</th>
                <th>File Type</th>
                <th>Customer Name</th>
                <th>Customer PO #</th>
                <th>Quotation Ref</th>
                <th>Products Count</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Workflow Action</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.length === 0 ? (
                <tr><td colSpan={9} className="sv-empty">No Product Files found. Click "New Blue File" or "New Green File" to get started!</td></tr>
              ) : filteredFiles.map(pf => {
                const isBlue = pf.fileType === 'Blue';
                return (
                  <tr key={pf._id}>
                    <td className="sv-name" style={{ fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>
                      {pf.fileNumber || '—'}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: isBlue ? '#EFF6FF' : '#ECFDF5',
                        color: isBlue ? '#1D4ED8' : '#047857',
                        border: `1px solid ${isBlue ? '#BFDBFE' : '#A7F3D0'}`
                      }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isBlue ? '#2563EB' : '#10B981' }} />
                        {pf.fileType} File
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{pf.customerName}</td>
                    <td>
                      {pf.customerPONumber ? (
                        <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {pf.customerPONumber}
                        </span>
                      ) : '—'}
                    </td>
                    <td>{pf.quotationNumber || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{pf.products?.length || 0} items</td>
                    <td>
                      <span className="sv-badge" style={{ background: (STATUS_COLORS[pf.status] || '#64748B') + '22', color: STATUS_COLORS[pf.status] || '#64748B', border: `1px solid ${(STATUS_COLORS[pf.status] || '#64748B')}44` }}>
                        {pf.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleTriggerCreateSO(pf)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          color: '#2563EB',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Auto pre-fill and create Sales Order"
                      >
                        <ShoppingCart size={13} /> → Sales Order
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button className="sv-btn-action-icon" onClick={() => setViewFile(pf)} title="View File Details"><Eye size={14} /></button>
                        <button className="sv-btn-action-icon" onClick={() => openEdit(pf)} title="Edit File"><Edit2 size={14} /></button>
                        <button className="sv-btn-action-icon" onClick={() => setDeleteTarget(pf)} title="Delete File" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filteredFiles.length > 0 && (
              <tfoot>
                <tr style={{ background: '#F8FAFC', fontWeight: 700, borderTop: '2px solid #E2E8F0' }}>
                  <td colSpan={5} style={{ textAlign: 'right', padding: '12px', color: '#475569' }}>TOTAL SCOPE ITEMS:</td>
                  <td style={{ color: '#2563EB', padding: '12px', fontWeight: 800 }}>
                    {filteredFiles.reduce((s, pf) => s + (pf.products?.length || 0), 0)} Items
                  </td>
                  <td colSpan={3} style={{ color: '#64748B', padding: '12px', fontSize: '0.85rem' }}>
                    {filteredFiles.length} Product Files ({filteredFiles.filter(f => f.fileType === 'Blue').length} Blue, {filteredFiles.filter(f => f.fileType === 'Green').length} Green)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL - FULLY ALIGNED RESPONSIVE FORM */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: form.fileType === 'Blue' ? '#EFF6FF' : '#ECFDF5',
                  border: `1px solid ${form.fileType === 'Blue' ? '#BFDBFE' : '#A7F3D0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: form.fileType === 'Blue' ? '#2563EB' : '#059669'
                }}>
                  <FolderPlus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    {editFile ? `Edit ${form.fileType} File (${form.fileNumber})` : `New ${form.fileType} Product File`}
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                    Configure job file specifications, customer PO / Quotation linkages, and product scope
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {error && <div className="sv-error">{error}</div>}

            <form onSubmit={handleSave} className="sv-form">
              {/* Card 1: File Information */}
              <div className="sv-form-section">
                <div className="sv-form-section-title">
                  <FolderPlus size={14} color="#2563EB" /> 1. File Identification & Customer
                </div>
                
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>File Type *</label>
                    <select value={form.fileType} onChange={e => setForm(p => ({ ...p, fileType: e.target.value }))}>
                      <option value="Blue">Blue File (Standard / Routine)</option>
                      <option value="Green">Green File (Special / Customized)</option>
                    </select>
                  </div>
                  <div className="sv-field">
                    <label>File Number</label>
                    <input 
                      value={form.fileNumber} 
                      onChange={e => setForm(p => ({ ...p, fileNumber: e.target.value }))} 
                      placeholder="e.g. 1016 Green" 
                    />
                  </div>
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Customer / Company Name *</label>
                    <input 
                      value={form.customerName} 
                      onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} 
                      placeholder="Enter Client or Company Name" 
                      required 
                    />
                  </div>
                  <div className="sv-field">
                    <label>File Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="Active">Active</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Linkage to PO and Quotation */}
              <div className="sv-form-section">
                <div className="sv-form-section-title">
                  <Link2 size={14} color="#059669" /> 2. Linked Customer PO & Quotation
                </div>
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Link Customer PO (Auto-fills Quotation & Customer)</label>
                    <select value={form.customerPOId} onChange={e => handlePOChange(e.target.value)}>
                      <option value="">-- No Customer PO Linked --</option>
                      {customerPOs.map(po => (
                        <option key={po._id} value={po._id}>
                          {po.poNumber} — {po.customerName} (Rs. {Number(po.amount || 0).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sv-field">
                    <label>Link Quotation (Auto-fills Products)</label>
                    <select value={form.quotationId} onChange={e => handleQuotationChange(e.target.value)}>
                      <option value="">-- No Quotation Linked --</option>
                      {quotations.map(q => (
                        <option key={q._id} value={q._id}>
                          {q.orderReference || q.quotationNumber} — {q.clientName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 3: Products Breakdown */}
              <div className="sv-form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div className="sv-form-section-title" style={{ margin: 0 }}>
                    <Package size={14} color="#7C3AED" /> 3. Product Scope & Line Items
                  </div>
                  <button 
                    type="button" 
                    onClick={addProductRow} 
                    className="sv-btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#2563EB', height: '32px' }}
                  >
                    <PlusCircle size={14} /> Add Item Row
                  </button>
                </div>

                <div className="sv-product-table-wrap">
                  <div className="sv-product-grid-header">
                    <div>Product / Item Name *</div>
                    <div>Qty *</div>
                    <div>Unit</div>
                    <div>Specifications / Details</div>
                    <div style={{ textAlign: 'center' }}>Del</div>
                  </div>

                  {form.products.map((item, idx) => (
                    <div key={idx} className="sv-product-grid-row">
                      <input 
                        placeholder="e.g. Industrial Inverter 5kW" 
                        value={item.name} 
                        onChange={e => updateProductRow(idx, 'name', e.target.value)} 
                        required 
                      />
                      <input 
                        type="number" 
                        placeholder="Qty" 
                        value={item.quantity} 
                        onChange={e => updateProductRow(idx, 'quantity', Number(e.target.value))} 
                        min={1} 
                        required
                      />
                      <input 
                        placeholder="pcs / sets / units" 
                        value={item.unit} 
                        onChange={e => updateProductRow(idx, 'unit', e.target.value)} 
                      />
                      <input 
                        placeholder="Model, size, specs or remarks" 
                        value={item.description} 
                        onChange={e => updateProductRow(idx, 'description', e.target.value)} 
                      />
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => removeProductRow(idx)} 
                          disabled={form.products.length <= 1} 
                          className="sv-product-remove-btn"
                          title="Remove item"
                        >
                          <MinusCircle size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Instructions */}
              <div className="sv-form-section">
                <div className="sv-form-section-title">
                  <FileText size={14} color="#D97706" /> 4. Workflow Notes & Production Instructions
                </div>
                <div className="sv-field">
                  <textarea 
                    rows={3} 
                    value={form.notes} 
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} 
                    placeholder="Enter special shipping instructions, delivery timeline, or manufacturing notes..." 
                  />
                </div>
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving File...' : 'Save Product File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PRE-FILL SALES ORDER MODAL */}
      {soPreFillModal && (
        <div className="sv-modal-overlay" onClick={() => setSoPreFillModal(null)}>
          <div className="sv-modal" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} color="#2563EB" />
                <h3 style={{ margin: 0 }}>Create Sales Order from Product File</h3>
              </div>
              <button onClick={() => setSoPreFillModal(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleConfirmCreateSO} className="sv-form">
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                All fields have been automatically extracted and linked from <strong>{soPreFillModal.fileNo || soPreFillModal.fileType + ' File'}</strong>.
              </p>

              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Order Reference #</label>
                  <input value={soPreFillModal.orderReference} onChange={e => setSoPreFillModal(p => ({ ...p, orderReference: e.target.value }))} required />
                </div>
                <div className="sv-field">
                  <label>Customer Name</label>
                  <input value={soPreFillModal.clientName} onChange={e => setSoPreFillModal(p => ({ ...p, clientName: e.target.value }))} required />
                </div>
              </div>

              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>File-No# (Linked)</label>
                  <input value={`${soPreFillModal.fileNo} (${soPreFillModal.fileType})`} readOnly style={{ background: '#F1F5F9' }} />
                </div>
                <div className="sv-field">
                  <label>Total Order Amount (PKR) *</label>
                  <input type="number" placeholder="Enter Total Amount in PKR" value={soPreFillModal.totalAmount} onChange={e => setSoPreFillModal(p => ({ ...p, totalAmount: e.target.value }))} required />
                </div>
              </div>

              <div className="sv-field">
                <label>Product Summary</label>
                <textarea rows={2} value={soPreFillModal.productSummary} onChange={e => setSoPreFillModal(p => ({ ...p, productSummary: e.target.value }))} required />
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setSoPreFillModal(null)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={creatingSO}>
                  <ShoppingCart size={15} /> {creatingSO ? 'Creating Order...' : 'Confirm & Save Sales Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewFile && (
        <div className="sv-modal-overlay" onClick={() => setViewFile(null)}>
          <div className="sv-modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderPlus size={18} color={viewFile.fileType === 'Blue' ? '#2563EB' : '#059669'} />
                <h3 style={{ margin: 0 }}>{viewFile.fileType} File: {viewFile.fileNumber}</h3>
              </div>
              <button onClick={() => setViewFile(null)}><X size={18} /></button>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{viewFile.customerName}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                    Created: {new Date(viewFile.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className="sv-badge" style={{ background: (STATUS_COLORS[viewFile.status] || '#64748B') + '22', color: STATUS_COLORS[viewFile.status] || '#64748B', border: `1px solid ${(STATUS_COLORS[viewFile.status] || '#64748B')}44` }}>
                  {viewFile.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Customer PO</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>{viewFile.customerPONumber || 'None'}</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Quotation Ref</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>{viewFile.quotationNumber || 'None'}</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Sales Order</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>{viewFile.salesOrderNumber || 'None'}</div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Product Items Breakdown</div>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item Name</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', width: '80px' }}>Qty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', width: '80px' }}>Unit</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewFile.products && viewFile.products.length ? (
                        viewFile.products.map((p, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.name || '—'}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>{p.quantity}</td>
                            <td style={{ padding: '8px 12px' }}>{p.unit || 'pcs'}</td>
                            <td style={{ padding: '8px 12px', color: '#64748B' }}>{p.description || '—'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#94A3B8' }}>No product items specified.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {viewFile.notes && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>{viewFile.notes}</div>
                </div>
              )}

              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setViewFile(null)}>Close</button>
                <button className="sv-btn-primary" style={{ background: '#2563EB' }} onClick={() => { setViewFile(null); handleTriggerCreateSO(viewFile); }}>
                  <ShoppingCart size={14} /> Create Sales Order
                </button>
                <button className="sv-btn-primary" onClick={() => { setViewFile(null); openEdit(viewFile); }}>
                  <Edit2 size={14} /> Edit File
                </button>
              </div>
            </div>
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
                <h3 style={{ margin: 0 }}>Delete Product File</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className="sv-form">
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 16px' }}>
                Are you sure you want to permanently delete {deleteTarget.fileType} File <strong>{deleteTarget.fileNumber}</strong>?
              </p>
              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="sv-btn-primary" onClick={handleDelete} disabled={deleting} style={{ background: '#EF4444' }}>
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete File'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
