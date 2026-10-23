import React, { useState, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Download,
  X,
  Save,
  Check,
  Building,
  FileText,
  AlertCircle,
  Boxes,
  FileSpreadsheet,
  Package,
  Calendar,
  User,
  MapPin,
  Eye,
  Phone,
  ShieldCheck,
  Tag
} from 'lucide-react';
import '../employee/sales/SalesViews.css';
import './SupportPortal.css';

const SIGNED_DN_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp';
const SIGNED_DN_EXTENSIONS = /\.(pdf|png|jpe?g|webp|gif|bmp)$/i;
const SIGNED_DN_MIME_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp']);
const SIGNED_DN_MAX_SIZE = 3 * 1024 * 1024;

const EMPTY_ITEM = {
  product: '',
  description: '',
  demand: 1,
  quantity: 1,
  unit: 'pcs',
  availability: 'Available',
  orderItemId: '',
  unitPrice: 0,
  lineTotal: 0
};

const getFutureDateStr = (days = 3, baseDateStr = null) => {
  const d = baseDateStr ? new Date(baseDateStr) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
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

export default function SupportDeliveryNotesView({ initialSelectedOrder, onClearSelectedOrder }) {
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmDN, setConfirmDN] = useState(null);
  const [signedDNAttachment, setSignedDNAttachment] = useState({ signedDeliveryNoteDocument: '', signedDeliveryNoteDocumentName: '' });
  const [viewDN, setViewDN] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedStockCheck, setSelectedStockCheck] = useState(null);
  const [deliveryNoteStockChecks, setDeliveryNoteStockChecks] = useState({});

  const fetchDeliveryNotes = useCallback(async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/delivery-notes');
      if (response.ok && data.success) {
        const cutoff = new Date('2026-09-15T00:00:00.000Z');
        setDeliveryNotes((data.data || []).filter(d => new Date(d.createdAt) > cutoff));
      }
    } catch (e) {
      console.error('[Fetch Delivery Notes Error]:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const { response, data } = await apiRequest('/api/sales-employee/orders/available-for-delivery');
      if (response.ok && data.success) {
        const cutoff = new Date('2026-09-15T00:00:00.000Z');
        setSalesOrders((data.data || []).filter(d => new Date(d.createdAt) > cutoff));
      }
    } catch (e) {
      console.error('[Fetch Orders for DN Error]:', e);
    }
  }, []);

  useEffect(() => {
    fetchDeliveryNotes();
    fetchOrders();
  }, [fetchDeliveryNotes, fetchOrders]);

  useEffect(() => {
    const pending = deliveryNotes.filter(dn => !['Done', 'Delivered', 'Confirmed'].includes(dn.status) && dn.salesOrder?._id);
    if (pending.length === 0) return;
    let cancelled = false;
    Promise.all(pending.map(async dn => {
      const { response, data } = await apiRequest(`/api/sales-employee/orders/${dn.salesOrder._id}/stock-check`);
      return [dn._id, response.ok && data.success ? data.data : { isFullyInStock: false, message: data.message || 'Stock check failed.' }];
    })).then(entries => {
      if (!cancelled) setDeliveryNoteStockChecks(Object.fromEntries(entries));
    }).catch(() => {
      if (!cancelled) setDeliveryNoteStockChecks({});
    });
    return () => { cancelled = true; };
  }, [deliveryNotes]);

  useEffect(() => {
    if (initialSelectedOrder) {
      handleSelectOrder(initialSelectedOrder._id, initialSelectedOrder);
      setShowModal(true);
      if (onClearSelectedOrder) onClearSelectedOrder();
    }
  }, [initialSelectedOrder]);

  const handleOpenAddModal = () => {
    setSelectedStockCheck(null);
    setForm({
      ...EMPTY_FORM,
      deliveryNumber: '',
      trackingNumber: `TRK-${Math.floor(10000 + Math.random() * 90000)}`
    });
    setShowModal(true);
  };

  const handleSelectOrder = async (soId, fallbackOrder = null) => {
    if (!soId) {
      setForm(prev => ({ ...prev, salesOrderId: '', salesOrderNumber: '' }));
      setSelectedStockCheck(null);
      return;
    }
    const so = salesOrders.find(o => o._id === soId) || fallbackOrder;
    if (!so) return;

    const remainingOrderItems = so.deliveryRemainingItems?.length ? so.deliveryRemainingItems : so.items;
    const items = (remainingOrderItems && remainingOrderItems.length > 0)
      ? remainingOrderItems.map(it => ({
          product: it.description || 'Item',
          description: it.description || 'Item',
          demand: Number(it.quantity) || 1,
          quantity: Number(it.quantity) || 1,
          unit: 'pcs',
          availability: 'Available',
          orderItemId: it._id || '',
          unitPrice: Number(it.unitPrice) || 0,
          lineTotal: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)
        }))
      : [{ product: so.productSummary || 'General Delivery Item', description: so.productSummary || 'General Delivery Item', demand: 1, quantity: 1, unit: 'pcs', availability: 'Available', unitPrice: Number(so.netAmount || so.totalAmount) || 0, lineTotal: Number(so.netAmount || so.totalAmount) || 0 }];

    setForm(prev => ({
      ...prev,
      salesOrderId: so._id,
      salesOrderNumber: so.orderReference || so.orderNumber || '',
      clientName: so.clientName || '',
      recipientName: so.clientName || '',
      recipientPhone: so.clientPhone || '',
      deliveryAddress: so.clientAddress || 'Client Destination',
      trackingNumber: `TRK-${Math.floor(10000 + Math.random() * 90000)}`,
      items: items,
      notes: `Dispatch for ${so.orderReference || so.orderNumber}`
    }));

    setSelectedStockCheck({ loading: true, isFullyInStock: false });
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/orders/${so._id}/stock-check`);
      setSelectedStockCheck(response.ok && data.success
        ? data.data
        : { isFullyInStock: false, message: data.message || 'Stock check failed.' });
    } catch {
      setSelectedStockCheck({ isFullyInStock: false, message: 'Stock check failed.' });
    }
  };

  const handleSaveDN = async (e) => {
    e.preventDefault();
    if (!form.clientName.trim()) {
      alert('Client / Customer name is required.');
      return;
    }
    if (!form.salesOrderId) {
      alert('Select a Sales Order that has reached Support and has goods received in office.');
      return;
    }
    if (!selectedStockCheck?.isFullyInStock) {
      alert('Add inventory first using Receive Goods / Inventory IN. Every order line must have sufficient stock.');
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/delivery-notes', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      if (response.ok && data.success) {
        setFeedback(`Delivery Note ${data.data?.deliveryNumber || data.data?.deliveryNoteNumber} created successfully!`);
        setShowModal(false);
        fetchDeliveryNotes();
        fetchOrders();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(data.message || 'Failed to create Delivery Note.');
      }
    } catch (err) {
      alert('Server error creating Delivery Note.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignedDNFile = (file) => {
    if (!file || !SIGNED_DN_EXTENSIONS.test(file.name) || (file.type && !SIGNED_DN_MIME_TYPES.has(file.type))) {
      setSignedDNAttachment({ signedDeliveryNoteDocument: '', signedDeliveryNoteDocumentName: '' });
      alert('Attach the signed Delivery Note as a PDF or image.');
      return;
    }
    if (file.size > SIGNED_DN_MAX_SIZE) {
      setSignedDNAttachment({ signedDeliveryNoteDocument: '', signedDeliveryNoteDocumentName: '' });
      alert('The signed Delivery Note attachment must be 3 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSignedDNAttachment({
      signedDeliveryNoteDocument: reader.result,
      signedDeliveryNoteDocumentName: file.name
    });
    reader.onerror = () => alert('The signed Delivery Note attachment could not be read.');
    reader.readAsDataURL(file);
  };

  const openConfirmDN = (dn) => {
    if (!deliveryNoteStockChecks[dn._id]?.isFullyInStock) return;
    setSignedDNAttachment({ signedDeliveryNoteDocument: '', signedDeliveryNoteDocumentName: '' });
    setConfirmDN(dn);
  };

  const handleConfirmDN = async () => {
    const dn = confirmDN;
    if (!dn || !signedDNAttachment.signedDeliveryNoteDocument) return;
    setConfirmingId(dn._id);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/delivery-notes/${dn._id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          receivedBy: dn.recipientName || 'Customer Received',
          ...signedDNAttachment
        })
      });
      if (response.ok && data.success) {
        setFeedback(`Delivery Note ${dn.deliveryNumber || dn.deliveryNoteNumber} confirmed! Inventory updated & Order handed off to Accounts.`);
        setConfirmDN(null);
        fetchDeliveryNotes();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(data.message || 'Failed to confirm Delivery Note.');
      }
    } catch (err) {
      alert('Error confirming Delivery Note.');
    } finally {
      setConfirmingId(null);
    }
  };

  const viewSignedDN = (dn) => {
    if (dn?.signedDeliveryNoteDocument) window.open(dn.signedDeliveryNoteDocument, '_blank', 'noopener,noreferrer');
  };

  const downloadSignedDN = (dn) => {
    if (!dn?.signedDeliveryNoteDocument) return;
    const link = document.createElement('a');
    link.href = dn.signedDeliveryNoteDocument;
    link.download = dn.signedDeliveryNoteDocumentName || 'signed-delivery-note';
    link.click();
  };

  const handleDownloadPDF = (dn) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const dnRef = dn.deliveryNumber || dn.deliveryNoteNumber || 'DN-0001';

    // Primary Brand Header Banner (#0284C7 Logistics Sky Blue Theme)
    doc.setFillColor(2, 132, 199); // #0284C7
    doc.rect(0, 0, 210, 36, 'F');
    doc.setFillColor(3, 105, 161); // Accent strip #0369A1
    doc.rect(0, 36, 210, 2, 'F');

    // Title
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FORTLINE CRM', 14, 18);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 242, 254);
    doc.text('Support & Warehouse Outbound Dispatch Note', 14, 26);

    // Right Side Document Header
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('DELIVERY NOTE', 196, 18, { align: 'right' });

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 242, 254);
    doc.text(`Ref #: ${dnRef}`, 196, 26, { align: 'right' });

    // Customer & Shipment Information Card Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 44, 182, 40, 2.5, 2.5, 'FD');

    // Left Column: Consignee / Customer Details
    doc.setTextColor(3, 105, 161);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER / RECIPIENT DETAILS:', 19, 52);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(dn.clientName || dn.recipientName || 'Valued Consignee', 19, 58, { maxWidth: 85 });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Recipient Contact: ${dn.recipientName || dn.clientName || '—'}`, 19, 64, { maxWidth: 85 });
    doc.text(`Contact Phone: ${dn.recipientPhone || '—'}`, 19, 70, { maxWidth: 85 });
    doc.text(`Delivery Address: ${dn.deliveryAddress || 'Client Destination Address'}`, 19, 76, { maxWidth: 85 });

    // Vertical Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(108, 48, 108, 80);

    // Right Column: Order & Logistics Metadata
    doc.setTextColor(3, 105, 161);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('DISPATCH & SHIPMENT DETAILS:', 114, 52);

    doc.setFontSize(8.5);
    const soRef = dn.salesOrderNumber || dn.salesOrder?.orderReference || dn.salesOrder?.orderNumber || dn.sourceDocument || '—';
    const carrier = dn.carrier || 'Fortline Logistics';
    const tracking = dn.trackingNumber || 'TRK-001';
    const scheduled = dn.scheduledDate ? new Date(dn.scheduledDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const deadline = dn.deadline ? new Date(dn.deadline).toLocaleDateString('en-GB') : '—';

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Sales Order #: ', 114, 58);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(soRef, 155, 58);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Carrier / Fleet: ', 114, 64);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(carrier, 155, 64);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Tracking Code: ', 114, 70);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(tracking, 155, 70);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Dispatch Date: ', 114, 76);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${scheduled} (Due: ${deadline})`, 155, 76);

    // Line Items Table
    const tableRows = (dn.items && dn.items.length > 0) ? dn.items.map((it, idx) => [
      idx + 1,
      it.product || it.description || 'Delivered Item',
      it.description && it.description !== it.product ? it.description : 'Standard Scope',
      `${it.demand || it.quantity || 1} ${it.unit || 'pcs'}`,
      `${it.quantity || it.demand || 1} ${it.unit || 'pcs'}`,
      `PKR ${Number(it.unitPrice || 0).toLocaleString()}`,
      `PKR ${Number(it.lineTotal || ((Number(it.quantity) || 1) * Number(it.unitPrice || 0))).toLocaleString()}`
    ]) : [[
      '1',
      'Standard Package Goods',
      'Delivered as per order specification',
      '1 pcs',
      '1 pcs',
      'PKR 0',
      'PKR 0'
    ]];

    autoTable(doc, {
      startY: 90,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [['#', 'Product Item', 'Description / Scope', 'Ordered', 'Delivered', 'Unit Price', 'Line Total']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [2, 132, 199],
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
        1: { halign: 'left', cellWidth: 35 },
        2: { halign: 'left', cellWidth: 43 },
        3: { halign: 'center', cellWidth: 19 },
        4: { halign: 'center', cellWidth: 19 },
        5: { halign: 'right', cellWidth: 27 },
        6: { halign: 'right', cellWidth: 29 }
      }
    });

    let finalY = doc.lastAutoTable.finalY + 8;
    if (finalY > 215) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Grand Total: PKR ${Number(dn.grandTotal ?? dn.salesOrder?.netAmount ?? 0).toLocaleString()}`, 196, finalY, { align: 'right' });
    finalY += 7;

    // Special Dispatch Notes (if any)
    if (dn.notes) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, finalY, 182, 18, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(3, 105, 161);
      doc.text('DISPATCH & HANDLING NOTES:', 18, finalY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(dn.notes, 18, finalY + 12, { maxWidth: 174 });

      finalY += 24;
    } else {
      finalY += 4;
    }

    // Official Proof of Delivery Acknowledgement Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, finalY, 182, 38, 2, 2, 'D');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('PROOF OF DELIVERY & ACKNOWLEDGEMENT', 18, finalY + 8);

    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Dispatched By (Support / Warehouse):', 18, finalY + 16);
    doc.line(18, finalY + 30, 90, finalY + 30);
    doc.text('Authorized Signature & Stamp', 18, finalY + 34);

    doc.text('Received In Good Condition By (Customer):', 108, finalY + 16);
    if (dn.receivedBy) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Received By: ${dn.receivedBy}`, 108, finalY + 22);
      if (dn.deliveryDate) {
        doc.text(`Date: ${new Date(dn.deliveryDate).toLocaleDateString('en-GB')}`, 108, finalY + 26);
      }
    } else {
      doc.line(108, finalY + 30, 180, finalY + 30);
      doc.text('Customer Printed Name, Signature & Date', 108, finalY + 34);
    }

    // Page Footer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Fortline CRM Logistics System • Official Outbound Delivery Document', 105, 288, { align: 'center' });

    doc.save(`Delivery_Note_${dnRef.replace(/\//g, '_')}.pdf`);
  };

  // Full Delivery Notes List PDF Export
  const handleExportAllPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(2, 132, 199); // #0284C7
    doc.rect(0, 0, 297, 26, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM — DELIVERY NOTES & DISPATCH REGISTER', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 242, 254);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} • Warehouse Logistics & Delivery Control`, 14, 20);

    const rows = filteredDNs.map((dn, idx) => {
      const isConfirmed = dn.status === 'Done' || dn.status === 'Delivered' || dn.status === 'Confirmed';
      return [
        (idx + 1).toString(),
        dn.deliveryNumber || dn.deliveryNoteNumber || `DN-${idx + 1}`,
        dn.salesOrderNumber || dn.sourceDocument || '—',
        dn.clientName || '—',
        dn.deliveryAddress || '—',
        `${dn.items ? dn.items.length : 1} items`,
        isConfirmed ? 'Confirmed' : 'Pending',
        dn.createdAt ? new Date(dn.createdAt).toLocaleDateString('en-GB') : '—'
      ];
    });

    autoTable(doc, {
      startY: 32,
      margin: { left: 14, right: 14 },
      head: [['#', 'DN Ref #', 'Sales Order #', 'Customer / Consignee', 'Destination Address', 'Items', 'Status', 'Date Created']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [2, 132, 199],
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
        1: { cellWidth: 32, fontStyle: 'bold' },
        2: { cellWidth: 32 },
        3: { cellWidth: 48 },
        4: { cellWidth: 70 },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 28, halign: 'center' },
        7: { cellWidth: 29, halign: 'center' }
      }
    });

    doc.save(`Fortline_Delivery_Notes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Full Delivery Notes List Excel CSV Export
  const handleExportAllExcel = () => {
    const headers = ['#', 'DN Ref Number', 'Sales Order Number', 'Customer / Consignee', 'Recipient Name', 'Recipient Phone', 'Destination Address', 'Status', 'Created Date', 'Notes'];
    const rows = filteredDNs.map((dn, idx) => [
      idx + 1,
      `"${dn.deliveryNumber || dn.deliveryNoteNumber || ''}"`,
      `"${dn.salesOrderNumber || dn.sourceDocument || ''}"`,
      `"${(dn.clientName || '').replace(/"/g, '""')}"`,
      `"${(dn.recipientName || '').replace(/"/g, '""')}"`,
      `"${(dn.recipientPhone || '').replace(/"/g, '""')}"`,
      `"${(dn.deliveryAddress || '').replace(/"/g, '""')}"`,
      `"${dn.status || 'Ready'}"`,
      `"${dn.createdAt ? new Date(dn.createdAt).toLocaleDateString('en-GB') : ''}"`,
      `"${(dn.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fortline_Delivery_Notes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDNs = deliveryNotes.filter(dn => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (dn.deliveryNumber && dn.deliveryNumber.toLowerCase().includes(term)) ||
      (dn.clientName && dn.clientName.toLowerCase().includes(term)) ||
      (dn.salesOrderNumber && dn.salesOrderNumber.toLowerCase().includes(term))
    );
  });

  return (
    <div className="sv-container">
      {feedback && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>
          {feedback}
        </div>
      )}

      {/* Top Bar */}
      <div className="sv-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div className="sv-search-box">
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search Delivery Notes by DN#, client, order#..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="sv-btn-primary" style={{ background: '#0284C7' }} onClick={handleExportAllPDF} title="Export All to PDF">
            <Download size={15} /> Export PDF
          </button>
          <button className="sv-btn-primary" style={{ background: '#2563EB' }} onClick={handleExportAllExcel} title="Export All to Excel">
            <FileSpreadsheet size={15} /> Export Excel
          </button>
          <button className="sv-btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} /> Create Delivery Note
          </button>
        </div>
      </div>

      {/* DN Table */}
      {loading ? (
        <div className="sv-loading">Loading delivery notes...</div>
      ) : filteredDNs.length === 0 ? (
        <div className="sv-empty">
          <Truck size={40} color="#94A3B8" />
          <h3>No Delivery Notes Found</h3>
          <p>Create Delivery Notes from Sales Orders sent by Sales Representatives.</p>
        </div>
      ) : (
        <div className="sv-table-wrap support-table-card">
          <table className="sv-table support-table">
            <thead>
              <tr>
                <th>DN Ref #</th>
                <th>Sales Order #</th>
                <th>Customer / Consignee</th>
                <th>Items Count</th>
                <th>Status</th>
                <th>Date Created</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDNs.map((dn) => {
                const isConfirmed = dn.status === 'Done' || dn.status === 'Delivered' || dn.status === 'Confirmed';
                const stockCheck = deliveryNoteStockChecks[dn._id];
                return (
                  <tr key={dn._id}>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>
                      {dn.deliveryNumber || dn.deliveryNoteNumber}
                    </td>
                    <td>{dn.salesOrderNumber || dn.sourceDocument || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1E293B' }}>{dn.clientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{dn.deliveryAddress || ''}</div>
                    </td>
                    <td>{dn.items ? dn.items.length : 1} items</td>
                    <td>
                      <span className="sv-badge" style={{ background: isConfirmed ? '#ECFDF5' : '#FEF3C7', color: isConfirmed ? '#047857' : '#D97706', border: `1px solid ${isConfirmed ? '#A7F3D0' : '#FDE68A'}` }}>
                        {isConfirmed ? 'Confirmed / Delivered' : 'Pending Confirmation'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      {dn.createdAt ? new Date(dn.createdAt).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {!isConfirmed && (
                          <button
                            className="sv-btn-primary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#059669', gap: '4px' }}
                            onClick={() => openConfirmDN(dn)}
                            disabled={confirmingId === dn._id || !stockCheck?.isFullyInStock}
                            title={!stockCheck
                              ? 'Checking inventory stock...'
                              : (!stockCheck.isFullyInStock ? 'Add inventory first using Receive Goods / Inventory IN.' : '')}
                          >
                            <CheckCircle2 size={13} /> {confirmingId === dn._id ? 'Confirming...' : 'Confirm Delivery'}
                          </button>
                        )}
                        {!isConfirmed && stockCheck && !stockCheck.isFullyInStock && (
                          <span style={{ color: '#B91C1C', fontSize: '0.7rem', maxWidth: '150px' }}>Add inventory first</span>
                        )}
                        <button className="sv-btn-action-icon" onClick={() => setViewDN(dn)} title="View Delivery Note Complete Details">
                          <Eye size={14} color="#2563EB" />
                        </button>
                        <button className="sv-btn-action-icon" onClick={() => handleDownloadPDF(dn)} title="Download Delivery Note Official PDF">
                          <Download size={14} color="#0284C7" />
                        </button>
                        {dn.signedDeliveryNoteDocument && (
                          <>
                            <button className="sv-btn-action-icon" onClick={() => viewSignedDN(dn)} title="View Signed Delivery Note">
                              <FileText size={14} color="#059669" />
                            </button>
                            <button className="sv-btn-action-icon" onClick={() => downloadSignedDN(dn)} title="Download Signed Delivery Note">
                              <Download size={14} color="#059669" />
                            </button>
                          </>
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

      {/* CREATE DN MODAL FOLLOWING SALES REP PATTERN */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal support-dn-create-modal" style={{ maxWidth: '1180px', width: '96vw', maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                  <Truck size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    New Delivery Note
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                    Select a Sales Order to auto-populate delivery line items, recipient details, and deduct inventory
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveDN} className="sv-form">
              {/* TOP WORKFLOW BAR: LINK SALES ORDER IN SUPPORT TO DELIVERY NOTE */}
              <div style={{
                background: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '14px',
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
                    onChange={e => handleSelectOrder(e.target.value)}
                    required
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
                    {salesOrders.map(ord => {
                      return (
                        <option key={ord._id} value={ord._id}>
                          {ord.orderReference || ord.orderNumber} — {ord.clientName || ord.customerName} (Rs. {Number(ord.netAmount || ord.totalAmount || 0).toLocaleString()})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                  Only Sales Orders received by Support after goods arrive in the office are available for Delivery Note creation.
                </div>
              </div>

              {form.salesOrderId && (
                <div style={{
                  marginBottom: '14px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: selectedStockCheck?.isFullyInStock ? '#ECFDF5' : '#FEF2F2',
                  border: `1px solid ${selectedStockCheck?.isFullyInStock ? '#A7F3D0' : '#FECACA'}`,
                  color: selectedStockCheck?.isFullyInStock ? '#047857' : '#B91C1C',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}>
                  {selectedStockCheck?.loading
                    ? 'Checking inventory stock...'
                    : (selectedStockCheck?.isFullyInStock
                      ? 'All remaining order quantities are available.'
                      : 'Add inventory first using Receive Goods / Inventory IN before creating the Delivery Note.')}
                </div>
              )}

              <div className="support-dn-create-columns">
                <div className="sv-form-section support-dn-products-panel">
                  <div className="sv-form-section-title"><Package size={14} color="#7C3AED" /> Sales Order Product Details</div>
                  <div style={{ display: 'grid', gap: '8px', marginBottom: '12px', fontSize: '0.82rem' }}>
                    <div><strong>Sales Order:</strong> {form.salesOrderNumber || 'Select an order above'}</div>
                    <div><strong>Customer:</strong> {form.clientName || '—'}</div>
                  </div>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '0.8rem' }}>
                      <thead style={{ background: '#F8FAFC', color: '#475569' }}>
                        <tr><th style={{ padding: '8px', textAlign: 'left' }}>Product</th><th style={{ padding: '8px', width: '92px' }}>Delivery Qty</th><th style={{ padding: '8px', width: '60px' }}>Unit</th><th style={{ padding: '8px', width: '105px', textAlign: 'right' }}>Unit Price</th><th style={{ padding: '8px', width: '110px', textAlign: 'right' }}>Line Total</th></tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, index) => (
                          <tr key={`${item.product}-${index}`} style={{ borderTop: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '9px 8px', wordBreak: 'break-word' }}>{item.product || item.description || '—'}</td>
                            <td style={{ padding: '9px 8px', textAlign: 'center', fontWeight: 700 }}>
                              <input type="number" min="1" max={item.demand} value={item.quantity} onChange={event => {
                                const quantity = Math.max(1, Math.min(Number(item.demand) || 1, Number(event.target.value) || 1));
                                setForm(current => ({ ...current, items: current.items.map((line, lineIndex) => lineIndex === index ? { ...line, quantity, lineTotal: quantity * Number(line.unitPrice || 0) } : line) }));
                              }} style={{ width: '66px', padding: '5px', textAlign: 'center' }} />
                            </td>
                            <td style={{ padding: '9px 8px', textAlign: 'center' }}>{item.unit || 'pcs'}</td>
                            <td style={{ padding: '9px 8px', textAlign: 'right' }}>Rs. {Number(item.unitPrice || 0).toLocaleString()}</td>
                            <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: 800 }}>Rs. {Number(item.lineTotal || (item.quantity * item.unitPrice) || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '0.76rem', color: '#64748B' }}>Prices come from the Sales Order and cannot be edited. Reduce delivery quantity only for a partial delivery.</div>
                </div>

                <div className="support-dn-form-panel">
              {/* Section 1: Customer & Delivery Address */}
              <div className="sv-form-section">
                <div className="sv-form-section-title"><Building size={14} color="#2563EB" /> Customer &amp; Delivery Destination</div>
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Delivery Note #</label>
                    <input
                      value={form.deliveryNumber}
                      placeholder="Assigned on create"
                      readOnly
                      style={{ background: '#F1F5F9' }}
                    />
                  </div>
                  <div className="sv-field">
                    <label>Sales Order Number</label>
                    <input
                      value={form.salesOrderNumber}
                      placeholder="From selected Sales Order"
                      readOnly
                      style={{ background: '#F1F5F9' }}
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

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving || !selectedStockCheck?.isFullyInStock} title={!selectedStockCheck?.isFullyInStock ? 'Add inventory first using Receive Goods / Inventory IN.' : ''}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Delivery Note'}
                </button>
              </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DETAILED VIEW DELIVERY NOTE MODAL */}
      {viewDN && (
        <div className="sv-modal-overlay" onClick={() => setViewDN(null)}>
          <div className="sv-modal" style={{ maxWidth: '820px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header" style={{ padding: '18px 24px', background: '#F0F9FF', borderBottom: '1px solid #BAE6FD', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                  <Truck size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0F172A' }}>
                      Delivery Note: {viewDN.deliveryNumber || viewDN.deliveryNoteNumber}
                    </h3>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: ['Done', 'Confirmed', 'Delivered'].includes(viewDN.status) ? '#ECFDF5' : '#FEF3C7', color: ['Done', 'Confirmed', 'Delivered'].includes(viewDN.status) ? '#047857' : '#B45309', borderRadius: '6px', fontWeight: 800 }}>
                      {viewDN.status || 'Ready'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                    Support &amp; Warehouse Outbound Dispatch &bull; {viewDN.operationType || 'Outbound Delivery'}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewDN(null)}><X size={20} /></button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* 2-Column Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {/* Customer Details Box */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                    <Building size={14} color="#0284C7" /> Consignee / Delivery Destination
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    {viewDN.clientName}
                  </div>
                  {viewDN.recipientName && (
                    <div style={{ fontSize: '0.83rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <User size={13} color="#94A3B8" /> Attention: {viewDN.recipientName}
                    </div>
                  )}
                  {viewDN.recipientPhone && (
                    <div style={{ fontSize: '0.83rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Phone size={13} color="#94A3B8" /> Contact: {viewDN.recipientPhone}
                    </div>
                  )}
                  {viewDN.deliveryAddress && (
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '6px' }}>
                      <MapPin size={13} color="#94A3B8" style={{ display: 'inline', marginRight: '4px' }} />
                      <strong>Address:</strong> {viewDN.deliveryAddress}
                    </div>
                  )}
                </div>

                {/* Logistics Metadata Box */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                    <Truck size={14} color="#059669" /> Order &amp; Logistics Metadata
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.84rem' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Sales Order #:</span>
                      <strong style={{ color: '#0F172A' }}>{viewDN.salesOrderNumber || viewDN.sourceDocument || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Carrier / Logistics:</span>
                      <strong style={{ color: '#0284C7' }}>{viewDN.carrier || 'Fortline Logistics'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Tracking Code:</span>
                      <strong style={{ color: '#0F172A' }}>{viewDN.trackingNumber || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Source Warehouse:</span>
                      <strong style={{ color: '#0F172A' }}>{viewDN.sourceLocation || 'WH/Stock'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Scheduled Dispatch:</span>
                      <strong style={{ color: '#0F172A' }}>{viewDN.scheduledDate ? new Date(viewDN.scheduledDate).toLocaleDateString('en-GB') : '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Promised Deadline:</span>
                      <strong style={{ color: '#0F172A' }}>{viewDN.deadline ? new Date(viewDN.deadline).toLocaleDateString('en-GB') : '—'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itemized Products Table */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                  <Boxes size={15} color="#0284C7" /> Dispatched Items List ({viewDN.items ? viewDN.items.length : 0})
                </div>
                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', color: '#475569', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '10px 14px', width: '40px' }}>#</th>
                        <th style={{ padding: '10px 14px' }}>Product Name</th>
                        <th style={{ padding: '10px 14px' }}>Description / Scope</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', width: '100px' }}>Ordered Demand</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', width: '100px' }}>Delivered Qty</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', width: '110px' }}>Unit Price</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', width: '120px' }}>Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewDN.items && viewDN.items.length > 0) ? (
                        viewDN.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                            <td style={{ padding: '10px 14px', color: '#64748B', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>{item.product || item.description || 'Item'}</td>
                            <td style={{ padding: '10px 14px', color: '#475569' }}>{item.description || '—'}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>
                              {item.demand || item.quantity || 1} {item.unit || 'pcs'}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#059669' }}>
                              {item.quantity || item.demand || 1} {item.unit || 'pcs'}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>PKR {Number(item.unitPrice || 0).toLocaleString()}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800 }}>PKR {Number(item.lineTotal || ((Number(item.quantity) || 1) * Number(item.unitPrice || 0))).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td style={{ padding: '10px 14px' }}>1</td>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>Delivered Goods / Equipment</td>
                          <td style={{ padding: '10px 14px' }}>General Order Scope</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>1 pcs</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#059669' }}>1 pcs</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>PKR 0</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>PKR 0</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '1rem', fontWeight: 900, color: '#0F172A' }}>Grand Total: PKR {Number(viewDN.grandTotal ?? viewDN.salesOrder?.netAmount ?? 0).toLocaleString()}</div>
              </div>

              {/* Notes & Acknowledgement Status */}
              <div style={{ marginBottom: '16px', padding: '12px 14px', border: '1px solid #D1FAE5', background: '#F0FDF4', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#065F46', marginBottom: '6px' }}>Signed Delivery Note</div>
                {viewDN.signedDeliveryNoteDocument ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem', color: '#334155' }}>{viewDN.signedDeliveryNoteDocumentName}</span>
                    <button type="button" className="sv-btn-action-icon" onClick={() => viewSignedDN(viewDN)} title="View Signed Delivery Note"><Eye size={14} /></button>
                    <button type="button" className="sv-btn-action-icon" onClick={() => downloadSignedDN(viewDN)} title="Download Signed Delivery Note"><Download size={14} /></button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: '#92400E' }}>No signed Delivery Note attached.</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Handling Instructions &amp; Notes
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', minHeight: '80px', fontSize: '0.84rem', color: '#475569' }}>
                    {viewDN.notes || 'No specific dispatch notes.'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Receipt Confirmation Status
                  </div>
                  {viewDN.receivedBy ? (
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} /> Confirmed Received
                      </div>
                      <div style={{ fontSize: '0.83rem', color: '#334155', marginTop: '4px' }}>
                        <strong>Received By:</strong> {viewDN.receivedBy}
                      </div>
                      {viewDN.deliveryDate && (
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                          <strong>Date:</strong> {new Date(viewDN.deliveryDate).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: '#D97706', fontSize: '0.85rem', fontWeight: 600 }}>
                      ⏳ Pending Customer Receipt Confirmation
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="sv-modal-actions" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', marginTop: '16px' }}>
                <button className="sv-btn-cancel" onClick={() => setViewDN(null)}>
                  Close
                </button>
                <button className="sv-btn-primary" onClick={() => handleDownloadPDF(viewDN)} style={{ background: '#0284C7', gap: '6px' }}>
                  <Download size={14} /> Download Official PDF
                </button>
                {!['Done', 'Delivered', 'Confirmed'].includes(viewDN.status) && (
                  <button
                    className="sv-btn-primary"
                    style={{ background: '#059669', gap: '6px' }}
                    onClick={() => {
                      const dnToConfirm = viewDN;
                      setViewDN(null);
                      openConfirmDN(dnToConfirm);
                    }}
                  >
                    <CheckCircle2 size={14} /> Confirm Delivery
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmDN && (
        <div className="sv-modal-overlay" onClick={() => !confirmingId && setConfirmDN(null)}>
          <div className="sv-modal" style={{ maxWidth: '520px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Confirm Delivery</h3>
                <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.82rem' }}>{confirmDN.deliveryNumber || confirmDN.deliveryNoteNumber}</p>
              </div>
              <button onClick={() => setConfirmDN(null)} disabled={Boolean(confirmingId)}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Signed Delivery Note (PDF or image) *</label>
              <input type="file" accept={SIGNED_DN_ACCEPT} onChange={(e) => handleSignedDNFile(e.target.files?.[0])} />
              <div style={{ marginTop: '8px', color: '#64748B', fontSize: '0.8rem' }}>Maximum file size: 3 MB.</div>
              {signedDNAttachment.signedDeliveryNoteDocumentName && (
                <div style={{ marginTop: '10px', color: '#047857', fontSize: '0.85rem', fontWeight: 600 }}>{signedDNAttachment.signedDeliveryNoteDocumentName}</div>
              )}
              <div className="sv-modal-actions" style={{ marginTop: '20px' }}>
                <button className="sv-btn-cancel" onClick={() => setConfirmDN(null)} disabled={Boolean(confirmingId)}>Cancel</button>
                <button className="sv-btn-primary" style={{ background: '#059669' }} onClick={handleConfirmDN} disabled={!signedDNAttachment.signedDeliveryNoteDocument || Boolean(confirmingId)}>
                  <CheckCircle2 size={14} /> {confirmingId ? 'Confirming...' : 'Confirm Delivery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
