import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import {
  FileText,
  Search,
  Eye,
  Download,
  X,
  CheckCircle2,
  DollarSign,
  Clock,
  AlertTriangle,
  Check,
  Ban,
  ShieldCheck,
  Send,
  Truck,
  RotateCcw,
  Building,
  Mail,
  Phone,
  Calendar,
  Tag,
  AlertCircle,
  MessageSquare,
  FileCheck,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import '../employee/sales/SalesViews.css';

export default function FinanceInvoicesView({ onNavigateRecordPayment, searchQuery, initialTab }) {
  const [invoices, setInvoices] = useState([]);
  const [ordersRequiringApproval, setOrdersRequiringApproval] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewInvoice, setViewInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab || 'pending_drafts'); // 'pending_drafts' | 'order_approvals' | 'finalized' | 'all'
  const [finalizeTarget, setFinalizeTarget] = useState(null);
  const [finalizeType, setFinalizeType] = useState('GST Invoice'); // 'GST Invoice' | 'Cash Invoice'
  const [submittingFinalize, setSubmittingFinalize] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [approvalModalOrder, setApprovalModalOrder] = useState(null);
  const [approvalForm, setApprovalForm] = useState({
    fileType: 'Green',
    supplierName: '',
    supplierCountry: 'Pakistan',
    supplierPoNumber: '',
    supplierNotes: ''
  });
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [invRes, orderRes] = await Promise.all([
        apiRequest('/api/sales-employee/invoices'),
        apiRequest('/api/sales-employee/orders')
      ]);

      if (invRes.response.ok && invRes.data.success) {
        const cutoff = new Date('2026-09-15T00:00:00.000Z');
        setInvoices((invRes.data.data || []).filter(d => new Date(d.createdAt) > cutoff));
      }

      if (orderRes.response.ok && orderRes.data.success) {
        const allOrdersList = orderRes.data.data || [];
        const pendingApproval = allOrdersList.filter(o =>
          o.workflowStatus !== 'Finance Rejected' &&
          o.status !== 'Rejected' &&
          o.status !== 'Sales Order Rejected due to overdue amount' &&
          (
            (o.requiresFinanceApproval === true && !o.financeApprovedBy) ||
            ['Pending Finance Overdue Check', 'Pending Finance Approval', 'Pending Overdue Check'].includes(o.workflowStatus) ||
            ['Pending Finance Overdue Check', 'Pending Finance Approval', 'Pending Overdue Check'].includes(o.status) ||
            (!o.financeApprovedBy && !['Finance Approved', 'Delivered', 'Completed', 'Invoiced', 'Done'].includes(o.workflowStatus) && !['Completed', 'Delivered', 'Done'].includes(o.status))
          )
        );
        // Show pending orders requiring approval if any exist; otherwise show all sales orders for audit
        setOrdersRequiringApproval(pendingApproval.length > 0 ? pendingApproval : allOrdersList);
      }
    } catch (e) {
      console.error('[Fetch Finance Data Error]:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleFinalizeInvoice = async () => {
    if (!finalizeTarget) return;
    setSubmittingFinalize(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/invoices/${finalizeTarget._id}/finalize`, {
        method: 'POST',
        body: JSON.stringify({ invoiceType: finalizeType })
      });

      if (response.ok && data.success) {
        setFeedback(`Invoice ${finalizeTarget.invoiceNumber} finalized as ${finalizeType}!`);
        setFinalizeTarget(null);
        fetchFinanceData();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(data.message || 'Failed to finalize invoice.');
      }
    } catch (err) {
      alert('Error finalizing invoice.');
    } finally {
      setSubmittingFinalize(false);
    }
  };

  const handleReturnToAccounts = async () => {
    if (!returnTarget) return;
    if (!returnReason.trim()) {
      alert('Please enter a comment or correction note for Accounts.');
      return;
    }
    setSubmittingReturn(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/invoices/${returnTarget._id}/return-to-accounts`, {
        method: 'POST',
        body: JSON.stringify({ reason: returnReason.trim() })
      });

      if (response.ok && data.success) {
        setFeedback(`Draft Invoice ${returnTarget.invoiceNumber} returned to Accounts with note: "${returnReason.trim()}".`);
        setReturnTarget(null);
        setReturnReason('');
        if (viewInvoice && viewInvoice._id === returnTarget._id) {
          setViewInvoice(null);
        }
        fetchFinanceData();
        setTimeout(() => setFeedback(''), 5000);
      } else {
        alert(data.message || 'Failed to return invoice to Accounts.');
      }
    } catch (err) {
      alert('Error returning invoice to Accounts.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to permanently delete this invoice? This action cannot be undone.')) return;
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/invoices/${invoiceId}`, {
        method: 'DELETE'
      });
      if (response.ok && data.success) {
        setFeedback('Invoice deleted successfully.');
        fetchFinanceData();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        alert(data.message || 'Failed to delete invoice.');
      }
    } catch (err) {
      alert('Error deleting invoice.');
    }
  };

  const handleOrderReview = async (orderId, decision, extraData = {}) => {
    setProcessingOrderId(orderId);
    try {
      let reason = '';
      if (decision === 'block' || decision === 'hold') {
        reason = prompt('Enter reason for placing Sales Order on HOLD / BLOCKED due to customer overdue balance:');
        if (!reason) {
          setProcessingOrderId(null);
          return;
        }
      } else if (decision === 'reject') {
        reason = prompt('Enter reason for rejecting Sales Order due to overdue balance:');
        if (!reason) {
          setProcessingOrderId(null);
          return;
        }
      }

      const { response, data } = await apiRequest(`/api/sales-employee/orders/${orderId}/finance-review`, {
        method: 'POST',
        body: JSON.stringify({ action: decision, decision, reason, ...extraData })
      });

      if (response.ok && data.success) {
        setFeedback(data.message || `Order review updated successfully.`);
        fetchFinanceData();
        setTimeout(() => setFeedback(''), 4500);
      } else {
        alert(data.message || 'Failed to update order review.');
      }
    } catch (err) {
      alert('Error processing order approval.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleOpenApprovalModal = (order) => {
    setApprovalModalOrder(order);
    const isBlue = order.fileType === 'Blue';
    setApprovalForm({
      fileType: isBlue ? 'Blue' : 'Green',
      supplierName: order.supplierPO?.supplierName || (isBlue ? 'International Supplier Ltd' : 'Local Supplier'),
      supplierCountry: order.supplierPO?.supplierCountry || (isBlue ? 'China' : 'Pakistan'),
      supplierPoNumber: order.supplierPO?.poNumber || `${isBlue ? 'IPO' : 'LPO'}-${Date.now().toString().slice(-6)}`,
      supplierNotes: order.supplierPO?.notes || ''
    });
  };

  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    if (!approvalModalOrder) return;
    setSubmittingApproval(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/orders/${approvalModalOrder._id}/finance-review`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'clear',
          ...approvalForm
        })
      });
      if (response.ok && data.success) {
        setFeedback(data.message || `Sales Order approved as ${approvalForm.fileType} File!`);
        setApprovalModalOrder(null);
        fetchFinanceData();
        setTimeout(() => setFeedback(''), 4500);
      } else {
        alert(data.message || 'Failed to approve order.');
      }
    } catch (err) {
      alert('Error approving order.');
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleDownloadPDF = (inv) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.setFillColor(5, 150, 105); // #059669
    doc.rect(0, 0, 210, 34, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`FORTLINE CRM - ${inv.invoiceType || 'COMMERCIAL INVOICE'}`, 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${inv.invoiceNumber} • Status: ${inv.status || 'Finalized'}`, 14, 26);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Billed To: ${inv.clientName}`, 14, 42);
    doc.text(`Sales Order #: ${inv.salesOrderNumber || '—'}`, 14, 48);

    const rows = (inv.items || []).map(it => [
      it.description || 'Item',
      it.quantity || 1,
      `Rs. ${(Number(it.unitPrice) || 0).toLocaleString()}`,
      `Rs. ${(Number(it.total) || 0).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Description', 'Qty', 'Unit Price (PKR)', 'Total (PKR)']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice Total: Rs. ${Number(inv.amount || 0).toLocaleString()}`, 196, finalY, { align: 'right' });
    doc.text(`Amount Paid: Rs. ${Number(inv.paidAmount || 0).toLocaleString()}`, 196, finalY + 6, { align: 'right' });

    doc.save(`${inv.invoiceType ? inv.invoiceType.replace(' ', '_') : 'Invoice'}_${inv.invoiceNumber}.pdf`);
  };

  // Export Full Invoices List PDF
  const handleExportAllPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(5, 150, 105); // #059669
    doc.rect(0, 0, 297, 26, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM — COMMERCIAL INVOICES & RECEIVABLES REGISTER', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 242, 254);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} • All amounts in Pakistani Rupees (PKR)`, 14, 20);

    const rows = filteredInvoices.map((inv, idx) => {
      const total = Number(inv.amount) || 0;
      const paid = Number(inv.paidAmount) || 0;
      const remaining = Math.max(0, total - paid);
      return [
        (idx + 1).toString(),
        inv.invoiceNumber || `INV-${idx + 1}`,
        inv.clientName || '—',
        inv.salesOrderNumber || '—',
        inv.deliveryNoteNumber || '—',
        inv.invoiceType || (inv.isDraft ? 'Draft' : 'Commercial'),
        `Rs. ${total.toLocaleString()}`,
        `Rs. ${paid.toLocaleString()}`,
        `Rs. ${remaining.toLocaleString()}`,
        inv.status || 'Pending'
      ];
    });

    autoTable(doc, {
      startY: 32,
      margin: { left: 14, right: 14 },
      head: [['#', 'Invoice #', 'Customer / Client', 'Sales Order #', 'DN #', 'Invoice Type', 'Total (PKR)', 'Paid (PKR)', 'Remaining (PKR)', 'Status']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
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
        1: { cellWidth: 28, fontStyle: 'bold' },
        2: { cellWidth: 46 },
        3: { cellWidth: 26 },
        4: { cellWidth: 26 },
        5: { cellWidth: 26 },
        6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 26, halign: 'right' },
        8: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        9: { cellWidth: 25, halign: 'center' }
      }
    });

    const totalAmt = filteredInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`Total Invoiced: Rs. ${totalAmt.toLocaleString()}`, 14, finalY > 195 ? 195 : finalY);

    doc.save(`Fortline_Invoices_Register_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export Full Invoices List Excel CSV
  const handleExportAllExcel = () => {
    const headers = ['#', 'Invoice Number', 'Customer / Client', 'Sales Order Number', 'Delivery Note Number', 'Invoice Type', 'Total Amount (PKR)', 'Paid Amount (PKR)', 'Remaining Balance (PKR)', 'Status', 'Created Date'];
    const rows = filteredInvoices.map((inv, idx) => {
      const total = Number(inv.amount) || 0;
      const paid = Number(inv.paidAmount) || 0;
      const remaining = Math.max(0, total - paid);
      return [
        idx + 1,
        `"${inv.invoiceNumber || ''}"`,
        `"${(inv.clientName || '').replace(/"/g, '""')}"`,
        `"${inv.salesOrderNumber || ''}"`,
        `"${inv.deliveryNoteNumber || ''}"`,
        `"${inv.invoiceType || (inv.isDraft ? 'Draft' : 'Commercial')}"`,
        total,
        paid,
        remaining,
        `"${inv.status || 'Pending'}"`,
        `"${inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-GB') : ''}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fortline_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group invoices
  const pendingDrafts = invoices.filter(inv =>
    inv.status === 'Pending Finance Finalization' || (inv.status === 'Submitted' && inv.isDraft !== false)
  );

  const finalizedInvoices = invoices.filter(inv =>
    inv.status === 'Finalized' || inv.isDraft === false || ['Approved', 'Paid', 'Partially Paid'].includes(inv.status)
  );

  const filteredInvoices = (activeTab === 'pending_drafts'
    ? pendingDrafts
    : activeTab === 'finalized'
    ? finalizedInvoices
    : invoices
  ).filter(inv => {
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
      (inv.invoiceType && inv.invoiceType.toLowerCase().includes(term)) ||
      (inv.status && inv.status.toLowerCase().includes(term)) ||
      (inv.items && inv.items.some(i => (i.description || '').toLowerCase().includes(term)))
    );
  });

  const filteredOrdersToApprove = ordersRequiringApproval.filter(o => {
    const effectiveSearch = (searchQuery || searchTerm || '').trim().toLowerCase();
    if (!effectiveSearch) return true;
    const term = effectiveSearch;
    return (
      (o.orderReference && o.orderReference.toLowerCase().includes(term)) ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
      (o.clientName && o.clientName.toLowerCase().includes(term)) ||
      (o.salePerson && o.salePerson.toLowerCase().includes(term)) ||
      (o.salesPerson?.fullName && o.salesPerson.fullName.toLowerCase().includes(term)) ||
      (o.productSummary && o.productSummary.toLowerCase().includes(term)) ||
      (o.fileNo && o.fileNo.toLowerCase().includes(term)) ||
      (o.status && o.status.toLowerCase().includes(term))
    );
  });

  return (
    <div className="sv-container">
      {/* Top Bar */}
      <div className="sv-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="sv-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={22} color="#059669" /> Finance &amp; Invoice Finalization
          </h2>
          <p className="sv-subtitle">
            Review draft invoices, finalize into GST / Cash invoices, and approve credit-overdue orders
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="sv-btn-primary" style={{ background: '#059669' }} onClick={handleExportAllPDF} title="Export Invoices PDF">
            <Download size={15} /> Export PDF
          </button>
          <button className="sv-btn-primary" style={{ background: '#2563EB' }} onClick={handleExportAllExcel} title="Export Invoices Excel">
            <FileSpreadsheet size={15} /> Export Excel
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '0.85rem' }}>
            <Clock size={16} color="#D97706" /> Pending Drafts: <strong>{pendingDrafts.length}</strong>
          </div>
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
          <span className="sv-ts-label">Pending Draft Invoices</span>
          <span className="sv-ts-value" style={{ color: '#D97706' }}>{pendingDrafts.length}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Awaiting GST / Cash selection</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #DC2626' }}>
          <span className="sv-ts-label">Orders Requiring Approval</span>
          <span className="sv-ts-value" style={{ color: '#DC2626' }}>{ordersRequiringApproval.length}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Due to customer overdue balance</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #059669' }}>
          <span className="sv-ts-label">Finalized Invoices</span>
          <span className="sv-ts-value" style={{ color: '#059669' }}>{finalizedInvoices.length}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Official billing records</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #2563EB' }}>
          <span className="sv-ts-label">Finalized Value</span>
          <span className="sv-ts-value" style={{ color: '#2563EB' }}>
            Rs. {finalizedInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString()}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Invoiced commercial total</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('pending_drafts')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'pending_drafts' ? '1px solid #D97706' : '1px solid #E2E8F0',
            background: activeTab === 'pending_drafts' ? '#FEF3C7' : '#FFFFFF',
            color: activeTab === 'pending_drafts' ? '#B45309' : '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Clock size={14} /> Pending Draft Invoices ({pendingDrafts.length})
        </button>

        <button
          onClick={() => setActiveTab('order_approvals')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'order_approvals' ? '1px solid #DC2626' : '1px solid #E2E8F0',
            background: activeTab === 'order_approvals' ? '#FEF2F2' : '#FFFFFF',
            color: activeTab === 'order_approvals' ? '#DC2626' : '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertTriangle size={14} /> Orders Requiring Approval ({ordersRequiringApproval.length})
        </button>

        <button
          onClick={() => setActiveTab('finalized')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'finalized' ? '1px solid #059669' : '1px solid #E2E8F0',
            background: activeTab === 'finalized' ? '#ECFDF5' : '#FFFFFF',
            color: activeTab === 'finalized' ? '#047857' : '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={14} /> Final Invoices / History ({finalizedInvoices.length})
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

      {/* Search Box */}
      <div className="sv-search-box" style={{ marginBottom: '16px' }}>
        <Search size={16} color="#94A3B8" />
        <input
          type="text"
          placeholder="Search by invoice #, customer name, sales order #..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* CONTENT: ORDERS REQUIRING APPROVAL */}
      {activeTab === 'order_approvals' ? (
        loading ? (
          <div className="sv-loading">Loading orders requiring approval...</div>
        ) : filteredOrdersToApprove.length === 0 ? (
          <div className="sv-empty">
            <CheckCircle2 size={40} color="#059669" />
            <h3>No Orders Requiring Finance Approval</h3>
            <p>All sales orders are in good standing without overdue credit blocks.</p>
          </div>
        ) : (
          <div className="sv-table-card">
            <table className="sv-table">
              <thead>
                <tr>
                  <th>Order Ref #</th>
                  <th>Client / Customer</th>
                  <th>Sales Person</th>
                  <th>Order Value</th>
                  <th>Overdue Status &amp; Balance</th>
                  <th>File Type</th>
                  <th>Workflow Status</th>
                  <th style={{ textAlign: 'center' }}>Finance Overdue Decision</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrdersToApprove.map(o => {
                  const overdueAmt = Number(o.customerOverdueAtCreation || 0);
                  const hasOverdue = overdueAmt > 0;
                  const isBlocked = o.isOverdueBlocked || o.workflowStatus === 'Order Blocked / Hold' || o.status === 'Order Blocked / Hold';

                  return (
                    <tr key={o._id} style={{ backgroundColor: isBlocked ? '#FFF5F5' : 'transparent' }}>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>
                        <div>{o.orderReference || o.orderNumber}</div>
                        {o.quotationNumber && <div style={{ fontSize: '0.72rem', color: '#2563EB' }}>Quote: {o.quotationNumber}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.clientName}</div>
                        {o.clientPhone && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{o.clientPhone}</div>}
                      </td>
                      <td style={{ color: '#2563EB', fontWeight: 600 }}>
                        {o.salePerson || o.salesPerson?.fullName || 'Sales Person'}
                      </td>
                      <td style={{ fontWeight: 800, color: '#059669' }}>
                        Rs. {Number(o.netAmount || o.totalAmount || 0).toLocaleString()}
                      </td>
                      <td>
                        {hasOverdue ? (
                          <span className="sv-badge" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontWeight: 700 }}>
                            <AlertTriangle size={11} /> Overdue: Rs. {overdueAmt.toLocaleString()}
                          </span>
                        ) : (
                          <span className="sv-badge" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: 700 }}>
                            <Check size={11} /> No Overdue (All Clear)
                          </span>
                        )}
                      </td>
                      <td>
                        {o.fileType === 'Blue' ? (
                          <span className="sv-badge" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: 700 }}>
                            Blue File (Imported)
                          </span>
                        ) : o.fileType === 'Green' ? (
                          <span className="sv-badge" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: 700 }}>
                            Green File (Local)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.76rem', color: '#94A3B8' }}>Select on Review</span>
                        )}
                      </td>
                      <td>
                        {isBlocked ? (
                          <div>
                            <span className="sv-badge" style={{ background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', fontWeight: 700 }}>
                              <Ban size={11} /> Order Blocked / Hold
                            </span>
                            {o.overdueBlockReason && (
                              <div style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: '2px', maxWidth: '200px' }}>
                                {o.overdueBlockReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="sv-badge" style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}>
                            {o.workflowStatus || 'Pending Finance Overdue Check'}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            className="sv-btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#059669', gap: '4px' }}
                            onClick={() => handleOpenApprovalModal(o)}
                            disabled={processingOrderId === o._id}
                            title="Verify All Clear and choose Green / Blue File branch"
                          >
                            <Check size={13} /> {isBlocked ? 'Unblock & Clear' : 'All Clear → Approve'}
                          </button>

                          {!isBlocked && (
                            <button
                              className="sv-btn-cancel"
                              style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2', gap: '4px' }}
                              onClick={() => handleOrderReview(o._id, 'block')}
                              disabled={processingOrderId === o._id}
                              title="Overdue = YES -> Order Blocked / Hold"
                            >
                              <Ban size={13} /> Overdue: Hold
                            </button>
                          )}

                          <button
                            className="sv-btn-cancel"
                            style={{ padding: '6px 8px', fontSize: '0.75rem', color: '#64748B', borderColor: '#CBD5E1', background: '#F8FAFC' }}
                            onClick={() => handleOrderReview(o._id, 'reject')}
                            disabled={processingOrderId === o._id}
                            title="Reject order and return to Sales Person"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* INVOICES TABLE (PENDING DRAFTS, FINALIZED, OR ALL) */
        loading ? (
          <div className="sv-loading">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="sv-empty">
            <FileText size={40} color="#94A3B8" />
            <h3>{activeTab === 'pending_drafts' ? 'No Draft Invoices Pending Finalization' : 'No Invoices Found'}</h3>
            <p>
              {activeTab === 'pending_drafts'
                ? 'All draft invoices submitted by Accounts have been finalized.'
                : 'No invoices match your selected filter.'}
            </p>
          </div>
        ) : (
          <div className="sv-table-card">
            <table className="sv-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client / Customer</th>
                  <th>Sales Order #</th>
                  <th>Delivery Note #</th>
                  <th>Invoice Type</th>
                  <th>Invoice Total</th>
                  <th>Paid Amount</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const total = Number(inv.amount) || 0;
                  const paid = Number(inv.paidAmount) || 0;
                  const remaining = Math.max(0, total - paid);
                  const isPaid = remaining === 0;
                  const isPendingFinalization = inv.status === 'Pending Finance Finalization' || (inv.status === 'Submitted' && inv.isDraft !== false);
                  const isFinalized = inv.status === 'Finalized' || inv.isDraft === false;

                  return (
                    <tr key={inv._id}>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>
                        {inv.invoiceNumber}
                        {inv.isDraft && (
                          <span style={{ marginLeft: '6px', fontSize: '0.68rem', padding: '1px 5px', background: '#FEF3C7', color: '#B45309', borderRadius: '4px', fontWeight: 800 }}>
                            DRAFT
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{inv.clientName}</td>
                      <td>{inv.salesOrderNumber || '—'}</td>
                      <td>
                        {inv.deliveryNoteNumber ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284C7', fontWeight: 600 }}>
                            <Truck size={12} /> {inv.deliveryNoteNumber}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        {inv.invoiceType ? (
                          <span className="sv-badge" style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', fontWeight: 700 }}>
                            {inv.invoiceType}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.82rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 800, color: '#059669' }}>
                        Rs. {total.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 700, color: '#2563EB' }}>
                        Rs. {paid.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 800, color: isPaid ? '#059669' : '#DC2626' }}>
                        Rs. {remaining.toLocaleString()}
                      </td>
                      <td>
                        {isPendingFinalization ? (
                          <span className="sv-badge" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', fontWeight: 700 }}>
                            <Clock size={11} /> Pending Finalization
                          </span>
                        ) : isFinalized ? (
                          <span className="sv-badge" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
                            <CheckCircle2 size={11} /> Finalized
                          </span>
                        ) : (
                          <span className="sv-badge" style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                            {inv.status}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {isPendingFinalization && (
                            <>
                              <button
                                className="sv-btn-primary"
                                style={{ padding: '5px 11px', fontSize: '0.75rem', background: '#059669', gap: '4px' }}
                                onClick={() => {
                                  setFinalizeTarget(inv);
                                  setFinalizeType('GST Invoice');
                                }}
                                title="Finalize Invoice into GST or Cash Invoice"
                              >
                                <ShieldCheck size={13} /> Finalize
                              </button>
                              <button
                                className="sv-btn-cancel"
                                style={{ padding: '5px 10px', fontSize: '0.75rem', color: '#D97706', borderColor: '#FDE68A', background: '#FFFBEB', gap: '4px', fontWeight: 700 }}
                                onClick={() => {
                                  setReturnTarget(inv);
                                  setReturnReason('');
                                }}
                                title="Return Draft Invoice to Accounts with correction comments"
                              >
                                <RotateCcw size={12} /> Return
                              </button>
                            </>
                          )}
                          <button className="sv-btn-action-icon" onClick={() => setViewInvoice(inv)} title="View Complete Draft Invoice Details">
                            <Eye size={14} />
                          </button>
                          <button className="sv-btn-action-icon" onClick={() => handleDownloadPDF(inv)} title="Download Invoice PDF">
                            <Download size={14} color="#059669" />
                          </button>
                          <button
                            className="sv-btn-action-icon"
                            onClick={() => handleDeleteInvoice(inv._id)}
                            title="Delete Invoice"
                          >
                            <Trash2 size={14} color="#DC2626" />
                          </button>
                          {isFinalized && !isPaid && (
                            <button
                              className="sv-btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#2563EB', gap: '4px' }}
                              onClick={() => {
                                if (onNavigateRecordPayment) onNavigateRecordPayment(inv);
                              }}
                            >
                              <DollarSign size={13} /> Record Payment
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
        )
      )}

      {/* FINALIZE INVOICE MODAL */}
      {finalizeTarget && (
        <div className="sv-modal-overlay" onClick={() => setFinalizeTarget(null)}>
          <div className="sv-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#059669" />
                <h3 style={{ margin: 0 }}>Finalize Invoice {finalizeTarget.invoiceNumber}</h3>
              </div>
              <button onClick={() => setFinalizeTarget(null)}><X size={18} /></button>
            </div>
            <div>
              <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 16px' }}>
                Customer: <strong>{finalizeTarget.clientName}</strong><br />
                Amount: <strong style={{ color: '#059669' }}>Rs. {Number(finalizeTarget.amount || 0).toLocaleString()}</strong>
              </p>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', marginBottom: '8px' }}>
                  Select Invoice Type:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFinalizeType('GST Invoice')}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      border: finalizeType === 'GST Invoice' ? '2px solid #059669' : '1px solid #CBD5E1',
                      background: finalizeType === 'GST Invoice' ? '#ECFDF5' : '#FFFFFF',
                      color: finalizeType === 'GST Invoice' ? '#047857' : '#334155',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    GST Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinalizeType('Cash Invoice')}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      border: finalizeType === 'Cash Invoice' ? '2px solid #059669' : '1px solid #CBD5E1',
                      background: finalizeType === 'Cash Invoice' ? '#ECFDF5' : '#FFFFFF',
                      color: finalizeType === 'Cash Invoice' ? '#047857' : '#334155',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Cash Invoice
                  </button>
                </div>
              </div>

              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setFinalizeTarget(null)}>Cancel</button>
                <button
                  className="sv-btn-primary"
                  style={{ background: '#059669' }}
                  onClick={handleFinalizeInvoice}
                  disabled={submittingFinalize}
                >
                  {submittingFinalize ? 'Finalizing...' : `Confirm as ${finalizeType}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RETURN TO ACCOUNTS MODAL */}
      {returnTarget && (
        <div className="sv-modal-overlay" onClick={() => setReturnTarget(null)}>
          <div className="sv-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header" style={{ borderBottom: '1.5px solid #FDE68A', background: '#FFFBEB', borderRadius: '12px 12px 0 0', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#92400E' }}>Return Invoice to Accounts</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#B45309' }}>Draft Invoice: {returnTarget.invoiceNumber} &bull; {returnTarget.clientName}</p>
                </div>
              </div>
              <button onClick={() => setReturnTarget(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '0.84rem', color: '#334155' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Specify corrections or mistakes to Accounts:</p>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.78rem' }}>
                  Accounts will receive this invoice in their portal with your comment highlighted. Once they update the values or references, they can resubmit it back to Finance.
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#0F172A', marginBottom: '6px' }}>
                  Comment / Correction Reason <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Please change the unit price in line item #2 to match PO, and verify the correct Sales Order ID."
                  className="ip-input"
                  style={{ width: '100%', padding: '10px 12px', fontSize: '0.88rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', resize: 'vertical' }}
                  required
                />
              </div>

              <div className="sv-modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="sv-btn-cancel" onClick={() => setReturnTarget(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="sv-btn-primary"
                  style={{ background: '#D97706', gap: '6px' }}
                  onClick={handleReturnToAccounts}
                  disabled={submittingReturn}
                >
                  <RotateCcw size={14} /> {submittingReturn ? 'Returning to Accounts...' : 'Return to Accounts'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE DETAILED VIEW INVOICE MODAL */}
      {viewInvoice && (
        <div className="sv-modal-overlay" onClick={() => setViewInvoice(null)}>
          <div className="sv-modal" style={{ maxWidth: '840px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sv-modal-header" style={{ padding: '18px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <FileText size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0F172A' }}>
                      {viewInvoice.invoiceNumber}
                    </h3>
                    {viewInvoice.isDraft ? (
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#FEF3C7', color: '#B45309', borderRadius: '6px', fontWeight: 800 }}>
                        DRAFT ({viewInvoice.status || 'Pending Finalization'})
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#ECFDF5', color: '#047857', borderRadius: '6px', fontWeight: 800 }}>
                        {viewInvoice.invoiceType || 'FINALIZED'}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                    Prepared by Accounts &bull; Submitted for Finance Review
                  </p>
                </div>
              </div>
              <button onClick={() => setViewInvoice(null)}><X size={20} /></button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Revision Reason Alert (if returned before) */}
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

              {/* 2-Column Info Grid: Customer & Linked Documents */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {/* Customer Details Box */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                    <Building size={14} color="#2563EB" /> Customer / Client Details
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

                {/* Linked References & Billing Terms Box */}
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

              {/* Financial Breakdown Summary & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                {/* Notes Block */}
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Notes &amp; Payment Instructions
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', minHeight: '100px', fontSize: '0.84rem', color: '#475569' }}>
                    {viewInvoice.notes || 'No specific notes entered.'}
                  </div>
                </div>

                {/* Calculation Summary Box */}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#2563EB', fontWeight: 600 }}>Amount Paid:</span>
                    <span style={{ fontWeight: 700, color: '#2563EB' }}>Rs. {Number(viewInvoice.paidAmount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: Math.max(0, (Number(viewInvoice.amount) || 0) - (Number(viewInvoice.paidAmount) || 0)) === 0 ? '#059669' : '#DC2626', fontWeight: 700 }}>
                      Remaining Balance:
                    </span>
                    <span style={{ fontWeight: 800, color: Math.max(0, (Number(viewInvoice.amount) || 0) - (Number(viewInvoice.paidAmount) || 0)) === 0 ? '#059669' : '#DC2626' }}>
                      Rs. {Math.max(0, (Number(viewInvoice.amount) || 0) - (Number(viewInvoice.paidAmount) || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="sv-modal-actions" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', marginTop: '16px' }}>
                <button className="sv-btn-cancel" onClick={() => setViewInvoice(null)}>
                  Close
                </button>
                <button className="sv-btn-cancel" onClick={() => handleDownloadPDF(viewInvoice)} style={{ gap: '6px' }}>
                  <Download size={14} color="#059669" /> Download PDF
                </button>

                {/* If invoice is pending finalization, show Return to Accounts and Finalize buttons */}
                {(viewInvoice.status === 'Pending Finance Finalization' || (viewInvoice.status === 'Submitted' && viewInvoice.isDraft !== false) || viewInvoice.isDraft) && (
                  <>
                    <button
                      className="sv-btn-cancel"
                      style={{ color: '#D97706', borderColor: '#FDE68A', background: '#FFFBEB', gap: '6px', fontWeight: 700 }}
                      onClick={() => {
                        const inv = viewInvoice;
                        setReturnTarget(inv);
                        setReturnReason('');
                      }}
                      title="Return this draft invoice back to Accounts with comments"
                    >
                      <RotateCcw size={14} /> Return to Accounts
                    </button>
                    <button
                      className="sv-btn-primary"
                      style={{ background: '#059669', gap: '6px' }}
                      onClick={() => {
                        const inv = viewInvoice;
                        setViewInvoice(null);
                        setFinalizeTarget(inv);
                        setFinalizeType('GST Invoice');
                      }}
                    >
                      <ShieldCheck size={14} /> Finalize Invoice
                    </button>
                  </>
                )}

                {Math.max(0, (Number(viewInvoice.amount) || 0) - (Number(viewInvoice.paidAmount) || 0)) > 0 && !viewInvoice.isDraft && (
                  <button
                    className="sv-btn-primary"
                    onClick={() => {
                      const invToPay = viewInvoice;
                      setViewInvoice(null);
                      if (onNavigateRecordPayment) onNavigateRecordPayment(invToPay);
                    }}
                    style={{ gap: '6px' }}
                  >
                    <DollarSign size={14} /> Record Customer Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FINANCE OVERDUE ALL CLEAR & FILE TYPE APPROVAL MODAL ─── */}
      {approvalModalOrder && (
        <div className="sv-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="sv-modal-card" style={{ maxWidth: '600px' }}>
            <div className="sv-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} color="#059669" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                    Finance Overdue All Clear &amp; File Type Branching
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Order: {approvalModalOrder.orderReference || approvalModalOrder.orderNumber} &bull; Sales Person: {approvalModalOrder.salePerson || approvalModalOrder.salesPerson?.fullName || 'Sales Person'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="sv-modal-close"
                onClick={() => setApprovalModalOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94A3B8' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitApproval} style={{ padding: '20px' }}>
              {/* Customer & Order Summary */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Customer:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{approvalModalOrder.clientName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Order Amount:</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#059669' }}>
                    Rs. {Number(approvalModalOrder.netAmount || approvalModalOrder.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Customer Overdue:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: approvalModalOrder.customerOverdueAtCreation > 0 ? '#DC2626' : '#16A34A' }}>
                    {approvalModalOrder.customerOverdueAtCreation > 0
                      ? `Rs. ${Number(approvalModalOrder.customerOverdueAtCreation).toLocaleString()} (Override Approved)`
                      : 'Rs. 0 (All Clear)'}
                  </span>
                </div>
              </div>

              {/* Business Flowchart Branching Decision: File Type */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                  1. Authoritative File Type Selection (Business Flowchart):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div
                    onClick={() => setApprovalForm({
                      ...approvalForm,
                      fileType: 'Green',
                      supplierCountry: 'Pakistan',
                      supplierName: approvalForm.supplierName || 'Local Supplier'
                    })}
                    style={{
                      border: approvalForm.fileType === 'Green' ? '2px solid #10B981' : '1px solid #CBD5E1',
                      background: approvalForm.fileType === 'Green' ? '#ECFDF5' : '#FFFFFF',
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#047857', marginBottom: '4px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
                      Green File
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#065F46', fontWeight: 600 }}>Local / Normal Order</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
                      Local Supplier PO &rarr; Support &rarr; Goods Received &rarr; Inventory &rarr; DN
                    </div>
                  </div>

                  <div
                    onClick={() => setApprovalForm({
                      ...approvalForm,
                      fileType: 'Blue',
                      supplierCountry: approvalForm.supplierCountry === 'Pakistan' ? 'China' : approvalForm.supplierCountry,
                      supplierName: approvalForm.supplierName || 'International Supplier Ltd'
                    })}
                    style={{
                      border: approvalForm.fileType === 'Blue' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      background: approvalForm.fileType === 'Blue' ? '#EFF6FF' : '#FFFFFF',
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1D4ED8', marginBottom: '4px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563EB' }} />
                      Blue File
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#1E40AF', fontWeight: 600 }}>Imported from Outside Pakistan</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
                      Int'l PO &rarr; Logistics Tracking &rarr; Shipment Received &rarr; Support &rarr; DN
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier PO Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.85rem' }}
                    value={approvalForm.supplierName}
                    onChange={(e) => setApprovalForm({ ...approvalForm, supplierName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Supplier Country
                  </label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.85rem' }}
                    value={approvalForm.supplierCountry}
                    onChange={(e) => setApprovalForm({ ...approvalForm, supplierCountry: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Supplier PO Number
                </label>
                <input
                  type="text"
                  required
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  value={approvalForm.supplierPoNumber}
                  onChange={(e) => setApprovalForm({ ...approvalForm, supplierPoNumber: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  className="sv-btn-cancel"
                  onClick={() => setApprovalModalOrder(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sv-btn-primary"
                  disabled={submittingApproval}
                  style={{
                    backgroundColor: approvalForm.fileType === 'Blue' ? '#2563EB' : '#059669',
                    padding: '9px 18px',
                    fontWeight: 700
                  }}
                >
                  {submittingApproval
                    ? 'Processing...'
                    : approvalForm.fileType === 'Blue'
                    ? 'Approve → Route to Logistics'
                    : 'Approve → Route to Support'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
