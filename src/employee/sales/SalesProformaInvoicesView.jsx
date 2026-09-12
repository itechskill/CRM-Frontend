import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../../utils/api';
import {
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Download,
  Eye,
  Edit2,
  Trash2,
  X,
  Save,
  Calendar,
  Building,
  CheckCircle2,
  DollarSign,
  Truck,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Layers,
  Percent,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import './SalesViews.css';

const STATUS_COLORS = {
  Draft: { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  Issued: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  Sent: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  Approved: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  Cancelled: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' }
};

const EMPTY_PROFORMA_FORM = {
  salesOrderId: '',
  salesOrderNumber: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientAddress: '',
  items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
  discount: 0,
  tax: 0,
  status: 'Issued',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  paymentTerms: 'Advance 100%',
  deliveryTerms: 'Ex-Works / Standard Dispatch',
  notes: ''
};

export default function SalesProformaInvoicesView({ initialSalesOrder, onNavigateDeliveryNotes, onClearInitialOrder }) {
  const [proformas, setProformas] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editProforma, setEditProforma] = useState(null);
  const [form, setForm] = useState(EMPTY_PROFORMA_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  
  const [viewProforma, setViewProforma] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Proforma Invoices
  const fetchProformas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const { response, data } = await apiRequest(`/api/sales-employee/proforma-invoices?${params}`);
      if (response.ok && data.success) {
        setProformas(data.data || []);
      }
    } catch (err) {
      console.error('Fetch Proforma Invoices Error:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm]);

  // Fetch Sales Orders for creation modal
  const fetchSalesOrders = useCallback(async () => {
    try {
      const { response, data } = await apiRequest('/api/sales-employee/orders');
      if (response.ok && data.success) {
        setSalesOrders(data.data || []);
      }
    } catch (err) {
      console.error('Fetch Sales Orders for PI Error:', err);
    }
  }, []);

  useEffect(() => {
    fetchProformas();
  }, [fetchProformas]);

  useEffect(() => {
    fetchSalesOrders();
  }, [fetchSalesOrders]);

  // Handle pre-fill if navigated from Sales Orders view
  useEffect(() => {
    if (initialSalesOrder) {
      handleOpenCreateFromSalesOrder(initialSalesOrder);
      if (onClearInitialOrder) onClearInitialOrder();
    }
  }, [initialSalesOrder]);

  const handleOpenCreateFromSalesOrder = (so) => {
    setEditProforma(null);
    setError('');
    
    const items = (so.items && so.items.length > 0)
      ? so.items.map(it => ({
          description: it.description || '',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          total: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)
        }))
      : [{ description: so.productSummary || 'Standard Products', quantity: 1, unitPrice: Number(so.netAmount || so.totalAmount) || 0, total: Number(so.netAmount || so.totalAmount) || 0 }];

    setForm({
      salesOrderId: so._id,
      salesOrderNumber: so.orderReference || so.orderNumber || '',
      clientName: so.clientName || '',
      clientEmail: so.clientEmail || '',
      clientPhone: so.clientPhone || '',
      clientAddress: so.clientAddress || '',
      items: items,
      discount: Number(so.discount) || 0,
      tax: Number(so.tax) || 0,
      status: 'Issued',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      paymentTerms: 'Advance 100%',
      deliveryTerms: 'Ex-Works / Standard Dispatch',
      notes: `Proforma invoice generated from Sales Order ${so.orderReference || so.orderNumber}`
    });
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    setEditProforma(null);
    setError('');
    setForm(EMPTY_PROFORMA_FORM);
    setShowModal(true);
  };

  const handleSelectSalesOrder = (soId) => {
    const so = salesOrders.find(o => o._id === soId);
    if (!so) return;

    const items = (so.items && so.items.length > 0)
      ? so.items.map(it => ({
          description: it.description || '',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          total: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)
        }))
      : [{ description: so.productSummary || 'Standard Products', quantity: 1, unitPrice: Number(so.netAmount || so.totalAmount) || 0, total: Number(so.netAmount || so.totalAmount) || 0 }];

    setForm(prev => ({
      ...prev,
      salesOrderId: so._id,
      salesOrderNumber: so.orderReference || so.orderNumber || '',
      clientName: so.clientName || '',
      clientEmail: so.clientEmail || '',
      clientPhone: so.clientPhone || '',
      clientAddress: so.clientAddress || '',
      items: items,
      discount: Number(so.discount) || 0,
      tax: Number(so.tax) || 0
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...form.items];
    updated[index][field] = value;

    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(updated[index].quantity) || 0;
      const u = Number(updated[index].unitPrice) || 0;
      updated[index].total = q * u;
    }

    setForm(prev => ({ ...prev, items: updated }));
  };

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  // Subtotal and Net Amount calculation
  const subtotal = useMemo(() => {
    return form.items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  }, [form.items]);

  const calculatedNetAmount = useMemo(() => {
    const disc = Number(form.discount) || 0;
    const tx = Number(form.tax) || 0;
    return Math.max(0, subtotal - disc + tx);
  }, [subtotal, form.discount, form.tax]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.salesOrderId) {
      setError('Please select a linked Sales Order.');
      return;
    }
    if (!form.clientName.trim()) {
      setError('Client / Customer name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        salesOrderId: form.salesOrderId,
        salesOrderNumber: form.salesOrderNumber,
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientPhone: form.clientPhone,
        clientAddress: form.clientAddress,
        items: form.items,
        totalAmount: subtotal,
        discount: Number(form.discount) || 0,
        tax: Number(form.tax) || 0,
        netAmount: calculatedNetAmount,
        status: form.status,
        issueDate: form.issueDate || new Date(),
        dueDate: form.dueDate || null,
        paymentTerms: form.paymentTerms,
        deliveryTerms: form.deliveryTerms,
        notes: form.notes
      };

      const url = editProforma
        ? `/api/sales-employee/proforma-invoices/${editProforma._id}`
        : '/api/sales-employee/proforma-invoices';
      const method = editProforma ? 'PATCH' : 'POST';

      const { response, data } = await apiRequest(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (response.ok && data.success) {
        setFeedback(`Proforma Invoice ${data.data?.proformaNumber || ''} saved successfully!`);
        setShowModal(false);
        fetchProformas();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        setError(data.message || 'Failed to save Proforma Invoice.');
      }
    } catch (err) {
      console.error('Save Proforma Invoice Error:', err);
      setError('Server error saving Proforma Invoice.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (pi) => {
    setEditProforma(pi);
    setError('');
    setForm({
      salesOrderId: pi.salesOrder?._id || pi.salesOrder || '',
      salesOrderNumber: pi.salesOrderNumber || pi.orderReference || '',
      clientName: pi.clientName || '',
      clientEmail: pi.clientEmail || '',
      clientPhone: pi.clientPhone || '',
      clientAddress: pi.clientAddress || '',
      items: pi.items && pi.items.length > 0 ? pi.items : [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      discount: pi.discount || 0,
      tax: pi.tax || 0,
      status: pi.status || 'Issued',
      issueDate: pi.issueDate ? new Date(pi.issueDate).toISOString().split('T')[0] : '',
      dueDate: pi.dueDate ? new Date(pi.dueDate).toISOString().split('T')[0] : '',
      paymentTerms: pi.paymentTerms || 'Advance 100%',
      deliveryTerms: pi.deliveryTerms || 'Ex-Works / Standard Dispatch',
      notes: pi.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/proforma-invoices/${deleteTarget._id}`, {
        method: 'DELETE'
      });
      if (response.ok && data.success) {
        setFeedback(`Proforma Invoice ${deleteTarget.proformaNumber} deleted.`);
        setDeleteTarget(null);
        fetchProformas();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(data.message || 'Failed to delete Proforma Invoice.');
      }
    } catch (err) {
      console.error('Delete PI Error:', err);
      alert('Server error deleting Proforma Invoice.');
    } finally {
      setDeleting(false);
    }
  };

  // Download Proforma Invoice PDF
  const handleDownloadPDF = (pi) => {
    const doc = new jsPDF();

    // Primary Brand Header
    doc.setFillColor(37, 99, 235); // #2563EB
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FORTLINE CRM', 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Commercial Sales & Operations Portal', 14, 26);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFORMA INVOICE', 196, 18, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ref: ${pi.proformaNumber || 'PI-0000'}`, 196, 26, { align: 'right' });

    // Document Meta & Customer Info Box
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);

    // Left Column: Customer Details
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED / CONFINED TO:', 14, 46);
    doc.setFont('helvetica', 'normal');
    doc.text(`Customer Name: ${pi.clientName || 'N/A'}`, 14, 52);
    if (pi.clientEmail) doc.text(`Email: ${pi.clientEmail}`, 14, 58);
    if (pi.clientPhone) doc.text(`Phone: ${pi.clientPhone}`, 14, 64);
    if (pi.clientAddress) doc.text(`Address: ${pi.clientAddress}`, 14, 70);

    // Right Column: Proforma & Order Meta
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER & INVOICE DETAILS:', 120, 46);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sales Order Ref: ${pi.salesOrderNumber || pi.orderReference || 'N/A'}`, 120, 52);
    if (pi.customerPONumber) doc.text(`Customer PO: ${pi.customerPONumber}`, 120, 58);
    doc.text(`Issue Date: ${pi.issueDate ? new Date(pi.issueDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}`, 120, 64);
    if (pi.dueDate) doc.text(`Valid Until / Due: ${new Date(pi.dueDate).toLocaleDateString('en-GB')}`, 120, 70);
    doc.text(`Status: ${pi.status || 'Issued'}`, 120, 76);

    // Items Table
    const tableBody = (pi.items && pi.items.length > 0)
      ? pi.items.map((it, idx) => [
          idx + 1,
          it.description || 'Standard Product',
          it.quantity || 1,
          `Rs. ${Number(it.unitPrice || 0).toLocaleString()}`,
          `Rs. ${Number(it.total || (it.quantity * it.unitPrice) || 0).toLocaleString()}`
        ])
      : [[1, 'Sales Order Items', 1, `Rs. ${Number(pi.netAmount || 0).toLocaleString()}`, `Rs. ${Number(pi.netAmount || 0).toLocaleString()}`]];

    autoTable(doc, {
      startY: 84,
      head: [['#', 'Item Description', 'Qty', 'Unit Price (PKR)', 'Total Amount (PKR)']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 4,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 85 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 40, halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 8;

    // Financial Summary Block (Right aligned)
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal:`, 135, finalY);
    doc.text(`Rs. ${Number(pi.totalAmount || 0).toLocaleString()}`, 196, finalY, { align: 'right' });

    if (pi.discount > 0) {
      doc.text(`Discount:`, 135, finalY + 6);
      doc.text(`- Rs. ${Number(pi.discount).toLocaleString()}`, 196, finalY + 6, { align: 'right' });
    }

    if (pi.tax > 0) {
      doc.text(`Tax Amount:`, 135, finalY + 12);
      doc.text(`+ Rs. ${Number(pi.tax).toLocaleString()}`, 196, finalY + 12, { align: 'right' });
    }

    doc.setFillColor(241, 245, 249);
    doc.rect(130, finalY + 16, 70, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`Grand Total:`, 135, finalY + 23);
    doc.text(`Rs. ${Number(pi.netAmount || 0).toLocaleString()}`, 196, finalY + 23, { align: 'right' });

    // Terms & Conditions Block (Left)
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS & CONDITIONS:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`• Payment Terms: ${pi.paymentTerms || 'Advance 100%'}`, 14, finalY + 6);
    doc.text(`• Delivery Terms: ${pi.deliveryTerms || 'Ex-Works / Standard Dispatch'}`, 14, finalY + 12);
    doc.text(`• Currency: Pakistani Rupee (PKR)`, 14, finalY + 18);
    if (pi.notes) {
      doc.text(`• Remarks: ${pi.notes}`, 14, finalY + 24, { maxWidth: 105 });
    }

    // Signatures
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Prepared By: Sales Department', 14, 260);
    doc.text('Authorized Signature & Company Stamp', 140, 260);
    doc.line(140, 275, 196, 275);

    doc.save(`Proforma_Invoice_${pi.proformaNumber || 'PI'}.pdf`);
  };

  // KPI Calculations
  const totalValue = useMemo(() => proformas.reduce((sum, p) => sum + (Number(p.netAmount) || 0), 0), [proformas]);
  const approvedPIs = useMemo(() => proformas.filter(p => p.status === 'Approved'), [proformas]);
  const approvedValue = useMemo(() => approvedPIs.reduce((sum, p) => sum + (Number(p.netAmount) || 0), 0), [approvedPIs]);
  const issuedPIs = useMemo(() => proformas.filter(p => ['Issued', 'Sent'].includes(p.status)), [proformas]);

  return (
    <div className="sv-container">
      {/* Header */}
      <div className="sv-header">
        <div>
          <h2 className="sv-title">
            <FileSpreadsheet size={20} /> Proforma Invoices
          </h2>
          <p className="sv-subtitle">
            Generate and manage optional commercial proforma invoices from Sales Orders before dispatch
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="sv-btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> New Proforma Invoice
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#059669" /> {feedback}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="deal-kpi-grid">
        <div className="deal-kpi-card active-pipeline">
          <div className="deal-kpi-icon active-pipeline">
            <FileSpreadsheet size={22} />
          </div>
          <div className="deal-kpi-content">
            <div className="deal-kpi-label">Total Proforma Value</div>
            <div className="deal-kpi-value">Rs. {totalValue.toLocaleString()}</div>
            <div className="deal-kpi-sub active-pipeline">
              {proformas.length} Proforma Invoices Generated
            </div>
          </div>
        </div>

        <div className="deal-kpi-card won-deals">
          <div className="deal-kpi-icon won-deals">
            <CheckCircle size={22} />
          </div>
          <div className="deal-kpi-content">
            <div className="deal-kpi-label">Approved Proformas</div>
            <div className="deal-kpi-value" style={{ color: '#059669' }}>Rs. {approvedValue.toLocaleString()}</div>
            <div className="deal-kpi-sub won-deals">
              {approvedPIs.length} Approved by Clients
            </div>
          </div>
        </div>

        <div className="deal-kpi-card win-rate">
          <div className="deal-kpi-icon win-rate">
            <Clock size={22} />
          </div>
          <div className="deal-kpi-content">
            <div className="deal-kpi-label">Issued & Sent</div>
            <div className="deal-kpi-value">{issuedPIs.length}</div>
            <div className="deal-kpi-sub win-rate">
              Awaiting client approval / payment
            </div>
          </div>
        </div>

        <div className="deal-kpi-card total-pipeline">
          <div className="deal-kpi-icon total-pipeline">
            <Truck size={22} />
          </div>
          <div className="deal-kpi-content">
            <div className="deal-kpi-label">Next Stage Ready</div>
            <div className="deal-kpi-value">{proformas.length}</div>
            <div className="deal-kpi-sub total-pipeline">
              Ready for Delivery Note creation
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="sv-filters">
        <div className="sv-search-box">
          <Search size={15} />
          <input
            placeholder="Search Proforma #, Sales Order, customer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sv-status-tabs">
          {['all', 'Draft', 'Issued', 'Sent', 'Approved', 'Cancelled'].map(st => (
            <button
              key={st}
              className={`sv-tab ${filterStatus === st ? 'active' : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="sv-loading">Loading Proforma Invoices...</div>
      ) : proformas.length === 0 ? (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <tbody>
              <tr>
                <td className="sv-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <FileSpreadsheet size={32} color="#94A3B8" style={{ marginBottom: '8px' }} />
                  <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>No Proforma Invoices Found</div>
                  <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '4px' }}>
                    Proforma Invoices are optional. You can create one from any Sales Order or start a new Proforma Invoice above.
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Proforma Ref #</th>
                <th>Sales Order Ref</th>
                <th>Customer / Client</th>
                <th>Items</th>
                <th>Grand Total (PKR)</th>
                <th>Status</th>
                <th>Issue Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {proformas.map(pi => {
                const colors = STATUS_COLORS[pi.status] || { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
                const itemCount = pi.items?.length || 0;

                return (
                  <tr key={pi._id}>
                    <td style={{ fontWeight: 800, color: '#2563EB' }}>
                      {pi.proformaNumber || 'PI-0000'}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0F172A', background: '#F8FAFC', padding: '3px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                        {pi.salesOrderNumber || pi.orderReference || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#1E293B' }}>{pi.clientName}</div>
                      {pi.clientPhone && <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{pi.clientPhone}</div>}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                      Rs. {Number(pi.netAmount || 0).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className="sv-badge"
                        style={{
                          background: colors.bg,
                          color: colors.color,
                          border: `1px solid ${colors.border}`,
                          fontSize: '0.72rem',
                          padding: '3px 9px'
                        }}
                      >
                        {pi.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        {pi.issueDate ? new Date(pi.issueDate).toLocaleDateString('en-GB') : '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <button
                          className="sv-btn-action-icon"
                          onClick={() => handleDownloadPDF(pi)}
                          title="Download Proforma PDF"
                          style={{ color: '#2563EB', background: '#EFF6FF' }}
                        >
                          <Download size={13} />
                        </button>
                        <button
                          className="sv-btn-action-icon"
                          onClick={() => setViewProforma(pi)}
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="sv-btn-action-icon"
                          onClick={() => handleOpenEdit(pi)}
                          title="Edit Proforma"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="sv-btn-action-icon"
                          onClick={() => setDeleteTarget(pi)}
                          title="Delete Proforma"
                          style={{ color: '#EF4444' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal sv-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#EFF6FF', color: '#2563EB', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    {editProforma ? `Edit Proforma Invoice: ${editProforma.proformaNumber}` : 'Create Proforma Invoice'}
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                    {editProforma ? 'Update commercial line items, pricing, and terms' : 'Generate official optional commercial proforma invoice linked to a Sales Order'}
                  </p>
                </div>
              </div>
              <button className="sv-modal-close-btn" onClick={() => setShowModal(false)} title="Close">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="sv-error" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSave} className="sv-form">
              {/* SECTION 1: Linked Sales Order & Customer Details */}
              <div className="sv-form-section">
                <div className="sv-form-section-title">
                  <Building size={14} color="#2563EB" /> 1. Sales Order & Customer Details
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Linked Sales Order <span style={{ color: '#EF4444' }}>*</span></label>
                    <select
                      value={form.salesOrderId}
                      onChange={e => handleSelectSalesOrder(e.target.value)}
                      required
                    >
                      <option value="">-- Select Linked Sales Order --</option>
                      {salesOrders.map(so => (
                        <option key={so._id} value={so._id}>
                          {so.orderReference || so.orderNumber} — {so.clientName} (Rs. {Number(so.netAmount || so.totalAmount || 0).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sv-field">
                    <label>Invoice Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="Draft">Draft (Preliminary)</option>
                      <option value="Issued">Issued (Active)</option>
                      <option value="Sent">Sent to Client</option>
                      <option value="Approved">Approved by Client</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="sv-grid-3">
                  <div className="sv-field">
                    <label>Customer / Client Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input
                      value={form.clientName}
                      onChange={e => setForm({ ...form, clientName: e.target.value })}
                      placeholder="e.g. Apex Engineering Ltd"
                      required
                    />
                  </div>
                  <div className="sv-field">
                    <label>Customer Email</label>
                    <input
                      type="email"
                      value={form.clientEmail}
                      onChange={e => setForm({ ...form, clientEmail: e.target.value })}
                      placeholder="client@company.com"
                    />
                  </div>
                  <div className="sv-field">
                    <label>Customer Phone</label>
                    <input
                      value={form.clientPhone}
                      onChange={e => setForm({ ...form, clientPhone: e.target.value })}
                      placeholder="+92 300 1234567"
                    />
                  </div>
                </div>

                <div className="sv-field">
                  <label>Billing & Delivery Address</label>
                  <input
                    value={form.clientAddress}
                    onChange={e => setForm({ ...form, clientAddress: e.target.value })}
                    placeholder="Plot #, Street, Industrial Area, City..."
                  />
                </div>
              </div>

              {/* SECTION 2: Itemized Products & Scope of Supply */}
              <div className="sv-form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="sv-form-section-title" style={{ margin: 0 }}>
                    <Layers size={14} color="#2563EB" /> 2. Products & Line Items (Calculated in PKR)
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.78rem',
                      color: '#2563EB',
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <PlusCircle size={14} /> Add Line Item
                  </button>
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                  {/* Table Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 3fr) 90px 130px 130px 44px', gap: '8px', padding: '10px 12px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    <div>Item Description *</div>
                    <div style={{ textAlign: 'center' }}>Qty</div>
                    <div style={{ textAlign: 'right' }}>Unit Price (PKR)</div>
                    <div style={{ textAlign: 'right' }}>Total (PKR)</div>
                    <div style={{ textAlign: 'center' }}>Action</div>
                  </div>

                  {/* Table Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {form.items.map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(200px, 3fr) 90px 130px 130px 44px',
                          gap: '8px',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderBottom: idx === form.items.length - 1 ? 'none' : '1px solid #F1F5F9',
                          backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFF'
                        }}
                      >
                        <input
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                          placeholder="e.g. Industrial Valve / Servo Motor..."
                          value={it.description}
                          onChange={e => handleItemChange(idx, 'description', e.target.value)}
                          required
                        />
                        <input
                          type="number"
                          min="1"
                          style={{ width: '100%', padding: '8px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', textAlign: 'center', boxSizing: 'border-box' }}
                          placeholder="Qty"
                          value={it.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                          required
                        />
                        <input
                          type="number"
                          min="0"
                          style={{ width: '100%', padding: '8px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', textAlign: 'right', boxSizing: 'border-box' }}
                          placeholder="0"
                          value={it.unitPrice}
                          onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                          required
                        />
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', textAlign: 'right', paddingRight: '4px' }}>
                          Rs. {(Number(it.total) || 0).toLocaleString()}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="sv-product-remove-btn"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={form.items.length <= 1}
                            title="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Commercial Terms, Dates & Calculations */}
              <div className="sv-form-section">
                <div className="sv-form-section-title">
                  <DollarSign size={14} color="#059669" /> 3. Commercial Terms & Financial Breakdown
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                  {/* Terms & Dates Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="sv-grid-2">
                      <div className="sv-field">
                        <label>Issue Date</label>
                        <input
                          type="date"
                          value={form.issueDate}
                          onChange={e => setForm({ ...form, issueDate: e.target.value })}
                        />
                      </div>
                      <div className="sv-field">
                        <label>Due Date / Validity</label>
                        <input
                          type="date"
                          value={form.dueDate}
                          onChange={e => setForm({ ...form, dueDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="sv-grid-2">
                      <div className="sv-field">
                        <label>Payment Terms</label>
                        <input
                          value={form.paymentTerms}
                          onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
                          placeholder="Advance 100%, Net 30 Days..."
                        />
                      </div>
                      <div className="sv-field">
                        <label>Delivery Terms</label>
                        <input
                          value={form.deliveryTerms}
                          onChange={e => setForm({ ...form, deliveryTerms: e.target.value })}
                          placeholder="Ex-Works, Door Delivery..."
                        />
                      </div>
                    </div>

                    <div className="sv-field">
                      <label>Notes & Commercial Remarks</label>
                      <textarea
                        rows={2}
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        placeholder="Special instructions or commercial terms..."
                      />
                    </div>
                  </div>

                  {/* Financial Summary Card Right Column */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#64748B', paddingBottom: '6px', borderBottom: '1px dashed #E2E8F0' }}>
                        <span>Subtotal Amount:</span>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                          Rs. {subtotal.toLocaleString()}
                        </span>
                      </div>

                      <div className="sv-field" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem', color: '#64748B' }}>Discount (PKR)</label>
                        <input
                          type="number"
                          min="0"
                          value={form.discount}
                          onChange={e => setForm({ ...form, discount: e.target.value })}
                          placeholder="0"
                          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div className="sv-field" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem', color: '#64748B' }}>Tax / GST (PKR)</label>
                        <input
                          type="number"
                          min="0"
                          value={form.tax}
                          onChange={e => setForm({ ...form, tax: e.target.value })}
                          placeholder="0"
                          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Grand Total (PKR)
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                        Rs. {calculatedNetAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sv-btn-primary" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving...' : editProforma ? 'Update Proforma Invoice' : 'Issue Proforma Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewProforma && (
        <div className="sv-modal-overlay" onClick={() => setViewProforma(null)}>
          <div className="sv-modal sv-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#EFF6FF', color: '#2563EB', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    Proforma Invoice: {viewProforma.proformaNumber}
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                    Issued on {viewProforma.issueDate ? new Date(viewProforma.issueDate).toLocaleDateString('en-GB') : '—'}
                  </p>
                </div>
              </div>
              <button className="sv-modal-close-btn" onClick={() => setViewProforma(null)} title="Close">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header Banner Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>{viewProforma.clientName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.82rem', color: '#64748B' }}>
                    {viewProforma.clientEmail && <span>{viewProforma.clientEmail}</span>}
                    {viewProforma.clientPhone && <span>• {viewProforma.clientPhone}</span>}
                  </div>
                  {viewProforma.clientAddress && (
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
                      📍 {viewProforma.clientAddress}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    className="sv-badge"
                    style={{
                      background: STATUS_COLORS[viewProforma.status]?.bg || '#F1F5F9',
                      color: STATUS_COLORS[viewProforma.status]?.color || '#475569',
                      border: `1px solid ${STATUS_COLORS[viewProforma.status]?.border || '#CBD5E1'}`,
                      fontSize: '0.8rem',
                      padding: '4px 12px',
                      borderRadius: '20px'
                    }}
                  >
                    {viewProforma.status}
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                    Rs. {Number(viewProforma.netAmount || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Metadata Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
                <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Sales Order Ref</div>
                  <div style={{ fontWeight: 700, color: '#2563EB', fontSize: '0.88rem', marginTop: '2px' }}>
                    {viewProforma.salesOrderNumber || viewProforma.orderReference || '—'}
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Customer PO #</div>
                  <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.88rem', marginTop: '2px' }}>
                    {viewProforma.customerPONumber || 'N/A'}
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Payment Terms</div>
                  <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.88rem', marginTop: '2px' }}>
                    {viewProforma.paymentTerms || 'Advance 100%'}
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Delivery Terms</div>
                  <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.88rem', marginTop: '2px' }}>
                    {viewProforma.deliveryTerms || 'Standard Dispatch'}
                  </div>
                </div>
              </div>

              {/* Itemized Products Table */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontWeight: 700, fontSize: '0.82rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Itemized Scope of Supply
                </div>
                <table className="sv-table" style={{ fontSize: '0.84rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                      <th>Product Description</th>
                      <th style={{ textAlign: 'center', width: '80px' }}>Qty</th>
                      <th style={{ textAlign: 'right', width: '130px' }}>Unit Price (PKR)</th>
                      <th style={{ textAlign: 'right', width: '140px' }}>Total Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewProforma.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#0F172A' }}>{it.description}</td>
                        <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                        <td style={{ textAlign: 'right' }}>Rs. {Number(it.unitPrice || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                          Rs. {Number(it.total || (it.quantity * it.unitPrice) || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary and Notes Footer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px', fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Remarks / Commercial Notes:</div>
                  <div style={{ color: '#64748B' }}>
                    {viewProforma.notes || 'No specific terms specified for this proforma invoice.'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                    <span>Subtotal:</span>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>Rs. {Number(viewProforma.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  {Number(viewProforma.discount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                      <span>Discount:</span>
                      <span>- Rs. {Number(viewProforma.discount).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(viewProforma.tax) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>Tax / GST:</span>
                      <span>+ Rs. {Number(viewProforma.tax).toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #CBD5E1', paddingTop: '6px', marginTop: '2px', fontWeight: 800, fontSize: '0.95rem', color: '#059669' }}>
                    <span>Grand Total:</span>
                    <span>Rs. {Number(viewProforma.netAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setViewProforma(null)}>
                  Close
                </button>
                <button
                  className="sv-btn-primary"
                  onClick={() => handleDownloadPDF(viewProforma)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} /> Download Proforma PDF
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
              <h3 style={{ margin: 0, color: '#DC2626' }}>Delete Proforma Invoice</h3>
              <button className="sv-modal-close-btn" onClick={() => setDeleteTarget(null)} title="Close">
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '14px 0' }}>
              Are you sure you want to delete Proforma Invoice <strong>{deleteTarget.proformaNumber}</strong>?
              This will remove the Proforma Invoice record and unlink it from Sales Order {deleteTarget.salesOrderNumber || ''}. The Sales Order itself will NOT be deleted.
            </p>
            <div className="sv-modal-actions">
              <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                className="sv-btn-primary"
                onClick={handleDelete}
                disabled={deleting}
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
              >
                {deleting ? 'Deleting...' : 'Delete Proforma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
