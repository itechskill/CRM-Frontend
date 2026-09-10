import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../../utils/api';
import {
  Plus,
  ShoppingCart,
  Edit2,
  Eye,
  Trash2,
  X,
  Save,
  Search,
  Calendar,
  User,
  Hash,
  Tag,
  DollarSign,
  CheckCircle2,
  Truck,
  FileText,
  CreditCard,
  Building,
  Info,
  PackageCheck,
  Download,
  FileSpreadsheet,
  Boxes,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import './SalesViews.css';

const DELIVERY_COLORS = {
  'Not Delivered': '#64748B',
  'Ready': '#3B82F6',
  'Pending': '#F59E0B',
  'Partially Delivered': '#3B82F6',
  'Fully Delivered': '#10B981',
  'Delivered': '#10B981'
};

const INVOICE_COLORS = {
  'Not Invoiced': '#64748B',
  'Partially Invoiced': '#F59E0B',
  'Fully Invoiced': '#10B981',
  'Invoiced': '#10B981'
};

const PAYMENT_COLORS = {
  'Pending': '#EF4444',
  'Advance Received': '#3B82F6',
  'Partially Paid': '#F59E0B',
  'Fully Paid': '#10B981'
};

const STATUS_COLORS = {
  'Sales Order': '#10B981',
  'Confirmed': '#3B82F6',
  'Processing': '#8B5CF6',
  'Shipped': '#F59E0B',
  'Delivered': '#059669',
  'Cancelled': '#EF4444'
};

const EMPTY_FORM = {
  orderReference: '',
  clientName: '',
  salePerson: '',
  fileNo: '',
  fileType: 'Blue',
  customerPONumber: '',
  productSummary: '',
  clientEmail: '',
  clientPhone: '',
  totalAmount: '',
  netAmount: '',
  stockStatus: 'Available',
  deliveryStatus: 'Not Delivered',
  invoiceStatus: 'Not Invoiced',
  paymentStatus: 'Pending',
  status: 'Sales Order',
  creationDate: '',
  deliveryDate: '',
  notes: ''
};

export default function SalesOrdersView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editO, setEditO] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [viewOrder, setViewOrder] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Stock check & delivery workflow states
  const [stockCheckResult, setStockCheckResult] = useState(null);
  const [checkingStock, setCheckingStock] = useState(false);
  const [deliveryPreFill, setDeliveryPreFill] = useState(null);
  const [creatingDN, setCreatingDN] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const { response, data } = await apiRequest(`/api/sales-employee/orders${params}`);
      if (response.ok && data.success) {
        setOrders(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCheckStock = async (order) => {
    setCheckingStock(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/orders/${order._id}/stock-check`);
      if (response.ok && data.success) {
        setStockCheckResult({ ...data.data, rawOrder: order });
      } else {
        alert(data.message || 'Failed to verify warehouse stock.');
      }
    } catch (e) {
      alert('Error connecting to inventory.');
    } finally {
      setCheckingStock(false);
    }
  };

  const handleCreateDeliveryFromStock = (orderData) => {
    const rawOrder = orderData.rawOrder || orderData;
    const items = orderData.items && orderData.items.length
      ? orderData.items.map(it => ({
          product: it.productName,
          description: it.productName,
          demand: it.requiredQty,
          quantity: it.requiredQty,
          unit: it.unit || 'pcs',
          availability: it.status
        }))
      : (rawOrder.items && rawOrder.items.length
          ? rawOrder.items.map(it => ({
              product: it.description,
              description: it.description,
              demand: it.quantity,
              quantity: it.quantity,
              unit: 'pcs',
              availability: 'Available'
            }))
          : [{ product: rawOrder.productSummary || 'Scope Items', description: rawOrder.productSummary || 'Scope Items', demand: 1, quantity: 1, unit: 'pcs', availability: 'Available' }]);

    const todayStr = new Date().toISOString().split('T')[0];
    const deadlineStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setDeliveryPreFill({
      salesOrderId: rawOrder._id,
      salesOrderNumber: rawOrder.orderReference || rawOrder.orderNumber,
      clientName: rawOrder.clientName,
      deliveryAddress: rawOrder.clientAddress || `${rawOrder.clientName} Headquarters`,
      recipientName: rawOrder.clientName,
      recipientPhone: rawOrder.clientPhone || '',
      trackingNumber: `TRK-${Math.floor(10000 + Math.random() * 90000)}`,
      carrier: 'Fortline Internal Logistics',
      status: 'Done',
      scheduledDate: todayStr,
      deadline: deadlineStr,
      isPartial: false,
      items: items,
      notes: `Standard dispatch for ${rawOrder.orderReference || rawOrder.orderNumber}`
    });
    setStockCheckResult(null);
  };

  const handleSaveDeliveryNoteFromOrder = async (e) => {
    e.preventDefault();
    if (!deliveryPreFill) return;
    setCreatingDN(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/delivery-notes', {
        method: 'POST',
        body: JSON.stringify(deliveryPreFill)
      });
      if (response.ok && data.success) {
        setFeedback(`Delivery Note ${data.data?.deliveryNumber || data.data?.deliveryNoteNumber} created & inventory deducted!`);
        setDeliveryPreFill(null);
        fetchOrders();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(data.message || 'Failed to create Delivery Note.');
      }
    } catch (e) {
      alert('Error creating Delivery Note.');
    } finally {
      setCreatingDN(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(o =>
      (o.orderReference && o.orderReference.toLowerCase().includes(term)) ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
      (o.clientName && o.clientName.toLowerCase().includes(term)) ||
      (o.customerName && o.customerName.toLowerCase().includes(term)) ||
      (o.salePerson && o.salePerson.toLowerCase().includes(term)) ||
      (o.createdBy?.fullName && o.createdBy.fullName.toLowerCase().includes(term)) ||
      (o.productSummary && o.productSummary.toLowerCase().includes(term)) ||
      (o.fileNo && o.fileNo.toLowerCase().includes(term)) ||
      (o.customerPONumber && o.customerPONumber.toLowerCase().includes(term))
    );
  }, [orders, searchTerm]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const openCreate = () => {
    const today = new Date().toISOString().substring(0, 10);
    const defaultRef = `SO-${String(orders.length + 1).padStart(4, '0')}`;
    setForm({ ...EMPTY_FORM, orderReference: defaultRef, creationDate: today });
    setEditO(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (o) => {
    setForm({
      orderReference: o.orderReference || o.orderNumber || '',
      clientName: o.clientName || o.customerName || '',
      salePerson: o.salePerson || o.createdBy?.fullName || '',
      fileNo: o.fileNo || o.fileNumber || '',
      fileType: o.fileType || (o.fileNo?.toLowerCase().includes('blue') ? 'Blue' : 'Green'),
      customerPONumber: o.customerPONumber || '',
      productSummary: o.productSummary || '',
      clientEmail: o.clientEmail || '',
      clientPhone: o.clientPhone || '',
      totalAmount: o.totalAmount || o.netAmount || 0,
      netAmount: o.netAmount || o.totalAmount || 0,
      stockStatus: o.stockStatus || 'Available',
      deliveryStatus: o.deliveryStatus || 'Not Delivered',
      invoiceStatus: o.invoiceStatus || 'Not Invoiced',
      paymentStatus: o.paymentStatus || 'Pending',
      status: o.status || 'Sales Order',
      creationDate: o.creationDate ? new Date(o.creationDate).toISOString().substring(0, 10) : '',
      deliveryDate: o.deliveryDate ? new Date(o.deliveryDate).toISOString().substring(0, 10) : '',
      notes: o.notes || ''
    });
    setEditO(o);
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
      const net = Number(form.totalAmount) || Number(form.netAmount) || 0;
      const payload = {
        ...form,
        totalAmount: net,
        netAmount: net,
        creationDate: form.creationDate || null,
        deliveryDate: form.deliveryDate || null
      };
      const url = editO ? `/api/sales-employee/orders/${editO._id}` : '/api/sales-employee/orders';
      const method = editO ? 'PATCH' : 'POST';
      const { response, data } = await apiRequest(url, { method, body: JSON.stringify(payload) });
      if (response.ok && data.success) {
        setShowModal(false);
        setFeedback(editO ? 'Sales Order updated successfully.' : 'Sales Order created successfully.');
        setTimeout(() => setFeedback(''), 3500);
        fetchOrders();
      } else {
        setError(data.message || 'Failed to save sales order.');
      }
    } catch (e) {
      setError('Network error saving sales order.');
    } finally {
      setSaving(false);
    }
  };

  // ── INDIVIDUAL SALES ORDER PDF DOWNLOAD ──
  const handleDownloadSinglePDF = (order) => {
    const doc = new jsPDF();
    const ref = order.orderReference || order.orderNumber || 'SO-DOC';
    const customer = order.clientName || order.customerName || 'Valued Customer';
    const dateStr = order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

    // Header Card
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('Fortline CRM - Sales Order', 14, 20);

    doc.setFontSize(10);
    doc.text(`Order Reference: ${ref}`, 145, 15);
    doc.text(`Date: ${dateStr}`, 145, 23);

    // Customer & Details Box
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text('Customer Information:', 14, 45);
    doc.setFontSize(13);
    doc.text(customer, 14, 53);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Email: ${order.clientEmail || '—'}`, 14, 60);
    doc.text(`Phone: ${order.clientPhone || '—'}`, 14, 66);
    doc.text(`Address: ${order.clientAddress || 'Pakistan'}`, 14, 72);

    doc.text(`Sales Rep: ${order.salePerson || order.createdBy?.fullName || 'Sales Team'}`, 120, 53);
    doc.text(`Customer PO #: ${order.customerPONumber || '—'}`, 120, 60);
    doc.text(`Product File: ${order.fileNo || '—'} (${order.fileType || 'Standard'})`, 120, 66);
    doc.text(`Stock Status: ${order.stockStatus || 'Available'}`, 120, 72);

    // Items Table
    const items = order.items && order.items.length
      ? order.items.map((item, idx) => [
          idx + 1,
          item.description || order.productSummary || 'Standard Product Item',
          item.quantity || 1,
          `Rs. ${(Number(item.unitPrice) || Number(order.netAmount || order.totalAmount || 0)).toLocaleString()}`,
          `Rs. ${(Number(item.total) || Number(order.netAmount || order.totalAmount || 0)).toLocaleString()}`
        ])
      : [[1, order.productSummary || 'Product Scope', 1, `Rs. ${(Number(order.netAmount || order.totalAmount || 0)).toLocaleString()}`, `Rs. ${(Number(order.netAmount || order.totalAmount || 0)).toLocaleString()}`]];

    autoTable(doc, {
      startY: 82,
      head: [['#', 'Item / Description', 'Qty', 'Unit Price', 'Total (PKR)']],
      body: items,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: [15, 23, 42] }
    });

    const finalY = doc.lastAutoTable.finalY + 12;

    // Totals Box
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Amount: Rs. ${(Number(order.netAmount || order.totalAmount || 0)).toLocaleString()}`, 130, finalY);
    doc.text(`Amount Paid: Rs. ${(Number(order.totalPaid || 0)).toLocaleString()}`, 130, finalY + 6);
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38);
    doc.text(`Outstanding Balance: Rs. ${(Number(order.outstandingBalance !== undefined ? order.outstandingBalance : (Number(order.netAmount || order.totalAmount || 0) - Number(order.totalPaid || 0)))).toLocaleString()}`, 130, finalY + 13);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Delivery Status: ${order.deliveryStatus || 'Not Delivered'}`, 14, finalY);
    doc.text(`Payment Status: ${order.paymentStatus || 'Pending'}`, 14, finalY + 6);
    if (order.notes) doc.text(`Notes: ${order.notes}`, 14, finalY + 13);

    doc.save(`Sales_Order_${ref}.pdf`);
  };

  // ── EXPORT ENTIRE LIST TO PDF ──
  const handleExportListPDF = () => {
    if (filteredOrders.length === 0) return;
    const doc = new jsPDF('landscape');

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('Fortline CRM - Sales Orders Master List', 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} | Total Orders: ${filteredOrders.length}`, 14, 25);

    const rows = filteredOrders.map(o => [
      o.orderReference || o.orderNumber || '—',
      o.clientName || o.customerName || '—',
      o.salePerson || o.createdBy?.fullName || 'Sales Team',
      o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-GB') : (o.creationDate ? new Date(o.creationDate).toLocaleDateString('en-GB') : '—'),
      `Rs. ${(Number(o.netAmount || o.totalAmount || 0)).toLocaleString()}`,
      `Rs. ${(Number(o.totalPaid || 0)).toLocaleString()}`,
      `Rs. ${(Number(o.outstandingBalance !== undefined ? o.outstandingBalance : (Number(o.netAmount || o.totalAmount || 0) - Number(o.totalPaid || 0)))).toLocaleString()}`,
      o.deliveryStatus || 'Not Delivered',
      o.paymentStatus || 'Pending'
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Order Ref #', 'Customer / Client', 'Sales Member', 'Date', 'Total (PKR)', 'Collected', 'Remaining', 'Delivery', 'Payment']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`Sales_Orders_List_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ── EXPORT LIST TO EXCEL (CSV) ──
  const handleExportListExcel = () => {
    if (filteredOrders.length === 0) return;
    const headers = ['Order Reference', 'Customer', 'Sales Member', 'Order Date', 'File No', 'Product Summary', 'Total Amount (PKR)', 'Paid Amount (PKR)', 'Outstanding (PKR)', 'Delivery Status', 'Payment Status'];
    const rows = filteredOrders.map(o => {
      const ref = o.orderReference || o.orderNumber || '';
      const client = (o.clientName || o.customerName || '').replace(/,/g, ' ');
      const rep = (o.salePerson || o.createdBy?.fullName || 'Sales Team').replace(/,/g, ' ');
      const date = o.orderDate ? new Date(o.orderDate).toISOString().slice(0, 10) : '';
      const file = `${o.fileNo || ''} ${o.fileType || ''}`.trim();
      const summary = (o.productSummary || '').replace(/,/g, ' ');
      const total = Number(o.netAmount || o.totalAmount || 0);
      const paid = Number(o.totalPaid || 0);
      const remaining = o.outstandingBalance !== undefined ? Number(o.outstandingBalance) : (total - paid);
      return [`"${ref}"`, `"${client}"`, `"${rep}"`, `"${date}"`, `"${file}"`, `"${summary}"`, total, paid, remaining, `"${o.deliveryStatus || ''}"`, `"${o.paymentStatus || ''}"`].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/orders/${deleteTarget._id}`, { method: 'DELETE' });
      if (response.ok && data.success) {
        setOrders(prev => prev.filter(o => o._id !== deleteTarget._id));
        setFeedback(`Order "${deleteTarget.orderReference || deleteTarget.orderNumber}" deleted successfully.`);
        setDeleteTarget(null);
        fetchOrders();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(data.message || 'Failed to delete sales order.');
      }
    } catch (e) {
      alert('Server error deleting sales order.');
    } finally {
      setDeleting(false);
    }
  };

  const statuses = ['all', 'Sales Order', 'Confirmed', 'Processing', 'Delivered', 'Cancelled'];

  return (
    <div className="sv-container">
      {/* Header */}
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><ShoppingCart size={22} color="#2563EB" /> Sales Orders</h2>
          <p className="sv-subtitle">Complete Sales Orders tracking Customer POs, stock checks, warehouse dispatch, invoices & payments</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleExportListPDF} className="sv-btn-cancel" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={15} color="#DC2626" /> Export PDF
          </button>
          <button onClick={handleExportListExcel} className="sv-btn-cancel" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FileSpreadsheet size={15} color="#059669" /> Export Excel
          </button>
          <button className="sv-btn-primary" onClick={openCreate}><Plus size={16} /> New Sales Order</button>
        </div>
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

      {/* Table */}
      {loading ? <div className="sv-loading">Loading sales orders from database...</div> : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Order Reference</th>
                <th>Creation Date</th>
                <th>Customer / Client</th>
                <th>Sale Person</th>
                <th>File-No#</th>
                <th>Product Summary</th>
                <th>Total (PKR)</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Stock Check</th>
                <th style={{ textAlign: 'center' }}>PDF</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr><td colSpan={11} className="sv-empty">No sales orders found matching your search.</td></tr>
              ) : paginatedOrders.map(o => {
                const orderRef = o.orderReference || o.orderNumber || '—';
                const customer = o.clientName || o.customerName || '—';
                const salePerson = o.salePerson || o.createdBy?.fullName || 'Sales Rep';
                const fileNo = o.fileNo || o.fileNumber || '—';
                const productSummary = o.productSummary || '—';
                const total = o.totalAmount || o.netAmount || 0;
                const status = o.status || 'Sales Order';
                const badgeColor = STATUS_COLORS[status] || '#10B981';

                return (
                  <tr key={o._id}>
                    <td className="sv-name" style={{ fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>{orderRef}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#64748B' }}>
                      {o.creationDate ? new Date(o.creationDate).toLocaleDateString('en-GB') : (o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB') : '—')}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{customer}</td>
                    <td>{salePerson}</td>
                    <td>
                      {(() => {
                        const fileNo = o.fileNo || o.fileNumber || '';
                        const fileType = o.fileType || '';
                        if (!fileNo && !fileType) return <span style={{ color: '#94A3B8' }}>—</span>;
                        const combined = `${fileNo} ${fileType}`.toLowerCase();
                        const isGreen = combined.includes('green');
                        const color = isGreen ? '#059669' : '#2563EB';
                        const bg = isGreen ? '#ECFDF5' : '#EFF6FF';
                        const border = isGreen ? '#A7F3D0' : '#BFDBFE';
                        const dotColor = isGreen ? '#10B981' : '#3B82F6';
                        const colorName = isGreen ? 'Green File' : 'Blue File';
                        return (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, background: bg, color: color, border: `1px solid ${border}`, whiteSpace: 'nowrap' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor }} />
                            <span>{fileNo ? `${fileNo} (${colorName})` : colorName}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '0.82rem', color: '#334155' }} title={productSummary}>
                      {productSummary}
                    </td>
                    <td style={{ fontWeight: 800, color: '#059669', whiteSpace: 'nowrap' }}>
                      Rs. {Number(total).toLocaleString()}
                    </td>
                    <td>
                      <span className="sv-badge" style={{ background: badgeColor + '18', color: badgeColor, border: `1px solid ${badgeColor}33` }}>
                        {status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleCheckStock(o)}
                        disabled={checkingStock}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: o.stockStatus === 'Available' ? '#ECFDF5' : '#FEF3C7',
                          color: o.stockStatus === 'Available' ? '#047857' : '#B45309',
                          border: `1px solid ${o.stockStatus === 'Available' ? '#A7F3D0' : '#FDE68A'}`,
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Check real warehouse stock in MongoDB"
                      >
                        <Boxes size={13} /> {o.stockStatus || 'Check Stock'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleDownloadSinglePDF(o)}
                        className="sv-btn-action-icon"
                        title="Download Sales Order PDF"
                        style={{ color: '#2563EB' }}
                      >
                        <Download size={14} />
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button className="sv-btn-action-icon" onClick={() => setViewOrder(o)} title="View Order Details"><Eye size={14} /></button>
                        <button className="sv-btn-action-icon" onClick={() => openEdit(o)} title="Edit Order"><Edit2 size={14} /></button>
                        <button className="sv-btn-action-icon" onClick={() => setDeleteTarget(o)} title="Delete Order" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} records
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
      {viewOrder && (
        <div className="sv-modal-overlay" onClick={() => setViewOrder(null)}>
          <div className="sv-modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} color="#10B981" />
                <h3 style={{ margin: 0 }}>Sales Order: {viewOrder.orderReference || viewOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setViewOrder(null)}><X size={18} /></button>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{viewOrder.clientName || viewOrder.customerName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Sale Person: {viewOrder.salePerson || viewOrder.createdBy?.fullName || 'Sales Rep'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>
                    Rs. {Number(viewOrder.totalAmount || viewOrder.netAmount || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>File-No# / Color</div>
                  <div style={{ marginTop: '4px' }}>
                    {(() => {
                      const fileNo = viewOrder.fileNo || viewOrder.fileNumber || '';
                      const fileType = viewOrder.fileType || '';
                      if (!fileNo && !fileType) return <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>—</span>;
                      const combined = `${fileNo} ${fileType}`.toLowerCase();
                      const isGreen = combined.includes('green');
                      const color = isGreen ? '#059669' : '#2563EB';
                      const bg = isGreen ? '#ECFDF5' : '#EFF6FF';
                      const border = isGreen ? '#A7F3D0' : '#BFDBFE';
                      const dotColor = isGreen ? '#10B981' : '#3B82F6';
                      const colorName = isGreen ? 'Green File' : 'Blue File';
                      return (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, background: bg, color: color, border: `1px solid ${border}`, whiteSpace: 'nowrap' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor }} />
                          <span>{fileNo ? `${fileNo} (${colorName})` : colorName}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Stock Check</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: viewOrder.stockStatus === 'Available' || viewOrder.stockStatus === 'In Stock' ? '#047857' : '#B45309', marginTop: '2px' }}>
                    {viewOrder.stockStatus || 'Available'}
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Status</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: STATUS_COLORS[viewOrder.status] || '#10B981', marginTop: '2px' }}>
                    {viewOrder.status || 'Sales Order'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Delivery</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: DELIVERY_COLORS[viewOrder.deliveryStatus] || '#64748B', marginTop: '2px' }}>
                    {viewOrder.deliveryStatus || 'Not Delivered'}
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Invoice</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: INVOICE_COLORS[viewOrder.invoiceStatus] || '#64748B', marginTop: '2px' }}>
                    {viewOrder.invoiceStatus || 'Not Invoiced'}
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Payment</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: PAYMENT_COLORS[viewOrder.paymentStatus] || '#64748B', marginTop: '2px' }}>
                    {viewOrder.paymentStatus || 'Pending'}
                  </div>
                </div>
              </div>

              {viewOrder.productSummary && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>Product Summary</div>
                  <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>{viewOrder.productSummary}</div>
                </div>
              )}

              <div className="sv-modal-actions" style={{ marginTop: '16px' }}>
                <button className="sv-btn-cancel" onClick={() => setViewOrder(null)}>Close</button>
                <button className="sv-btn-cancel" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => handleDownloadSinglePDF(viewOrder)}>
                  <Download size={14} color="#2563EB" /> Download PDF
                </button>
                <button className="sv-btn-primary" onClick={() => { setViewOrder(null); openEdit(viewOrder); }}>
                  <Edit2 size={14} /> Edit Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL - FULLY ALIGNED PROPORTIONAL CSS */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  {editO ? `Edit Sales Order (${editO.orderReference || editO.orderNumber})` : 'New Sales Order'}
                </h3>
                <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                  Fill in customer specifications, product scope, stock check, and financial amounts
                </p>
              </div>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {error && <div className="sv-error">{error}</div>}

            <form onSubmit={handleSave} className="sv-form">
              {/* Section 1: Customer & Reference */}
              <div className="sv-form-section">
                <div className="sv-form-section-title"><Building size={14} color="#2563EB" /> Customer & Order Info</div>
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Order Reference # *</label>
                    <input value={form.orderReference} onChange={e => setForm(p => ({ ...p, orderReference: e.target.value }))} placeholder="e.g. S01723" required />
                  </div>
                  <div className="sv-field">
                    <label>Customer Name *</label>
                    <input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Company / Client Name" required />
                  </div>
                </div>

                <div className="sv-grid-4">
                  <div className="sv-field">
                    <label>Sale Person</label>
                    <input value={form.salePerson} onChange={e => setForm(p => ({ ...p, salePerson: e.target.value }))} placeholder="Sales Representative" />
                  </div>
                  <div className="sv-field">
                    <label>File-No#</label>
                    <input value={form.fileNo} onChange={e => setForm(p => ({ ...p, fileNo: e.target.value }))} placeholder="e.g. 1016 Green" />
                  </div>
                  <div className="sv-field">
                    <label>File Color</label>
                    <select value={form.fileType || 'Blue'} onChange={e => setForm(p => ({ ...p, fileType: e.target.value }))}>
                      <option value="Blue">Blue File</option>
                      <option value="Green">Green File</option>
                    </select>
                  </div>
                  <div className="sv-field">
                    <label>Customer PO #</label>
                    <input value={form.customerPONumber} onChange={e => setForm(p => ({ ...p, customerPONumber: e.target.value }))} placeholder="e.g. CPO-0001" />
                  </div>
                </div>
              </div>

              {/* Section 2: Product Summary & Total */}
              <div className="sv-form-section">
                <div className="sv-form-section-title"><DollarSign size={14} color="#059669" /> Product Scope & Total Amount</div>
                <div className="sv-field">
                  <label>Product Summary *</label>
                  <textarea rows={2} value={form.productSummary} onChange={e => setForm(p => ({ ...p, productSummary: e.target.value }))} placeholder="e.g. LAPTOP, ThinkBook, G8 / 512 GB SSD" required />
                </div>

                <div className="sv-grid-3">
                  <div className="sv-field">
                    <label>Total Amount (PKR) *</label>
                    <input type="number" value={form.totalAmount} onChange={e => setForm(p => ({ ...p, totalAmount: e.target.value, netAmount: e.target.value }))} placeholder="0" required />
                  </div>
                  <div className="sv-field">
                    <label>Order Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="Sales Order">Sales Order</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="sv-field">
                    <label>Stock Check</label>
                    <select value={form.stockStatus} onChange={e => setForm(p => ({ ...p, stockStatus: e.target.value }))}>
                      <option value="Available">Available (In Stock)</option>
                      <option value="Purchase Required">Purchase Required</option>
                      <option value="In Procurement">In Procurement</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Delivery & Invoicing */}
              <div className="sv-form-section">
                <div className="sv-form-section-title"><PackageCheck size={14} color="#7C3AED" /> Workflow Tracking</div>
                <div className="sv-grid-3">
                  <div className="sv-field">
                    <label>Delivery Status</label>
                    <select value={form.deliveryStatus} onChange={e => setForm(p => ({ ...p, deliveryStatus: e.target.value }))}>
                      <option value="Not Delivered">Not Delivered</option>
                      <option value="Partially Delivered">Partially Delivered</option>
                      <option value="Fully Delivered">Fully Delivered</option>
                    </select>
                  </div>
                  <div className="sv-field">
                    <label>Invoice Status</label>
                    <select value={form.invoiceStatus} onChange={e => setForm(p => ({ ...p, invoiceStatus: e.target.value }))}>
                      <option value="Not Invoiced">Not Invoiced</option>
                      <option value="Partially Invoiced">Partially Invoiced</option>
                      <option value="Fully Invoiced">Fully Invoiced</option>
                    </select>
                  </div>
                  <div className="sv-field">
                    <label>Payment Status</label>
                    <select value={form.paymentStatus} onChange={e => setForm(p => ({ ...p, paymentStatus: e.target.value }))}>
                      <option value="Pending">Pending / Unpaid</option>
                      <option value="Advance Received">Advance Received</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Fully Paid">Fully Paid</option>
                    </select>
                  </div>
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Order Date</label>
                    <input type="date" value={form.creationDate} onChange={e => setForm(p => ({ ...p, creationDate: e.target.value }))} />
                  </div>
                  <div className="sv-field">
                    <label>Scheduled Delivery Date</label>
                    <input type="date" value={form.deliveryDate} onChange={e => setForm(p => ({ ...p, deliveryDate: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Section 4: Remarks */}
              <div className="sv-form-section">
                <div className="sv-form-section-title"><Info size={14} color="#64748B" /> Contact & Remarks</div>
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Client Email</label>
                    <input type="email" value={form.clientEmail} onChange={e => setForm(p => ({ ...p, clientEmail: e.target.value }))} placeholder="client@company.com" />
                  </div>
                  <div className="sv-field">
                    <label>Client Phone</label>
                    <input value={form.clientPhone} onChange={e => setForm(p => ({ ...p, clientPhone: e.target.value }))} placeholder="+92 300 1234567" />
                  </div>
                </div>
                <div className="sv-field">
                  <label>Order Notes & Delivery Instructions</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any specific requirements or instructions..." />
                </div>
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Sales Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK VERIFICATION MODAL */}
      {stockCheckResult && (
        <div className="sv-modal-overlay" onClick={() => setStockCheckResult(null)}>
          <div className="sv-modal" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: stockCheckResult.isFullyInStock ? '#ECFDF5' : '#FEF3C7',
                  border: `1px solid ${stockCheckResult.isFullyInStock ? '#A7F3D0' : '#FDE68A'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stockCheckResult.isFullyInStock ? '#047857' : '#B45309'
                }}>
                  <Boxes size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                    Warehouse Inventory & Stock Verification
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                    Live MongoDB stock availability for <strong>{stockCheckResult.orderNumber}</strong> ({stockCheckResult.clientName})
                  </p>
                </div>
              </div>
              <button onClick={() => setStockCheckResult(null)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Overall Status Banner */}
              <div style={{
                background: stockCheckResult.isFullyInStock ? '#ECFDF5' : '#FEF2F2',
                border: `1px solid ${stockCheckResult.isFullyInStock ? '#A7F3D0' : '#FECACA'}`,
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {stockCheckResult.isFullyInStock ? (
                    <CheckCircle2 size={20} color="#059669" />
                  ) : (
                    <AlertTriangle size={20} color="#DC2626" />
                  )}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: stockCheckResult.isFullyInStock ? '#065F46' : '#991B1B' }}>
                      {stockCheckResult.isFullyInStock ? 'All Ordered Items Available in Stock' : 'Stock Shortage Detected — Procurement Required'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: stockCheckResult.isFullyInStock ? '#047857' : '#B91C1C' }}>
                      {stockCheckResult.isFullyInStock
                        ? 'Warehouse inventory verified. Ready to create Delivery Note.'
                        : 'Some items require supplier procurement before full shipment.'}
                    </div>
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: stockCheckResult.isFullyInStock ? '#10B981' : '#EF4444',
                  color: '#FFFFFF'
                }}>
                  {stockCheckResult.stockStatus}
                </span>
              </div>

              {/* Items Breakdown Table */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Product / Description</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Required</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>In Warehouse</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockCheckResult.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B' }}>{item.productName}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{item.requiredQty} {item.unit}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: item.availableQty >= item.requiredQty ? '#059669' : '#DC2626' }}>
                          {item.availableQty} {item.unit}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: item.status === 'In Stock' ? '#ECFDF5' : '#FEF2F2',
                            color: item.status === 'In Stock' ? '#047857' : '#DC2626',
                            border: `1px solid ${item.status === 'In Stock' ? '#A7F3D0' : '#FECACA'}`
                          }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="sv-modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="sv-btn-cancel" onClick={() => setStockCheckResult(null)}>Close</button>
                {stockCheckResult.isFullyInStock ? (
                  <button
                    type="button"
                    className="sv-btn-primary"
                    style={{ background: '#059669' }}
                    onClick={() => handleCreateDeliveryFromStock(stockCheckResult)}
                  >
                    <Truck size={15} /> Proceed to Create Delivery Note <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sv-btn-primary"
                    style={{ background: '#D97706' }}
                    onClick={() => handleCreateDeliveryFromStock(stockCheckResult)}
                  >
                    <Truck size={15} /> Create Partial Delivery Note
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE DELIVERY NOTE MODAL FROM SALES ORDER */}
      {deliveryPreFill && (
        <div className="sv-modal-overlay" onClick={() => setDeliveryPreFill(null)}>
          <div className="sv-modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={22} color="#059669" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    Generate Delivery Note
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                    Auto-populated from Sales Order <strong>{deliveryPreFill.salesOrderNumber}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setDeliveryPreFill(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveDeliveryNoteFromOrder} className="sv-form">
              <div className="sv-form-section">
                <div className="sv-form-section-title"><Building size={14} color="#2563EB" /> Delivery Logistics & Recipient</div>
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Client / Company</label>
                    <input value={deliveryPreFill.clientName} onChange={e => setDeliveryPreFill(p => ({ ...p, clientName: e.target.value }))} required />
                  </div>
                  <div className="sv-field">
                    <label>Recipient Contact Phone</label>
                    <input value={deliveryPreFill.recipientPhone} onChange={e => setDeliveryPreFill(p => ({ ...p, recipientPhone: e.target.value }))} placeholder="+92 300..." />
                  </div>
                </div>

                <div className="sv-field">
                  <label>Delivery Destination Address *</label>
                  <input value={deliveryPreFill.deliveryAddress} onChange={e => setDeliveryPreFill(p => ({ ...p, deliveryAddress: e.target.value }))} required />
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Carrier / Vehicle Details</label>
                    <input value={deliveryPreFill.carrier} onChange={e => setDeliveryPreFill(p => ({ ...p, carrier: e.target.value }))} />
                  </div>
                  <div className="sv-field">
                    <label>Tracking #</label>
                    <input value={deliveryPreFill.trackingNumber} onChange={e => setDeliveryPreFill(p => ({ ...p, trackingNumber: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="sv-form-section">
                <div className="sv-form-section-title"><PackageCheck size={14} color="#059669" /> Products Being Dispatched</div>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <tr>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item Description</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '90px' }}>Dispatch Qty</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '90px' }}>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryPreFill.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>{item.product || item.description}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={e => {
                                const list = [...deliveryPreFill.items];
                                list[idx].quantity = Number(e.target.value) || 1;
                                setDeliveryPreFill(p => ({ ...p, items: list }));
                              }}
                              style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                            />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748B' }}>{item.unit || 'pcs'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setDeliveryPreFill(null)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={creatingDN} style={{ background: '#059669' }}>
                  <Truck size={15} /> {creatingDN ? 'Generating Note...' : 'Confirm & Save Delivery Note'}
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
                <h3 style={{ margin: 0 }}>Delete Sales Order</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className="sv-form">
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 16px' }}>
                Are you sure you want to permanently delete sales order <strong>{deleteTarget.orderReference || deleteTarget.orderNumber}</strong>?
              </p>
              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="sv-btn-primary" onClick={handleDelete} disabled={deleting} style={{ background: '#EF4444' }}>
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
