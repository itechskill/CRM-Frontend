import React, { useState, useEffect, useCallback } from 'react';
import ReactDOMServer from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest } from '../utils/api';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Edit2,
  Trash2,
  X,
  Save,
  DollarSign,
  User,
  Building,
  Calendar,
  Layers,
  Clock,
  Send,
  Filter,
  Download
} from 'lucide-react';
import '../employee/sales/SalesViews.css';

/* ── Inject print-only styles once ── */
const PRINT_STYLE_ID = 'invoice-pdf-print-style';
if (!document.getElementById(PRINT_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @media print {
      body > *:not(#invoice-print-root) { display: none !important; }
      #invoice-print-root {
        display: block !important;
        position: fixed !important;
        inset: 0 !important;
        z-index: 99999 !important;
        background: #fff !important;
        padding: 32px !important;
        font-family: 'Inter', sans-serif !important;
        color: #0F172A !important;
      }
      #invoice-print-root .no-print { display: none !important; }
    }
    @media screen { #invoice-print-root { display: none; } }
  `;
  document.head.appendChild(style);
}

const INVOICE_STATUS_STYLES = {
  'Draft': { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  'Pending Review': { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  'Submitted': { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  'Approved': { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  'Rejected': { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  'Sent': { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  'Paid': { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' },
  'Partially Paid': { bg: '#FEF9C3', color: '#CA8A04', border: '#FEF08A' },
  'Overdue': { bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5' },
  'Cancelled': { bg: '#F8FAFC', color: '#94A3B8', border: '#E2E8F0' }
};

export default function SalesInvoicesView() {
  const [invoices, setInvoices] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [editInvoice, setEditInvoice] = useState(null);
  const [rejectModalInvoice, setRejectModalInvoice] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deleteModalInvoice, setDeleteModalInvoice] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (selectedMember !== 'all') params.set('employeeId', selectedMember);
      if (search.trim()) params.set('search', search.trim());

      const [invRes, teamRes] = await Promise.all([
        apiRequest(`/api/sales-manager/invoices?${params}`),
        apiRequest('/api/sales-manager/team-members')
      ]);

      if (invRes.response.ok && invRes.data.success) {
        setInvoices(invRes.data.data || []);
      }
      if (teamRes.response.ok && teamRes.data.success) {
        setTeamMembers(teamRes.data.data || []);
      }
    } catch (e) {
      console.error('Fetch sales manager invoices error:', e);
    } finally {
      setLoading(false);
    }
  }, [filter, selectedMember, search]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Recalculate invoice totals when line items, tax, discount change in edit modal
  const recalculateTotals = (itemsList, taxRatePct, discountVal) => {
    const subtotal = itemsList.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    const tax = Number(((subtotal * (Number(taxRatePct) || 0)) / 100).toFixed(2));
    const discount = Number(Number(discountVal) || 0);
    const amount = Math.max(0, Number((subtotal + tax - discount).toFixed(2)));
    return { subtotal, tax, amount };
  };

  // PDF Download — opens formatted invoice in printable popup and triggers print
  const handleDownloadPDF = (inv) => {
    const items = inv.items && inv.items.length > 0 ? inv.items : [
      { description: inv.dealTitle || 'Commercial Sales Services', quantity: 1, unitPrice: inv.amount, total: inv.amount }
    ];
    const statusStyle = INVOICE_STATUS_STYLES[inv.status] || { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };

    const qrData = `INVOICE: ${inv.invoiceNumber}\nCUSTOMER: ${inv.clientName}\nAMOUNT: PKR ${Number(inv.amount || 0).toLocaleString()}\nREFERENCE: ${inv.dealTitle || inv.saleReference || 'Direct'}\nDATE: ${new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}`;
    let qrSvgString = '';
    try {
      qrSvgString = ReactDOMServer.renderToStaticMarkup(
        React.createElement(QRCodeSVG, { value: qrData, size: 84, level: 'M' })
      );
    } catch (e) {
      console.error('QR code generation error:', e);
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Invoice - ${inv.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #0F172A; background: #F8FAFC; padding: 24px; }
    .page-container { max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .action-bar { max-width: 820px; margin: 0 auto 16px; display: flex; justify-content: space-between; align-items: center; }
    .btn-print { background: #2563EB; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(37,99,235,0.3); }
    .btn-print:hover { background: #1D4ED8; }
    .btn-close { background: #E2E8F0; color: #334155; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; }
    .btn-close:hover { background: #CBD5E1; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 3px solid #1E3A5F; }
    .brand { font-size: 1.85rem; font-weight: 800; color: #1E3A5F; letter-spacing: -0.5px; }
    .brand-sub { font-size: 0.85rem; color: #64748B; margin-top: 4px; font-weight: 500; }
    .inv-num { font-size: 1.5rem; font-weight: 800; color: #2563EB; font-family: monospace; text-align: right; }
    .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; margin-top: 8px; background: ${statusStyle.bg}; color: ${statusStyle.color}; border: 1px solid ${statusStyle.border}; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 28px; }
    .meta-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #94A3B8; letter-spacing: 0.8px; margin-bottom: 6px; }
    .meta-client { font-size: 1.15rem; font-weight: 700; color: #0F172A; }
    .meta-detail { font-size: 0.85rem; color: #475569; margin-top: 3px; }
    .meta-right { text-align: right; }
    .meta-right .meta-detail { color: #334155; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #1E3A5F; }
    thead th { padding: 11px 14px; font-size: 0.78rem; font-weight: 700; color: #ffffff; text-align: left; letter-spacing: 0.5px; }
    thead th:nth-child(2) { text-align: center; width: 70px; }
    thead th:nth-child(3), thead th:nth-child(4) { text-align: right; width: 140px; }
    tbody tr:nth-child(even) { background: #F8FAFC; }
    tbody td { padding: 11px 14px; font-size: 0.875rem; color: #0F172A; border-bottom: 1px solid #F1F5F9; }
    tbody td:nth-child(2) { text-align: center; color: #475569; }
    tbody td:nth-child(3) { text-align: right; color: #475569; }
    tbody td:nth-child(4) { text-align: right; font-weight: 700; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .totals-box { width: 320px; }
    .totals-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 0.875rem; color: #475569; border-bottom: 1px solid #F1F5F9; }
    .totals-final { display: flex; justify-content: space-between; padding: 12px 0 4px; font-size: 1.2rem; font-weight: 800; color: #0F172A; border-top: 3px solid #1E3A5F; margin-top: 6px; }
    .totals-final span:last-child { color: #2563EB; }
    .notes-box { margin-bottom: 0; padding: 14px 16px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0; }
    .notes-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: #94A3B8; letter-spacing: 0.8px; margin-bottom: 6px; }
    .notes-text { font-size: 0.875rem; color: #334155; line-height: 1.5; }
    .qr-box { text-align: center; border: 1px solid #E2E8F0; padding: 10px 14px; border-radius: 8px; background: #FFF; flex-shrink: 0; }
    .qr-caption { font-size: 0.65rem; color: #64748B; font-weight: 700; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { display: flex; justify-content: space-between; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 0.75rem; color: #94A3B8; }
    @media print {
      body { background: #ffffff !important; padding: 0 !important; }
      .no-print { display: none !important; }
      .page-container { border: none !important; box-shadow: none !important; padding: 10px !important; }
    }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <button class="btn-close" onclick="window.close()">Close Window</button>
  </div>

  <div class="page-container">
    <div class="header">
      <div>
        <div class="brand">Fortline CRM</div>
        <div class="brand-sub">Commercial Sales & Services Invoice</div>
      </div>
      <div style="text-align:right">
        <div class="inv-num">${inv.invoiceNumber}</div>
        <div><span class="status-badge">${inv.status}</span></div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-label">Billed To (Client / Customer)</div>
        <div class="meta-client">${inv.clientName}</div>
        ${inv.customerEmail ? `<div class="meta-detail">✉ ${inv.customerEmail}</div>` : ''}
        ${inv.customerPhone ? `<div class="meta-detail">📞 ${inv.customerPhone}</div>` : ''}
        ${inv.customerAddress ? `<div class="meta-detail">📍 ${inv.customerAddress}</div>` : ''}
      </div>
      <div class="meta-right">
        <div class="meta-label">Invoice Details</div>
        <div class="meta-detail"><strong>Issue Date:</strong> ${new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}</div>
        <div class="meta-detail"><strong>Due Date:</strong> ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Upon Receipt'}</div>
        <div class="meta-detail"><strong>Payment Terms:</strong> ${inv.paymentTerms || 'Net 30'}</div>
        ${inv.createdBy?.fullName ? `<div class="meta-detail"><strong>Sales Rep:</strong> ${inv.createdBy.fullName}</div>` : ''}
        ${inv.dealTitle ? `<div class="meta-detail"><strong>Deal Reference:</strong> ${inv.dealTitle}</div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.description || '—'}</td>
            <td>${item.quantity}</td>
            <td>Rs. ${Number(item.unitPrice || 0).toLocaleString()}</td>
            <td>Rs. ${Number(item.total || 0).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="totals-row"><span>Subtotal:</span><span>Rs. ${Number(inv.subtotal || inv.amount).toLocaleString()}</span></div>
        ${inv.tax > 0 ? `<div class="totals-row"><span>Tax (${inv.taxRate || 0}%):</span><span>+Rs. ${Number(inv.tax).toLocaleString()}</span></div>` : ''}
        ${inv.discount > 0 ? `<div class="totals-row"><span>Discount:</span><span>-Rs. ${Number(inv.discount).toLocaleString()}</span></div>` : ''}
        <div class="totals-final"><span>Total Amount Due:</span><span>Rs. ${Number(inv.amount).toLocaleString()}</span></div>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px;">
      ${inv.notes ? `
      <div class="notes-box" style="flex: 1;">
        <div class="notes-label">Notes &amp; Payment Instructions</div>
        <div class="notes-text">${inv.notes}</div>
      </div>` : '<div style="flex:1;"></div>'}
      ${qrSvgString ? `
      <div class="qr-box">
        ${qrSvgString}
        <div class="qr-caption">Scan to Verify</div>
      </div>` : ''}
    </div>

    <div class="footer">
      <span>Generated by Fortline CRM &middot; Commercial Sales Management</span>
      <span>Date: ${new Date().toLocaleDateString()}</span>
    </div>
  </div>

  <script>
    setTimeout(function() {
      try {
        window.focus();
        window.print();
      } catch(e) { console.error(e); }
    }, 400);
  <\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=800');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
    } else {
      alert('Please allow popups for this website to print/download invoice PDF.');
    }
  };

  // 1. Approve Invoice

  const handleApproveInvoice = async (inv) => {
    setActionLoading(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-manager/invoices/${inv._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Approved' })
      });
      if (response.ok && data.success) {
        setFeedbackMsg(`Invoice ${inv.invoiceNumber} has been approved and forwarded to Finance.`);
        if (previewInvoice?._id === inv._id) setPreviewInvoice(null);
        fetchInvoices();
      } else {
        setErrorMsg(data.message || 'Failed to approve invoice.');
      }
    } catch (e) {
      setErrorMsg('Server error approving invoice.');
    } finally {
      setActionLoading(false);
      setTimeout(() => { setFeedbackMsg(''); setErrorMsg(''); }, 4000);
    }
  };

  // 2. Open Reject Modal
  const openRejectModal = (inv) => {
    setRejectModalInvoice(inv);
    setRejectionReason('Price or billing terms require adjustment before client delivery.');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalInvoice) return;
    setActionLoading(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-manager/invoices/${rejectModalInvoice._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Rejected',
          rejectionReason: rejectionReason.trim() || 'Rejected by Sales Manager'
        })
      });
      if (response.ok && data.success) {
        setFeedbackMsg(`Invoice ${rejectModalInvoice.invoiceNumber} has been rejected.`);
        setRejectModalInvoice(null);
        if (previewInvoice?._id === rejectModalInvoice._id) setPreviewInvoice(null);
        fetchInvoices();
      } else {
        setErrorMsg(data.message || 'Failed to reject invoice.');
      }
    } catch (e) {
      setErrorMsg('Server error rejecting invoice.');
    } finally {
      setActionLoading(false);
      setTimeout(() => { setFeedbackMsg(''); setErrorMsg(''); }, 4000);
    }
  };

  // 3. Edit Invoice
  const openEditModal = (inv) => {
    const items = inv.items && inv.items.length > 0 ? inv.items : [
      { description: inv.dealTitle || 'Commercial Sales Services', quantity: 1, unitPrice: inv.amount, total: inv.amount }
    ];
    setEditInvoice({
      ...inv,
      items,
      taxRate: inv.taxRate || 0,
      discount: inv.discount || 0,
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
      issueDate: inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : ''
    });
  };

  const handleEditItemChange = (index, field, value) => {
    const updated = [...editInvoice.items];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(field === 'quantity' ? value : item.quantity) || 0;
      const u = Number(field === 'unitPrice' ? value : item.unitPrice) || 0;
      item.total = Number((q * u).toFixed(2));
    }
    updated[index] = item;
    const totals = recalculateTotals(updated, editInvoice.taxRate, editInvoice.discount);
    setEditInvoice(p => ({ ...p, items: updated, ...totals }));
  };

  const handleAddEditItem = () => {
    const updated = [...editInvoice.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }];
    const totals = recalculateTotals(updated, editInvoice.taxRate, editInvoice.discount);
    setEditInvoice(p => ({ ...p, items: updated, ...totals }));
  };

  const handleRemoveEditItem = (index) => {
    if (editInvoice.items.length <= 1) return;
    const updated = editInvoice.items.filter((_, i) => i !== index);
    const totals = recalculateTotals(updated, editInvoice.taxRate, editInvoice.discount);
    setEditInvoice(p => ({ ...p, items: updated, ...totals }));
  };

  const handleSaveEditInvoice = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-manager/invoices/${editInvoice._id}`, {
        method: 'PATCH',
        body: JSON.stringify(editInvoice)
      });
      if (response.ok && data.success) {
        setFeedbackMsg(`Invoice ${editInvoice.invoiceNumber} updated successfully.`);
        setEditInvoice(null);
        fetchInvoices();
      } else {
        setErrorMsg(data.message || 'Failed to update invoice.');
      }
    } catch (e) {
      setErrorMsg('Server error updating invoice.');
    } finally {
      setActionLoading(false);
      setTimeout(() => { setFeedbackMsg(''); setErrorMsg(''); }, 4000);
    }
  };

  // 4. Delete Invoice
  const handleConfirmDelete = async () => {
    if (!deleteModalInvoice) return;
    setActionLoading(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-manager/invoices/${deleteModalInvoice._id}`, {
        method: 'DELETE'
      });
      if (response.ok && data.success) {
        setFeedbackMsg(`Invoice ${deleteModalInvoice.invoiceNumber} deleted from database.`);
        setDeleteModalInvoice(null);
        fetchInvoices();
      } else {
        setErrorMsg(data.message || 'Failed to delete invoice.');
      }
    } catch (e) {
      setErrorMsg('Server error deleting invoice.');
    } finally {
      setActionLoading(false);
      setTimeout(() => { setFeedbackMsg(''); setErrorMsg(''); }, 4000);
    }
  };

  // Metrics
  const totalTeamInvoiced = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const pendingReviewCount = invoices.filter(i => i.status === 'Pending Review' || i.status === 'Submitted').length;
  const approvedCount = invoices.filter(i => i.status === 'Approved').length;
  const rejectedCount = invoices.filter(i => i.status === 'Rejected').length;
  const paidCount = invoices.filter(i => i.status === 'Paid').length;
  const paidAmount = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.amount || 0), 0);

  const statuses = ['all', 'Pending Review', 'Approved', 'Rejected', 'Draft', 'Sent', 'Paid', 'Overdue'];

  return (
    <div className="sv-container">
      {/* Header */}
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><FileText size={22} color="#2563EB" /> Sales Team Invoices & Billing Management</h2>
          <p className="sv-subtitle">Review, edit, approve, and oversee all invoices submitted by sales team members</p>
        </div>
        {feedbackMsg && (
          <div style={{ background: '#ECFDF5', color: '#065F46', padding: '8px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem' }}>
            {feedbackMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '8px 16px', borderRadius: '8px', border: '1px solid #FECACA', fontWeight: 600, fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="sv-grid-4">
        <div className="sv-target-card" style={{ borderLeft: '4px solid #2563EB' }}>
          <span className="sv-ts-label">Total Team Invoiced</span>
          <span className="sv-ts-value">Rs. {totalTeamInvoiced.toLocaleString()}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{invoices.length} invoices across sales team</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #F59E0B' }}>
          <span className="sv-ts-label">Pending Manager Review</span>
          <span className="sv-ts-value" style={{ color: '#D97706' }}>{pendingReviewCount}</span>
          <span style={{ fontSize: '0.78rem', color: '#D97706' }}>Requires manager action</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #10B981' }}>
          <span className="sv-ts-label">Approved Invoices</span>
          <span className="sv-ts-value" style={{ color: '#059669' }}>{approvedCount}</span>
          <span style={{ fontSize: '0.78rem', color: '#059669' }}>Synced with Finance</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #EF4444' }}>
          <span className="sv-ts-label">Rejected / Needs Revision</span>
          <span className="sv-ts-value" style={{ color: '#DC2626' }}>{rejectedCount}</span>
          <span style={{ fontSize: '0.78rem', color: '#DC2626' }}>Returned to sales member</span>
        </div>
      </div>

      {/* Filters: Search, Status Tabs, Employee Select */}
      <div className="sv-filters">
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="sv-search-box">
            <Search size={15} />
            <input
              placeholder="Search invoice #, customer, deal, or creator..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            value={selectedMember}
            onChange={e => setSelectedMember(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.85rem', color: '#334155' }}
          >
            <option value="all">All Sales Team Members</option>
            {teamMembers.map(m => (
              <option key={m._id} value={m._id}>{m.fullName} ({m.position || 'Sales'})</option>
            ))}
          </select>
        </div>

        <div className="sv-status-tabs">
          {statuses.map(s => (
            <button key={s} className={`sv-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'All Invoices' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="sv-loading">Loading Invoices...</div>
      ) : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer / Client</th>
                <th>Created By (Sales Member)</th>
                <th>Deal Reference</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th style={{ textAlign: 'center' }}>Manager Review & Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="sv-empty">
                    No team invoices found matching your selected filters.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => {
                  const style = INVOICE_STATUS_STYLES[inv.status] || { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
                  const creatorName = inv.createdBy?.fullName || 'Sales Member';
                  const initials = creatorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <tr key={inv._id}>
                      <td className="sv-name">
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563EB' }}>
                          {inv.invoiceNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{inv.clientName}</div>
                        {inv.customerEmail && (
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{inv.customerEmail}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#3B82F6', color: '#FFF', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1E293B' }}>{creatorName}</div>
                            <div style={{ fontSize: '0.725rem', color: '#64748B' }}>{inv.createdBy?.position || 'Sales Rep'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ color: '#334155', fontWeight: 500 }}>
                          {inv.dealTitle || inv.dealId?.title || inv.saleReference || 'Direct Sale'}
                        </div>
                      </td>
                      <td className="sv-amount">Rs. {Number(inv.amount || 0).toLocaleString()}</td>
                      <td>
                        <span className="sv-badge" style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                          {inv.status}
                        </span>
                        {inv.status === 'Rejected' && inv.rejectionReason && (
                          <div style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: '2px', maxWidth: '140px' }} title={inv.rejectionReason}>
                            Reason: {inv.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td>{new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}</td>
                      <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {/* View Preview */}
                          <button
                            className="sv-btn-action-icon"
                            onClick={() => setPreviewInvoice(inv)}
                            title="View Full Invoice"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Quick Approve */}
                          {inv.status !== 'Approved' && inv.status !== 'Paid' && (
                            <button
                              className="sv-btn-action-icon sv-btn-action-approve"
                              onClick={() => handleApproveInvoice(inv)}
                              disabled={actionLoading}
                              title="Approve Invoice"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}

                          {/* Quick Reject */}
                          {inv.status !== 'Rejected' && inv.status !== 'Paid' && (
                            <button
                              className="sv-btn-action-icon sv-btn-action-reject"
                              onClick={() => openRejectModal(inv)}
                              disabled={actionLoading}
                              title="Reject Invoice"
                            >
                              <XCircle size={15} />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            className="sv-btn-action-icon"
                            onClick={() => openEditModal(inv)}
                            title="Edit Invoice"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            className="sv-btn-action-icon"
                            onClick={() => setDeleteModalInvoice(inv)}
                            title="Delete Invoice"
                            style={{ color: '#EF4444' }}
                          >
                            <Trash2 size={14} />
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

      {/* Hidden print target */}
      <div id="invoice-print-root" aria-hidden="true" />

      {/* VIEW & REVIEW INVOICE PREVIEW MODAL */}
      {previewInvoice && (
        <div className="sv-modal-overlay" onClick={() => setPreviewInvoice(null)}>
          <div className="sv-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#2563EB" />
                <h3 style={{ margin: 0 }}>Review Invoice ({previewInvoice.invoiceNumber})</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleDownloadPDF(previewInvoice)}
                  disabled={pdfLoading}
                  title="Download PDF"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '7px',
                    background: '#1E3A5F', color: '#fff', border: 'none',
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <Download size={14} /> {pdfLoading ? 'Preparing...' : 'Download PDF'}
                </button>
                <button onClick={() => setPreviewInvoice(null)}><X size={18} /></button>
              </div>
            </div>

            <div style={{ maxHeight: '76vh', overflowY: 'auto', padding: '4px' }}>
              
              {/* Creator & Reviewer Banner */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>SUBMITTED BY</span>
                  <strong style={{ color: '#0F172A' }}>{previewInvoice.createdBy?.fullName || 'Sales Member'}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}> ({previewInvoice.createdBy?.email})</span>
                </div>
                {previewInvoice.reviewedBy && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>REVIEWED BY</span>
                    <strong style={{ color: '#059669' }}>{previewInvoice.reviewedBy?.fullName || 'Sales Manager'}</strong>
                    {previewInvoice.reviewedAt && (
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {new Date(previewInvoice.reviewedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tax Invoice Details Card */}
              <div className="sv-invoice-preview-card">
                <div className="sv-inv-top-bar">
                  <div>
                    <div className="sv-inv-brand-title">Fortline CRM</div>
                    <div style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '4px' }}>
                      Commercial Sales Invoice
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="sv-inv-number">{previewInvoice.invoiceNumber}</div>
                    <div style={{ marginTop: '6px' }}>
                      <span className="sv-badge" style={{
                        backgroundColor: INVOICE_STATUS_STYLES[previewInvoice.status]?.bg || '#F1F5F9',
                        color: INVOICE_STATUS_STYLES[previewInvoice.status]?.color || '#475569',
                        border: `1px solid ${INVOICE_STATUS_STYLES[previewInvoice.status]?.border || '#CBD5E1'}`
                      }}>
                        {previewInvoice.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sv-inv-grid-2">
                  <div>
                    <div className="sv-inv-meta-label">Billed To</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                      {previewInvoice.clientName}
                    </div>
                    {previewInvoice.customerEmail && (
                      <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                        {previewInvoice.customerEmail}
                      </div>
                    )}
                    {previewInvoice.customerPhone && (
                      <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                        {previewInvoice.customerPhone}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="sv-inv-meta-label">Invoice Meta</div>
                    <div className="sv-inv-meta-value">
                      <strong>Issue Date:</strong> {new Date(previewInvoice.issueDate || previewInvoice.createdAt).toLocaleDateString()}
                    </div>
                    <div className="sv-inv-meta-value">
                      <strong>Due Date:</strong> {previewInvoice.dueDate ? new Date(previewInvoice.dueDate).toLocaleDateString() : 'Upon Receipt'}
                    </div>
                    <div className="sv-inv-meta-value">
                      <strong>Payment Terms:</strong> {previewInvoice.paymentTerms || 'Net 30'}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="sv-inv-items-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th style={{ textAlign: 'center', width: '60px' }}>Qty</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Unit Price</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(previewInvoice.items && previewInvoice.items.length > 0 ? previewInvoice.items : [
                      { description: previewInvoice.dealTitle || 'Commercial Sales Services', quantity: 1, unitPrice: previewInvoice.amount, total: previewInvoice.amount }
                    ]).map((item, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{item.description}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>Rs. {Number(item.unitPrice || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {Number(item.total || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="sv-inv-summary-box">
                  <div className="sv-inv-summary-row">
                    <span>Subtotal:</span>
                    <span>Rs. {Number(previewInvoice.subtotal || previewInvoice.amount).toLocaleString()}</span>
                  </div>
                  {previewInvoice.tax > 0 && (
                    <div className="sv-inv-summary-row">
                      <span>Tax ({previewInvoice.taxRate || 0}%):</span>
                      <span>+Rs. {Number(previewInvoice.tax).toLocaleString()}</span>
                    </div>
                  )}
                  {previewInvoice.discount > 0 && (
                    <div className="sv-inv-summary-row">
                      <span>Discount:</span>
                      <span>-Rs. {Number(previewInvoice.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="sv-inv-summary-total">
                    <span>Total Amount:</span>
                    <span>Rs. {Number(previewInvoice.amount).toLocaleString()}</span>
                  </div>
                </div>

                {/* QR Code & Notes Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginTop: '18px', flexWrap: 'wrap' }}>
                  {previewInvoice.notes ? (
                    <div style={{ flex: 1, minWidth: '220px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Notes & Instructions
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                        {previewInvoice.notes}
                      </div>
                    </div>
                  ) : <div style={{ flex: 1 }}></div>}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 14px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <QRCodeSVG
                      value={`INVOICE: ${previewInvoice.invoiceNumber}\nCUSTOMER: ${previewInvoice.clientName}\nAMOUNT: PKR ${Number(previewInvoice.amount || 0).toLocaleString()}\nREFERENCE: ${previewInvoice.dealTitle || previewInvoice.saleReference || 'Direct'}\nDATE: ${new Date(previewInvoice.issueDate || previewInvoice.createdAt).toLocaleDateString()}`}
                      size={84}
                      level="M"
                    />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Scan to Verify
                    </span>
                  </div>
                </div>
              </div>

              {/* Manager Actions inside Preview */}
              <div className="sv-modal-actions" style={{ marginTop: '18px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="sv-btn-cancel" onClick={() => setPreviewInvoice(null)}>
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(previewInvoice)}
                    disabled={pdfLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: '8px',
                      background: '#1E3A5F', color: '#fff', border: 'none',
                      fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <Download size={14} /> {pdfLoading ? 'Preparing...' : 'Download PDF'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {previewInvoice.status !== 'Rejected' && (
                    <button
                      type="button"
                      className="sv-btn-cancel"
                      onClick={() => openRejectModal(previewInvoice)}
                      style={{ color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2' }}
                    >
                      <XCircle size={15} /> Reject Invoice
                    </button>
                  )}
                  {previewInvoice.status !== 'Approved' && previewInvoice.status !== 'Paid' && (
                    <button
                      type="button"
                      className="sv-btn-primary"
                      onClick={() => handleApproveInvoice(previewInvoice)}
                      disabled={actionLoading}
                      style={{ background: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CheckCircle2 size={15} />
                      {actionLoading ? 'Approving...' : '✓ Approve & Sync to Finance'}
                    </button>
                  )}
                  {(previewInvoice.status === 'Approved' || previewInvoice.status === 'Paid') && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600,
                      background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0'
                    }}>
                      <CheckCircle2 size={14} /> Synced with Finance
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalInvoice && (
        <div className="sv-modal-overlay" onClick={() => setRejectModalInvoice(null)}>
          <div className="sv-modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={20} color="#DC2626" />
                <h3 style={{ margin: 0 }}>Reject Invoice ({rejectModalInvoice.invoiceNumber})</h3>
              </div>
              <button onClick={() => setRejectModalInvoice(null)}><X size={18} /></button>
            </div>

            <div className="sv-form">
              <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 12px 0' }}>
                Provide a reason for rejecting this invoice. The sales team member (<strong>{rejectModalInvoice.createdBy?.fullName || 'Sales Member'}</strong>) will be notified to revise the invoice.
              </p>

              <div className="sv-field">
                <label>Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Specify what needs to be changed (e.g. incorrect price, discount missing, terms)..."
                  required
                />
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setRejectModalInvoice(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="sv-btn-primary"
                  onClick={handleConfirmReject}
                  disabled={actionLoading}
                  style={{ background: '#DC2626' }}
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT INVOICE MODAL */}
      {editInvoice && (
        <div className="sv-modal-overlay" onClick={() => setEditInvoice(null)}>
          <div className="sv-modal" style={{ maxWidth: '820px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} color="#2563EB" />
                <h3 style={{ margin: 0 }}>Edit Invoice ({editInvoice.invoiceNumber})</h3>
              </div>
              <button onClick={() => setEditInvoice(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveEditInvoice} className="sv-form" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              
              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Customer Name *</label>
                  <input
                    value={editInvoice.clientName}
                    onChange={e => setEditInvoice(p => ({ ...p, clientName: e.target.value }))}
                    required
                  />
                </div>
                <div className="sv-field">
                  <label>Invoice Status</label>
                  <select
                    value={editInvoice.status}
                    onChange={e => setEditInvoice(p => ({ ...p, status: e.target.value }))}
                  >
                    {['Draft', 'Pending Review', 'Approved', 'Rejected', 'Sent', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Customer Email</label>
                  <input
                    type="email"
                    value={editInvoice.customerEmail || ''}
                    onChange={e => setEditInvoice(p => ({ ...p, customerEmail: e.target.value }))}
                  />
                </div>
                <div className="sv-field">
                  <label>Customer Phone</label>
                  <input
                    value={editInvoice.customerPhone || ''}
                    onChange={e => setEditInvoice(p => ({ ...p, customerPhone: e.target.value }))}
                  />
                </div>
              </div>

              {/* Line Items */}
              <div style={{ margin: '14px 0 10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                    Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEditItem}
                    style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Add Item
                  </button>
                </div>

                {editInvoice.items.map((item, idx) => (
                  <div key={idx} className="sv-line-item-row">
                    <input
                      placeholder="Description"
                      value={item.description}
                      onChange={e => handleEditItemChange(idx, 'description', e.target.value)}
                      style={{ padding: '8px 10px', fontSize: '0.825rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => handleEditItemChange(idx, 'quantity', e.target.value)}
                      style={{ padding: '8px 10px', fontSize: '0.825rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={e => handleEditItemChange(idx, 'unitPrice', e.target.value)}
                      style={{ padding: '8px 10px', fontSize: '0.825rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                    />
                    <div style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A', fontSize: '0.85rem', textAlign: 'right' }}>
                      ${Number(item.total || 0).toLocaleString()}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEditItem(idx)}
                      disabled={editInvoice.items.length <= 1}
                      style={{ background: 'transparent', border: 'none', color: editInvoice.items.length <= 1 ? '#CBD5E1' : '#EF4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', margin: '14px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B' }}>Subtotal</label>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>${Number(editInvoice.subtotal || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B' }}>Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      value={editInvoice.taxRate || 0}
                      onChange={e => {
                        const taxRate = Number(e.target.value);
                        const totals = recalculateTotals(editInvoice.items, taxRate, editInvoice.discount);
                        setEditInvoice(p => ({ ...p, taxRate, ...totals }));
                      }}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B' }}>Discount (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      value={editInvoice.discount || 0}
                      onChange={e => {
                        const discount = Number(e.target.value);
                        const totals = recalculateTotals(editInvoice.items, editInvoice.taxRate, discount);
                        setEditInvoice(p => ({ ...p, discount, ...totals }));
                      }}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #CBD5E1', paddingTop: '8px' }}>
                  <strong>Total Amount:</strong>
                  <strong style={{ color: '#2563EB', fontSize: '1.2rem' }}>${Number(editInvoice.amount || 0).toLocaleString()}</strong>
                </div>
              </div>

              {/* Dates & Notes */}
              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={editInvoice.dueDate}
                    onChange={e => setEditInvoice(p => ({ ...p, dueDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="sv-field">
                  <label>Payment Terms</label>
                  <input
                    value={editInvoice.paymentTerms || ''}
                    onChange={e => setEditInvoice(p => ({ ...p, paymentTerms: e.target.value }))}
                  />
                </div>
              </div>

              <div className="sv-field">
                <label>Notes & Instructions</label>
                <textarea
                  rows={2}
                  value={editInvoice.notes || ''}
                  onChange={e => setEditInvoice(p => ({ ...p, notes: e.target.value }))}
                />
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setEditInvoice(null)}>
                  Cancel
                </button>
                <button type="submit" className="sv-btn-primary" disabled={actionLoading}>
                  <Save size={15} /> {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteModalInvoice && (
        <div className="sv-modal-overlay" onClick={() => setDeleteModalInvoice(null)}>
          <div className="sv-modal" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={20} color="#EF4444" />
                <h3 style={{ margin: 0 }}>Delete Invoice</h3>
              </div>
              <button onClick={() => setDeleteModalInvoice(null)}><X size={18} /></button>
            </div>

            <div className="sv-form">
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 16px 0' }}>
                Are you sure you want to permanently delete invoice <strong>{deleteModalInvoice.invoiceNumber}</strong> for <strong>{deleteModalInvoice.clientName}</strong>?
              </p>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setDeleteModalInvoice(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="sv-btn-primary"
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                  style={{ background: '#EF4444' }}
                >
                  {actionLoading ? 'Deleting...' : 'Delete Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
