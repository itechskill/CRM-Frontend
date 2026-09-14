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
  MinusCircle,
  Tag,
  Minus
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
  discountPercentage: 0,
  tax: 0,
  taxPercentage: 0,
  totalAmount: 0,
  netAmount: 0,
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

  /**
   * Universal Financial Recalculation Engine for Proforma Invoices
   * Handles subtotal, discount percentage/amount, tax percentage/amount, and complete grand total.
   */
  const recalculateForm = (items, currentDiscountPct, currentDiscountAmt, currentTaxPct, currentTaxAmt, trigger = 'items') => {
    const subtotal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    
    let discountPct = currentDiscountPct === '' ? '' : Math.max(0, parseFloat(currentDiscountPct) || 0);
    let discountAmt = currentDiscountAmt === '' ? '' : Math.max(0, parseFloat(currentDiscountAmt) || 0);
    
    if (trigger === 'discountPct') {
      discountAmt = subtotal > 0 && typeof discountPct === 'number'
        ? Math.round(((subtotal * discountPct) / 100) * 100) / 100
        : (discountPct === 0 ? 0 : discountAmt);
    } else if (trigger === 'discountAmt') {
      discountPct = subtotal > 0 && typeof discountAmt === 'number'
        ? Math.round(((discountAmt / subtotal) * 100) * 100) / 100
        : (discountAmt === 0 ? 0 : discountPct);
    } else if (trigger === 'items') {
      if (typeof discountPct === 'number' && discountPct > 0) {
        discountAmt = Math.round(((subtotal * discountPct) / 100) * 100) / 100;
      }
    }
    
    const numDiscountAmt = typeof discountAmt === 'number' ? discountAmt : (Number(discountAmt) || 0);
    const taxableBase = Math.max(0, subtotal - numDiscountAmt);
    
    let taxPct = currentTaxPct === '' ? '' : Math.max(0, parseFloat(currentTaxPct) || 0);
    let taxAmt = currentTaxAmt === '' ? '' : Math.max(0, parseFloat(currentTaxAmt) || 0);
    
    if (trigger === 'taxPct' || trigger === 'discountPct' || trigger === 'discountAmt') {
      taxAmt = taxableBase > 0 && typeof taxPct === 'number'
        ? Math.round(((taxableBase * taxPct) / 100) * 100) / 100
        : (taxPct === 0 ? 0 : taxAmt);
    } else if (trigger === 'taxAmt') {
      taxPct = taxableBase > 0 && typeof taxAmt === 'number'
        ? Math.round(((taxAmt / taxableBase) * 100) * 100) / 100
        : (taxAmt === 0 ? 0 : taxPct);
    } else if (trigger === 'items') {
      if (typeof taxPct === 'number' && taxPct > 0) {
        taxAmt = Math.round(((taxableBase * taxPct) / 100) * 100) / 100;
      }
    }
    
    const numTaxAmt = typeof taxAmt === 'number' ? taxAmt : (Number(taxAmt) || 0);
    const netAmount = Math.max(0, Math.round((subtotal - numDiscountAmt + numTaxAmt) * 100) / 100);
    
    return {
      totalAmount: subtotal,
      discount: discountAmt,
      discountPercentage: discountPct,
      tax: taxAmt,
      taxPercentage: taxPct,
      netAmount
    };
  };

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

    const calculatedSubtotal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    const discVal = Number(so.discount) || 0;
    const discPct = so.discountPercentage !== undefined && so.discountPercentage !== null 
      ? Number(so.discountPercentage)
      : (calculatedSubtotal > 0 && discVal > 0 ? Math.round(((discVal / calculatedSubtotal) * 100) * 100) / 100 : 0);
    
    const taxableBase = Math.max(0, calculatedSubtotal - discVal);
    const taxVal = Number(so.tax) || 0;
    const taxPct = so.taxPercentage !== undefined && so.taxPercentage !== null
      ? Number(so.taxPercentage)
      : (taxableBase > 0 && taxVal > 0 ? Math.round(((taxVal / taxableBase) * 100) * 100) / 100 : (calculatedSubtotal > 0 && taxVal > 0 ? Math.round(((taxVal / calculatedSubtotal) * 100) * 100) / 100 : 0));

    const financials = recalculateForm(items, discPct, discVal, taxPct, taxVal, 'items');

    setForm({
      salesOrderId: so._id,
      salesOrderNumber: so.orderReference || so.orderNumber || '',
      clientName: so.clientName || '',
      clientEmail: so.clientEmail || '',
      clientPhone: so.clientPhone || '',
      clientAddress: so.clientAddress || '',
      items: items,
      ...financials,
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

    const calculatedSubtotal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    const discVal = Number(so.discount) || 0;
    const discPct = so.discountPercentage !== undefined && so.discountPercentage !== null 
      ? Number(so.discountPercentage)
      : (calculatedSubtotal > 0 && discVal > 0 ? Math.round(((discVal / calculatedSubtotal) * 100) * 100) / 100 : 0);
    
    const taxableBase = Math.max(0, calculatedSubtotal - discVal);
    const taxVal = Number(so.tax) || 0;
    const taxPct = so.taxPercentage !== undefined && so.taxPercentage !== null
      ? Number(so.taxPercentage)
      : (taxableBase > 0 && taxVal > 0 ? Math.round(((taxVal / taxableBase) * 100) * 100) / 100 : (calculatedSubtotal > 0 && taxVal > 0 ? Math.round(((taxVal / calculatedSubtotal) * 100) * 100) / 100 : 0));

    const financials = recalculateForm(items, discPct, discVal, taxPct, taxVal, 'items');

    setForm(prev => ({
      ...prev,
      salesOrderId: so._id,
      salesOrderNumber: so.orderReference || so.orderNumber || '',
      clientName: so.clientName || '',
      clientEmail: so.clientEmail || '',
      clientPhone: so.clientPhone || '',
      clientAddress: so.clientAddress || '',
      items: items,
      ...financials
    }));
  };

  const handleItemChange = (index, field, value) => {
    setForm(prev => {
      const updated = prev.items.map((it, idx) => {
        if (idx !== index) return it;
        const copy = { ...it };
        if (field === 'description') {
          copy.description = value;
        } else if (field === 'quantity') {
          const q = value === '' ? '' : Math.max(1, parseInt(value, 10) || 1);
          copy.quantity = q;
          copy.total = (typeof q === 'number' ? q : 1) * (Number(copy.unitPrice) || 0);
        } else if (field === 'unitPrice') {
          const u = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
          copy.unitPrice = u;
          copy.total = (Math.max(1, parseInt(copy.quantity, 10) || 1)) * (typeof u === 'number' ? u : 0);
        }
        return copy;
      });

      const financials = recalculateForm(
        updated,
        prev.discountPercentage,
        prev.discount,
        prev.taxPercentage,
        prev.tax,
        'items'
      );

      return {
        ...prev,
        items: updated,
        ...financials
      };
    });
  };

  const handleDiscountPctChange = (val) => {
    setForm(prev => {
      const financials = recalculateForm(prev.items, val, prev.discount, prev.taxPercentage, prev.tax, 'discountPct');
      return { ...prev, ...financials };
    });
  };

  const handleDiscountAmtChange = (val) => {
    setForm(prev => {
      const financials = recalculateForm(prev.items, prev.discountPercentage, val, prev.taxPercentage, prev.tax, 'discountAmt');
      return { ...prev, ...financials };
    });
  };

  const handleTaxPctChange = (val) => {
    setForm(prev => {
      const financials = recalculateForm(prev.items, prev.discountPercentage, prev.discount, val, prev.tax, 'taxPct');
      return { ...prev, ...financials };
    });
  };

  const handleTaxAmtChange = (val) => {
    setForm(prev => {
      const financials = recalculateForm(prev.items, prev.discountPercentage, prev.discount, prev.taxPercentage, val, 'taxAmt');
      return { ...prev, ...financials };
    });
  };

  const stepTaxPct = (delta) => {
    const current = Number(form.taxPercentage) || 0;
    const nextVal = Math.max(0, Math.min(100, Math.round((current + delta) * 10) / 10));
    handleTaxPctChange(nextVal);
  };

  const stepDiscountPct = (delta) => {
    const current = Number(form.discountPercentage) || 0;
    const nextVal = Math.max(0, Math.min(100, Math.round((current + delta) * 10) / 10));
    handleDiscountPctChange(nextVal);
  };

  const handleAddItem = () => {
    setForm(prev => {
      const newItems = [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }];
      const financials = recalculateForm(newItems, prev.discountPercentage, prev.discount, prev.taxPercentage, prev.tax, 'items');
      return {
        ...prev,
        items: newItems,
        ...financials
      };
    });
  };

  const handleRemoveItem = (index) => {
    setForm(prev => {
      if (prev.items.length <= 1) return prev;
      const newItems = prev.items.filter((_, idx) => idx !== index);
      const financials = recalculateForm(newItems, prev.discountPercentage, prev.discount, prev.taxPercentage, prev.tax, 'items');
      return {
        ...prev,
        items: newItems,
        ...financials
      };
    });
  };

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

    const calculated = recalculateForm(
      form.items,
      form.discountPercentage,
      form.discount,
      form.taxPercentage,
      form.tax,
      'items'
    );

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
        totalAmount: calculated.totalAmount,
        discount: Number(calculated.discount) || 0,
        discountPercentage: Number(calculated.discountPercentage) || 0,
        tax: Number(calculated.tax) || 0,
        taxPercentage: Number(calculated.taxPercentage) || 0,
        netAmount: calculated.netAmount,
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
    const rawItems = pi.items && pi.items.length > 0 ? pi.items : [{ description: '', quantity: 1, unitPrice: 0, total: 0 }];
    const calculatedSubtotal = rawItems.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    const discVal = Number(pi.discount) || 0;
    const discPct = pi.discountPercentage !== undefined && pi.discountPercentage !== null 
      ? Number(pi.discountPercentage) 
      : (calculatedSubtotal > 0 && discVal > 0 ? Math.round(((discVal / calculatedSubtotal) * 100) * 100) / 100 : 0);
    
    const taxableBase = Math.max(0, calculatedSubtotal - discVal);
    const taxVal = Number(pi.tax) || 0;
    const taxPct = pi.taxPercentage !== undefined && pi.taxPercentage !== null 
      ? Number(pi.taxPercentage) 
      : (taxableBase > 0 && taxVal > 0 ? Math.round(((taxVal / taxableBase) * 100) * 100) / 100 : 0);

    const financials = recalculateForm(rawItems, discPct, discVal, taxPct, taxVal, 'items');

    setEditProforma(pi);
    setError('');
    setForm({
      salesOrderId: pi.salesOrder?._id || pi.salesOrder || '',
      salesOrderNumber: pi.salesOrderNumber || pi.orderReference || '',
      clientName: pi.clientName || '',
      clientEmail: pi.clientEmail || '',
      clientPhone: pi.clientPhone || '',
      clientAddress: pi.clientAddress || '',
      items: rawItems,
      ...financials,
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
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Primary Brand Header Banner (A4 width = 210mm)
    doc.setFillColor(30, 58, 138); // Deep Navy #1E3A8A
    doc.rect(0, 0, 210, 36, 'F');

    // Accent line
    doc.setFillColor(37, 99, 235); // Blue #2563EB
    doc.rect(0, 36, 210, 2, 'F');

    // Brand Title & Subtitle (Left)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FORTLINE CRM', 14, 18);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text('Commercial Sales & Operations Portal • Tax & Commercial Documents', 14, 26);

    // Document Title & Reference (Right)
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('PROFORMA INVOICE', 196, 18, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(191, 219, 254);
    doc.text(`Doc Ref: ${pi.proformaNumber || 'PI-0000'}`, 196, 26, { align: 'right' });

    // Customer & Order Information Container Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 44, 182, 38, 2.5, 2.5, 'FD');

    // Left Column: Customer Details (X = 19)
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED / CONFINED TO:', 19, 52);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(pi.clientName || 'Valued Customer', 19, 58, { maxWidth: 85 });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const emailStr = pi.clientEmail ? `Email: ${pi.clientEmail}` : 'Email: —';
    const phoneStr = pi.clientPhone ? `Phone: ${pi.clientPhone}` : 'Phone: —';
    doc.text(`${emailStr}   •   ${phoneStr}`, 19, 64, { maxWidth: 85 });

    if (pi.clientAddress) {
      doc.text(`Address: ${pi.clientAddress}`, 19, 70, { maxWidth: 85 });
    } else {
      doc.text('Address: Direct Dispatch / Standard Delivery', 19, 70, { maxWidth: 85 });
    }

    // Vertical Divider Line between Customer and Order info
    doc.setDrawColor(226, 232, 240);
    doc.line(108, 48, 108, 78);

    // Right Column: Order & Proforma Meta (X = 114)
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER & INVOICE DETAILS:', 114, 52);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    doc.text('Sales Order Ref:', 114, 58);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${pi.salesOrderNumber || pi.orderReference || '—'}`, 155, 58);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Customer PO #:', 114, 64);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${pi.customerPONumber || 'N/A'}`, 155, 64);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Issue Date:', 114, 70);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${pi.issueDate ? new Date(pi.issueDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}`, 155, 70);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Status:', 114, 76);
    doc.setFont('helvetica', 'bold');
    const isApproved = pi.status === 'Approved';
    const isCancelled = pi.status === 'Cancelled';
    doc.setTextColor(isApproved ? 5 : (isCancelled ? 220 : 37), isApproved ? 150 : (isCancelled ? 38 : 99), isApproved ? 105 : (isCancelled ? 38 : 235));
    doc.text(`${pi.status || 'Issued'}`, 155, 76);

    // Items Table
    const tableBody = (pi.items && pi.items.length > 0)
      ? pi.items.map((it, idx) => [
          idx + 1,
          it.description || 'Standard Product Item',
          it.quantity || 1,
          `Rs. ${Number(it.unitPrice || 0).toLocaleString()}`,
          `Rs. ${Number(it.total || (it.quantity * it.unitPrice) || 0).toLocaleString()}`
        ])
      : [[1, 'Sales Order Items', 1, `Rs. ${Number(pi.netAmount || 0).toLocaleString()}`, `Rs. ${Number(pi.netAmount || 0).toLocaleString()}`]];

    autoTable(doc, {
      startY: 88,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [['#', 'Item Description & Specifications', 'Qty', 'Unit Price (PKR)', 'Total Amount (PKR)']],
      body: tableBody,
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

    // Terms & Conditions Container Box (Left, X=14, Width=100)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, finalY, 100, 42, 2, 2, 'FD');

    doc.setTextColor(30, 58, 138);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('COMMERCIAL TERMS & INSTRUCTIONS:', 18, finalY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.text(`• Payment Terms: ${pi.paymentTerms || 'Advance 100%'}`, 18, finalY + 14);
    doc.text(`• Delivery Terms: ${pi.deliveryTerms || 'Ex-Works / Standard Dispatch'}`, 18, finalY + 20);
    doc.text(`• Currency: Pakistani Rupee (PKR)`, 18, finalY + 26);
    if (pi.dueDate) {
      doc.text(`• Validity Period: Valid until ${new Date(pi.dueDate).toLocaleDateString('en-GB')}`, 18, finalY + 32);
    }
    if (pi.notes) {
      doc.text(`• Notes: ${pi.notes}`, 18, finalY + 38, { maxWidth: 92 });
    }

    const subtotal = Number(pi.totalAmount || 0);
    const discount = Number(pi.discount || 0);
    const discountPct = pi.discountPercentage !== undefined && pi.discountPercentage !== null && Number(pi.discountPercentage) > 0
      ? Number(pi.discountPercentage)
      : (subtotal > 0 && discount > 0 ? Math.round(((discount / subtotal) * 100) * 10) / 10 : 0);
    const taxableBase = Math.max(0, subtotal - discount);
    const tax = Number(pi.tax || 0);
    const taxPct = pi.taxPercentage !== undefined && pi.taxPercentage !== null && Number(pi.taxPercentage) > 0
      ? Number(pi.taxPercentage)
      : (taxableBase > 0 && tax > 0 ? Math.round(((tax / taxableBase) * 100) * 10) / 10 : (subtotal > 0 && tax > 0 ? Math.round(((tax / subtotal) * 100) * 10) / 10 : 0));
    const grandTotal = Number(pi.netAmount !== undefined ? pi.netAmount : (subtotal - discount + tax));

    // Financial Breakdown Box (Right, X=118, Width=78)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(118, finalY, 78, 42, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Subtotal:', 122, finalY + 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${subtotal.toLocaleString()}`, 192, finalY + 7, { align: 'right' });

    if (discount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(220, 38, 38);
      const discLbl = discountPct > 0 ? `Discount (- ${discountPct}%):` : 'Discount (-):';
      doc.text(discLbl, 122, finalY + 13);
      doc.text(`- Rs. ${discount.toLocaleString()}`, 192, finalY + 13, { align: 'right' });
    }

    if (tax > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const taxLbl = taxPct > 0 ? `Tax / GST (+ ${taxPct}%):` : 'Tax / GST (+):';
      doc.text(taxLbl, 122, finalY + 19);
      doc.text(`+ Rs. ${tax.toLocaleString()}`, 192, finalY + 19, { align: 'right' });
    }

    // Grand Total Highlight Rect
    doc.setFillColor(236, 253, 245); // #ECFDF5
    doc.setDrawColor(167, 243, 208); // #A7F3D0
    doc.roundedRect(122, finalY + 24, 70, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(4, 120, 87); // #047857
    doc.text('GRAND TOTAL (PKR):', 126, finalY + 30);

    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105); // #059669
    doc.text(`Rs. ${Number(pi.netAmount || 0).toLocaleString()}`, 188, finalY + 35, { align: 'right' });

    // Signature Block
    const sigY = 252;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);

    // Left Signature
    doc.line(14, sigY + 12, 75, sigY + 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Prepared By:', 14, sigY + 17);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Commercial Sales Department', 14, sigY + 21);

    // Right Signature
    doc.line(135, sigY + 12, 196, sigY + 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Authorized Signatory:', 135, sigY + 17);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Company Stamp & Official Approval', 135, sigY + 21);

    // Document Footer Note
    doc.setDrawColor(241, 245, 249);
    doc.line(14, 280, 196, 280);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated via Fortline CRM • Commercial Proforma Invoice • Official Commercial Document', 105, 285, { align: 'center' });

    doc.save(`Proforma_Invoice_${pi.proformaNumber || 'PI'}.pdf`);
  };

  // ── COMPLETE PROFORMA INVOICES LEDGER EXPORT (PDF) ──
  const downloadCompleteProformasPDF = () => {
    const dataset = filteredProformas.length > 0 ? filteredProformas : proformas;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const nowStr = new Date().toLocaleDateString('en-GB');

    doc.setFillColor(15, 23, 42); // Navy
    doc.rect(0, 0, 297, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM — PROFORMA INVOICES MASTER LEDGER', 14, 12);

    const totalAmt = dataset.reduce((sum, p) => sum + (Number(p.netAmount || p.totalAmount) || 0), 0);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${nowStr} | Total Records: ${dataset.length} | Grand Total Volume: Rs. ${totalAmt.toLocaleString()} PKR`, 14, 19);

    const rows = dataset.map((p, idx) => [
      idx + 1,
      p.proformaNumber || '—',
      p.clientName || '—',
      p.salesOrderNumber || p.orderReference || '—',
      p.customerPONumber || '—',
      p.issueDate ? new Date(p.issueDate).toLocaleDateString('en-GB') : '—',
      p.validUntil ? new Date(p.validUntil).toLocaleDateString('en-GB') : '—',
      p.status || 'Draft',
      (p.items || []).length,
      `Rs. ${Number(p.netAmount || p.totalAmount || 0).toLocaleString()}`
    ]);

    try {
      autoTable(doc, {
        startY: 28,
        head: [['#', 'PI Number', 'Customer Name', 'Linked SO #', 'Customer PO #', 'Issue Date', 'Valid Until', 'Status', 'Items', 'Grand Total (PKR)']],
        body: rows,
        foot: [[
          { content: 'GRAND TOTAL / SUMMARY', colSpan: 9, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
          { content: `Rs. ${totalAmt.toLocaleString()}`, styles: { halign: 'left', fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [4, 120, 87] } }
        ]],
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      doc.save(`Proforma_Invoices_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Proforma invoices PDF export error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // ── COMPLETE PROFORMA INVOICES LEDGER EXPORT (EXCEL / CSV) ──
  const downloadCompleteProformasExcel = () => {
    const dataset = filteredProformas.length > 0 ? filteredProformas : proformas;
    const totalAmt = dataset.reduce((sum, p) => sum + (Number(p.netAmount || p.totalAmount) || 0), 0);

    const headers = ['#', 'Proforma Number', 'Client Name', 'Customer Email', 'Customer Phone', 'Sales Order #', 'Customer PO #', 'Issue Date', 'Valid Until', 'Status', 'Payment Terms', 'Subtotal', 'Tax Rate (%)', 'Tax (PKR)', 'Discount (PKR)', 'Net Total Amount (PKR)', 'Notes'];
    const rows = dataset.map((p, idx) => [
      idx + 1,
      `"${p.proformaNumber || ''}"`,
      `"${(p.clientName || '').replace(/"/g, '""')}"`,
      `"${p.clientEmail || ''}"`,
      `"${p.clientPhone || ''}"`,
      `"${p.salesOrderNumber || p.orderReference || ''}"`,
      `"${p.customerPONumber || ''}"`,
      `"${p.issueDate ? new Date(p.issueDate).toLocaleDateString('en-GB') : ''}"`,
      `"${p.validUntil ? new Date(p.validUntil).toLocaleDateString('en-GB') : ''}"`,
      `"${p.status || 'Draft'}"`,
      `"${p.paymentTerms || 'Advance Payment'}"`,
      Number(p.subtotal || p.netAmount || 0),
      Number(p.taxRate || 0),
      Number(p.tax || 0),
      Number(p.discount || 0),
      Number(p.netAmount || p.totalAmount || 0),
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);

    rows.push([
      'TOTAL',
      `"Total Records: ${dataset.length}"`,
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      totalAmt,
      '""'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Proforma_Invoices_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button className="sv-btn-secondary" onClick={downloadCompleteProformasPDF} title="Download Complete Proformas (PDF)">
            <Download size={15} color="#DC2626" /> Export PDF
          </button>
          <button className="sv-btn-secondary" onClick={downloadCompleteProformasExcel} title="Download Complete Proformas (Excel)">
            <FileSpreadsheet size={15} color="#059669" /> Export Excel
          </button>
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
                  <Calendar size={14} color="#2563EB" /> 3. Commercial Terms & Delivery Dates
                </div>

                <div className="sv-grid-2" style={{ marginBottom: '14px' }}>
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

                <div className="sv-grid-2" style={{ marginBottom: '14px' }}>
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

                <div className="sv-field" style={{ marginBottom: '16px' }}>
                  <label>Notes & Commercial Remarks</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Special instructions or commercial terms..."
                  />
                </div>

                {/* Section 3B: Dynamic Percentage & PKR Discount and Tax Calculator */}
                <div className="quote-calc-card">
                  <div className="quote-calc-grid">
                    {/* Discount Control Column */}
                    <div className="quote-calc-col">
                      <div className="quote-calc-col-header" style={{ color: '#DC2626' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tag size={14} /> Discount
                        </span>
                        <span style={{ fontSize: '0.75rem', background: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          - {Number(form.discountPercentage || 0)}%
                        </span>
                      </div>

                      <div className="quote-calc-input-row">
                        {/* Percentage Stepper */}
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                            Discount (%)
                          </label>
                          <div className="quote-stepper-group" style={{ width: '100%' }}>
                            <button
                              type="button"
                              className="quote-stepper-btn"
                              onClick={() => stepDiscountPct(-1)}
                              title="Decrease Discount % by 1%"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={form.discountPercentage === '' ? '' : form.discountPercentage}
                              onChange={e => handleDiscountPctChange(e.target.value)}
                              className="quote-stepper-val"
                              style={{ flex: 1 }}
                              placeholder="0"
                            />
                            <button
                              type="button"
                              className="quote-stepper-btn"
                              onClick={() => stepDiscountPct(1)}
                              title="Increase Discount % by 1%"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Direct Amount Input */}
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                            Discount Amount (PKR)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={form.discount === '' ? '' : form.discount}
                            onChange={e => handleDiscountAmtChange(e.target.value)}
                            placeholder="0"
                            style={{
                              width: '100%',
                              height: '38px',
                              padding: '6px 10px',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: '#DC2626',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              background: '#FFFFFF'
                            }}
                          />
                        </div>
                      </div>

                      {/* Quick Percentage Presets */}
                      <div className="quote-presets-row">
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>Presets:</span>
                        {[0, 5, 10, 15, 20].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            className={`quote-preset-btn ${Number(form.discountPercentage) === pct ? 'active-discount' : ''}`}
                            onClick={() => handleDiscountPctChange(pct)}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tax / GST Control Column */}
                    <div className="quote-calc-col">
                      <div className="quote-calc-col-header" style={{ color: '#2563EB' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Percent size={14} /> Tax / GST
                        </span>
                        <span style={{ fontSize: '0.75rem', background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          + {Number(form.taxPercentage || 0)}%
                        </span>
                      </div>

                      <div className="quote-calc-input-row">
                        {/* Percentage Stepper with easy increase / decrease */}
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                            Tax Rate (%)
                          </label>
                          <div className="quote-stepper-group" style={{ width: '100%' }}>
                            <button
                              type="button"
                              className="quote-stepper-btn"
                              onClick={() => stepTaxPct(-1)}
                              title="Decrease Tax % by 1%"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={form.taxPercentage === '' ? '' : form.taxPercentage}
                              onChange={e => handleTaxPctChange(e.target.value)}
                              className="quote-stepper-val"
                              style={{ flex: 1 }}
                              placeholder="0"
                            />
                            <button
                              type="button"
                              className="quote-stepper-btn"
                              onClick={() => stepTaxPct(1)}
                              title="Increase Tax % by 1%"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Direct Tax PKR Input */}
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                            Tax Amount (PKR)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={form.tax === '' ? '' : form.tax}
                            onChange={e => handleTaxAmtChange(e.target.value)}
                            placeholder="0"
                            style={{
                              width: '100%',
                              height: '38px',
                              padding: '6px 10px',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: '#1E293B',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              background: '#FFFFFF'
                            }}
                          />
                        </div>
                      </div>

                      {/* Quick Percentage Presets */}
                      <div className="quote-presets-row">
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>Presets:</span>
                        {[0, 5, 10, 15, 16, 17, 18].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            className={`quote-preset-btn ${Number(form.taxPercentage) === pct ? 'active' : ''}`}
                            onClick={() => handleTaxPctChange(pct)}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Comprehensive Live Calculation Summary Banner */}
                  <div className="quote-summary-banner">
                    <div className="quote-summary-stat-grid">
                      <div>
                        <div className="quote-summary-stat-label">Subtotal (Products)</div>
                        <div className="quote-summary-stat-val" style={{ color: '#1E293B' }}>
                          Rs. {Number(form.totalAmount || 0).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>PKR</span>
                        </div>
                      </div>
                      <div>
                        <div className="quote-summary-stat-label" style={{ color: '#DC2626' }}>
                          Discount ({Number(form.discountPercentage || 0)}%)
                        </div>
                        <div className="quote-summary-stat-val" style={{ color: '#DC2626' }}>
                          - Rs. {Number(form.discount || 0).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>PKR</span>
                        </div>
                      </div>
                      <div>
                        <div className="quote-summary-stat-label" style={{ color: '#2563EB' }}>
                          Tax / GST ({Number(form.taxPercentage || 0)}%)
                        </div>
                        <div className="quote-summary-stat-val" style={{ color: '#2563EB' }}>
                          + Rs. {Number(form.tax || 0).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>PKR</span>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1.5px dashed #A7F3D0',
                      paddingTop: '10px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: '#065F46', fontWeight: 600 }}>
                        Calculation: <strong>Rs. {Number(form.totalAmount || 0).toLocaleString()}</strong> (Subtotal) 
                        {Number(form.discount || 0) > 0 && <span> - <strong>Rs. {Number(form.discount || 0).toLocaleString()}</strong> ({Number(form.discountPercentage || 0)}% Disc)</span>}
                        {Number(form.tax || 0) > 0 && <span> + <strong>Rs. {Number(form.tax || 0).toLocaleString()}</strong> ({Number(form.taxPercentage || 0)}% Tax)</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: 800, color: '#047857' }}>
                          Grand Total:
                        </span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
                          Rs. {Number(form.netAmount || 0).toLocaleString()} <span style={{ fontSize: '0.85rem' }}>PKR</span>
                        </span>
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
                      <span>Discount (- {Number(viewProforma.discountPercentage !== undefined && viewProforma.discountPercentage !== null && Number(viewProforma.discountPercentage) > 0 ? viewProforma.discountPercentage : ((Number(viewProforma.discount) / Math.max(1, Number(viewProforma.totalAmount || 0))) * 100)).toFixed(1)}%):</span>
                      <span>- Rs. {Number(viewProforma.discount).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(viewProforma.tax) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                      <span>Tax / GST (+ {Number(viewProforma.taxPercentage !== undefined && viewProforma.taxPercentage !== null && Number(viewProforma.taxPercentage) > 0 ? viewProforma.taxPercentage : ((Number(viewProforma.tax) / Math.max(1, Number(viewProforma.totalAmount || 0) - Number(viewProforma.discount || 0))) * 100)).toFixed(1)}%):</span>
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
