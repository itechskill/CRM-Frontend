import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  User,
  Calendar,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  FileSpreadsheet,
  FileText,
  DollarSign,
  ArrowUpDown,
  Boxes,
  Truck,
  AlertTriangle,
  X,
  ArrowRight,
  Save
} from 'lucide-react';
import './SalesManagerDashboard.css';

const DELIVERY_COLORS = {
  'Pending': '#F59E0B',
  'Partially Delivered': '#3B82F6',
  'Fully Delivered': '#10B981',
  'Delivered': '#10B981',
  'Done': '#10B981',
  'Ready': '#3B82F6',
  'Not Delivered': '#64748B'
};

const INVOICE_COLORS = {
  'Not Invoiced': '#64748B',
  'Invoiced': '#3B82F6',
  'Fully Invoiced': '#10B981',
  'Partially Invoiced': '#F59E0B'
};

const PAYMENT_COLORS = {
  'Unpaid': '#EF4444',
  'Pending': '#EF4444',
  'Partially Paid': '#F59E0B',
  'Paid': '#10B981',
  'Fully Paid': '#10B981',
  'Advance Paid': '#3B82F6'
};

export default function SalesManagerOrdersView() {
  const [orders, setOrders] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [viewOrder, setViewOrder] = useState(null);

  // Stock check, delivery & proforma workflow states
  const [stockCheckResult, setStockCheckResult] = useState(null);
  const [checkingStock, setCheckingStock] = useState(false);
  const [deliveryPreFill, setDeliveryPreFill] = useState(null);
  const [creatingDN, setCreatingDN] = useState(false);
  const [proformaPreFill, setProformaPreFill] = useState(null);
  const [creatingPI, setCreatingPI] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordRes, tmRes] = await Promise.all([
        apiRequest('/api/sales-manager/all-orders'),
        apiRequest('/api/sales-manager/team-members')
      ]);
      if (ordRes.response.ok && ordRes.data.success) {
        setOrders(ordRes.data.data || []);
      }
      if (tmRes.response.ok && tmRes.data.success) {
        setTeamMembers(tmRes.data.data || []);
      }
    } catch (e) {
      console.error('Fetch orders error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckStock = async (order) => {
    setCheckingStock(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-manager/orders/${order._id}/stock-check`);
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
      clientName: rawOrder.clientName || rawOrder.customerName,
      deliveryAddress: rawOrder.clientAddress || `${rawOrder.clientName || rawOrder.customerName} Headquarters`,
      recipientName: rawOrder.clientName || rawOrder.customerName,
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
      const { response, data } = await apiRequest('/api/sales-manager/delivery-notes', {
        method: 'POST',
        body: JSON.stringify(deliveryPreFill)
      });
      if (response.ok && data.success) {
        setFeedback(`Delivery Note ${data.data?.deliveryNumber || data.data?.deliveryNoteNumber} created & inventory deducted!`);
        setDeliveryPreFill(null);
        fetchData();
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

  const handleOpenProformaModal = (order) => {
    const items = (order.items && order.items.length > 0)
      ? order.items.map(it => ({
          description: it.description || it.productName || '',
          quantity: Number(it.quantity || it.requiredQty) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          total: (Number(it.quantity || it.requiredQty) || 1) * (Number(it.unitPrice) || 0)
        }))
      : [{ description: order.productSummary || 'Standard Products', quantity: 1, unitPrice: Number(order.netAmount || order.totalAmount) || 0, total: Number(order.netAmount || order.totalAmount) || 0 }];

    let subtotal = 0;
    items.forEach(it => { subtotal += it.total; });
    const disc = Number(order.discount) || 0;
    const tx = Number(order.tax) || 0;

    setProformaPreFill({
      salesOrderId: order._id,
      salesOrderNumber: order.orderReference || order.orderNumber || '',
      clientName: order.clientName || order.customerName || '',
      clientEmail: order.clientEmail || '',
      clientPhone: order.clientPhone || '',
      clientAddress: order.clientAddress || '',
      items: items,
      totalAmount: subtotal,
      discount: disc,
      tax: tx,
      netAmount: Math.max(0, subtotal - disc + tx),
      status: 'Issued',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      paymentTerms: 'Advance 100%',
      deliveryTerms: 'Ex-Works / Standard Dispatch',
      notes: `Optional Proforma Invoice generated from Sales Order ${order.orderReference || order.orderNumber}`
    });
  };

  const handleSaveProformaFromOrder = async (e) => {
    e.preventDefault();
    if (!proformaPreFill) return;
    setCreatingPI(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/proforma-invoices', {
        method: 'POST',
        body: JSON.stringify(proformaPreFill)
      });
      if (response.ok && data.success) {
        setFeedback(`Proforma Invoice ${data.data?.proformaNumber || ''} created successfully!`);
        setProformaPreFill(null);
        fetchData();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(data.message || 'Failed to create Proforma Invoice.');
      }
    } catch (err) {
      alert('Error creating Proforma Invoice.');
    } finally {
      setCreatingPI(false);
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter(o => {
      const creatorId = o.createdBy?._id || o.createdBy || o.salesPerson?._id || o.salesPerson;
      const creatorName = (o.createdBy?.fullName || o.salesPerson?.fullName || o.salePerson || '').toLowerCase();
      
      const matchesMember = selectedMember === 'all' || 
        creatorId === selectedMember || 
        creatorName === selectedMember.toLowerCase();

      const matchesDelivery = deliveryFilter === 'all' || 
        o.deliveryStatus === deliveryFilter ||
        (deliveryFilter === 'Fully Delivered' && (o.deliveryStatus === 'Delivered' || o.deliveryStatus === 'Done'));

      const matchesPayment = paymentFilter === 'all' || 
        o.paymentStatus === paymentFilter ||
        (paymentFilter === 'Paid' && o.paymentStatus === 'Fully Paid') ||
        (paymentFilter === 'Unpaid' && o.paymentStatus === 'Pending');

      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
        (o.orderReference && o.orderReference.toLowerCase().includes(term)) ||
        (o.customerName && o.customerName.toLowerCase().includes(term)) ||
        (o.clientName && o.clientName.toLowerCase().includes(term)) ||
        (o.customerPONumber && o.customerPONumber.toLowerCase().includes(term)) ||
        (o.fileNo && o.fileNo.toLowerCase().includes(term)) ||
        (o.productSummary && o.productSummary.toLowerCase().includes(term)) ||
        creatorName.includes(term);

      return matchesMember && matchesDelivery && matchesPayment && matchesSearch;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.orderDate || b.creationDate || b.createdAt) - new Date(a.orderDate || a.creationDate || a.createdAt);
      }
      if (sortBy === 'date-asc') {
        return new Date(a.orderDate || a.creationDate || a.createdAt) - new Date(b.orderDate || b.creationDate || b.createdAt);
      }
      if (sortBy === 'amount-desc') {
        return (b.netAmount || b.totalAmount || 0) - (a.netAmount || a.totalAmount || 0);
      }
      if (sortBy === 'amount-asc') {
        return (a.netAmount || a.totalAmount || 0) - (b.netAmount || b.totalAmount || 0);
      }
      if (sortBy === 'customer') {
        return (a.clientName || a.customerName || '').localeCompare(b.clientName || b.customerName || '');
      }
      return 0;
    });

    return result;
  }, [orders, selectedMember, deliveryFilter, paymentFilter, searchTerm, sortBy]);

  // Helper to reliably determine collected payment for an order
  const getOrderPaid = useCallback((o) => {
    if (o.totalPaid != null && Number(o.totalPaid) > 0) return Number(o.totalPaid);
    if (o.paidAmount != null && Number(o.paidAmount) > 0) return Number(o.paidAmount);
    const tot = Number(o.netAmount || o.totalAmount || 0);
    if (o.paymentStatus === 'Paid' || o.paymentStatus === 'Fully Paid') return tot;
    if (o.paymentStatus === 'Partially Paid' || o.paymentStatus === 'Advance Paid' || o.paymentStatus === 'Partial') return Math.round(tot / 2);
    return 0;
  }, []);

  // Helper to reliably determine outstanding balance for an order
  const getOrderOutstanding = useCallback((o) => {
    const tot = Number(o.netAmount || o.totalAmount || 0);
    const paid = getOrderPaid(o);
    if (o.outstandingBalance != null && o.outstandingBalance !== '' && Number(o.outstandingBalance) >= 0) {
      return Number(o.outstandingBalance);
    }
    return Math.max(0, tot - paid);
  }, [getOrderPaid]);

  // Accurate Financial Calculations
  const totalValue = filteredOrders.reduce((sum, o) => sum + (Number(o.netAmount) || Number(o.totalAmount) || 0), 0);
  const totalPaid = filteredOrders.reduce((sum, o) => sum + getOrderPaid(o), 0);
  const totalOutstanding = filteredOrders.reduce((sum, o) => sum + getOrderOutstanding(o), 0);

  // ── INDIVIDUAL SALES ORDER PDF DOWNLOAD ──
  const handleDownloadSinglePDF = (order) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const ref = order.orderReference || order.orderNumber || 'SO-DOC';
    const customer = order.clientName || order.customerName || 'Valued Customer';
    const dateStr = order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'));

    // Primary Brand Header Banner
    doc.setFillColor(30, 58, 138); // Deep Navy #1E3A8A
    doc.rect(0, 0, 210, 36, 'F');
    doc.setFillColor(37, 99, 235); // Blue Accent
    doc.rect(0, 36, 210, 2, 'F');

    // Brand Title (Left)
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FORTLINE CRM', 14, 18);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text('Commercial Sales & Operations Portal • Sales Order Confirmation', 14, 26);

    // Document Title (Right)
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('SALES ORDER', 196, 18, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(191, 219, 254);
    doc.text(`Order Ref: ${ref}`, 196, 26, { align: 'right' });

    // Customer & Order Details Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 44, 182, 38, 2.5, 2.5, 'FD');

    // Left Column: Customer Details
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER INFORMATION:', 19, 52);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(customer, 19, 58, { maxWidth: 85 });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Email: ${order.clientEmail || '—'}   •   Phone: ${order.clientPhone || '—'}`, 19, 64, { maxWidth: 85 });
    doc.text(`Delivery Address: ${order.clientAddress || 'Direct Dispatch / Standard Delivery'}`, 19, 70, { maxWidth: 85 });

    // Vertical Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.line(108, 48, 108, 78);

    // Right Column: Order Meta
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('SALES & PRODUCT DETAILS:', 114, 52);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Sales Representative:', 114, 58);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${order.salePerson || order.createdBy?.fullName || 'Sales Team'}`, 155, 58);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Customer PO #:', 114, 64);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${order.customerPONumber || 'N/A'}`, 155, 64);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Product File # / Type:', 114, 70);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${order.fileNo || '—'} (${order.fileType || 'Standard'})`, 155, 70);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Order Date:', 114, 76);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(dateStr, 155, 76);

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
      startY: 88,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [['#', 'Item Description & Scope', 'Qty', 'Unit Price (PKR)', 'Total Amount (PKR)']],
      body: items,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: 4,
        halign: 'left'
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 84, halign: 'left' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 34, halign: 'right' },
        4: { cellWidth: 34, halign: 'right' }
      }
    });

    let finalY = doc.lastAutoTable.finalY + 8;
    if (finalY > 215) {
      doc.addPage();
      finalY = 20;
    }

    // Status & Notes Box (Left, X=14, Width=100)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, finalY, 100, 42, 2, 2, 'FD');

    doc.setTextColor(30, 58, 138);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('FULFILLMENT & PAYMENT STATUS:', 18, finalY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.text(`• Delivery Status: ${order.deliveryStatus || 'Not Delivered'}`, 18, finalY + 14);
    doc.text(`• Invoice Status: ${order.invoiceStatus || 'Not Invoiced'}`, 18, finalY + 20);
    doc.text(`• Payment Status: ${order.paymentStatus || 'Pending'}`, 18, finalY + 26);
    if (order.notes) {
      doc.text(`• Order Notes: ${order.notes}`, 18, finalY + 34, { maxWidth: 92 });
    }

    // Financial Breakdown Box (Right, X=118, Width=78)
    const netTotal = Number(order.netAmount || order.totalAmount || 0);
    const paidAmt = Number(getOrderPaid(order) || order.totalPaid || 0);
    const outstanding = Number(getOrderOutstanding(order) !== undefined ? getOrderOutstanding(order) : (netTotal - paidAmt));

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(118, finalY, 78, 42, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Total Order Value:', 122, finalY + 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${netTotal.toLocaleString()}`, 192, finalY + 7, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(5, 150, 105);
    doc.text('Amount Received:', 122, finalY + 13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${paidAmt.toLocaleString()}`, 192, finalY + 13, { align: 'right' });

    // Outstanding Balance Highlight Rect
    doc.setFillColor(outstanding > 0 ? 254 : 240, outstanding > 0 ? 242 : 253, outstanding > 0 ? 242 : 244);
    doc.setDrawColor(outstanding > 0 ? 254 : 187, outstanding > 0 ? 202 : 247, outstanding > 0 ? 202 : 208);
    doc.roundedRect(122, finalY + 20, 70, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(outstanding > 0 ? 220 : 5, outstanding > 0 ? 38 : 150, outstanding > 0 ? 38 : 105);
    doc.text('OUTSTANDING BALANCE:', 126, finalY + 26);

    doc.setFontSize(11);
    doc.text(`Rs. ${outstanding.toLocaleString()}`, 188, finalY + 34, { align: 'right' });

    // Signature Block
    const sigY = 252;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);

    doc.line(14, sigY + 12, 75, sigY + 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Sales Department:', 14, sigY + 17);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Commercial Representative', 14, sigY + 21);

    doc.line(135, sigY + 12, 196, sigY + 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Client Acceptance / Stamp:', 135, sigY + 17);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Customer Authorized Signature', 135, sigY + 21);

    // Document Footer Note
    doc.setDrawColor(241, 245, 249);
    doc.line(14, 280, 196, 280);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated via Fortline CRM • Official Sales Order Confirmation • System Generated', 105, 285, { align: 'center' });

    doc.save(`Sales_Order_${ref}.pdf`);
  };

  // ── EXPORT MASTER LIST TO PDF ──
  const handleExportPDF = () => {
    if (filteredOrders.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Header Background
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 28, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM — SALES ORDERS MASTER REPORT', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} | Total Orders: ${filteredOrders.length} | Total Value: Rs. ${totalValue.toLocaleString()}`, 14, 22);

    const tableRows = filteredOrders.map(o => {
      const orderRef = o.orderReference || o.orderNumber || '—';
      const customer = o.clientName || o.customerName || '—';
      const creator = o.createdBy?.fullName || o.salesPerson?.fullName || o.salePerson || 'Sales Team';
      const date = o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-GB') : (o.creationDate ? new Date(o.creationDate).toLocaleDateString('en-GB') : '—');
      const total = `Rs. ${(Number(o.netAmount) || Number(o.totalAmount) || 0).toLocaleString()}`;
      const collected = `Rs. ${(Number(getOrderPaid(o)) || 0).toLocaleString()}`;
      const outstanding = `Rs. ${(Number(getOrderOutstanding(o))).toLocaleString()}`;
      const delStatus = o.deliveryStatus || 'Not Delivered';
      const payStatus = o.paymentStatus || 'Pending';

      return [orderRef, customer, creator, date, total, collected, outstanding, delStatus, payStatus];
    });

    try {
      autoTable(doc, {
        startY: 34,
        head: [['Order Ref #', 'Customer / Client', 'Sales Member', 'Date', 'Total Amount', 'Collected', 'Remaining', 'Delivery', 'Payment']],
        body: tableRows,
        foot: [[
          { content: 'GRAND TOTAL / SUMMARY', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
          { content: `Rs. ${totalValue.toLocaleString()}`, styles: { halign: 'left', fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [15, 23, 42] } },
          { content: `Rs. ${totalPaid.toLocaleString()}`, styles: { halign: 'left', fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [4, 120, 87] } },
          { content: `Rs. ${totalOutstanding.toLocaleString()}`, styles: { halign: 'left', fontStyle: 'bold', fillColor: [254, 242, 242], textColor: [185, 28, 28] } },
          { content: `${filteredOrders.length} Orders`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } }
        ]],
        theme: 'grid',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8.5
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [15, 23, 42]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: 14, right: 14 }
      });

      doc.save(`Sales_Orders_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Manager orders PDF export error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // ── EXPORT TO EXCEL (CSV) ──
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) return;
    const headers = ['Order Reference', 'Customer', 'Sales Person', 'Order Date', 'File No', 'Product Summary', 'Total Amount', 'Collected', 'Outstanding', 'Delivery Status', 'Payment Status'];
    const rows = filteredOrders.map(o => {
      const ref = o.orderReference || o.orderNumber || '';
      const client = (o.clientName || o.customerName || '').replace(/,/g, ' ');
      const rep = (o.createdBy?.fullName || o.salesPerson?.fullName || o.salePerson || 'Sales Team').replace(/,/g, ' ');
      const date = o.orderDate ? new Date(o.orderDate).toISOString().slice(0, 10) : '';
      const file = `${o.fileNo || ''} ${o.fileType || ''}`.trim();
      const summary = (o.productSummary || '').replace(/,/g, ' ');
      const total = Number(o.netAmount) || Number(o.totalAmount) || 0;
      const paid = Number(getOrderPaid(o)) || 0;
      const out = Number(getOrderOutstanding(o)) || 0;
      const del = o.deliveryStatus || 'Not Delivered';
      const pay = o.paymentStatus || 'Pending';
      return [ref, client, rep, date, file, summary, total, paid, out, del, pay].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Team_Sales_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={24} color="#2563EB" /> Team Sales Orders
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.85rem' }}>
            Complete list of Sales Orders created by Farhan and all Sales Team Members with real-time financial balances
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportPDF}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#0F172A',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.2s'
            }}
          >
            <Download size={16} color="#DC2626" /> Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(5,150,105,0.2)',
              transition: 'all 0.2s'
            }}
          >
            <FileSpreadsheet size={16} color="#FFFFFF" /> Export Excel
          </button>
        </div>
      </div>

      {/* Summary Financial Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total Orders Value</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>Rs. {totalValue.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>{filteredOrders.length} Orders matching filter</div>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total Collected / Paid</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>Rs. {totalPaid.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '4px' }}>Recorded collections in DB</div>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Remaining / Outstanding</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#DC2626', marginTop: '6px' }}>Rs. {totalOutstanding.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: '#DC2626', marginTop: '4px' }}>Receivable balance</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search order #, customer, product, member, PO..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
          />
        </div>

        <select
          value={selectedMember}
          onChange={e => setSelectedMember(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}
        >
          <option value="all">All Sales Members</option>
          {teamMembers.map(m => (
            <option key={m._id} value={m._id}>{m.fullName || m.email}</option>
          ))}
        </select>

        <select
          value={deliveryFilter}
          onChange={e => setDeliveryFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}
        >
          <option value="all">All Delivery Status</option>
          <option value="Not Delivered">Not Delivered</option>
          <option value="Partially Delivered">Partially Delivered</option>
          <option value="Fully Delivered">Fully Delivered</option>
        </select>

        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}
        >
          <option value="all">All Payment Status</option>
          <option value="Unpaid">Unpaid / Pending</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Fully Paid</option>
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}
        >
          <option value="date-desc">Newest Date First</option>
          <option value="date-asc">Oldest Date First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
          <option value="customer">Customer Name (A-Z)</option>
        </select>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading sales orders from database...</div>
      ) : (
        <div style={{ background: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '14px 16px' }}>Order Ref #</th>
                <th style={{ padding: '14px 16px' }}>Customer / Client</th>
                <th style={{ padding: '14px 16px' }}>Sales Member</th>
                <th style={{ padding: '14px 16px' }}>File / Color</th>
                <th style={{ padding: '14px 16px' }}>Order Date</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Total Amount</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Collected</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Remaining</th>
                <th style={{ padding: '14px 16px' }}>Delivery</th>
                <th style={{ padding: '14px 16px' }}>Payment</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                    No sales orders match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(o => {
                  const delColor = DELIVERY_COLORS[o.deliveryStatus] || '#64748B';
                  const payColor = PAYMENT_COLORS[o.paymentStatus] || '#64748B';
                  const memberName = o.createdBy?.fullName || o.salesPerson?.fullName || o.salePerson || 'Farhan';
                  const totalAmt = Number(o.netAmount) || Number(o.totalAmount) || 0;
                  const paidAmt = getOrderPaid(o);
                  const remainingAmt = getOrderOutstanding(o);
                  const orderDateStr = o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-GB') : (o.creationDate ? new Date(o.creationDate).toLocaleDateString('en-GB') : '—');

                  return (
                    <tr key={o._id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1E293B' }}>
                        {o.orderReference || o.orderNumber || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>
                        {o.clientName || o.customerName || '—'}
                        {o.productSummary && (
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', fontWeight: 400 }}>
                            {o.productSummary}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#1E293B' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#EFF6FF',
                            color: '#2563EB',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {memberName.charAt(0).toUpperCase()}
                          </span>
                          {memberName}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
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
                      <td style={{ padding: '12px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {orderDateStr}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', textAlign: 'right' }}>
                        Rs. {totalAmt.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#059669', textAlign: 'right' }}>
                        Rs. {paidAmt.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: remainingAmt > 0 ? '#DC2626' : '#64748B', textAlign: 'right' }}>
                        Rs. {remainingAmt.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: delColor + '18', color: delColor }}>
                          {o.deliveryStatus || 'Not Delivered'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: payColor + '18', color: payColor }}>
                          {o.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleCheckStock(o)}
                            disabled={checkingStock}
                            style={{
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              color: '#047857',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 700,
                              fontSize: '0.78rem'
                            }}
                            title="Check Warehouse Stock Availability"
                          >
                            <Boxes size={13} /> Stock Check
                          </button>
                          <button
                            onClick={() => handleOpenProformaModal(o)}
                            style={{
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              color: '#2563EB',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 600,
                              fontSize: '0.78rem'
                            }}
                            title="Generate Optional Proforma Invoice"
                          >
                            <FileSpreadsheet size={13} /> Proforma
                          </button>
                          <button
                            onClick={() => handleDownloadSinglePDF(o)}
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              color: '#1E293B',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 600,
                              fontSize: '0.78rem'
                            }}
                            title="Download Official Sales Order PDF"
                          >
                            <Download size={13} color="#2563EB" /> PDF
                          </button>
                          <button
                            onClick={() => setViewOrder(o)}
                            style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.78rem' }}
                            title="View Order Details"
                          >
                            <Eye size={13} /> View
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

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#065F46', color: '#FFF', padding: '14px 20px', borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 2000, fontWeight: 700, fontSize: '0.875rem' }}>
          <CheckCircle2 size={18} color="#34D399" />
          {feedback}
        </div>
      )}

      {/* DETAIL MODAL */}
      {viewOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={() => setViewOrder(null)}>
          <div style={{ background: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '640px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  Order: {viewOrder.orderReference || viewOrder.orderNumber}
                </h3>
                <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.85rem' }}>
                  Customer: {viewOrder.clientName || viewOrder.customerName}
                </p>
              </div>
              <button onClick={() => setViewOrder(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94A3B8' }}>✕</button>
            </div>

            {/* Financial Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Amount</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  Rs. {Number(viewOrder.netAmount || viewOrder.totalAmount || 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Collected / Paid</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                  Rs. {Number(getOrderPaid(viewOrder)).toLocaleString()}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Remaining / Outstanding</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>
                  Rs. {Number(getOrderOutstanding(viewOrder)).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Statuses Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Delivery Status</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: DELIVERY_COLORS[viewOrder.deliveryStatus] || '#64748B', marginTop: '2px' }}>
                  {viewOrder.deliveryStatus || 'Not Delivered'}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Invoice Status</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: INVOICE_COLORS[viewOrder.invoiceStatus] || '#64748B', marginTop: '2px' }}>
                  {viewOrder.invoiceStatus || 'Not Invoiced'}
                  {viewOrder.invoiceNumber ? ` (${viewOrder.invoiceNumber})` : ''}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Payment Status</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: PAYMENT_COLORS[viewOrder.paymentStatus] || '#64748B', marginTop: '2px' }}>
                  {viewOrder.paymentStatus || 'Pending'}
                </div>
              </div>
            </div>

            {/* Creator & Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Created By (Sales Member)</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>
                  {viewOrder.createdBy?.fullName || viewOrder.salesPerson?.fullName || viewOrder.salePerson || 'Farhan'}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Product File / Color</div>
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
            </div>

            {viewOrder.productSummary && (
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Product Summary</div>
                <div style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 600 }}>{viewOrder.productSummary}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    const targetOrder = viewOrder;
                    setViewOrder(null);
                    handleCheckStock(targetOrder);
                  }}
                  style={{
                    background: '#ECFDF5',
                    color: '#047857',
                    border: '1px solid #A7F3D0',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Boxes size={16} /> Run Stock Check
                </button>
                <button
                  onClick={() => handleDownloadSinglePDF(viewOrder)}
                  style={{
                    background: '#F8FAFC',
                    color: '#1E293B',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={16} color="#2563EB" /> Download PDF
                </button>
              </div>
              <button
                onClick={() => setViewOrder(null)}
                style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '9px 20px', fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOCK VERIFICATION MODAL */}
      {stockCheckResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }} onClick={() => setStockCheckResult(null)}>
          <div style={{ background: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '680px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
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
              <button onClick={() => setStockCheckResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
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
                    {stockCheckResult.items && stockCheckResult.items.length > 0 ? (
                      stockCheckResult.items.map((item, idx) => (
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ padding: '14px', textAlign: 'center', color: '#64748B' }}>
                          Standard package items confirmed available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <button
                  type="button"
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '9px 18px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                  onClick={() => setStockCheckResult(null)}
                >
                  Close
                </button>
                {stockCheckResult.isFullyInStock ? (
                  <button
                    type="button"
                    style={{ background: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', padding: '9px 20px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleCreateDeliveryFromStock(stockCheckResult)}
                  >
                    <Truck size={15} /> Proceed to Create Delivery Note <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    style={{ background: '#D97706', color: '#FFF', border: 'none', borderRadius: '8px', padding: '9px 20px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }} onClick={() => setDeliveryPreFill(null)}>
          <div style={{ background: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '700px', padding: '24px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
              <button onClick={() => setDeliveryPreFill(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveDeliveryNoteFromOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Client / Company Name</label>
                  <input
                    type="text"
                    required
                    value={deliveryPreFill.clientName}
                    onChange={e => setDeliveryPreFill(p => ({ ...p, clientName: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Delivery Status</label>
                  <select
                    value={deliveryPreFill.status}
                    onChange={e => setDeliveryPreFill(p => ({ ...p, status: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: '#FFF' }}
                  >
                    <option value="Done">Done (Delivered & Verified)</option>
                    <option value="Ready">Ready for Dispatch</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Delivery Address</label>
                <input
                  type="text"
                  required
                  value={deliveryPreFill.deliveryAddress}
                  onChange={e => setDeliveryPreFill(p => ({ ...p, deliveryAddress: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Recipient Contact / Phone</label>
                  <input
                    type="text"
                    value={deliveryPreFill.recipientPhone}
                    onChange={e => setDeliveryPreFill(p => ({ ...p, recipientPhone: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Tracking Number</label>
                  <input
                    type="text"
                    value={deliveryPreFill.trackingNumber}
                    onChange={e => setDeliveryPreFill(p => ({ ...p, trackingNumber: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Dispatched Items (Stock will be automatically deducted)</label>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <tr>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '100px' }}>Qty</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '80px' }}>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryPreFill.items.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <input
                              type="text"
                              value={it.product}
                              onChange={e => {
                                const val = e.target.value;
                                setDeliveryPreFill(prev => {
                                  const nItems = [...prev.items];
                                  nItems[idx] = { ...nItems[idx], product: val, description: val };
                                  return { ...prev, items: nItems };
                                });
                              }}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '0.8rem' }}
                            />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setDeliveryPreFill(prev => {
                                  const nItems = [...prev.items];
                                  nItems[idx] = { ...nItems[idx], quantity: val, demand: val };
                                  return { ...prev, items: nItems };
                                });
                              }}
                              style={{ width: '70px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '0.8rem', textAlign: 'center' }}
                            />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748B' }}>
                            {it.unit || 'pcs'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Delivery Notes</label>
                <textarea
                  rows={2}
                  value={deliveryPreFill.notes}
                  onChange={e => setDeliveryPreFill(p => ({ ...p, notes: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '9px 18px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                  onClick={() => setDeliveryPreFill(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDN}
                  style={{ background: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', padding: '9px 22px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={15} /> {creatingDN ? 'Processing & Deducting Stock...' : 'Confirm & Save Delivery Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE OPTIONAL PROFORMA INVOICE MODAL */}
      {proformaPreFill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }} onClick={() => setProformaPreFill(null)}>
          <div style={{ background: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '720px', padding: '24px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#EFF6FF', color: '#2563EB', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    Generate Proforma Invoice (Optional)
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                    Auto-populated from Sales Order <strong>{proformaPreFill.salesOrderNumber}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setProformaPreFill(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveProformaFromOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Customer & Contact Information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Customer / Client *</label>
                    <input
                      value={proformaPreFill.clientName}
                      onChange={e => setProformaPreFill(p => ({ ...p, clientName: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Contact Phone</label>
                    <input
                      value={proformaPreFill.clientPhone}
                      onChange={e => setProformaPreFill(p => ({ ...p, clientPhone: e.target.value }))}
                      placeholder="+92 300..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Payment Terms</label>
                    <input
                      value={proformaPreFill.paymentTerms}
                      onChange={e => setProformaPreFill(p => ({ ...p, paymentTerms: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Delivery Terms</label>
                    <input
                      value={proformaPreFill.deliveryTerms}
                      onChange={e => setProformaPreFill(p => ({ ...p, deliveryTerms: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Product Scope & Pricing Breakdown (PKR)
                </div>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', background: '#FFF' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <tr>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item Description</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '70px' }}>Qty</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Unit Price</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', width: '120px' }}>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proformaPreFill.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>{item.description}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>Rs. {Number(item.unitPrice || 0).toLocaleString()}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                            Rs. {Number(item.total || (item.quantity * item.unitPrice) || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <div style={{ background: '#F0FDF4', padding: '8px 14px', borderRadius: '8px', border: '1px solid #BBF7D0', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Grand Total: </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginLeft: '6px' }}>
                      Rs. {Number(proformaPreFill.netAmount || proformaPreFill.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '9px 18px', fontWeight: 600, color: '#475569', cursor: 'pointer' }} onClick={() => setProformaPreFill(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={creatingPI} style={{ background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '8px', padding: '9px 22px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <FileSpreadsheet size={15} /> {creatingPI ? 'Generating Proforma...' : 'Confirm & Issue Proforma Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
