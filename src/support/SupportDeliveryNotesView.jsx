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
  Trash2,
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

const EMPTY_ITEM = {
  product: '',
  description: '',
  demand: 1,
  quantity: 1,
  unit: 'pcs',
  availability: 'Available'
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

export default function SupportDeliveryNotesView({ initialPreFillOrder }) {
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [proformaInvoices, setProformaInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmingId, setConfirmingId] = useState(null);
  const [viewDN, setViewDN] = useState(null);
  const [feedback, setFeedback] = useState('');

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
      const { response, data } = await apiRequest('/api/sales-employee/orders');
      if (response.ok && data.success) {
        const supportOrders = (data.data || []).filter(o =>
          o.workflowStatus && o.workflowStatus !== 'Sales Order Created'
        );
        const cutoff = new Date('2026-09-15T00:00:00.000Z');
        setSalesOrders(supportOrders.filter(d => new Date(d.createdAt) > cutoff));
      }
    } catch (e) {
      console.error('[Fetch Orders for DN Error]:', e);
    }
  }, []);

  const fetchProformas = useCallback(async () => {
    try {
      const { response, data } = await apiRequest('/api/sales-employee/proforma-invoices');
      if (response.ok && data.success) {
        setProformaInvoices(data.data || []);
      }
    } catch (e) {
      console.error('[Fetch Proformas for DN Error]:', e);
    }
  }, []);

  useEffect(() => {
    fetchDeliveryNotes();
    fetchOrders();
    fetchProformas();
  }, [fetchDeliveryNotes, fetchOrders, fetchProformas]);

  useEffect(() => {
    if (initialPreFillOrder) {
      handleSelectOrder(initialPreFillOrder._id);
      setShowModal(true);
    }
  }, [initialPreFillOrder]);

  const handleOpenAddModal = () => {
    setForm({
      ...EMPTY_FORM,
      deliveryNumber: `DN-${Math.floor(10000 + Math.random() * 90000)}`,
      trackingNumber: `TRK-${Math.floor(10000 + Math.random() * 90000)}`
    });
    setShowModal(true);
  };

  const handleSelectOrder = (soId) => {
    if (!soId) {
      setForm(prev => ({ ...prev, salesOrderId: '', salesOrderNumber: '' }));
      return;
    }
    const so = salesOrders.find(o => o._id === soId);
    if (!so) return;

    const items = (so.items && so.items.length > 0)
      ? so.items.map(it => ({
          product: it.description || 'Item',
          description: it.description || 'Item',
          demand: Number(it.quantity) || 1,
          quantity: Number(it.quantity) || 1,
          unit: 'pcs',
          availability: 'Available'
        }))
      : [{ product: so.productSummary || 'General Delivery Item', description: so.productSummary || 'General Delivery Item', demand: 1, quantity: 1, unit: 'pcs', availability: 'Available' }];

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
  };

  const handleSelectProforma = (piId) => {
    if (!piId) return;
    const pi = proformaInvoices.find(p => p._id === piId);
    if (!pi) return;

    const items = (pi.items && pi.items.length > 0)
      ? pi.items.map(it => ({
          product: it.description || 'Item',
          description: it.description || 'Item',
          demand: Number(it.quantity) || 1,
          quantity: Number(it.quantity) || 1,
          unit: 'pcs',
          availability: 'Available'
        }))
      : [{ product: pi.productSummary || 'Proforma Delivery Goods', description: pi.productSummary || 'Proforma Delivery Goods', demand: 1, quantity: 1, unit: 'pcs', availability: 'Available' }];

    setForm(prev => ({
      ...prev,
      salesOrderNumber: pi.proformaNumber || '',
      clientName: pi.clientName || '',
      recipientName: pi.clientName || '',
      recipientPhone: pi.clientPhone || '',
      deliveryAddress: pi.clientAddress || 'Client Facility',
      items: items,
      notes: `Dispatch for Approved Proforma ${pi.proformaNumber}`
    }));
  };

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_ITEM }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateItem = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleSaveDN = async (e) => {
    e.preventDefault();
    if (!form.clientName.trim()) {
      alert('Client / Customer name is required.');
      return;
    }
    try {
      const { response, data } = await apiRequest('/api/sales-employee/delivery-notes', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      if (response.ok && data.success) {
        setFeedback(`Delivery Note ${data.data?.deliveryNumber || data.data?.deliveryNoteNumber} created successfully!`);
        setShowModal(false);
        fetchDeliveryNotes();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(data.message || 'Failed to create Delivery Note.');
      }
    } catch (err) {
      alert('Server error creating Delivery Note.');
    }
  };

  const handleConfirmDN = async (dn) => {
    setConfirmingId(dn._id);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/delivery-notes/${dn._id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ receivedBy: dn.recipientName || 'Customer Received' })
      });
      if (response.ok && data.success) {
        setFeedback(`Delivery Note ${dn.deliveryNumber || dn.deliveryNoteNumber} confirmed! Inventory updated & Order handed off to Accounts.`);
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
      it.availability || 'Available'
    ]) : [[
      '1',
      'Standard Package Goods',
      'Delivered as per order specification',
      '1 pcs',
      '1 pcs',
      'Available'
    ]];

    autoTable(doc, {
      startY: 90,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [['#', 'Product Item', 'Description / Scope', 'Ordered', 'Delivered', 'Availability']],
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
        1: { halign: 'left', cellWidth: 50 },
        2: { halign: 'left', cellWidth: 60 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 22 }
      }
    });

    let finalY = doc.lastAutoTable.finalY + 8;
    if (finalY > 215) {
      doc.addPage();
      finalY = 20;
    }

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
                            onClick={() => handleConfirmDN(dn)}
                            disabled={confirmingId === dn._id}
                          >
                            <CheckCircle2 size={13} /> {confirmingId === dn._id ? 'Confirming...' : 'Confirm Delivery'}
                          </button>
                        )}
                        <button className="sv-btn-action-icon" onClick={() => setViewDN(dn)} title="View Delivery Note Complete Details">
                          <Eye size={14} color="#2563EB" />
                        </button>
                        <button className="sv-btn-action-icon" onClick={() => handleDownloadPDF(dn)} title="Download Delivery Note Official PDF">
                          <Download size={14} color="#0284C7" />
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

      {/* CREATE DN MODAL FOLLOWING SALES REP PATTERN */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
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
              {/* TOP WORKFLOW BAR: LINK / MOVE SALES ORDER OR APPROVED PROFORMA INTO DELIVERY NOTE */}
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
                    {proformaInvoices.map(pi => {
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

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary">
                  <Save size={14} /> Save Delivery Note
                </button>
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
                        <th style={{ padding: '10px 14px', textAlign: 'center', width: '110px' }}>Stock Status</th>
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
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.74rem', padding: '2px 8px', background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', borderRadius: '12px', fontWeight: 700 }}>
                                {item.availability || 'Available'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td style={{ padding: '10px 14px' }}>1</td>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>Delivered Goods / Equipment</td>
                          <td style={{ padding: '10px 14px' }}>General Order Scope</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>1 pcs</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#059669' }}>1 pcs</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>Available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes & Acknowledgement Status */}
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
                      handleConfirmDN(dnToConfirm);
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
    </div>
  );
}
