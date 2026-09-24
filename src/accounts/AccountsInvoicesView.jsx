import React, { useState, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import { generateCombinedDocumentPackagePDF } from '../utils/combinedPdfGenerator';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Download,
  X,
  Save,
  Send,
  CheckCircle2,
  DollarSign,
  Truck,
  ShoppingCart,
  Calendar,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Tag,
  FileSpreadsheet
} from 'lucide-react';
import '../employee/sales/SalesViews.css';
import './InvoicePaymentForms.css';

export default function AccountsInvoicesView({ initialOrder, initialPreFillOrder, onClearInitialOrder, searchQuery }) {
  const [invoices, setInvoices] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [sendingId, setSendingId] = useState(null);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [selectedDN, setSelectedDN] = useState(null);
  const [activeTab, setActiveTab] = useState('drafts'); // 'drafts' | 'submitted' | 'all'

  const [form, setForm] = useState({
    salesOrderId: '',
    salesOrderNumber: '',
    deliveryNoteId: '',
    deliveryNoteNumber: '',
    clientName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    fileNumber: '',
    fileType: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    subtotal: 0,
    tax: 0,
    taxRate: 0,
    discount: 0,
    amount: 0,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerms: 'Net 30',
    status: 'Draft',
    notes: ''
  });

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/invoices');
      if (response.ok && data.success) {
        const cutoff = new Date('2026-09-15T00:00:00.000Z');
        setInvoices((data.data || []).filter(d => new Date(d.createdAt) > cutoff));
      }
    } catch (e) {
      console.error('[Fetch Invoices Error]:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const { response, data } = await apiRequest('/api/sales-employee/orders');
      if (response.ok && data.success) {
        setSalesOrders(data.data || []);
      }
    } catch (e) {
      console.error('[Fetch Orders Error]:', e);
    }
  }, []);

  const fetchDeliveryNotes = useCallback(async () => {
    try {
      const { response, data } = await apiRequest('/api/sales-employee/delivery-notes');
      if (response.ok && data.success) {
        setDeliveryNotes(data.data || []);
      }
    } catch (e) {
      console.error('[Fetch Delivery Notes Error]:', e);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchOrders();
    fetchDeliveryNotes();
  }, [fetchInvoices, fetchOrders, fetchDeliveryNotes]);

  // Handle incoming prefill order from navigation
  useEffect(() => {
    const targetOrder = initialOrder || initialPreFillOrder;
    if (targetOrder) {
      if (targetOrder.deliveryNumber || targetOrder.deliveryNoteNumber) {
        handleSelectDeliveryNote(targetOrder._id, targetOrder);
      } else {
        handleSelectOrder(targetOrder._id);
      }
      setShowModal(true);
      if (onClearInitialOrder) onClearInitialOrder();
    }
  }, [initialOrder, initialPreFillOrder]);

  // AUTO-SELECT DELIVERY NOTE FOR INVOICE CREATION
  const handleSelectDeliveryNote = (dnId, directDn = null) => {
    if (!dnId && !directDn) {
      setSelectedDN(null);
      return;
    }

    const dn = directDn || deliveryNotes.find(d => d._id === dnId);
    if (!dn) return;

    setSelectedDN(dn);

    // Resolve linked sales order data
    const linkedSoId = dn.salesOrder?._id || dn.salesOrder;
    const so = salesOrders.find(o => o._id === linkedSoId) || (typeof dn.salesOrder === 'object' ? dn.salesOrder : null);

    const dnNumber = dn.deliveryNumber || dn.deliveryNoteNumber || '';
    const soNumber = dn.salesOrderNumber || so?.orderReference || so?.orderNumber || '';

    // Auto-map line items from delivery note or sales order
    let items = [];
    if (so?.items && so.items.length > 0) {
      items = so.items.map(it => {
        const qty = Number(it.quantity) || 1;
        const up = Number(it.unitPrice) || 0;
        return {
          description: it.description || it.product || 'Item',
          quantity: qty,
          unitPrice: up,
          total: qty * up
        };
      });
    } else if (dn.items && dn.items.length > 0) {
      items = dn.items.map(it => {
        const qty = Number(it.quantity) || Number(it.demand) || 1;
        const up = Number(it.unitPrice) || (Number(so?.netAmount || 0) / (dn.items.length || 1)) || 0;
        return {
          description: it.description || it.product || 'Item',
          quantity: qty,
          unitPrice: up,
          total: qty * up
        };
      });
    } else {
      const amountVal = Number(so?.netAmount || so?.totalAmount) || 0;
      items = [{
        description: so?.productSummary || `Goods delivered as per ${dnNumber}`,
        quantity: 1,
        unitPrice: amountVal,
        total: amountVal
      }];
    }

    const subtotal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    const disc = Number(so?.discount) || 0;
    const taxRate = Number(so?.taxRate) || 0;
    const tax = Number(so?.tax) || (taxRate > 0 ? (subtotal - disc) * (taxRate / 100) : 0);
    const net = Math.max(0, subtotal - disc + tax);

    setForm(prev => ({
      ...prev,
      deliveryNoteId: dn._id,
      deliveryNoteNumber: dnNumber,
      salesOrderId: so?._id || linkedSoId || '',
      salesOrderNumber: soNumber,
      clientName: dn.clientName || so?.clientName || '',
      customerEmail: so?.clientEmail || '',
      customerPhone: dn.recipientPhone || so?.clientPhone || '',
      customerAddress: dn.deliveryAddress || so?.clientAddress || '',
      fileNumber: so?.fileNo || '',
      fileType: so?.fileType || '',
      items: items,
      subtotal: subtotal,
      discount: disc,
      taxRate: taxRate,
      tax: tax,
      amount: net,
      notes: `Final Invoice generated from Delivery Note ${dnNumber}${soNumber ? ` (Sales Order ${soNumber})` : ''}.`
    }));
  };

  // SELECT SALES ORDER (ALTERNATIVE)
  const handleSelectOrder = (soId) => {
    const so = salesOrders.find(o => o._id === soId);
    if (!so) return;

    // Check if there is a delivery note for this sales order
    const matchingDN = deliveryNotes.find(d => {
      const dSoId = d.salesOrder?._id || d.salesOrder;
      return dSoId === soId || (d.salesOrderNumber && d.salesOrderNumber === (so.orderReference || so.orderNumber));
    });

    if (matchingDN) {
      handleSelectDeliveryNote(matchingDN._id);
      return;
    }

    const items = (so.items && so.items.length > 0)
      ? so.items.map(it => ({
          description: it.description || 'Item',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          total: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)
        }))
      : [{ description: so.productSummary || 'General Service / Products', quantity: 1, unitPrice: Number(so.netAmount || so.totalAmount) || 0, total: Number(so.netAmount || so.totalAmount) || 0 }];

    const subtotal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    const disc = Number(so.discount) || 0;
    const tax = Number(so.tax) || 0;
    const net = Math.max(0, subtotal - disc + tax);

    setSelectedDN(null);
    setForm(prev => ({
      ...prev,
      salesOrderId: so._id,
      salesOrderNumber: so.orderReference || so.orderNumber || '',
      deliveryNoteId: '',
      deliveryNoteNumber: '',
      clientName: so.clientName || '',
      customerEmail: so.clientEmail || '',
      customerPhone: so.clientPhone || '',
      customerAddress: so.clientAddress || '',
      fileNumber: so.fileNo || '',
      fileType: so.fileType || '',
      items: items,
      subtotal: subtotal,
      discount: disc,
      tax: tax,
      amount: net,
      notes: `Final Invoice generated from Sales Order ${so.orderReference || so.orderNumber}`
    }));
  };

  // ITEM MANAGEMENT
  const handleItemChange = (index, field, value) => {
    const updated = [...form.items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) || 0 : Number(updated[index].quantity) || 0;
      const p = field === 'unitPrice' ? Number(value) || 0 : Number(updated[index].unitPrice) || 0;
      updated[index].total = q * p;
    }

    const subtotal = updated.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const tax = form.taxRate > 0 ? (subtotal - (Number(form.discount) || 0)) * (form.taxRate / 100) : (Number(form.tax) || 0);
    const net = Math.max(0, subtotal - (Number(form.discount) || 0) + tax);

    setForm(prev => ({
      ...prev,
      items: updated,
      subtotal,
      tax,
      amount: net
    }));
  };

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (form.items.length <= 1) return;
    const updated = form.items.filter((_, i) => i !== index);
    const subtotal = updated.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const tax = form.taxRate > 0 ? (subtotal - (Number(form.discount) || 0)) * (form.taxRate / 100) : (Number(form.tax) || 0);
    const net = Math.max(0, subtotal - (Number(form.discount) || 0) + tax);

    setForm(prev => ({
      ...prev,
      items: updated,
      subtotal,
      tax,
      amount: net
    }));
  };

  const handleFinancialFieldChange = (field, value) => {
    const numVal = Math.max(0, Number(value) || 0);
    const newForm = { ...form, [field]: numVal };

    const subtotal = Number(newForm.subtotal) || 0;
    const disc = field === 'discount' ? numVal : (Number(newForm.discount) || 0);
    const taxRate = field === 'taxRate' ? numVal : (Number(newForm.taxRate) || 0);

    let tax = Number(newForm.tax) || 0;
    if (field === 'taxRate') {
      tax = taxRate > 0 ? (subtotal - disc) * (taxRate / 100) : 0;
      newForm.tax = tax;
    } else if (field === 'tax') {
      tax = numVal;
    }

    const net = Math.max(0, subtotal - disc + tax);
    newForm.amount = net;
    setForm(newForm);
  };

  const openCreateModal = () => {
    setEditInvoice(null);
    setSelectedDN(null);
    setForm({
      salesOrderId: '',
      salesOrderNumber: '',
      deliveryNoteId: '',
      deliveryNoteNumber: '',
      clientName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      fileNumber: '',
      fileType: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      subtotal: 0,
      tax: 0,
      taxRate: 0,
      discount: 0,
      amount: 0,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: 'Net 30',
      status: 'Draft',
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (inv) => {
    setEditInvoice(inv);
    const matchingDN = deliveryNotes.find(d => d._id === inv.deliveryNoteId);
    setSelectedDN(matchingDN || null);
    setForm({
      salesOrderId: inv.salesOrderId || '',
      salesOrderNumber: inv.salesOrderNumber || '',
      deliveryNoteId: inv.deliveryNoteId || '',
      deliveryNoteNumber: inv.deliveryNoteNumber || '',
      clientName: inv.clientName || '',
      customerEmail: inv.customerEmail || '',
      customerPhone: inv.customerPhone || '',
      customerAddress: inv.customerAddress || '',
      fileNumber: inv.fileNumber || '',
      fileType: inv.fileType || '',
      items: inv.items && inv.items.length > 0 ? inv.items : [{ description: 'Item', quantity: 1, unitPrice: inv.amount, total: inv.amount }],
      subtotal: inv.subtotal || inv.amount || 0,
      tax: inv.tax || 0,
      taxRate: inv.taxRate || 0,
      discount: inv.discount || 0,
      amount: inv.amount || 0,
      issueDate: inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
      paymentTerms: inv.paymentTerms || 'Net 30',
      status: inv.status || 'Pending Review',
      notes: inv.notes || ''
    });
    setShowModal(true);
  };

  const handleSaveInvoice = async (e, resubmit = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.clientName.trim()) {
      alert('Client / Customer name is required.');
      return;
    }
    if (!form.amount || form.amount <= 0) {
      alert('Invoice total amount must be greater than 0.');
      return;
    }

    setSavingInvoice(true);
    try {
      const url = editInvoice
        ? `/api/sales-employee/invoices/${editInvoice._id}`
        : '/api/sales-employee/invoices';
      const method = editInvoice ? 'PATCH' : 'POST';

      const { response, data } = await apiRequest(url, {
        method,
        body: JSON.stringify(form)
      });

      if (response.ok && data.success) {
        const savedInvoice = data.data || editInvoice;
        if (resubmit && savedInvoice?._id) {
          const sendRes = await apiRequest(`/api/sales-employee/invoices/${savedInvoice._id}/send-to-finance`, {
            method: 'POST',
            body: JSON.stringify({ notes: 'Invoice revised and resubmitted to Finance for finalization.' })
          });
          if (sendRes.response.ok && sendRes.data.success) {
            setFeedback(`Draft Invoice ${savedInvoice.invoiceNumber || ''} revised and successfully resubmitted to Finance!`);
          } else {
            setFeedback(`Invoice saved, but could not send to Finance: ${sendRes.data.message || ''}`);
          }
        } else {
          setFeedback(`Invoice ${savedInvoice?.invoiceNumber || ''} saved successfully!`);
        }
        setShowModal(false);
        fetchInvoices();
        setTimeout(() => setFeedback(''), 4500);
      } else {
        alert(data.message || 'Failed to save Invoice.');
      }
    } catch (err) {
      alert('Server error saving Invoice.');
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleSendToFinance = async (inv) => {
    setSendingId(inv._id);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/invoices/${inv._id}/send-to-finance`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Invoice submitted to Finance Department for processing & collections.' })
      });
      if (response.ok && data.success) {
        setFeedback(`Invoice ${inv.invoiceNumber} submitted to Finance Department!`);
        fetchInvoices();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(data.message || 'Failed to send invoice to Finance.');
      }
    } catch (err) {
      alert('Error sending invoice to Finance.');
    } finally {
      setSendingId(null);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteTarget) return;
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/invoices/${deleteTarget._id}`, {
        method: 'DELETE'
      });
      if (response.ok && data.success) {
        setFeedback(`Invoice ${deleteTarget.invoiceNumber} deleted.`);
        setDeleteTarget(null);
        fetchInvoices();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(data.message || 'Failed to delete Invoice.');
      }
    } catch (err) {
      alert('Error deleting Invoice.');
    }
  };

  const handleDownloadPDF = (inv) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('COMMERCIAL INVOICE', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('FORTLINE CRM • Accounts Department', 14, 26);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 30, 196, 30);

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Invoice Number: ${inv.invoiceNumber}`, 14, 38);
    doc.text(`Issue Date: ${inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : 'N/A'}`, 14, 44);
    doc.text(`Due Date: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}`, 14, 50);
    doc.text(`Payment Terms: ${inv.paymentTerms || 'Net 30'}`, 14, 56);

    doc.text(`Billed To: ${inv.clientName}`, 120, 38);
    doc.text(`Email: ${inv.customerEmail || '—'}`, 120, 44);
    doc.text(`Phone: ${inv.customerPhone || '—'}`, 120, 50);
    doc.text(`Delivery Note: ${inv.deliveryNoteNumber || '—'}`, 120, 56);
    doc.text(`Sales Order: ${inv.salesOrderNumber || '—'}`, 120, 62);

    const tableRows = (inv.items && inv.items.length > 0)
      ? inv.items.map((it, idx) => [idx + 1, it.description, it.quantity, `Rs. ${Number(it.unitPrice).toLocaleString()}`, `Rs. ${Number(it.total).toLocaleString()}`])
      : [[1, inv.description || 'Deliverables', 1, `Rs. ${Number(inv.amount).toLocaleString()}`, `Rs. ${Number(inv.amount).toLocaleString()}`]];

    autoTable(doc, {
      startY: 68,
      head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total (PKR)']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Subtotal: Rs. ${Number(inv.subtotal || inv.amount).toLocaleString()}`, 130, finalY);
    if (inv.discount > 0) doc.text(`Discount: -Rs. ${Number(inv.discount).toLocaleString()}`, 130, finalY + 6);
    if (inv.tax > 0) doc.text(`Tax: +Rs. ${Number(inv.tax).toLocaleString()}`, 130, finalY + 12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Amount: Rs. ${Number(inv.amount).toLocaleString()}`, 130, finalY + 20);

    doc.save(`${inv.invoiceNumber || 'Invoice'}.pdf`);
  };

  const handleDownloadCombinedPackage = async (inv) => {
    const orderId = inv.salesOrderId?._id || inv.salesOrderId;
    if (!orderId) {
      alert('This invoice is not linked to a master Sales Order.');
      return;
    }

    try {
      const res = await apiRequest(`/api/sales-employee/orders/${orderId}/document-package`);
      if (res.success && res.data) {
        const { isComplete, missingDocuments } = res.data.validation;
        if (!isComplete && missingDocuments.length > 0) {
          alert(`Complete document package cannot be generated.\n\nThe following document is missing:\n- ${missingDocuments.join('\n- ')}`);
          return;
        }

        generateCombinedDocumentPackagePDF(res.data);
      } else {
        alert(res.message || 'Error fetching document package details.');
      }
    } catch (err) {
      console.error('Download Package Error:', err);
      alert('Failed to generate complete document package PDF.');
    }
  };

  // Export Full Invoices List PDF
  const handleExportAllPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(30, 58, 138); // Navy
    doc.rect(0, 0, 297, 26, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM — ACCOUNTS INVOICES & BILLING REGISTER', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 242, 254);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} • All amounts in Pakistani Rupees (PKR)`, 14, 20);

    const rows = filteredInvoices.map((inv, idx) => [
      (idx + 1).toString(),
      inv.invoiceNumber || `INV-${idx + 1}`,
      inv.clientName || '—',
      inv.salesOrderNumber || '—',
      inv.deliveryNoteNumber || '—',
      `Rs. ${(Number(inv.amount) || 0).toLocaleString()}`,
      `Rs. ${(Number(inv.paidAmount) || 0).toLocaleString()}`,
      inv.status || 'Draft',
      inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-GB') : '—'
    ]);

    autoTable(doc, {
      startY: 32,
      margin: { left: 14, right: 14 },
      head: [['#', 'Invoice #', 'Customer / Client', 'Sales Order #', 'DN #', 'Total (PKR)', 'Paid (PKR)', 'Status', 'Date']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
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
        1: { cellWidth: 30, fontStyle: 'bold' },
        2: { cellWidth: 54 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 30, halign: 'right' },
        7: { cellWidth: 28, halign: 'center' },
        8: { cellWidth: 23, halign: 'center' }
      }
    });

    const totalVal = filteredInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(`Total Filtered Value: Rs. ${totalVal.toLocaleString()} (${filteredInvoices.length} Invoices)`, 14, finalY > 195 ? 195 : finalY);

    doc.save(`Fortline_Accounts_Invoices_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export Full Invoices List Excel CSV
  const handleExportAllExcel = () => {
    const headers = ['#', 'Invoice Number', 'Customer / Client', 'Sales Order Number', 'Delivery Note Number', 'Total Amount (PKR)', 'Paid Amount (PKR)', 'Status', 'Created Date', 'Payment Terms'];
    const rows = filteredInvoices.map((inv, idx) => [
      idx + 1,
      `"${inv.invoiceNumber || ''}"`,
      `"${(inv.clientName || '').replace(/"/g, '""')}"`,
      `"${inv.salesOrderNumber || ''}"`,
      `"${inv.deliveryNoteNumber || ''}"`,
      Number(inv.amount) || 0,
      Number(inv.paidAmount) || 0,
      `"${inv.status || 'Draft'}"`,
      `"${inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-GB') : ''}"`,
      `"${inv.paymentTerms || 'Net 30'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fortline_Accounts_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingDrafts = invoices.filter(i =>
    i.status === 'Draft' ||
    i.status === 'Pending Review' ||
    (i.isDraft && i.status !== 'Pending Finance Finalization')
  );
  const submittedToFinance = invoices.filter(i =>
    i.status === 'Pending Finance Finalization' ||
    i.status === 'Submitted' ||
    i.status === 'Approved' ||
    i.status === 'Finalized'
  );

  const displayedInvoices = activeTab === 'drafts'
    ? pendingDrafts
    : activeTab === 'submitted'
    ? submittedToFinance
    : invoices;

  const filteredInvoices = displayedInvoices.filter(inv => {
    const effectiveSearch = (searchQuery || searchTerm || '').trim().toLowerCase();
    if (!effectiveSearch) return true;
    const term = effectiveSearch;
    return (
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(term)) ||
      (inv.clientName && inv.clientName.toLowerCase().includes(term)) ||
      (inv.salePerson && inv.salePerson.toLowerCase().includes(term)) ||
      (inv.salesPerson?.fullName && inv.salesPerson.fullName.toLowerCase().includes(term)) ||
      (inv.salesOrderNumber && inv.salesOrderNumber.toLowerCase().includes(term)) ||
      (inv.deliveryNoteNumber && inv.deliveryNoteNumber.toLowerCase().includes(term)) ||
      (inv.fileNumber && inv.fileNumber.toLowerCase().includes(term)) ||
      (inv.status && inv.status.toLowerCase().includes(term)) ||
      (inv.invoiceType && inv.invoiceType.toLowerCase().includes(term)) ||
      (inv.items && inv.items.some(i => (i.description || '').toLowerCase().includes(term)))
    );
  });

  return (
    <div className="sv-container">
      {/* Top Bar */}
      <div className="sv-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="sv-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={22} color="#2563EB" /> Invoices Management
          </h2>
          <p className="sv-subtitle">
            Create, issue, and manage commercial draft invoices linked with Delivery Notes &amp; Sales Orders
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="sv-btn-primary" style={{ background: '#1E3A8A' }} onClick={handleExportAllPDF} title="Export Invoices PDF">
            <Download size={15} /> Export PDF
          </button>
          <button className="sv-btn-primary" style={{ background: '#2563EB' }} onClick={handleExportAllExcel} title="Export Invoices Excel">
            <FileSpreadsheet size={15} /> Export Excel
          </button>
          <button className="sv-btn-primary" style={{ background: '#0F172A' }} onClick={openCreateModal}>
            <Plus size={16} /> Create Draft Invoice
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{
          background: '#ECFDF5',
          color: '#065F46',
          padding: '12px 18px',
          borderRadius: '10px',
          border: '1px solid #A7F3D0',
          fontWeight: 600,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <CheckCircle2 size={16} color="#059669" /> {feedback}
        </div>
      )}

      {/* KPI Cards */}
      <div className="sv-grid-4" style={{ marginBottom: '20px' }}>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #D97706' }}>
          <span className="sv-ts-label">Pending Drafts</span>
          <span className="sv-ts-value" style={{ color: '#D97706' }}>{pendingDrafts.length}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Awaiting Finance submission</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #2563EB' }}>
          <span className="sv-ts-label">Drafts Value</span>
          <span className="sv-ts-value" style={{ color: '#2563EB' }}>
            Rs. {pendingDrafts.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString()}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Active draft queue</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #6366F1' }}>
          <span className="sv-ts-label">Sent to Finance</span>
          <span className="sv-ts-value" style={{ color: '#6366F1' }}>
            {submittedToFinance.length}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Under financial review</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #059669' }}>
          <span className="sv-ts-label">Total Invoices (DB)</span>
          <span className="sv-ts-value">
            {invoices.length}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Stored for audit &amp; history</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('drafts')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'drafts' ? '1px solid #D97706' : '1px solid #E2E8F0',
            background: activeTab === 'drafts' ? '#FEF3C7' : '#FFFFFF',
            color: activeTab === 'drafts' ? '#B45309' : '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Clock size={14} /> Pending Draft Invoices ({pendingDrafts.length})
        </button>
        <button
          onClick={() => setActiveTab('submitted')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'submitted' ? '1px solid #2563EB' : '1px solid #E2E8F0',
            background: activeTab === 'submitted' ? '#EFF6FF' : '#FFFFFF',
            color: activeTab === 'submitted' ? '#2563EB' : '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Send size={14} /> Submitted to Finance ({submittedToFinance.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'all' ? '1px solid #64748B' : '1px solid #E2E8F0',
            background: activeTab === 'all' ? '#F1F5F9' : '#FFFFFF',
            color: activeTab === 'all' ? '#0F172A' : '#64748B'
          }}
        >
          All Invoices ({invoices.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="sv-filters" style={{ marginBottom: '16px' }}>
        <div className="sv-search-box" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            placeholder="Search invoice #, customer name, delivery note #, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="sv-loading">Loading invoices...</div>
      ) : filteredInvoices.length === 0 ? (
        <div className="sv-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <FileText size={36} color="#94A3B8" style={{ marginBottom: '10px' }} />
          <p style={{ fontWeight: 600, color: '#334155' }}>
            {activeTab === 'drafts' ? 'No pending draft invoices' : 'No invoices found'}
          </p>
          <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
            {activeTab === 'drafts' ? 'All draft invoices have been submitted to Finance.' : 'Click "Create Draft Invoice" to draft a new invoice from a Delivery Note.'}
          </p>
        </div>
      ) : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client / Customer</th>
                <th>Delivery Note #</th>
                <th>Sales Order #</th>
                <th>Amount (PKR)</th>
                <th>Status</th>
                <th>Due Date</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const isDraft = inv.status === 'Draft' || inv.status === 'Pending Review' || (inv.isDraft && inv.status !== 'Pending Finance Finalization' && inv.status !== 'Finalized');
                const isSubmitted = inv.status === 'Pending Finance Finalization' || inv.status === 'Submitted';
                const isFinalized = inv.status === 'Finalized';
                const needsRevision = isDraft && !!inv.rejectionReason;

                return (
                  <tr key={inv._id} style={{ background: needsRevision ? '#FFFDF5' : undefined }}>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {inv.invoiceNumber}
                        {isDraft && (
                          <span style={{ fontSize: '0.68rem', padding: '1px 5px', background: '#FEF3C7', color: '#B45309', borderRadius: '4px', fontWeight: 800 }}>
                            DRAFT
                          </span>
                        )}
                      </div>
                      {needsRevision && (
                        <div style={{ marginTop: '4px' }}>
                          <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '4px', padding: '2px 6px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={11} /> Revision Note: {inv.rejectionReason}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{inv.clientName}</td>
                    <td>
                      {inv.deliveryNoteNumber ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284C7', fontWeight: 600 }}>
                          <Truck size={12} /> {inv.deliveryNoteNumber}
                        </span>
                      ) : '—'}
                    </td>
                    <td>{inv.salesOrderNumber || inv.saleReference || '—'}</td>
                    <td style={{ fontWeight: 800, color: '#059669' }}>
                      Rs. {Number(inv.amount || 0).toLocaleString()}
                    </td>
                    <td>
                      {needsRevision ? (
                        <span className="sv-badge" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontWeight: 800 }}>
                          <AlertTriangle size={11} /> Revision Requested
                        </span>
                      ) : isDraft ? (
                        <span className="sv-badge" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', fontWeight: 700 }}>
                          <Clock size={11} /> Draft
                        </span>
                      ) : isSubmitted ? (
                        <span className="sv-badge" style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                          <Send size={11} /> With Finance
                        </span>
                      ) : isFinalized ? (
                        <span className="sv-badge" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
                          <CheckCircle2 size={11} /> Finalized
                        </span>
                      ) : (
                        <span className="sv-badge" style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                          {inv.status}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {isDraft && (
                          <button
                            className="sv-btn-primary"
                            style={{ padding: '5px 12px', fontSize: '0.75rem', background: needsRevision ? '#D97706' : '#6366F1', gap: '5px' }}
                            onClick={() => handleSendToFinance(inv)}
                            disabled={sendingId === inv._id}
                            title={needsRevision ? "Resubmit revised invoice back to Finance" : "Submit Draft Invoice to Finance for finalization"}
                          >
                            <Send size={13} /> {sendingId === inv._id ? 'Sending...' : (needsRevision ? 'Resubmit to Finance' : 'Send to Finance')}
                          </button>
                        )}
                        <button className="sv-btn-action-icon" onClick={() => setViewInvoice(inv)} title="View Complete Invoice Details">
                          <Eye size={14} />
                        </button>
                        <button className="sv-btn-action-icon" onClick={() => openEditModal(inv)} title="Edit Invoice Details & Line Items">
                          <Edit2 size={14} color="#2563EB" />
                        </button>
                        <button className="sv-btn-action-icon" onClick={() => handleDownloadPDF(inv)} title="Download PDF">
                          <Download size={14} color="#059669" />
                        </button>
                        <button className="sv-btn-action-icon" onClick={() => handleDownloadCombinedPackage(inv)} title="Download Complete 4-Document Package (Single PDF)" style={{ color: '#047857' }}>
                          <FileSpreadsheet size={14} />
                        </button>
                        {isDraft && (
                          <button className="sv-btn-action-icon" onClick={() => setDeleteTarget(inv)} title="Delete Invoice" style={{ color: '#EF4444' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* BEAUTIFULLY STYLED CREATE / EDIT INVOICE MODAL             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="ip-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="ip-modal-card"
            style={{ maxWidth: '860px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="ip-modal-header invoice-theme">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="ip-header-icon-box">
                  <FileText size={22} />
                </div>
                <div className="ip-header-title-group">
                  <h3>{editInvoice ? `Edit Invoice (${editInvoice.invoiceNumber})` : 'Create Commercial Invoice'}</h3>
                  <p>Select a confirmed Delivery Note to auto-fill customer, order reference, and line items</p>
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
            <form onSubmit={(e) => handleSaveInvoice(e, false)}>
              <div className="ip-modal-body">
                {/* REVISION NOTICE FROM FINANCE IF RETURNED */}
                {editInvoice?.rejectionReason && (
                  <div style={{
                    background: '#FFFBEB',
                    border: '1.5px solid #F59E0B',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', flexShrink: 0 }}>
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.92rem' }}>
                        Finance Returned this Draft Invoice for Revision
                      </div>
                      <div style={{ color: '#B45309', fontSize: '0.86rem', marginTop: '4px', fontWeight: 600 }}>
                        Finance Note: "{editInvoice.rejectionReason}"
                      </div>
                      <div style={{ color: '#78350F', fontSize: '0.78rem', marginTop: '4px' }}>
                        Please correct the requested values, line items, or order references below and click <strong>"Save &amp; Resubmit to Finance"</strong>.
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. AUTO SELECT DELIVERY NOTE (HERO SELECTOR) */}
                <div className="ip-section-card hero-selector-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div className="ip-section-title" style={{ margin: 0 }}>
                      <Truck size={16} color="#2563EB" /> Select Delivery Note (Auto-Fill Invoice)
                    </div>
                    <span className="ip-section-pill blue">
                      {deliveryNotes.length} Delivery Notes available
                    </span>
                  </div>

                  <select
                    className="ip-input"
                    style={{
                      fontWeight: 600,
                      borderColor: form.deliveryNoteId ? '#2563EB' : '#CBD5E1',
                      marginTop: '6px'
                    }}
                    value={form.deliveryNoteId}
                    onChange={(e) => handleSelectDeliveryNote(e.target.value)}
                  >
                    <option value="">-- Choose Confirmed Delivery Note to Auto-Fill --</option>
                    {deliveryNotes.map(dn => {
                      const dnNum = dn.deliveryNumber || dn.deliveryNoteNumber || 'DN';
                      const soNum = dn.salesOrderNumber || dn.salesOrder?.orderReference || dn.salesOrder?.orderNumber || '';
                      return (
                        <option key={dn._id} value={dn._id}>
                          {dnNum} — {dn.clientName || 'Client'} ({soNum ? `Order: ${soNum}` : 'General Order'} • {dn.status || 'Ready'})
                        </option>
                      );
                    })}
                  </select>

                  {/* Fallback: Choose Sales Order directly */}
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', whiteSpace: 'nowrap', fontWeight: 600 }}>Or choose Sales Order:</span>
                    <select
                      className="ip-input"
                      style={{ fontSize: '0.82rem', padding: '7px 12px' }}
                      value={form.salesOrderId}
                      onChange={(e) => handleSelectOrder(e.target.value)}
                    >
                      <option value="">-- Choose Sales Order directly --</option>
                      {salesOrders.map(so => (
                        <option key={so._id} value={so._id}>
                          {so.orderReference || so.orderNumber} — {so.clientName} (Rs. {Number(so.netAmount || so.totalAmount || 0).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Delivery Note Summary Tag */}
                  {form.deliveryNoteNumber && (
                    <div className="ip-linked-badge-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <div className="ip-linked-title">
                            Linked to Delivery Note: {form.deliveryNoteNumber}
                          </div>
                          <div className="ip-linked-sub">
                            Sales Order Ref: <strong>{form.salesOrderNumber || 'N/A'}</strong> &bull; Client: {form.clientName}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDN(null);
                          setForm(prev => ({
                            ...prev,
                            deliveryNoteId: '',
                            deliveryNoteNumber: '',
                            salesOrderId: '',
                            salesOrderNumber: ''
                          }));
                        }}
                        style={{
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          color: '#475569',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}
                      >
                        Clear Link
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. CUSTOMER & BILLING INFORMATION */}
                <div className="ip-section-card">
                  <div className="ip-section-title">
                    <Building size={16} color="#475569" /> Customer &amp; Billing Details
                  </div>
                  <div className="ip-grid-2" style={{ marginBottom: '14px' }}>
                    <div className="ip-field-group">
                      <label className="ip-label">
                        Client / Company Name <span className="required-mark">*</span>
                      </label>
                      <input
                        type="text"
                        className="ip-input"
                        value={form.clientName}
                        onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                        placeholder="e.g. Nexus Corp Ltd"
                        required
                      />
                    </div>
                    <div className="ip-field-group">
                      <label className="ip-label">Customer Email</label>
                      <input
                        type="email"
                        className="ip-input"
                        value={form.customerEmail}
                        onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                        placeholder="finance@client.com"
                      />
                    </div>
                  </div>

                  <div className="ip-grid-2">
                    <div className="ip-field-group">
                      <label className="ip-label">Customer Phone</label>
                      <input
                        type="text"
                        className="ip-input"
                        value={form.customerPhone}
                        onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                        placeholder="+92 300 1234567"
                      />
                    </div>
                    <div className="ip-field-group">
                      <label className="ip-label">Billing / Delivery Address</label>
                      <input
                        type="text"
                        className="ip-input"
                        value={form.customerAddress}
                        onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                        placeholder="Suite 400, Business Bay, Karachi"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. INVOICE DATES & TERMS */}
                <div className="ip-section-card">
                  <div className="ip-section-title">
                    <Calendar size={16} color="#475569" /> Invoice Dates &amp; Terms
                  </div>
                  <div className="ip-grid-3">
                    <div className="ip-field-group">
                      <label className="ip-label">
                        Issue Date <span className="required-mark">*</span>
                      </label>
                      <input
                        type="date"
                        className="ip-input"
                        value={form.issueDate}
                        onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="ip-field-group">
                      <label className="ip-label">
                        Due Date <span className="required-mark">*</span>
                      </label>
                      <input
                        type="date"
                        className="ip-input"
                        value={form.dueDate}
                        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="ip-field-group">
                      <label className="ip-label">Payment Terms</label>
                      <select
                        className="ip-input"
                        value={form.paymentTerms}
                        onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                      >
                        <option value="Net 30">Net 30 Days</option>
                        <option value="Net 15">Net 15 Days</option>
                        <option value="Net 60">Net 60 Days</option>
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Advance">100% Advance</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. LINE ITEMS TABLE */}
                <div className="ip-section-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div className="ip-section-title" style={{ margin: 0 }}>
                      <Tag size={16} color="#475569" /> Invoice Line Items ({form.items.length})
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#EFF6FF',
                        color: '#2563EB',
                        border: '1.5px solid #BFDBFE',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Plus size={14} /> Add Line Item
                    </button>
                  </div>

                  <div className="ip-table-wrapper">
                    <table className="ip-line-items-table">
                      <thead>
                        <tr>
                          <th>Item Description</th>
                          <th style={{ width: '90px' }}>Qty</th>
                          <th style={{ width: '140px' }}>Unit Price (PKR)</th>
                          <th style={{ width: '140px' }}>Total (PKR)</th>
                          <th style={{ width: '44px', textAlign: 'center' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                placeholder="Product or service details"
                                className="ip-input"
                                style={{ padding: '8px 10px', fontSize: '0.85rem' }}
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                className="ip-input"
                                style={{ padding: '8px 10px', fontSize: '0.85rem', textAlign: 'center' }}
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                                className="ip-input"
                                style={{ padding: '8px 10px', fontSize: '0.85rem' }}
                                required
                              />
                            </td>
                            <td style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>
                              Rs. {Number(item.total || 0).toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {form.items.length > 1 && (
                                <button
                                  type="button"
                                  className="ip-btn-delete-row"
                                  onClick={() => handleRemoveItem(idx)}
                                  title="Remove item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. FINANCIAL CALCULATION SUMMARY CARD */}
                <div className="ip-summary-container">
                  <div>
                    <label className="ip-label" style={{ marginBottom: '6px' }}>
                      Invoice Notes &amp; Wire Payment Instructions
                    </label>
                    <textarea
                      rows={4}
                      className="ip-input"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Payment instructions, bank account IBAN, or notes for customer..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <div className="ip-summary-row">
                      <span>Subtotal:</span>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>Rs. {Number(form.subtotal).toLocaleString()}</span>
                    </div>

                    <div className="ip-summary-row">
                      <span>Discount (PKR):</span>
                      <input
                        type="number"
                        min="0"
                        value={form.discount}
                        onChange={(e) => handleFinancialFieldChange('discount', e.target.value)}
                        className="ip-input"
                        style={{ width: '130px', padding: '6px 10px', fontSize: '0.85rem', textAlign: 'right' }}
                      />
                    </div>

                    <div className="ip-summary-row">
                      <span>Tax Rate (%):</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={form.taxRate}
                          onChange={(e) => handleFinancialFieldChange('taxRate', e.target.value)}
                          className="ip-input"
                          style={{ width: '65px', padding: '6px 8px', fontSize: '0.85rem', textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>= Rs. {Math.round(form.tax).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="ip-summary-row net-payable">
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>Net Payable Total:</span>
                      <span className="ip-payable-amount">
                        Rs. {Math.round(Number(form.amount)).toLocaleString()}
                      </span>
                    </div>
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
                  className="ip-btn-submit-invoice"
                  style={{ background: '#2563EB' }}
                  disabled={savingInvoice}
                >
                  <Save size={16} /> {savingInvoice ? 'Saving Invoice...' : (editInvoice ? 'Save Draft Updates' : 'Issue Commercial Invoice')}
                </button>
                {editInvoice && (
                  <button
                    type="button"
                    className="ip-btn-submit-invoice"
                    style={{ background: '#4F46E5', gap: '6px' }}
                    onClick={(e) => handleSaveInvoice(e, true)}
                    disabled={savingInvoice}
                  >
                    <Send size={16} /> {savingInvoice ? 'Submitting...' : 'Save & Resubmit to Finance'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE VIEW INVOICE MODAL */}
      {viewInvoice && (
        <div className="sv-modal-overlay" onClick={() => setViewInvoice(null)}>
          <div className="sv-modal" style={{ maxWidth: '820px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header" style={{ padding: '18px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                  <FileText size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0F172A' }}>{viewInvoice.invoiceNumber}</h3>
                    {viewInvoice.isDraft ? (
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#FEF3C7', color: '#B45309', borderRadius: '6px', fontWeight: 800 }}>
                        DRAFT ({viewInvoice.status || 'Draft'})
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#ECFDF5', color: '#047857', borderRadius: '6px', fontWeight: 800 }}>
                        {viewInvoice.invoiceType || 'FINALIZED'}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                    Created by Accounts &bull; Commercial Invoice
                  </p>
                </div>
              </div>
              <button onClick={() => setViewInvoice(null)}><X size={20} /></button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Revision Reason Alert (if returned by finance) */}
              {viewInvoice.rejectionReason && (
                <div style={{
                  background: '#FFFBEB',
                  border: '1.5px solid #F59E0B',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.88rem' }}>
                      Finance Revision Note:
                    </div>
                    <div style={{ color: '#B45309', fontSize: '0.84rem', marginTop: '2px' }}>
                      "{viewInvoice.rejectionReason}"
                    </div>
                  </div>
                </div>
              )}

              {/* 2-Column Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                    <Building size={14} color="#2563EB" /> Customer Details
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    {viewInvoice.clientName}
                  </div>
                  {viewInvoice.customerEmail && (
                    <div style={{ fontSize: '0.83rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Mail size={13} color="#94A3B8" /> {viewInvoice.customerEmail}
                    </div>
                  )}
                  {viewInvoice.customerPhone && (
                    <div style={{ fontSize: '0.83rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Phone size={13} color="#94A3B8" /> {viewInvoice.customerPhone}
                    </div>
                  )}
                  {viewInvoice.customerAddress && (
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '6px' }}>
                      <strong>Address:</strong> {viewInvoice.customerAddress}
                    </div>
                  )}
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                    <Tag size={14} color="#059669" /> References &amp; Terms
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.84rem' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Sales Order #:</span>
                      <strong style={{ color: '#0F172A' }}>{viewInvoice.salesOrderNumber || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Delivery Note #:</span>
                      <strong style={{ color: '#0284C7' }}>{viewInvoice.deliveryNoteNumber || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Issue Date:</span>
                      <strong style={{ color: '#0F172A' }}>{viewInvoice.issueDate ? new Date(viewInvoice.issueDate).toLocaleDateString() : '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Due Date:</span>
                      <strong style={{ color: '#0F172A' }}>{viewInvoice.dueDate ? new Date(viewInvoice.dueDate).toLocaleDateString() : '—'}</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Payment Terms:</span>
                      <strong style={{ color: '#0F172A' }}>{viewInvoice.paymentTerms || 'Net 30 Days'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                  <Tag size={15} color="#2563EB" /> Line Items Breakdown
                </div>
                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', color: '#475569', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '10px 14px', width: '40px' }}>#</th>
                        <th style={{ padding: '10px 14px' }}>Item Description</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', width: '80px' }}>Qty</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', width: '140px' }}>Unit Price (PKR)</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', width: '150px' }}>Total (PKR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewInvoice.items && viewInvoice.items.length > 0) ? (
                        viewInvoice.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                            <td style={{ padding: '10px 14px', color: '#64748B', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0F172A' }}>{item.description || 'Item'}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>{item.quantity || 1}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>
                              Rs. {(Number(item.unitPrice) || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                              Rs. {(Number(item.total) || ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0))).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td style={{ padding: '10px 14px' }}>1</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>General Invoiced Services / Deliverables</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>1</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>Rs. {Number(viewInvoice.amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>Rs. {Number(viewInvoice.amount || 0).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Summary & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Notes &amp; Payment Instructions
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', minHeight: '100px', fontSize: '0.84rem', color: '#475569' }}>
                    {viewInvoice.notes || 'No specific notes entered.'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748B' }}>Subtotal:</span>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>Rs. {Number(viewInvoice.subtotal || viewInvoice.amount || 0).toLocaleString()}</span>
                  </div>
                  {Number(viewInvoice.discount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#DC2626' }}>Discount:</span>
                      <span style={{ fontWeight: 600, color: '#DC2626' }}>- Rs. {Number(viewInvoice.discount).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(viewInvoice.tax) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748B' }}>Tax ({viewInvoice.taxRate || 0}%):</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>+ Rs. {Number(viewInvoice.tax).toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1.5px solid #CBD5E1', borderBottom: '1.5px solid #CBD5E1', marginTop: '6px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>Total Invoice Amount:</span>
                    <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.15rem' }}>Rs. {Number(viewInvoice.amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="sv-modal-actions" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', marginTop: '16px' }}>
                <button className="sv-btn-cancel" onClick={() => setViewInvoice(null)}>
                  Close
                </button>
                <button className="sv-btn-cancel" onClick={() => handleDownloadPDF(viewInvoice)} style={{ gap: '6px' }}>
                  <Download size={14} color="#059669" /> Download Invoice PDF
                </button>
                <button className="sv-btn-primary" onClick={() => handleDownloadCombinedPackage(viewInvoice)} style={{ background: '#047857', gap: '6px' }} title="Download 4-page complete document package (Invoice, Delivery Note, Undertaking, Goods Declaration)">
                  <FileSpreadsheet size={14} /> Download Complete Package (Single PDF)
                </button>
                {(viewInvoice.status === 'Draft' || viewInvoice.status === 'Pending Review' || viewInvoice.isDraft) && (
                  <button
                    className="sv-btn-primary"
                    style={{ background: '#2563EB', gap: '6px' }}
                    onClick={() => {
                      const inv = viewInvoice;
                      setViewInvoice(null);
                      openEditModal(inv);
                    }}
                  >
                    <Edit2 size={14} /> Edit / Revise Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="sv-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="sv-modal" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', color: '#DC2626' }}>Delete Invoice {deleteTarget.invoiceNumber}?</h3>
            <p style={{ color: '#64748B', fontSize: '0.88rem' }}>Are you sure you want to delete this invoice record?</p>
            <div className="sv-modal-actions" style={{ justifyContent: 'center', marginTop: '20px' }}>
              <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="sv-btn-primary" style={{ background: '#DC2626' }} onClick={handleDeleteInvoice}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
