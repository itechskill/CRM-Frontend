import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiRequest } from '../../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Plus,
  Truck,
  Edit2,
  Eye,
  Trash2,
  X,
  Save,
  MapPin,
  Calendar,
  User,
  Package,
  Printer,
  CheckCircle2,
  Search,
  Building,
  FileText,
  Layers,
  DollarSign,
  Boxes,
  ArrowRight,
  ShoppingCart,
  Send,
  Download,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import './SalesViews.css';

const getFutureDateStr = (days = 3, baseDateStr = null) => {
  const d = baseDateStr ? new Date(baseDateStr) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const EMPTY_ITEM = {
  product: '',
  description: '',
  demand: 1,
  quantity: 1,
  unit: 'pcs',
  availability: 'Available'
};

const EMPTY_FORM = {
  deliveryNumber: '',
  salesOrderId: '',
  salesOrderNumber: '',
  clientName: '',
  deliveryAddress: '',
  recipientName: '',
  recipientPhone: '',
  trackingNumber: '',
  carrier: 'Fortline Internal Logistics',
  operationType: 'Delivery Orders (Outbound)',
  sourceLocation: 'WH/Stock',
  scheduledDate: new Date().toISOString().split('T')[0],
  deadline: getFutureDateStr(3),
  status: 'Ready',
  isPartial: false,
  items: [{ ...EMPTY_ITEM, product: 'Standard Goods / Equipment', description: 'Standard Goods / Equipment', demand: 1, quantity: 1, unit: 'pcs', availability: 'Available' }],
  notes: ''
};

export default function SalesDeliveryNotesView({ initialSalesOrder, initialProforma, onClearInitial }) {
  const [notes, setNotes] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [availableProformas, setAvailableProformas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // View / Detail Modal
  const [viewNote, setViewNote] = useState(null);

  // Invoice Generation Modal
  const [invoicePreFill, setInvoicePreFill] = useState(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── 1. FETCH DATA ──
  const fetchOrdersForDelivery = useCallback(async () => {
    try {
      const { response, data } = await apiRequest('/api/sales-employee/orders');
      if (response.ok && data.success) {
        setAvailableOrders(data.data || []);
      }
    } catch (e) {
      console.error('Fetch orders error:', e);
    }
  }, []);

  const fetchProformasForDelivery = useCallback(async () => {
    try {
      const { response, data } = await apiRequest('/api/sales-employee/proforma-invoices');
      if (response.ok && data.success) {
        setAvailableProformas(data.data || []);
      }
    } catch (e) {
      console.error('Fetch proformas error:', e);
    }
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const { response, data } = await apiRequest(`/api/sales-employee/delivery-notes${params}`);
      if (response.ok && data.success) {
        setNotes(data.data || []);
      }
    } catch (e) {
      console.error('Fetch notes error:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotes();
    fetchOrdersForDelivery();
    fetchProformasForDelivery();
  }, [fetchNotes, fetchOrdersForDelivery, fetchProformasForDelivery]);

  // ── 2. MOVE / TRANSFER SALES ORDER TO DELIVERY NOTE ──
  const handleSelectSalesOrder = (orderId) => {
    if (!orderId) {
      setForm(prev => ({
        ...prev,
        salesOrderId: '',
        salesOrderNumber: ''
      }));
      return;
    }

    const selected = availableOrders.find(o => o._id === orderId);
    if (selected) {
      // Map ordered products into delivery line items
      const items = selected.items && selected.items.length > 0
        ? selected.items.map(it => ({
            product: it.description || it.productName || 'Order Item',
            description: it.description || it.productName || 'Order Item',
            demand: Number(it.quantity) || 1,
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'pcs',
            availability: 'Available'
          }))
        : [{
            product: selected.productSummary || 'Scope Items',
            description: selected.productSummary || 'Scope Items',
            demand: 1,
            quantity: 1,
            unit: 'pcs',
            availability: 'Available'
          }];

      setForm(prev => ({
        ...prev,
        salesOrderId: selected._id,
        salesOrderNumber: selected.orderReference || selected.orderNumber || '',
        clientName: selected.clientName || selected.customerName || '',
        recipientName: selected.clientName || selected.customerName || '',
        recipientPhone: selected.clientPhone || '',
        deliveryAddress: selected.clientAddress || `${selected.clientName || selected.customerName} Facility / Warehouse`,
        items: items,
        notes: `Standard dispatch for Sales Order ${selected.orderReference || selected.orderNumber}. File: ${selected.fileNo || 'N/A'}`
      }));
    }
  };

  // ── 2B. MOVE / TRANSFER APPROVED PROFORMA INVOICE TO DELIVERY NOTE ──
  const handleSelectProforma = (proformaId) => {
    if (!proformaId) {
      setForm(prev => ({
        ...prev,
        salesOrderId: '',
        salesOrderNumber: ''
      }));
      return;
    }

    const selected = availableProformas.find(p => p._id === proformaId);
    if (selected) {
      const items = selected.items && selected.items.length > 0
        ? selected.items.map(it => ({
            product: it.description || 'Proforma Item',
            description: it.description || 'Proforma Item',
            demand: Number(it.quantity) || 1,
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'pcs',
            availability: 'Available'
          }))
        : [{
            product: 'Commercial Scope Items',
            description: 'Commercial Scope Items',
            demand: 1,
            quantity: 1,
            unit: 'pcs',
            availability: 'Available'
          }];

      setForm(prev => ({
        ...prev,
        salesOrderId: selected.salesOrderId || selected._id,
        salesOrderNumber: selected.proformaNumber ? `${selected.proformaNumber} (${selected.salesOrderNumber || 'Approved PI'})` : (selected.salesOrderNumber || ''),
        clientName: selected.clientName || '',
        recipientName: selected.clientName || '',
        recipientPhone: selected.clientPhone || '',
        deliveryAddress: selected.clientAddress || `${selected.clientName} Facility / Warehouse`,
        items: items,
        notes: `Delivery against Approved Proforma Invoice ${selected.proformaNumber || ''}. Total Amount: Rs. ${Number(selected.netAmount || selected.totalAmount || 0).toLocaleString()} PKR.`
      }));
    }
  };

  useEffect(() => {
    if (initialProforma) {
      handleOpenCreateModal();
      handleSelectProforma(initialProforma._id || initialProforma);
      if (onClearInitial) onClearInitial();
    } else if (initialSalesOrder) {
      handleOpenCreateModal();
      handleSelectSalesOrder(initialSalesOrder._id || initialSalesOrder);
      if (onClearInitial) onClearInitial();
    }
  }, [initialProforma, initialSalesOrder]);

  // ── 3. OPEN CREATE / EDIT MODAL ──
  const handleOpenCreateModal = () => {
    setEditNote(null);
    const defaultNumber = `DN-${String(notes.length + 1).padStart(5, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    setForm({
      ...EMPTY_FORM,
      deliveryNumber: defaultNumber,
      trackingNumber: `TRK-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'Ready',
      scheduledDate: today,
      deadline: getFutureDateStr(3, today)
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (note) => {
    setEditNote(note);
    const scheduled = note.scheduledDate ? note.scheduledDate.split('T')[0] : (note.deliveryDate ? note.deliveryDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    const dline = note.deadline ? note.deadline.split('T')[0] : getFutureDateStr(3, scheduled);
    setForm({
      deliveryNumber: note.deliveryNumber || note.deliveryNoteNumber || '',
      salesOrderId: note.salesOrderId?._id || note.salesOrderId || '',
      salesOrderNumber: note.salesOrderNumber || note.sourceDocument || '',
      clientName: note.clientName || note.recipientName || '',
      deliveryAddress: note.deliveryAddress || '',
      recipientName: note.recipientName || note.clientName || '',
      recipientPhone: note.recipientPhone || '',
      trackingNumber: note.trackingNumber || '',
      carrier: note.carrier || 'Fortline Internal Logistics',
      operationType: note.operationType || 'Delivery Orders (Outbound)',
      sourceLocation: note.sourceLocation || 'WH/Stock',
      scheduledDate: scheduled,
      deadline: dline,
      status: note.status || 'Ready',
      isPartial: note.isPartial || false,
      items: note.items && note.items.length > 0
        ? note.items.map(it => ({
            product: it.product || it.description || '',
            description: it.description || it.product || '',
            demand: Number(it.demand || it.quantity) || 1,
            quantity: Number(it.quantity || it.demand) || 1,
            unit: it.unit || 'pcs',
            availability: it.availability || 'Available'
          }))
        : [{ ...EMPTY_ITEM }],
      notes: note.notes || ''
    });
    setError('');
    setShowModal(true);
  };

  // ── 4. ITEMS MANAGEMENT IN FORM ──
  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { product: '', description: '', demand: 1, quantity: 1, unit: 'pcs', availability: 'Available' }
      ]
    }));
  };

  const handleUpdateItem = (idx, field, value) => {
    setForm(prev => {
      const updated = [...prev.items];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'product' && !updated[idx].description) {
        updated[idx].description = value;
      }
      return { ...prev, items: updated };
    });
  };

  const handleRemoveItem = (idx) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  // ── 5. SAVE DELIVERY NOTE (WITH INVENTORY DEDUCTION) ──
  const handleSaveDeliveryNote = async (e) => {
    e.preventDefault();
    if (!form.clientName.trim()) {
      setError('Customer / Client name is required.');
      return;
    }
    if (!form.deliveryAddress.trim()) {
      setError('Delivery address is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        deliveryNoteNumber: form.deliveryNumber,
        sourceDocument: form.salesOrderNumber
      };

      if (editNote?._id) {
        const { response, data } = await apiRequest(`/api/sales-employee/delivery-notes/${editNote._id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        if (response.ok && data.success) {
          const saved = data.data || payload;
          setFeedback(`Delivery Note ${form.deliveryNumber} updated successfully!`);
          setShowModal(false);
          fetchNotes();
          if (saved.status === 'Done') {
            setTimeout(() => handleOpenCreateInvoice(saved), 500);
          }
        } else {
          setError(data.message || 'Failed to update delivery note.');
        }
      } else {
        const { response, data } = await apiRequest('/api/sales-employee/delivery-notes', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (response.ok && data.success) {
          const saved = data.data || payload;
          setFeedback(`Delivery Note ${form.deliveryNumber} created & inventory deducted!`);
          setShowModal(false);
          fetchNotes();
          fetchOrdersForDelivery();
          if (saved.status === 'Done') {
            setTimeout(() => handleOpenCreateInvoice(saved), 500);
          }
        } else {
          setError(data.message || 'Failed to create delivery note.');
        }
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  // ── 6. DELETE DELIVERY NOTE ──
  const handleDeleteNote = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/delivery-notes/${deleteTarget._id}`, {
        method: 'DELETE'
      });
      if (response.ok && data.success) {
        setFeedback('Delivery note deleted successfully.');
        setDeleteTarget(null);
        if (viewNote?._id === deleteTarget._id) setViewNote(null);
        fetchNotes();
      } else {
        alert(data.message || 'Failed to delete delivery note.');
      }
    } catch (e) {
      alert('Error deleting delivery note.');
    } finally {
      setDeleting(false);
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  // ── 7. CREATE INVOICE FROM DELIVERY NOTE ──
  const handleOpenCreateInvoice = (note) => {
    // Look up matching Sales Order for exact financial amount
    const orderRef = note.salesOrderNumber || note.sourceDocument;
    const orderId = note.salesOrderId?._id || note.salesOrderId;
    const linkedOrder = availableOrders.find(
      o => (orderId && o._id === orderId) ||
           (orderRef && (o.orderReference === orderRef || o.orderNumber === orderRef))
    );

    const netAmount = linkedOrder ? (Number(linkedOrder.netAmount) || Number(linkedOrder.totalAmount) || 0) : 0;

    const items = note.items && note.items.length
      ? note.items.map(it => {
          const qty = Number(it.quantity || it.demand) || 1;
          const unitPrice = netAmount > 0 && note.items.length === 1 ? (netAmount / qty) : 0;
          return {
            description: it.product || it.description || 'Delivered Item',
            quantity: qty,
            unitPrice: unitPrice,
            total: unitPrice * qty
          };
        })
      : [{ description: 'Delivered Goods', quantity: 1, unitPrice: netAmount, total: netAmount }];

    setInvoicePreFill({
      deliveryNoteId: note._id,
      deliveryNoteNumber: note.deliveryNumber || note.deliveryNoteNumber,
      salesOrderId: linkedOrder?._id || note.salesOrder?._id || note.salesOrderId || null,
      salesOrderNumber: orderRef || linkedOrder?.orderReference || '',
      clientName: note.clientName || note.recipientName || linkedOrder?.clientName || '',
      customerEmail: linkedOrder?.clientEmail || '',
      customerPhone: note.recipientPhone || linkedOrder?.clientPhone || '',
      customerAddress: note.deliveryAddress || linkedOrder?.clientAddress || '',
      items: items,
      amount: netAmount > 0 ? netAmount : '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const handleSaveInvoiceFromDelivery = async (e) => {
    e.preventDefault();
    if (!invoicePreFill) return;
    setCreatingInvoice(true);
    try {
      const net = Number(invoicePreFill.amount) || 0;
      const payload = {
        invoiceNumber: `INV-${Date.now().toString().slice(-5)}`,
        clientName: invoicePreFill.clientName,
        customerEmail: invoicePreFill.customerEmail,
        customerPhone: invoicePreFill.customerPhone,
        customerAddress: invoicePreFill.customerAddress,
        deliveryNoteId: invoicePreFill.deliveryNoteId,
        deliveryNoteNumber: invoicePreFill.deliveryNoteNumber,
        salesOrderId: invoicePreFill.salesOrderId,
        salesOrderNumber: invoicePreFill.salesOrderNumber,
        items: invoicePreFill.items.map(it => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: net > 0 && invoicePreFill.items.length === 1 ? net : it.unitPrice,
          total: net > 0 && invoicePreFill.items.length === 1 ? net : (it.quantity * it.unitPrice)
        })),
        subtotal: net,
        tax: 0,
        discount: 0,
        amount: net,
        dueDate: invoicePreFill.dueDate,
        status: 'Pending Review'
      };

      const { response, data } = await apiRequest('/api/sales-employee/invoices', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok && data.success) {
        setFeedback(`Invoice ${data.data?.invoiceNumber} created and submitted for Sales Manager approval!`);
        setInvoicePreFill(null);
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(data.message || 'Failed to create invoice.');
      }
    } catch (e) {
      alert('Error creating invoice.');
    } finally {
      setCreatingInvoice(false);
    }
  };

  // ── 8. DOWNLOAD DELIVERY SLIP (PDF) ──
  const handleDownloadPDF = (note) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const ref = note.deliveryNumber || note.deliveryNoteNumber || 'DN-0001';

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
    doc.text('Logistics, Warehouse & Fulfillment Operations', 14, 26);

    // Document Title (Right)
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('DELIVERY NOTE', 196, 18, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(191, 219, 254);
    doc.text(`Slip Ref: ${ref}`, 196, 26, { align: 'right' });

    // Customer & Logistics Details Container Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 44, 182, 38, 2.5, 2.5, 'FD');

    // Left Column: Customer Details
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIPIENT & DELIVERY DETAILS:', 19, 52);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(note.clientName || note.recipientName || 'Valued Consignee', 19, 58, { maxWidth: 85 });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Recipient Contact: ${note.recipientPhone || '—'}`, 19, 64, { maxWidth: 85 });
    doc.text(`Delivery Location: ${note.deliveryAddress || 'Standard Warehouse Dispatch'}`, 19, 70, { maxWidth: 85 });

    // Vertical Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.line(108, 48, 108, 78);

    // Right Column: Logistics Meta
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('DISPATCH & SHIPMENT METADATA:', 114, 52);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Source Order #:', 114, 58);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${note.salesOrderNumber || note.sourceDocument || 'Direct'}`, 155, 58);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Tracking Code:', 114, 64);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${note.trackingNumber || 'TRK-LOGISTICS'}`, 155, 64);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Carrier / Fleet:', 114, 70);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${note.carrier || 'Internal Fleet'}`, 155, 70);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Dispatch Date:', 114, 76);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${note.scheduledDate ? new Date(note.scheduledDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}`, 155, 76);

    const tableRows = (note.items || []).map((it, idx) => [
      idx + 1,
      it.product || it.description || 'Delivered Item',
      it.demand || it.quantity || 1,
      it.quantity || it.demand || 1,
      it.unit || 'pcs',
      it.availability || 'In Stock'
    ]);

    autoTable(doc, {
      startY: 88,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [['#', 'Item Description & Scope', 'Ordered Qty', 'Delivered Qty', 'Unit', 'Stock Status']],
      body: tableRows.length ? tableRows : [['1', 'Standard Package Items', '1', '1', 'pcs', 'In Stock']],
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
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 80 },
        2: { halign: 'center', cellWidth: 23 },
        3: { halign: 'center', cellWidth: 23 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 26 }
      }
    });

    let finalY = doc.lastAutoTable.finalY + 8;
    if (finalY > 215) {
      doc.addPage();
      finalY = 20;
    }

    // Notes Box
    if (note.notes) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, finalY, 182, 22, 2, 2, 'FD');
      doc.setTextColor(30, 58, 138);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('DISPATCH & SPECIAL HANDLING INSTRUCTIONS:', 18, finalY + 7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8);
      doc.text(note.notes, 18, finalY + 14, { maxWidth: 174 });
      finalY += 28;
    }

    // Signatures
    const sigY = 252;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);

    doc.line(14, sigY + 12, 75, sigY + 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Dispatched By:', 14, sigY + 17);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Warehouse Logistics Department', 14, sigY + 21);

    doc.line(135, sigY + 12, 196, sigY + 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Received & Verified By:', 135, sigY + 17);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Customer Consignee Signature & Stamp', 135, sigY + 21);

    // Document Footer Note
    doc.setDrawColor(241, 245, 249);
    doc.line(14, 280, 196, 280);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated via Fortline CRM • Official Delivery Dispatch Note • System Generated', 105, 285, { align: 'center' });

    doc.save(`DeliveryNote_${ref}.pdf`);
  };

  // ── COMPLETE DELIVERY NOTES LEDGER EXPORT (PDF) ──
  const downloadCompleteDeliveryNotesPDF = () => {
    const dataset = filteredNotes.length > 0 ? filteredNotes : notes;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const nowStr = new Date().toLocaleDateString('en-GB');

    doc.setFillColor(15, 23, 42); // Navy
    doc.rect(0, 0, 297, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM — WAREHOUSE DELIVERY & SHIPMENTS LEDGER', 14, 12);

    const totalPieces = dataset.reduce((sum, n) => {
      const pcs = (n.items || []).reduce((acc, it) => acc + (Number(it.quantity || it.demand) || 1), 0);
      return sum + pcs;
    }, 0);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${nowStr} | Total Dispatches: ${dataset.length} | Total Units / Quantity: ${totalPieces} pcs`, 14, 19);

    const rows = dataset.map((n, idx) => {
      const pcs = (n.items || []).reduce((acc, it) => acc + (Number(it.quantity || it.demand) || 1), 0);
      return [
        idx + 1,
        n.deliveryNumber || n.deliveryNoteNumber || '—',
        n.clientName || n.recipientName || '—',
        n.salesOrderNumber || n.sourceDocument || 'Direct',
        n.carrier || 'Internal Logistics',
        n.trackingNumber || '—',
        n.scheduledDate ? new Date(n.scheduledDate).toLocaleDateString('en-GB') : '—',
        n.deadline ? new Date(n.deadline).toLocaleDateString('en-GB') : '—',
        n.status || 'Ready',
        `${pcs} pcs`
      ];
    });

    try {
      autoTable(doc, {
        startY: 28,
        head: [['#', 'Delivery #', 'Customer / Consignee', 'Linked SO #', 'Carrier', 'Tracking #', 'Dispatch Date', 'Deadline', 'Status', 'Total Quantity']],
        body: rows,
        foot: [[
          { content: 'GRAND TOTAL / SUMMARY', colSpan: 9, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
          { content: `${totalPieces} pcs`, styles: { halign: 'left', fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [4, 120, 87] } }
        ]],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      doc.save(`Delivery_Notes_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Delivery notes PDF export error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // ── COMPLETE DELIVERY NOTES LEDGER EXPORT (EXCEL / CSV) ──
  const downloadCompleteDeliveryNotesExcel = () => {
    const dataset = filteredNotes.length > 0 ? filteredNotes : notes;
    const totalPieces = dataset.reduce((sum, n) => {
      const pcs = (n.items || []).reduce((acc, it) => acc + (Number(it.quantity || it.demand) || 1), 0);
      return sum + pcs;
    }, 0);

    const headers = ['#', 'Delivery Number', 'Customer / Recipient', 'Linked Sales Order #', 'Carrier / Transporter', 'Tracking #', 'Scheduled Dispatch Date', 'Delivery Deadline', 'Status', 'Total Pieces (Qty)', 'Delivery Address', 'Notes'];
    const rows = dataset.map((n, idx) => {
      const pcs = (n.items || []).reduce((acc, it) => acc + (Number(it.quantity || it.demand) || 1), 0);
      return [
        idx + 1,
        `"${n.deliveryNumber || n.deliveryNoteNumber || ''}"`,
        `"${(n.clientName || n.recipientName || '').replace(/"/g, '""')}"`,
        `"${n.salesOrderNumber || n.sourceDocument || ''}"`,
        `"${n.carrier || 'Internal Logistics'}"`,
        `"${n.trackingNumber || ''}"`,
        `"${n.scheduledDate ? new Date(n.scheduledDate).toLocaleDateString('en-GB') : ''}"`,
        `"${n.deadline ? new Date(n.deadline).toLocaleDateString('en-GB') : ''}"`,
        `"${n.status || 'Ready'}"`,
        pcs,
        `"${(n.shippingAddress || '').replace(/"/g, '""')}"`,
        `"${(n.notes || '').replace(/"/g, '""')}"`
      ];
    });

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
      totalPieces,
      '""',
      '""'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Delivery_Notes_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── 9. FILTERING & SEARCH ──
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (n.deliveryNumber || n.deliveryNoteNumber || '').toLowerCase().includes(q) ||
        (n.recipientName || n.clientName || '').toLowerCase().includes(q) ||
        (n.sourceDocument || n.salesOrderNumber || '').toLowerCase().includes(q) ||
        (n.trackingNumber || '').toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || (n.status || 'Ready').toLowerCase() === filter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [notes, searchQuery, filter]);

  return (
    <div className="sv-container">
      {/* View Header */}
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><Truck size={22} color="#2563EB" /> Delivery Notes &amp; Shipments</h2>
          <p className="sv-subtitle">Generate warehouse outbound dispatches, link Sales Orders, and deduct live inventory</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button className="sv-btn-secondary" onClick={downloadCompleteDeliveryNotesPDF} title="Download Complete Delivery Notes (PDF)">
            <Download size={15} color="#DC2626" /> Export PDF
          </button>
          <button className="sv-btn-secondary" onClick={downloadCompleteDeliveryNotesExcel} title="Download Complete Delivery Notes (Excel)">
            <FileSpreadsheet size={15} color="#059669" /> Export Excel
          </button>
          <button className="sv-btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} /> New Delivery Note
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '12px 18px', borderRadius: '10px', border: '1px solid #A7F3D0', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="#10B981" /> {feedback}
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="sv-filters">
        <div className="sv-status-tabs">
          {['all', 'Ready', 'Done', 'Draft', 'Waiting', 'Cancelled'].map(s => (
            <button
              key={s}
              className={`sv-tab ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? 'All Deliveries' : s}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '7px 14px', gap: '8px', width: '320px' }}>
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search note #, client, order #, tracking..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Table List View */}
      {loading ? (
        <div className="sv-loading">Loading delivery notes from database...</div>
      ) : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Delivery Note #</th>
                <th>Customer / Consignee</th>
                <th>Sales Order Ref</th>
                <th>Carrier &amp; Tracking</th>
                <th>Items (Dispatched)</th>
                <th>Dispatch &amp; Deadline (2-3 Days)</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="sv-empty">
                    No delivery notes match your filter. Click <strong>"+ New Delivery Note"</strong> to create one.
                  </td>
                </tr>
              ) : (
                filteredNotes.map(n => {
                  const refNum = n.deliveryNumber || n.deliveryNoteNumber || 'DN-0001';
                  const isDone = n.status === 'Done';
                  const isReady = n.status === 'Ready';
                  const isDraft = n.status === 'Draft';
                  const totalUnits = (n.items || []).reduce((acc, it) => acc + (Number(it.quantity || it.demand) || 1), 0);
                  const itemCount = n.items?.length || 1;
                  const dispatchDateStr = n.scheduledDate ? new Date(n.scheduledDate).toLocaleDateString('en-GB') : (n.deliveryDate ? new Date(n.deliveryDate).toLocaleDateString('en-GB') : '—');
                  const deadlineDateStr = n.deadline ? new Date(n.deadline).toLocaleDateString('en-GB') : (n.scheduledDate ? new Date(new Date(n.scheduledDate).getTime() + 3 * 86400000).toLocaleDateString('en-GB') : '—');

                  return (
                    <tr key={n._id}>
                      <td className="sv-name" style={{ color: '#2563EB', fontWeight: 800 }}>
                        {refNum}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{n.clientName || n.recipientName || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.deliveryAddress || '—'}
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#1E293B', background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                          <ShoppingCart size={12} color="#2563EB" /> {n.salesOrderNumber || n.sourceDocument || 'Direct'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>{n.carrier || 'Internal Logistics'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{n.trackingNumber || '—'}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                          {itemCount} {itemCount === 1 ? 'Item' : 'Items'} ({totalUnits} pcs)
                        </span>
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        <div><strong>Dispatch:</strong> {dispatchDateStr}</div>
                        <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 700, marginTop: '2px' }}>
                          ⏰ Deadline: {deadlineDateStr}
                        </div>
                      </td>
                      <td>
                        <span
                          className="sv-badge"
                          style={{
                            background: isDone ? '#ECFDF5' : isReady ? '#EFF6FF' : isDraft ? '#F8FAFC' : '#FEF3C7',
                            color: isDone ? '#065F46' : isReady ? '#1D4ED8' : isDraft ? '#475569' : '#B45309',
                            border: `1px solid ${isDone ? '#A7F3D0' : isReady ? '#BFDBFE' : isDraft ? '#E2E8F0' : '#FDE68A'}`,
                            fontWeight: 800
                          }}
                        >
                          {n.status || 'Ready'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            className="sv-btn-action-icon"
                            onClick={() => setViewNote(n)}
                            title="View Delivery Receipt"
                            style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className="sv-btn-action-icon"
                            onClick={() => handleOpenEditModal(n)}
                            title="Edit Delivery Note"
                            style={{ background: '#F8FAFC', color: '#334155', border: '1px solid #CBD5E1' }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="sv-btn-action-icon"
                            onClick={() => handleDownloadPDF(n)}
                            title="Print / Export PDF Dispatch Slip"
                            style={{ background: '#F8FAFC', color: '#059669', border: '1px solid #A7F3D0' }}
                          >
                            <Printer size={13} />
                          </button>
                          {isDone && (
                            <button
                              className="sv-btn-action-icon"
                              onClick={() => handleOpenCreateInvoice(n)}
                              title="Create Invoice from Delivery"
                              style={{ background: '#FAF5FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}
                            >
                              <FileText size={13} />
                            </button>
                          )}
                          <button
                            className="sv-btn-action-icon"
                            onClick={() => setDeleteTarget(n)}
                            title="Delete"
                            style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}
                          >
                            <Trash2 size={13} />
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── NEW / EDIT DELIVERY NOTE MODAL (MATCHING ADD SALES ORDER FORMAT) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                  <Truck size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    {editNote ? `Edit Delivery Note (${form.deliveryNumber})` : 'New Delivery Note'}
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                    Select a Sales Order to auto-populate delivery line items, recipient details, and deduct inventory
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {error && <div className="sv-error">{error}</div>}

            <form onSubmit={handleSaveDeliveryNote} className="sv-form">
              {/* TOP WORKFLOW BAR: LINK / MOVE SALES ORDER OR APPROVED PROFORMA INTO DELIVERY NOTE */}
              <div style={{
                background: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Boxes size={16} color="#059669" />
                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#065F46' }}>
                      Import from Active Sales Order
                    </label>
                  </div>
                  <select
                    value={form.salesOrderId}
                    onChange={e => handleSelectSalesOrder(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #A7F3D0',
                      background: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: '#0F172A'
                    }}
                  >
                    <option value="">-- Select Sales Order to Auto-Fill Delivery Note --</option>
                    {availableOrders.map(ord => {
                      const fileInfo = ord.fileNo ? ` [File: ${ord.fileNo}${ord.fileType ? ` (${ord.fileType})` : ''}]` : '';
                      return (
                        <option key={ord._id} value={ord._id}>
                          {ord.orderReference || ord.orderNumber} — {ord.clientName || ord.customerName}{fileInfo} (Rs. {Number(ord.netAmount || ord.totalAmount || 0).toLocaleString()})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Import from Approved Proforma Invoices */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <FileSpreadsheet size={16} color="#0284C7" />
                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0369A1' }}>
                      OR Import from Customer-Approved Proforma Invoice
                    </label>
                  </div>
                  <select
                    onChange={e => handleSelectProforma(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #BAE6FD',
                      background: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: '#0F172A'
                    }}
                  >
                    <option value="">-- Select Approved Proforma Invoice --</option>
                    {availableProformas.map(pi => {
                      const isApproved = pi.status === 'Approved';
                      return (
                        <option key={pi._id} value={pi._id}>
                          {pi.proformaNumber} — {pi.clientName} [{pi.status || 'Issued'}] (Rs. {Number(pi.netAmount || pi.totalAmount || 0).toLocaleString()})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                  💡 Selecting either an order or approved proforma invoice instantly auto-populates products, quantities, and customer shipping details into this Delivery Note.
                </div>
              </div>

              {/* Section 1: Customer & Delivery Address */}
              <div className="sv-form-section">
                <div className="sv-form-section-title"><Building size={14} color="#2563EB" /> Customer &amp; Delivery Destination</div>
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Delivery Note # *</label>
                    <input
                      value={form.deliveryNumber}
                      onChange={e => setForm(p => ({ ...p, deliveryNumber: e.target.value }))}
                      placeholder="e.g. DN-00371 or WH/OUT/00371"
                      required
                    />
                  </div>
                  <div className="sv-field">
                    <label>Sales Order Number</label>
                    <input
                      value={form.salesOrderNumber}
                      onChange={e => setForm(p => ({ ...p, salesOrderNumber: e.target.value }))}
                      placeholder="e.g. S01723"
                    />
                  </div>
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Customer / Client Name *</label>
                    <input
                      value={form.clientName}
                      onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))}
                      placeholder="e.g. Engro Polymer & Chemicals"
                      required
                    />
                  </div>
                  <div className="sv-field">
                    <label>Recipient Contact Person</label>
                    <input
                      value={form.recipientName}
                      onChange={e => setForm(p => ({ ...p, recipientName: e.target.value }))}
                      placeholder="Receiving Officer Name"
                    />
                  </div>
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Recipient Phone</label>
                    <input
                      value={form.recipientPhone}
                      onChange={e => setForm(p => ({ ...p, recipientPhone: e.target.value }))}
                      placeholder="+92 300 1234567"
                    />
                  </div>
                  <div className="sv-field">
                    <label>Delivery Address *</label>
                    <input
                      value={form.deliveryAddress}
                      onChange={e => setForm(p => ({ ...p, deliveryAddress: e.target.value }))}
                      placeholder="Full facility, factory, or office address"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Logistics & Dispatch Status */}
              <div className="sv-form-section">
                <div className="sv-form-section-title"><Truck size={14} color="#059669" /> Logistics &amp; Shipment Tracking</div>
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Delivery Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="Ready">Ready for Dispatch</option>
                      <option value="Done">Done (Delivered &amp; Verified)</option>
                      <option value="Draft">Draft</option>
                      <option value="Waiting">Waiting for Stock</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="sv-field">
                    <label>Source Location</label>
                    <input
                      value={form.sourceLocation}
                      onChange={e => setForm(p => ({ ...p, sourceLocation: e.target.value }))}
                      placeholder="e.g. WH/Stock"
                    />
                  </div>
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Dispatch Date</label>
                    <input
                      type="date"
                      value={form.scheduledDate}
                      onChange={e => {
                        const newDate = e.target.value;
                        setForm(p => ({
                          ...p,
                          scheduledDate: newDate,
                          deadline: getFutureDateStr(3, newDate)
                        }));
                      }}
                    />
                  </div>
                  <div className="sv-field">
                    <label>Delivery Deadline (2 to 3 Days) *</label>
                    <input
                      type="date"
                      value={form.deadline}
                      onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Carrier / Logistics Fleet</label>
                    <input
                      value={form.carrier}
                      onChange={e => setForm(p => ({ ...p, carrier: e.target.value }))}
                      placeholder="e.g. Fortline Fleet, TCS, Leopards"
                    />
                  </div>
                  <div className="sv-field">
                    <label>Tracking Number</label>
                    <input
                      value={form.trackingNumber}
                      onChange={e => setForm(p => ({ ...p, trackingNumber: e.target.value }))}
                      placeholder="e.g. TRK-90821"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Dispatched Items (Auto-Deducts Stock) */}
              <div className="sv-form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div className="sv-form-section-title" style={{ margin: 0 }}>
                    <Package size={14} color="#7C3AED" /> Dispatched Products (Live Stock Deducted)
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    style={{
                      background: '#EFF6FF',
                      color: '#2563EB',
                      border: '1px solid #BFDBFE',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={13} /> Add Product
                  </button>
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                      <tr>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Product / Description *</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '90px' }}>Demand</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '90px' }}>Delivering</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '70px' }}>Unit</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '6px 10px' }}>
                            <input
                              type="text"
                              value={it.product}
                              onChange={e => handleUpdateItem(idx, 'product', e.target.value)}
                              placeholder="e.g. LAPTOP ThinkBook G8 512GB SSD"
                              required
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="1"
                              value={it.demand}
                              onChange={e => handleUpdateItem(idx, 'demand', Number(e.target.value))}
                              style={{ width: '70px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.82rem', textAlign: 'center' }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={e => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                              style={{ width: '70px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.82rem', textAlign: 'center', fontWeight: 700, color: '#059669' }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            <input
                              type="text"
                              value={it.unit}
                              onChange={e => handleUpdateItem(idx, 'unit', e.target.value)}
                              placeholder="pcs"
                              style={{ width: '55px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.82rem', textAlign: 'center' }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            {form.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
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

              {/* Section 4: Delivery Instructions & Notes */}
              <div className="sv-form-section">
                <div className="sv-form-section-title"><FileText size={14} color="#64748B" /> Instructions &amp; Internal Notes</div>
                <div className="sv-field">
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Enter gate pass instructions, fragile equipment handling notes, or customer receiving remarks..."
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sv-btn-primary" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving & Deducting Stock...' : 'Save Delivery Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── DETAIL & RECEIPT VIEW MODAL ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {viewNote && (
        <div className="sv-modal-overlay" onClick={() => setViewNote(null)}>
          <div className="sv-modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  Delivery Note: {viewNote.deliveryNumber || viewNote.deliveryNoteNumber}
                </h3>
                <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                  Customer: {viewNote.clientName || viewNote.recipientName}
                </p>
              </div>
              <button onClick={() => setViewNote(null)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Status</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: viewNote.status === 'Done' ? '#059669' : '#2563EB', marginTop: '2px' }}>
                    {viewNote.status || 'Ready'}
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sales Order</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                    {viewNote.salesOrderNumber || viewNote.sourceDocument || 'Direct'}
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Dispatch Date</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                    {viewNote.scheduledDate ? new Date(viewNote.scheduledDate).toLocaleDateString('en-GB') : '—'}
                  </div>
                </div>
                <div style={{ background: '#FEF3C7', padding: '10px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>Deadline (2-3 Days)</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#92400E', marginTop: '2px' }}>
                    {viewNote.deadline ? new Date(viewNote.deadline).toLocaleDateString('en-GB') : (viewNote.scheduledDate ? new Date(new Date(viewNote.scheduledDate).getTime() + 3*86400000).toLocaleDateString('en-GB') : '—')}
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '2px' }}>Delivery Address</div>
                <div style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 600 }}>{viewNote.deliveryAddress || '—'}</div>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Demand</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Dispatched</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewNote.items || []).map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>{it.product || it.description}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{it.demand || it.quantity || 1}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#059669' }}>{it.quantity || it.demand || 1}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748B' }}>{it.unit || 'pcs'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {viewNote.notes && (
                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#475569' }}>
                  <strong>Notes:</strong> {viewNote.notes}
                </div>
              )}

              <div className="sv-modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="sv-btn-cancel"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleDownloadPDF(viewNote)}
                  >
                    <Printer size={14} color="#2563EB" /> Print / Export PDF
                  </button>
                  {viewNote.status === 'Done' && (
                    <button
                      type="button"
                      className="sv-btn-cancel"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FAF5FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}
                      onClick={() => {
                        const target = viewNote;
                        setViewNote(null);
                        handleOpenCreateInvoice(target);
                      }}
                    >
                      <FileText size={14} /> Create Invoice
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="sv-btn-cancel"
                    onClick={() => {
                      const target = viewNote;
                      setViewNote(null);
                      handleOpenEditModal(target);
                    }}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button type="button" className="sv-btn-primary" onClick={() => setViewNote(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── CREATE INVOICE MODAL FROM DELIVERED NOTE ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {invoicePreFill && (
        <div className="sv-modal-overlay" onClick={() => setInvoicePreFill(null)}>
          <div className="sv-modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={22} color="#7C3AED" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    Create Customer Invoice
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                    Generating invoice for Delivery Note <strong>{invoicePreFill.deliveryNoteNumber}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setInvoicePreFill(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveInvoiceFromDelivery} className="sv-form">
              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Customer Name *</label>
                  <input
                    value={invoicePreFill.clientName}
                    onChange={e => setInvoicePreFill(p => ({ ...p, clientName: e.target.value }))}
                    required
                  />
                </div>
                <div className="sv-field">
                  <label>Sales Order Ref</label>
                  <input
                    value={invoicePreFill.salesOrderNumber}
                    onChange={e => setInvoicePreFill(p => ({ ...p, salesOrderNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Total Invoice Amount (PKR) *</label>
                  <input
                    type="number"
                    min="1"
                    value={invoicePreFill.amount}
                    onChange={e => setInvoicePreFill(p => ({ ...p, amount: e.target.value }))}
                    placeholder="e.g. 450000"
                    required
                  />
                </div>
                <div className="sv-field">
                  <label>Payment Due Date</label>
                  <input
                    type="date"
                    value={invoicePreFill.dueDate}
                    onChange={e => setInvoicePreFill(p => ({ ...p, dueDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setInvoicePreFill(null)}>
                  Cancel
                </button>
                <button type="submit" className="sv-btn-primary" style={{ background: '#7C3AED' }} disabled={creatingInvoice}>
                  <Send size={14} /> {creatingInvoice ? 'Generating Invoice...' : 'Create & Submit Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── DELETE MODAL ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="sv-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="sv-modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={18} color="#EF4444" />
                <h3 style={{ margin: 0 }}>Delete Delivery Note</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className="sv-form">
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 16px' }}>
                Are you sure you want to delete delivery note <strong>{deleteTarget.deliveryNumber || deleteTarget.deliveryNoteNumber || ''}</strong>?
              </p>
              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="sv-btn-primary" onClick={handleDeleteNote} disabled={deleting} style={{ background: '#EF4444' }}>
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
