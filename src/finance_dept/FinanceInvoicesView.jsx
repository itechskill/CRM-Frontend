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
  CheckCircle,
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
  FileSpreadsheet,
  ShoppingCart
} from 'lucide-react';
import '../employee/sales/SalesViews.css';

export default function FinanceInvoicesView({ onNavigatePayment, searchQuery, initialTab }) {
  const [invoices, setInvoices] = useState([]);
  const [ordersRequiringApproval, setOrdersRequiringApproval] = useState([]);
  const [clearOrders, setClearOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewInvoice, setViewInvoice] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab || 'pending_drafts'); // 'pending_drafts' | 'order_approvals' | 'clear_orders' | 'finalized' | 'all'
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
  const [overdueDetailModalOrder, setOverdueDetailModalOrder] = useState(null);

  // Automatic customer overdue calculation helper
  const getCustomerOverdueDetails = (clientName) => {
    if (!clientName || !clientName.trim()) return { totalOverdue: 0, overdueInvoices: [], count: 0, maxOverdueDays: 0 };
    const nameNorm = clientName.trim().toLowerCase();
    const now = new Date();

    const overdueInvs = (invoices || []).filter(inv => {
      const invClient = (inv.clientName || '').trim().toLowerCase();
      if (invClient !== nameNorm) return false;
      if (inv.isDraft || ['Draft', 'Pending Finance Finalization', 'Cancelled'].includes(inv.status)) return false;
      if (!inv.dueDate) return false;
      const isPastDue = new Date(inv.dueDate) < now;
      const remaining = Math.max(0, (Number(inv.amount) || 0) - (Number(inv.paidAmount) || 0));
      return isPastDue && remaining > 0;
    });

    let totalOverdue = 0;
    let maxDays = 0;
    const items = overdueInvs.map(inv => {
      const remaining = Math.max(0, (Number(inv.amount) || 0) - (Number(inv.paidAmount) || 0));
      totalOverdue += remaining;
      const diffMs = now - new Date(inv.dueDate);
      const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      if (days > maxDays) maxDays = days;
      return {
        ...inv,
        remaining,
        daysOverdue: days
      };
    });

    return {
      totalOverdue,
      overdueInvoices: items,
      count: items.length,
      maxOverdueDays: maxDays
    };
  };

  const isOrderApproved = (o) => {
    // 1. Any order with overdue block/hold, rejection, or currently pending Finance review CANNOT be in Clear / Approved
    if (
      o.isOverdueBlocked ||
      o.workflowStatus === 'Order Blocked / Hold' ||
      o.status === 'Order Blocked / Hold' ||
      o.workflowStatus === 'Finance Rejected' ||
      o.status === 'Rejected' ||
      o.status === 'Sales Order Rejected due to overdue amount' ||
      o.workflowStatus === 'Pending Finance Overdue Check' ||
      o.workflowStatus === 'Pending Finance Approval' ||
      o.workflowStatus === 'Pending Overdue Check' ||
      o.status === 'Pending Finance Approval' ||
      o.status === 'Pending Overdue Check' ||
      (o.departmentResponsible === 'Finance' && !o.financeApprovedBy && !o.financeApprovedAt) ||
      (o.currentDepartment === 'Finance' && !o.financeApprovedBy && !o.financeApprovedAt)
    ) {
      return false;
    }

    // 2. Must have explicit finance approval OR have progressed to downstream departments
    const hasFinanceApproval = Boolean(o.financeApprovedBy || o.financeApprovedAt);
    const downstreamDepts = ['Local Purchaser', 'Global Purchaser', 'Logistics', 'Support', 'Accounts', 'Completed'];
    const hasDownstreamDept = downstreamDepts.includes(o.departmentResponsible) || downstreamDepts.includes(o.currentDepartment);
    const approvedStatuses = [
      'Finance Approved',
      'Pending Local Procurement',
      'Pending Global Procurement',
      'Local Supplier PO Issued',
      'International Supplier PO Issued',
      'Goods Received in Office',
      'Delivery Note Created',
      'Delivery Note Delivered',
      'Invoice Draft Created',
      'Invoice Finalized',
      'Payment Received',
      'Order Completed'
    ];
    const isApprovedStatus = approvedStatuses.includes(o.workflowStatus) || ['Delivered', 'Completed', 'Done', 'Invoiced', 'Paid'].includes(o.status);

    return Boolean(hasFinanceApproval || (hasDownstreamDept && isApprovedStatus));
  };

  const isOrderPendingApproval = (o) => {
    // 1. Exclude rejected orders
    if (
      o.workflowStatus === 'Finance Rejected' ||
      o.status === 'Rejected' ||
      o.status === 'Sales Order Rejected due to overdue amount'
    ) {
      return false;
    }

    // 2. Exclude orders that are approved or moved downstream
    if (isOrderApproved(o)) {
      return false;
    }

    // 3. Must be pending in Finance queue or on hold/blocked
    const isDeptFinance = o.departmentResponsible === 'Finance' || o.currentDepartment === 'Finance';
    const isPendingFinanceStatus = [
      'Pending Finance Overdue Check',
      'Pending Finance Approval',
      'Pending Overdue Check'
    ].includes(o.workflowStatus) || [
      'Pending Finance Overdue Check',
      'Pending Finance Approval',
      'Pending Overdue Check'
    ].includes(o.status);

    const isHoldOrBlocked = o.isOverdueBlocked === true ||
      o.workflowStatus === 'Order Blocked / Hold' ||
      o.status === 'Order Blocked / Hold';

    return Boolean(
      (isDeptFinance && (o.requiresFinanceApproval === true || isPendingFinanceStatus)) ||
      isPendingFinanceStatus ||
      isHoldOrBlocked
    );
  };

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
        setAllOrders(allOrdersList);

        const pendingList = allOrdersList.filter(isOrderPendingApproval);
        const approvedList = allOrdersList.filter(isOrderApproved);

        setOrdersRequiringApproval(pendingList);
        setClearOrders(approvedList);
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
      fileType: isBlue ? 'Blue' : 'Green'
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
    const now = new Date();
    const isOverdue = inv.isOverdue || (inv.dueDate && new Date(inv.dueDate) < now && inv.status !== 'Paid' && inv.status !== 'Cancelled');
    const amount = Number(inv.amount || 0);
    const lateCharge = isOverdue ? Math.round(amount * 0.03 * 100) / 100 : 0;
    const totalWithCharge = amount + lateCharge;

    doc.setFillColor(5, 150, 105); // #059669
    doc.rect(0, 0, 210, 34, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`FORTLINE CRM - ${inv.invoiceType || 'COMMERCIAL INVOICE'}`, 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${inv.invoiceNumber} • Status: ${isOverdue ? 'OVERDUE' : (inv.status || 'Finalized')}`, 14, 26);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Billed To: ${inv.clientName}`, 14, 42);
    doc.text(`Sales Order #: ${inv.salesOrderNumber || '—'}`, 14, 48);
    if (inv.dueDate) {
      doc.text(`Due Date: ${new Date(inv.dueDate).toLocaleDateString('en-GB')}`, 130, 48);
    }

    const itemsList = inv.items && inv.items.length > 0
      ? inv.items
      : [{ description: inv.description || 'Professional CRM Services', quantity: 1, unitPrice: amount, total: amount }];

    const rows = itemsList.map(it => [
      it.description || 'Item',
      it.quantity || 1,
      `PKR ${(Number(it.unitPrice) || 0).toLocaleString()}`,
      `PKR ${(Number(it.total) || 0).toLocaleString()}`
    ]);

    if (isOverdue) {
      rows.push([
        'Overdue Financial Charge (3% Late Fee applied past due date)',
        '1',
        `PKR ${lateCharge.toLocaleString()}`,
        `PKR ${lateCharge.toLocaleString()}`
      ]);
    }

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
    doc.text(`Invoice Subtotal: PKR ${amount.toLocaleString()}`, 196, finalY, { align: 'right' });
    if (isOverdue) {
      doc.setTextColor(220, 38, 38);
      doc.text(`Overdue 3% Charge: PKR ${lateCharge.toLocaleString()}`, 196, finalY + 6, { align: 'right' });
      doc.setTextColor(15, 23, 42);
      doc.text(`Total Payable with Charges: PKR ${totalWithCharge.toLocaleString()}`, 196, finalY + 12, { align: 'right' });
      doc.text(`Amount Paid: PKR ${Number(inv.paidAmount || 0).toLocaleString()}`, 196, finalY + 18, { align: 'right' });
    } else {
      doc.text(`Amount Paid: PKR ${Number(inv.paidAmount || 0).toLocaleString()}`, 196, finalY + 6, { align: 'right' });
    }

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
        `PKR ${total.toLocaleString()}`,
        `PKR ${paid.toLocaleString()}`,
        `PKR ${remaining.toLocaleString()}`,
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
    doc.text(`Total Invoiced: PKR ${totalAmt.toLocaleString()}`, 14, finalY > 195 ? 195 : finalY);

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
      (o.fileType && o.fileType.toLowerCase().includes(term)) ||
      (o.status && o.status.toLowerCase().includes(term)) ||
      (o.workflowStatus && o.workflowStatus.toLowerCase().includes(term))
    );
  });

  const filteredClearOrders = clearOrders.filter(o => {
    const effectiveSearch = (searchQuery || searchTerm || '').trim().toLowerCase();
    if (!effectiveSearch) return true;
    const term = effectiveSearch;
    return (
      (o.orderReference && o.orderReference.toLowerCase().includes(term)) ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
      (o.clientName && o.clientName.toLowerCase().includes(term)) ||
      (o.salePerson && o.salePerson.toLowerCase().includes(term)) ||
      (o.salesPerson?.fullName && o.salesPerson.fullName.toLowerCase().includes(term)) ||
      (o.financeApprovedByName && o.financeApprovedByName.toLowerCase().includes(term)) ||
      (o.fileType && o.fileType.toLowerCase().includes(term)) ||
      (o.status && o.status.toLowerCase().includes(term)) ||
      (o.workflowStatus && o.workflowStatus.toLowerCase().includes(term))
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
            Review draft invoices, finalize GST/Cash invoices, and approve sales orders with overdue credit checks
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
        <div className="sv-target-card" style={{ borderLeft: '4px solid #DC2626', cursor: 'pointer' }} onClick={() => setActiveTab('order_approvals')}>
          <span className="sv-ts-label">Orders Requiring Approval</span>
          <span className="sv-ts-value" style={{ color: '#DC2626' }}>{ordersRequiringApproval.length}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Awaiting Finance overdue verification</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #059669', cursor: 'pointer' }} onClick={() => setActiveTab('clear_orders')}>
          <span className="sv-ts-label">Clear / Approved Orders</span>
          <span className="sv-ts-value" style={{ color: '#059669' }}>{clearOrders.length}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Verified All Clear &amp; Routed</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #D97706', cursor: 'pointer' }} onClick={() => setActiveTab('pending_drafts')}>
          <span className="sv-ts-label">Pending Draft Invoices</span>
          <span className="sv-ts-value" style={{ color: '#D97706' }}>{pendingDrafts.length}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Awaiting GST / Cash selection</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #2563EB', cursor: 'pointer' }} onClick={() => setActiveTab('finalized')}>
          <span className="sv-ts-label">Finalized Invoices</span>
          <span className="sv-ts-value" style={{ color: '#2563EB' }}>{finalizedInvoices.length}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
            PKR {finalizedInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString()} Total
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('order_approvals')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'order_approvals' ? '1.5px solid #DC2626' : '1px solid #E2E8F0',
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
          onClick={() => setActiveTab('clear_orders')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'clear_orders' ? '1.5px solid #059669' : '1px solid #E2E8F0',
            background: activeTab === 'clear_orders' ? '#ECFDF5' : '#FFFFFF',
            color: activeTab === 'clear_orders' ? '#047857' : '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={14} /> Clear / Approved Orders ({clearOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('pending_drafts')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'pending_drafts' ? '1.5px solid #D97706' : '1px solid #E2E8F0',
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
          onClick={() => setActiveTab('finalized')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'finalized' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
            background: activeTab === 'finalized' ? '#EFF6FF' : '#FFFFFF',
            color: activeTab === 'finalized' ? '#1D4ED8' : '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileCheck size={14} /> Final Invoices / History ({finalizedInvoices.length})
        </button>

        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'all' ? '1.5px solid #64748B' : '1px solid #E2E8F0',
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
          placeholder="Search by order #, invoice #, customer name, sales person..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {/* TAB 1: ORDERS REQUIRING APPROVAL */}
      {activeTab === 'order_approvals' && (
        loading ? (
          <div className="sv-loading">Loading orders requiring approval...</div>
        ) : filteredOrdersToApprove.length === 0 ? (
          <div className="sv-empty">
            <CheckCircle2 size={40} color="#059669" />
            <h3>No Orders Requiring Finance Approval</h3>
            <p>All sales orders are currently clear and have passed Finance verification.</p>
          </div>
        ) : (
          <div>
            {/* Automatic Overdue Comparison Summary Matrix */}
            <div style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              color: '#FFFFFF',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck size={20} color="#10B981" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.3px' }}>
                    AUTOMATED OVERDUE COMPARISON ENGINE
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8' }}>
                  Real-time comparison between incoming Sales Order value vs customer's historical overdue debt &amp; unpaid invoices.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Awaiting Orders Value</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10B981' }}>
                    PKR {filteredOrdersToApprove.reduce((s, o) => s + (Number(o.netAmount || o.totalAmount) || 0), 0).toLocaleString()}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Total Overdue Debt on Queue</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#EF4444' }}>
                    PKR {filteredOrdersToApprove.reduce((s, o) => {
                      const live = getCustomerOverdueDetails(o.clientName);
                      return s + Math.max(live.totalOverdue, Number(o.customerOverdueAtCreation || 0));
                    }, 0).toLocaleString()}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>High Risk Customers</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F59E0B' }}>
                    {filteredOrdersToApprove.filter(o => {
                      const live = getCustomerOverdueDetails(o.clientName);
                      return live.totalOverdue > 0 || Number(o.customerOverdueAtCreation || 0) > 0;
                    }).length} / {filteredOrdersToApprove.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="sv-table-card">
              <table className="sv-table">
                <thead>
                  <tr>
                    <th>Order # / Ref</th>
                    <th>Customer</th>
                    <th>Sales Person</th>
                    <th>Incoming Order Value</th>
                    <th>Customer Overdue Balance</th>
                    <th>Automated Risk Comparison</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Finance Approval Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrdersToApprove.map(o => {
                    const liveOverdue = getCustomerOverdueDetails(o.clientName);
                    const overdueAmt = Math.max(liveOverdue.totalOverdue, Number(o.customerOverdueAtCreation || 0));
                    const orderAmt = Number(o.netAmount || o.totalAmount || 0);
                    const hasOverdue = overdueAmt > 0;
                    const isOverdueHigher = overdueAmt >= orderAmt;
                    const isBlocked = o.isOverdueBlocked || o.workflowStatus === 'Order Blocked / Hold' || o.status === 'Order Blocked / Hold';

                    return (
                      <tr key={o._id} style={{ backgroundColor: isBlocked ? '#FFF5F5' : (hasOverdue ? '#FFFBEB' : 'transparent') }}>
                        <td style={{ fontWeight: 700, color: '#0F172A' }}>
                          <div>{o.orderNumber || o.orderReference || 'SO'}</div>
                          {o.quotationNumber && <div style={{ fontSize: '0.72rem', color: '#2563EB' }}>Quote: {o.quotationNumber}</div>}
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            {o.orderDate ? new Date(o.orderDate).toLocaleDateString() : (o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—')}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{o.clientName}</div>
                          {o.clientPhone && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{o.clientPhone}</div>}
                        </td>
                        <td style={{ color: '#2563EB', fontWeight: 600 }}>
                          {o.salePerson || o.salesPerson?.fullName || 'Sales Person'}
                        </td>
                        <td style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                          PKR {orderAmt.toLocaleString()}
                          {o.fileType && (
                            <span style={{ display: 'block', fontSize: '0.72rem', color: o.fileType === 'Blue' ? '#1D4ED8' : '#047857', fontWeight: 700 }}>
                              {o.fileType} File
                            </span>
                          )}
                        </td>
                        <td>
                          {hasOverdue ? (
                            <div>
                              <div style={{ fontWeight: 800, color: '#DC2626', fontSize: '0.92rem' }}>
                                PKR {overdueAmt.toLocaleString()}
                              </div>
                              <button
                                type="button"
                                onClick={() => setOverdueDetailModalOrder(o)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  color: '#2563EB',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  marginTop: '2px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px'
                                }}
                              >
                                <Eye size={11} /> {liveOverdue.count > 0 ? `${liveOverdue.count} Overdue Invoices` : 'View Overdue Breakdown'}
                              </button>
                            </div>
                          ) : (
                            <span className="sv-badge" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: 700 }}>
                              <Check size={11} /> PKR 0 (Clean)
                            </span>
                          )}
                        </td>
                        <td>
                          {hasOverdue ? (
                            isOverdueHigher ? (
                              <div>
                                <span className="sv-badge" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', fontWeight: 800, fontSize: '0.72rem' }}>
                                  <AlertTriangle size={11} /> HIGH RISK (Debt &ge; Order)
                                </span>
                                <div style={{ fontSize: '0.7rem', color: '#B91C1C', marginTop: '2px' }}>
                                  Exposure: PKR {(overdueAmt + orderAmt).toLocaleString()}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="sv-badge" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontWeight: 800, fontSize: '0.72rem' }}>
                                  <AlertTriangle size={11} /> CAUTION (Has Overdue)
                                </span>
                                <div style={{ fontSize: '0.7rem', color: '#78350F', marginTop: '2px' }}>
                                  Overdue is {Math.round((overdueAmt / (orderAmt || 1)) * 100)}% of Order
                                </div>
                              </div>
                            )
                          ) : (
                            <span className="sv-badge" style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', fontWeight: 700, fontSize: '0.72rem' }}>
                              <Check size={11} /> ALL CLEAR / SAFE
                            </span>
                          )}
                        </td>
                        <td>
                          {isBlocked ? (
                            <div>
                              <span className="sv-badge" style={{ background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', fontWeight: 700 }}>
                                <Ban size={11} /> Order Blocked / Hold
                              </span>
                              {o.overdueBlockReason && (
                                <div style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: '2px', maxWidth: '160px' }}>
                                  {o.overdueBlockReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="sv-badge" style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}>
                              {o.workflowStatus || o.status || 'Pending Approval'}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            {/* 1. ALL CLEAR -> APPROVE BUTTON */}
                            <button
                              className="sv-btn-primary"
                              style={{
                                padding: '5px 12px',
                                fontSize: '0.75rem',
                                background: '#059669',
                                color: '#FFFFFF',
                                borderRadius: '20px',
                                border: 'none',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                              onClick={() => handleOpenApprovalModal(o)}
                              disabled={processingOrderId === o._id}
                              title="Verify comparison and route to Green File (Local) or Blue File (Global) branch"
                            >
                              <Check size={13} /> {hasOverdue ? 'Override & Approve' : 'All Clear and Approve'}
                            </button>

                            {/* 2. OVERDUE: HOLD / STOP BUTTON */}
                            {!isBlocked && (
                              <button
                                style={{
                                  padding: '4px 12px',
                                  fontSize: '0.73rem',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  background: '#FEF2F2',
                                  borderRadius: '20px',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                                onClick={() => handleOrderReview(o._id, 'block')}
                                disabled={processingOrderId === o._id}
                                title="Block / Hold order due to customer overdue balance"
                              >
                                <Ban size={12} /> Overdue: Hold
                              </button>
                            )}

                            {/* 3. REJECT & DETAILS */}
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <button
                                style={{
                                  padding: '2px 10px',
                                  fontSize: '0.72rem',
                                  color: '#64748B',
                                  border: '1px solid #CBD5E1',
                                  background: '#F8FAFC',
                                  borderRadius: '12px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                                onClick={() => handleOrderReview(o._id, 'reject')}
                                disabled={processingOrderId === o._id}
                                title="Reject order due to overdue"
                              >
                                Reject
                              </button>
                              <button
                                className="sv-btn-action-icon"
                                onClick={() => setViewOrder(o)}
                                title="View Complete Sales Order Details"
                                style={{ padding: '2px 6px' }}
                              >
                                <Eye size={13} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* TAB 2: CLEAR / APPROVED ORDERS */}
      {activeTab === 'clear_orders' && (
        loading ? (
          <div className="sv-loading">Loading clear / approved orders...</div>
        ) : filteredClearOrders.length === 0 ? (
          <div className="sv-empty">
            <CheckCircle2 size={40} color="#94A3B8" />
            <h3>No Clear / Approved Orders Found</h3>
            <p>Orders that pass Finance verification will appear here.</p>
          </div>
        ) : (
          <div className="sv-table-card">
            <table className="sv-table">
              <thead>
                <tr>
                  <th>Sales Order #</th>
                  <th>Customer</th>
                  <th>Sales Person</th>
                  <th>Amount (PKR)</th>
                  <th>File Type</th>
                  <th>Approval Status</th>
                  <th>Approved By</th>
                  <th>Approval Date &amp; Time</th>
                  <th style={{ textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredClearOrders.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>
                      <div>{o.orderNumber || o.orderReference || 'SO'}</div>
                      {o.supplierPO?.poNumber && (
                        <div style={{ fontSize: '0.72rem', color: o.fileType === 'Blue' ? '#2563EB' : '#059669', fontWeight: 600 }}>
                          PO: {o.supplierPO.poNumber}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.clientName}</div>
                      {o.clientPhone && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{o.clientPhone}</div>}
                    </td>
                    <td style={{ color: '#2563EB', fontWeight: 600 }}>
                      {o.salePerson || o.salesPerson?.fullName || 'Sales Person'}
                    </td>
                    <td style={{ fontWeight: 800, color: '#059669' }}>
                      PKR {Number(o.netAmount || o.totalAmount || 0).toLocaleString()}
                    </td>
                    <td>
                      {o.fileType === 'Blue' ? (
                        <span className="sv-badge" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: 700 }}>
                          Blue File (Imported)
                        </span>
                      ) : (
                        <span className="sv-badge" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: 700 }}>
                          Green File (Local)
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="sv-badge" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: 700 }}>
                        <CheckCircle2 size={11} /> {o.workflowStatus || o.status || 'Approved / Clear'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#334155' }}>
                      {o.financeApprovedByName || (o.financeApprovedBy ? 'Finance Dept' : 'Finance Reviewer')}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      {o.financeApprovedAt
                        ? new Date(o.financeApprovedAt).toLocaleString()
                        : (o.updatedAt ? new Date(o.updatedAt).toLocaleString() : '—')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="sv-btn-action-icon"
                        onClick={() => setViewOrder(o)}
                        title="View Sales Order Details"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* TAB 3: INVOICES (PENDING DRAFTS, FINALIZED, OR ALL) */}
      {['pending_drafts', 'finalized', 'all'].includes(activeTab) && (
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
                        PKR {total.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 700, color: '#2563EB' }}>
                        PKR {paid.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 800, color: isPaid ? '#059669' : '#DC2626' }}>
                        PKR {remaining.toLocaleString()}
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
                                if (onNavigatePayment) onNavigatePayment(inv);
                              }}
                            >
                              <span style={{fontWeight: 600, fontSize: "0.9em", marginRight: "4px"}}>PKR</span> Record Payment
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
                Amount: <strong style={{ color: '#059669' }}>PKR {Number(finalizeTarget.amount || 0).toLocaleString()}</strong>
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
                              PKR {(Number(item.unitPrice) || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                              PKR {(Number(item.total) || ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0))).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td style={{ padding: '10px 14px' }}>1</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>General Invoiced Services / Deliverables</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>1</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>PKR {Number(viewInvoice.amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>PKR {Number(viewInvoice.amount || 0).toLocaleString()}</td>
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
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>PKR {Number(viewInvoice.subtotal || viewInvoice.amount || 0).toLocaleString()}</span>
                  </div>
                  {Number(viewInvoice.discount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#DC2626' }}>Discount:</span>
                      <span style={{ fontWeight: 600, color: '#DC2626' }}>- PKR {Number(viewInvoice.discount).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(viewInvoice.tax) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748B' }}>Tax ({viewInvoice.taxRate || 0}%):</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>+ PKR {Number(viewInvoice.tax).toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1.5px solid #CBD5E1', borderBottom: '1.5px solid #CBD5E1', marginTop: '6px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>Total Invoice Amount:</span>
                    <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.15rem' }}>PKR {Number(viewInvoice.amount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#2563EB', fontWeight: 600 }}>Amount Paid:</span>
                    <span style={{ fontWeight: 700, color: '#2563EB' }}>PKR {Number(viewInvoice.paidAmount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: Math.max(0, (Number(viewInvoice.amount) || 0) - (Number(viewInvoice.paidAmount) || 0)) === 0 ? '#059669' : '#DC2626', fontWeight: 700 }}>
                      Remaining Balance:
                    </span>
                    <span style={{ fontWeight: 800, color: Math.max(0, (Number(viewInvoice.amount) || 0) - (Number(viewInvoice.paidAmount) || 0)) === 0 ? '#059669' : '#DC2626' }}>
                      PKR {Math.max(0, (Number(viewInvoice.amount) || 0) - (Number(viewInvoice.paidAmount) || 0)).toLocaleString()}
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
                      if (onNavigatePayment) onNavigatePayment(invToPay);
                    }}
                    style={{ gap: '6px' }}
                  >
                    <span style={{fontWeight: 600, fontSize: "0.9em", marginRight: "4px"}}>PKR</span> Record Customer Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FINANCE OVERDUE ALL CLEAR & FILE TYPE APPROVAL MODAL ─── */}
      {approvalModalOrder && (() => {
        const liveOverdue = getCustomerOverdueDetails(approvalModalOrder.clientName);
        const orderAmt = Number(approvalModalOrder.netAmount || approvalModalOrder.totalAmount || 0);
        const totalExposure = liveOverdue.totalOverdue + orderAmt;
        const hasOverdue = liveOverdue.totalOverdue > 0;
        const isHighRisk = liveOverdue.totalOverdue >= orderAmt && hasOverdue;

        return (
          <div className="sv-modal-overlay" style={{ zIndex: 1100 }}>
            <div className="sv-modal-card" style={{ maxWidth: '640px', width: '95%', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
              <div className="sv-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={22} color="#059669" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                      Finance Overdue Check &amp; Routing Approval
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Order: {approvalModalOrder.orderReference || approvalModalOrder.orderNumber} &bull; Sales Person: {approvalModalOrder.salePerson || approvalModalOrder.salesPerson?.fullName || 'Sales Team'}
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
                {/* Real-time Side-by-Side Overdue Comparison Engine Card */}
                <div style={{
                  background: hasOverdue ? (isHighRisk ? '#FEF2F2' : '#FFFBEB') : '#F0FDF4',
                  border: `1px solid ${hasOverdue ? (isHighRisk ? '#FECACA' : '#FDE68A') : '#BBF7D0'}`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: hasOverdue ? (isHighRisk ? '#991B1B' : '#92400E') : '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {hasOverdue ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                      {hasOverdue ? (isHighRisk ? 'HIGH RISK CREDIT EXPOSURE' : 'CAUTION: OUTSTANDING OVERDUE') : 'CLEAN CREDIT RECORD — ALL CLEAR'}
                    </div>
                    {hasOverdue && (
                      <button
                        type="button"
                        onClick={() => setOverdueDetailModalOrder(approvalModalOrder)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        View {liveOverdue.count} Overdue Invoices &rarr;
                      </button>
                    )}
                  </div>

                  {/* 3-Column Comparative Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
                    <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>New Order Value</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                        PKR {orderAmt.toLocaleString()}
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Total Past-Due Debt</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: hasOverdue ? '#DC2626' : '#16A34A' }}>
                        PKR {liveOverdue.totalOverdue.toLocaleString()}
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Total Exposure</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: hasOverdue ? '#B91C1C' : '#059669' }}>
                        PKR {totalExposure.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {hasOverdue && (
                    <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#991B1B', lineHeight: '1.4', background: 'rgba(255,255,255,0.7)', padding: '6px 10px', borderRadius: '6px' }}>
                      <strong>Warning:</strong> Customer has <strong>PKR {liveOverdue.totalOverdue.toLocaleString()}</strong> in unpaid invoices (oldest is {liveOverdue.maxOverdueDays} days overdue). Approving this order will route it to procurement.
                    </div>
                  )}
                </div>

                {/* Business Flowchart Branching Decision: File Type */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                    Select File Type for Procurement Routing:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div
                      onClick={() => setApprovalForm({
                        ...approvalForm,
                        fileType: 'Green'
                      })}
                      style={{
                        border: approvalForm.fileType === 'Green' ? '2px solid #10B981' : '1px solid #CBD5E1',
                        background: approvalForm.fileType === 'Green' ? '#ECFDF5' : '#FFFFFF',
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#047857', marginBottom: '4px', fontSize: '0.95rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
                        Green File (Local)
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#065F46', fontWeight: 600 }}>Local Order</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '6px', lineHeight: '1.4' }}>
                        Local Procurement &rarr; Move to <strong>Purchaser Local Portal</strong> for inventory check and local supplier PO.
                      </div>
                    </div>

                    <div
                      onClick={() => setApprovalForm({
                        ...approvalForm,
                        fileType: 'Blue'
                      })}
                      style={{
                        border: approvalForm.fileType === 'Blue' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                        background: approvalForm.fileType === 'Blue' ? '#EFF6FF' : '#FFFFFF',
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1D4ED8', marginBottom: '4px', fontSize: '0.95rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563EB' }} />
                        Blue File (Imported)
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#1E40AF', fontWeight: 600 }}>Imported Order (Outside Pakistan)</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '6px', lineHeight: '1.4' }}>
                        Import Procurement &rarr; Move to <strong>Purchaser Global Portal</strong> for international supplier PO.
                      </div>
                    </div>
                  </div>
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
                      padding: '10px 20px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      borderRadius: '8px'
                    }}
                  >
                    {submittingApproval
                      ? 'Processing...'
                      : approvalForm.fileType === 'Blue'
                      ? 'Move to Global Purchaser'
                      : 'Move to Local Purchaser'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ─── DETAILED CUSTOMER OVERDUE INVOICES BREAKDOWN MODAL ─── */}
      {overdueDetailModalOrder && (() => {
        const liveOverdue = getCustomerOverdueDetails(overdueDetailModalOrder.clientName);
        const orderAmt = Number(overdueDetailModalOrder.netAmount || overdueDetailModalOrder.totalAmount || 0);

        return (
          <div className="sv-modal-overlay" onClick={() => setOverdueDetailModalOrder(null)} style={{ zIndex: 1200 }}>
            <div className="sv-modal-card" style={{ maxWidth: '780px', width: '95%', maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
              <div className="sv-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#FEF2F2', borderRadius: '12px 12px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#991B1B' }}>
                      Overdue Invoices Breakdown: {overdueDetailModalOrder.clientName}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#7F1D1D' }}>
                      Incoming Sales Order: {overdueDetailModalOrder.orderReference || overdueDetailModalOrder.orderNumber} (PKR {orderAmt.toLocaleString()})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="sv-modal-close"
                  onClick={() => setOverdueDetailModalOrder(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94A3B8' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ padding: '20px' }}>
                {/* Summary Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Total Overdue Debt</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#DC2626' }}>
                      PKR {liveOverdue.totalOverdue.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Overdue Invoices Count</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                      {liveOverdue.count} Invoices
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Oldest Delinquency</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: liveOverdue.maxOverdueDays > 30 ? '#DC2626' : '#D97706' }}>
                      {liveOverdue.maxOverdueDays} Days Past Due
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Total Combined Exposure</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#7C2D12' }}>
                      PKR {(liveOverdue.totalOverdue + orderAmt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Overdue Invoices Table */}
                {liveOverdue.overdueInvoices.length > 0 ? (
                  <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                    <table className="sv-table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Due Date</th>
                          <th>Days Past Due</th>
                          <th style={{ textAlign: 'right' }}>Total (PKR)</th>
                          <th style={{ textAlign: 'right' }}>Paid (PKR)</th>
                          <th style={{ textAlign: 'right' }}>Remaining Balance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveOverdue.overdueInvoices.map((inv, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700, color: '#0F172A' }}>
                              {inv.invoiceNumber}
                              {inv.salesOrderNumber && (
                                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>SO: {inv.salesOrderNumber}</div>
                              )}
                            </td>
                            <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : 'N/A'}</td>
                            <td>
                              <span className="sv-badge" style={{ background: '#FEE2E2', color: '#B91C1C', fontWeight: 700, fontSize: '0.72rem' }}>
                                {inv.daysOverdue} days overdue
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(inv.amount || 0).toLocaleString()}</td>
                            <td style={{ textAlign: 'right', color: '#059669' }}>{Number(inv.paidAmount || 0).toLocaleString()}</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#DC2626' }}>
                              PKR {Number(inv.remaining || 0).toLocaleString()}
                            </td>
                            <td>
                              <span className="sv-badge" style={{ background: '#FEF3C7', color: '#92400E' }}>
                                {inv.status || 'Unpaid'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#059669', background: '#F0FDF4', borderRadius: '8px', marginBottom: '16px' }}>
                    <CheckCircle size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                    <div style={{ fontWeight: 700 }}>No Overdue Invoices Found</div>
                    <div style={{ fontSize: '0.8rem', color: '#166534' }}>All previous invoices for this customer are either paid or not past due.</div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                  <button
                    type="button"
                    className="sv-btn-cancel"
                    onClick={() => setOverdueDetailModalOrder(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="sv-btn-primary"
                    style={{ background: '#DC2626' }}
                    onClick={() => {
                      const ord = overdueDetailModalOrder;
                      setOverdueDetailModalOrder(null);
                      handleHoldOrderDueToOverdue(ord);
                    }}
                  >
                    Put Order on Overdue Hold
                  </button>
                  <button
                    type="button"
                    className="sv-btn-primary"
                    style={{ background: '#059669' }}
                    onClick={() => {
                      const ord = overdueDetailModalOrder;
                      setOverdueDetailModalOrder(null);
                      handleOpenApprovalModal(ord);
                    }}
                  >
                    Proceed to Approval &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── SALES ORDER COMPLETE DETAIL VIEW MODAL ─── */}
      {viewOrder && (
        <div className="sv-modal-overlay" onClick={() => setViewOrder(null)} style={{ zIndex: 1100 }}>
          <div className="sv-modal-card" style={{ maxWidth: '780px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: viewOrder.fileType === 'Blue' ? '#EFF6FF' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: viewOrder.fileType === 'Blue' ? '#2563EB' : '#059669' }}>
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                    Sales Order: {viewOrder.orderNumber || viewOrder.orderReference || 'SO'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Sales Person: {viewOrder.salePerson || viewOrder.salesPerson?.fullName || 'Sales Team'} &bull; Customer: {viewOrder.clientName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="sv-modal-close"
                onClick={() => setViewOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94A3B8' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Order Status & Financial Summary Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>File Type</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: viewOrder.fileType === 'Blue' ? '#1D4ED8' : '#047857' }}>
                    {viewOrder.fileType ? `${viewOrder.fileType} File` : 'Unassigned'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Net Order Total</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669' }}>
                    PKR {Number(viewOrder.netAmount || viewOrder.totalAmount || 0).toLocaleString()}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Customer Overdue at Creation</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: viewOrder.customerOverdueAtCreation > 0 ? '#DC2626' : '#16A34A' }}>
                    {viewOrder.customerOverdueAtCreation > 0 ? `PKR ${Number(viewOrder.customerOverdueAtCreation).toLocaleString()}` : 'PKR 0 (Clear)'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Workflow Status</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                    {viewOrder.workflowStatus || viewOrder.status || 'Active'}
                  </div>
                </div>
              </div>

              {/* Customer & Sales Person Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>Customer Information</div>
                  <div style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600 }}>{viewOrder.clientName}</div>
                  {viewOrder.clientEmail && <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Email: {viewOrder.clientEmail}</div>}
                  {viewOrder.clientPhone && <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Phone: {viewOrder.clientPhone}</div>}
                  {viewOrder.clientAddress && <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Address: {viewOrder.clientAddress}</div>}
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>Finance &amp; Supplier PO</div>
                  <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                    <strong>Finance Approved:</strong> {viewOrder.financeApprovedBy ? `Yes (by ${viewOrder.financeApprovedByName || 'Finance'})` : (viewOrder.isOverdueBlocked ? 'BLOCKED / ON HOLD' : 'Pending Verification')}
                  </div>
                  {viewOrder.supplierPO?.poNumber && (
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
                      <strong>Supplier PO:</strong> {viewOrder.supplierPO.poNumber} ({viewOrder.supplierPO.supplierName || 'Supplier'})
                    </div>
                  )}
                  {viewOrder.overdueBlockReason && (
                    <div style={{ fontSize: '0.82rem', color: '#DC2626', marginTop: '4px' }}>
                      <strong>Block Reason:</strong> {viewOrder.overdueBlockReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Table */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', marginBottom: '8px' }}>Line Items</div>
                <table className="sv-table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit Price (PKR)</th>
                      <th style={{ textAlign: 'right' }}>Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewOrder.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{it.description || 'Product / Service Item'}</td>
                        <td style={{ textAlign: 'right' }}>{it.quantity || 1}</td>
                        <td style={{ textAlign: 'right' }}>{Number(it.unitPrice || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{Number(it.total || (it.quantity || 1) * (it.unitPrice || 0)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Workflow History if present */}
              {viewOrder.workflowHistory && viewOrder.workflowHistory.length > 0 && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '8px' }}>Workflow History</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {viewOrder.workflowHistory.map((h, idx) => (
                      <div key={idx} style={{ background: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>{h.action}</strong> {h.notes ? `— ${h.notes}` : ''}</span>
                        <span style={{ color: '#94A3B8' }}>{h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  className="sv-btn-cancel"
                  onClick={() => setViewOrder(null)}
                >
                  Close
                </button>
                {isOrderPendingApproval(viewOrder) && (
                  <button
                    type="button"
                    className="sv-btn-primary"
                    style={{ background: '#059669' }}
                    onClick={() => {
                      const ord = viewOrder;
                      setViewOrder(null);
                      handleOpenApprovalModal(ord);
                    }}
                  >
                    All Clear / Approve Order
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
