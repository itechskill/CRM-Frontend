import React, { useState, useEffect, useCallback } from 'react';
import ReactDOMServer from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest } from '../../utils/api';
import { 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  AlertTriangle, 
  X, 
  Save, 
  Eye, 
  Trash2, 
  DollarSign, 
  Send, 
  CheckCircle2, 
  XCircle,
  Building,
  Mail,
  Phone,
  Calendar,
  Layers,
  Printer,
  Download,
  Edit2
} from 'lucide-react';
import './SalesViews.css';

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

const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: 0, total: 0 };

const EMPTY_FORM = {
  dealId: '',
  dealTitle: '',
  saleReference: '',
  clientName: '',
  customerEmail: '',
  customerPhone: '',
  customerAddress: '',
  paymentTerms: 'Net 30',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  items: [{ description: 'Sales Deal Services / Deliverable', quantity: 1, unitPrice: 0, total: 0 }],
  subtotal: 0,
  taxRate: 0,
  tax: 0,
  discount: 0,
  amount: 0,
  notes: 'Payment is due according to the agreed terms. Thank you for your business!',
  description: '',
  status: 'Pending Review'
};

export default function SalesInvoicesView() {
  const [invoices, setInvoices] = useState([]);
  const [eligibleWonSales, setEligibleWonSales] = useState({ deals: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // View / Preview Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search.trim()) params.set('search', search.trim());
      const { response, data } = await apiRequest(`/api/sales-employee/invoices?${params}`);
      if (response.ok && data.success) {
        setInvoices(data.data || []);
        if (data.eligibleWonSales) {
          setEligibleWonSales(data.eligibleWonSales);
        }
      }
    } catch (e) {
      console.error('Fetch invoices error:', e);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Recalculate invoice totals when items, tax, or discount changes
  const recalculateTotals = (itemsList, taxRatePct, discountVal) => {
    const subtotal = itemsList.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    const tax = Number(((subtotal * (Number(taxRatePct) || 0)) / 100).toFixed(2));
    const discount = Number(Number(discountVal) || 0);
    const amount = Math.max(0, Number((subtotal + tax - discount).toFixed(2)));
    return { subtotal, tax, amount };
  };

  const openCreate = () => {
    const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const initialItems = [{ description: 'Sales Deal Services / Deliverable', quantity: 1, unitPrice: 0, total: 0 }];
    const totals = recalculateTotals(initialItems, 0, 0);

    setForm({
      ...EMPTY_FORM,
      dueDate: defaultDueDate,
      items: initialItems,
      ...totals
    });
    setEditInvoice(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (inv) => {
    const items = inv.items && inv.items.length > 0 ? inv.items : [
      { description: inv.dealTitle || 'Commercial Sales Services', quantity: 1, unitPrice: inv.amount, total: inv.amount }
    ];
    setForm({
      dealId: inv.dealId?._id || inv.dealId || '',
      dealTitle: inv.dealTitle || '',
      saleReference: inv.saleReference || '',
      clientName: inv.clientName || '',
      customerEmail: inv.customerEmail || '',
      customerPhone: inv.customerPhone || '',
      customerAddress: inv.customerAddress || '',
      paymentTerms: inv.paymentTerms || 'Net 30',
      issueDate: inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
      items: items.map(it => ({
        description: it.description || '',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        total: it.total || (Number(it.quantity || 1) * Number(it.unitPrice || 0))
      })),
      subtotal: inv.subtotal || inv.amount,
      taxRate: inv.taxRate || 0,
      tax: inv.tax || 0,
      discount: inv.discount || 0,
      amount: inv.amount || 0,
      notes: inv.notes || '',
      description: inv.description || '',
      status: inv.status === 'Rejected' ? 'Pending Review' : inv.status
    });
    setEditInvoice(inv);
    setError('');
    setShowModal(true);
  };

  // Handle selecting an eligible completed/won deal
  const handleSelectWonDeal = (e) => {
    const dealId = e.target.value;
    if (!dealId) {
      setForm(p => ({
        ...p,
        dealId: '',
        dealTitle: '',
        saleReference: ''
      }));
      return;
    }

    const selectedDeal = eligibleWonSales.deals.find(d => d._id === dealId);
    if (selectedDeal) {
      const dealValue = Number(selectedDeal.value) || 0;
      const newItems = [{
        description: selectedDeal.title || 'Deal Fulfillment Services',
        quantity: 1,
        unitPrice: dealValue,
        total: dealValue
      }];
      const totals = recalculateTotals(newItems, form.taxRate, form.discount);

      setForm(p => ({
        ...p,
        dealId: selectedDeal._id,
        dealTitle: selectedDeal.title,
        saleReference: `DEAL-${selectedDeal.title.substring(0, 10)}`,
        clientName: selectedDeal.clientName || p.clientName,
        customerEmail: selectedDeal.contactEmail || p.customerEmail,
        customerPhone: selectedDeal.contactPhone || p.customerPhone,
        items: newItems,
        description: selectedDeal.description || p.description,
        ...totals
      }));
    }
  };

  // Line Items Handlers
  const handleItemChange = (index, field, value) => {
    const updated = [...form.items];
    const item = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(field === 'quantity' ? value : item.quantity) || 0;
      const u = Number(field === 'unitPrice' ? value : item.unitPrice) || 0;
      item.total = Number((q * u).toFixed(2));
    }

    updated[index] = item;
    const totals = recalculateTotals(updated, form.taxRate, form.discount);
    setForm(p => ({ ...p, items: updated, ...totals }));
  };

  const handleAddItem = () => {
    const updated = [...form.items, { ...EMPTY_ITEM }];
    const totals = recalculateTotals(updated, form.taxRate, form.discount);
    setForm(p => ({ ...p, items: updated, ...totals }));
  };

  const handleRemoveItem = (index) => {
    if (form.items.length <= 1) return;
    const updated = form.items.filter((_, i) => i !== index);
    const totals = recalculateTotals(updated, form.taxRate, form.discount);
    setForm(p => ({ ...p, items: updated, ...totals }));
  };

  const handleTaxRateChange = (taxRate) => {
    const totals = recalculateTotals(form.items, taxRate, form.discount);
    setForm(p => ({ ...p, taxRate: Number(taxRate), ...totals }));
  };

  const handleDiscountChange = (discount) => {
    const totals = recalculateTotals(form.items, form.taxRate, discount);
    setForm(p => ({ ...p, discount: Number(discount), ...totals }));
  };

  const handleSaveInvoice = async (submitForReview = true) => {
    if (!form.clientName.trim()) {
      setError('Customer / Client name is required.');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please add valid line items with prices.');
      return;
    }
    if (!form.dueDate) {
      setError('Payment due date is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        subtotal: Number(form.subtotal),
        tax: Number(form.tax),
        taxRate: Number(form.taxRate),
        discount: Number(form.discount),
        status: submitForReview ? 'Pending Review' : (editInvoice ? form.status : 'Draft')
      };

      const url = editInvoice ? `/api/sales-employee/invoices/${editInvoice._id}` : '/api/sales-employee/invoices';
      const method = editInvoice ? 'PATCH' : 'POST';

      const { response, data } = await apiRequest(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (response.ok && data.success) {
        setShowModal(false);
        setFeedback(editInvoice ? `Invoice ${editInvoice.invoiceNumber} updated successfully.` : 'Invoice submitted successfully.');
        setTimeout(() => setFeedback(''), 3500);
        fetchInvoices();
      } else {
        setError(data.message || 'Failed to save invoice.');
      }
    } catch (e) {
      setError('Server error saving invoice.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/invoices/${deleteTarget._id}`, { method: 'DELETE' });
      if (response.ok && data.success) {
        setFeedback(`Invoice ${deleteTarget.invoiceNumber} deleted.`);
        setDeleteTarget(null);
        fetchInvoices();
        setTimeout(() => setFeedback(''), 3000);
      } else {
        setFeedback(data.message || 'Failed to delete invoice.');
      }
    } catch (e) {
      setFeedback('Server error deleting invoice.');
    } finally {
      setDeleting(false);
    }
  };

  const openPreview = (inv) => {
    setSelectedInvoice(inv);
    setShowPreviewModal(true);
  };

  // PDF Download — generates complete, styled printable document
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

  // KPIs
  const totalInvoiced = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const pendingReviewInvoices = invoices.filter(i => i.status === 'Pending Review' || i.status === 'Submitted');
  const approvedInvoices = invoices.filter(i => i.status === 'Approved');
  const paidInvoices = invoices.filter(i => i.status === 'Paid');
  const paidAmount = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const overdueInvoices = invoices.filter(i => (i.status === 'Overdue' || (i.dueDate && new Date(i.dueDate) < new Date())) && i.status !== 'Paid' && i.status !== 'Cancelled');
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);

  const statuses = ['all', 'Pending Review', 'Approved', 'Draft', 'Sent', 'Paid', 'Rejected', 'Overdue'];

  return (
    <div className="sv-container">
      {/* Header */}
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><FileText size={22} color="#2563EB" /> Invoices & Billing Management</h2>
          <p className="sv-subtitle">Create invoices from won sales/deals, submit to Sales Manager for review, and track billing</p>
        </div>
        <button className="sv-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Create Invoice from Sale
        </button>
      </div>

      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '14px' }}>
          {feedback}
        </div>
      )}

      {/* KPI Cards */}
      <div className="sv-grid-4">
        <div className="sv-target-card" style={{ borderLeft: '4px solid #2563EB' }}>
          <span className="sv-ts-label">Total Invoiced</span>
          <span className="sv-ts-value">Rs. {totalInvoiced.toLocaleString()}</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{invoices.length} invoices generated</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #F59E0B' }}>
          <span className="sv-ts-label">Pending Manager Review</span>
          <span className="sv-ts-value" style={{ color: '#D97706' }}>{pendingReviewInvoices.length}</span>
          <span style={{ fontSize: '0.78rem', color: '#D97706' }}>Awaiting manager sign-off</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #10B981' }}>
          <span className="sv-ts-label">Approved Invoices</span>
          <span className="sv-ts-value" style={{ color: '#059669' }}>{approvedInvoices.length}</span>
          <span style={{ fontSize: '0.78rem', color: '#059669' }}>Synced with Finance</span>
        </div>
        <div className="sv-target-card" style={{ borderLeft: '4px solid #14B8A6' }}>
          <span className="sv-ts-label">Paid / Collected</span>
          <span className="sv-ts-value" style={{ color: '#0D9488' }}>Rs. {paidAmount.toLocaleString()}</span>
          <span style={{ fontSize: '0.78rem', color: overdueAmount > 0 ? '#DC2626' : '#64748B' }}>
            {overdueAmount > 0 ? `Overdue: Rs. ${overdueAmount.toLocaleString()}` : `${paidInvoices.length} settled`}
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="sv-filters">
        <div className="sv-search-box">
          <Search size={15} />
          <input 
            placeholder="Search by invoice #, client, deal, or reference..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="sv-status-tabs">
          {statuses.map(s => (
            <button key={s} className={`sv-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'All Invoices' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Table */}
      {loading ? (
        <div className="sv-loading">Loading Invoices...</div>
      ) : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer / Client</th>
                <th>Deal / Sale Reference</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="sv-empty">
                    No invoices found. Click <strong>"Create Invoice from Sale"</strong> to create an invoice for a won deal.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => {
                  const style = INVOICE_STATUS_STYLES[inv.status] || { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
                  const canEditOrDelete = inv.status !== 'Approved' && inv.status !== 'Paid';

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
                        <div style={{ color: '#334155', fontWeight: 500 }}>
                          {inv.dealTitle || inv.dealId?.title || inv.saleReference || 'Direct Sale'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                          {inv.items?.length || 1} line item(s)
                        </span>
                      </td>
                      <td className="sv-amount">Rs. {Number(inv.amount || 0).toLocaleString()}</td>
                      <td>{new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}</td>
                      <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
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
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button 
                            className="sv-btn-action-icon" 
                            onClick={() => openPreview(inv)}
                            title="View & Preview Tax Invoice"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="sv-btn-action-icon"
                            onClick={() => handleDownloadPDF(inv)}
                            title="Download / Print PDF"
                            style={{ color: '#2563EB' }}
                          >
                            <Download size={14} />
                          </button>
                          {canEditOrDelete && (
                            <>
                              <button
                                className="sv-btn-action-icon"
                                onClick={() => openEdit(inv)}
                                title="Edit Invoice"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="sv-btn-action-icon"
                                onClick={() => setDeleteTarget(inv)}
                                title="Delete Invoice"
                                style={{ color: '#EF4444' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
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

      {/* CREATE / EDIT INVOICE MODAL */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '820px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#2563EB" />
                <h3 style={{ margin: 0 }}>{editInvoice ? `Edit Invoice (${editInvoice.invoiceNumber})` : 'Create Sales Invoice'}</h3>
              </div>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {error && <div className="sv-error">{error}</div>}

            <div className="sv-form" style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
              
              {/* 1. SELECT COMPLETED SALE / WON DEAL (Only for new) */}
              {!editInvoice && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Select Completed / Won Deal (Auto-Populate Data)
                  </label>
                  <select 
                    value={form.dealId} 
                    onChange={handleSelectWonDeal}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Choose Won Deal (Or Enter Details Manually) --</option>
                    {eligibleWonSales.deals.map(deal => (
                      <option key={deal._id} value={deal._id}>
                        {deal.title} — {deal.clientName || 'Client'} (Rs. {Number(deal.value || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 2. CUSTOMER DETAILS */}
              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Customer / Client Name *</label>
                  <input
                    value={form.clientName}
                    onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))}
                    placeholder="Company or individual"
                    required
                  />
                </div>
                <div className="sv-field">
                  <label>Sale Reference / Deal Title</label>
                  <input
                    value={form.saleReference}
                    onChange={e => setForm(p => ({ ...p, saleReference: e.target.value }))}
                    placeholder="e.g. Enterprise License Deal"
                  />
                </div>
              </div>

              <div className="sv-grid-3">
                <div className="sv-field">
                  <label>Customer Email</label>
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={e => setForm(p => ({ ...p, customerEmail: e.target.value }))}
                    placeholder="finance@client.com"
                  />
                </div>
                <div className="sv-field">
                  <label>Customer Phone</label>
                  <input
                    value={form.customerPhone}
                    onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))}
                    placeholder="+92 300 0000000"
                  />
                </div>
                <div className="sv-field">
                  <label>Billing Address</label>
                  <input
                    value={form.customerAddress}
                    onChange={e => setForm(p => ({ ...p, customerAddress: e.target.value }))}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              {/* 3. LINE ITEMS */}
              <div style={{ margin: '14px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                    Invoice Line Items ({form.items.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      color: '#2563EB',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {form.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr 36px', gap: '8px', alignItems: 'center' }}>
                      <input
                        placeholder="Item Description"
                        value={item.description}
                        onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        style={{ padding: '8px 10px', fontSize: '0.825rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                        required
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        style={{ padding: '8px 10px', fontSize: '0.825rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Unit Price (PKR)"
                        value={item.unitPrice}
                        onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                        style={{ padding: '8px 10px', fontSize: '0.825rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                      />
                      <div style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A', fontSize: '0.85rem', textAlign: 'right' }}>
                        Rs. {Number(item.total || 0).toLocaleString()}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(idx)}
                        disabled={form.items.length <= 1}
                        style={{ background: 'transparent', border: 'none', color: form.items.length <= 1 ? '#CBD5E1' : '#EF4444', cursor: form.items.length <= 1 ? 'not-allowed' : 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. TOTALS & CALCULATIONS */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', margin: '14px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>Subtotal</label>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                      Rs. {Number(form.subtotal || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.taxRate}
                      onChange={e => handleTaxRateChange(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>Discount (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.discount}
                      onChange={e => handleDiscountChange(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #CBD5E1', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Final Total Amount Due:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563EB' }}>
                    Rs. {Number(form.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 5. DATES & PAYMENT TERMS */}
              <div className="sv-grid-3">
                <div className="sv-field">
                  <label>Invoice Date *</label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="sv-field">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="sv-field">
                  <label>Payment Terms</label>
                  <select 
                    value={form.paymentTerms} 
                    onChange={e => setForm(p => ({ ...p, paymentTerms: e.target.value }))}
                  >
                    <option value="Immediate">Due Upon Receipt</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                  </select>
                </div>
              </div>

              {/* 6. NOTES */}
              <div className="sv-field">
                <label>Billing Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Wire transfer instructions, client reference, or remarks..."
                />
              </div>

              {/* ACTIONS */}
              <div className="sv-modal-actions" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="sv-btn-cancel" 
                    disabled={saving}
                    onClick={() => handleSaveInvoice(false)}
                    style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}
                  >
                    Save as Draft
                  </button>
                  <button 
                    type="button" 
                    className="sv-btn-primary" 
                    disabled={saving}
                    onClick={() => handleSaveInvoice(true)}
                  >
                    <Send size={15} /> {saving ? 'Saving...' : (editInvoice ? 'Update & Submit' : 'Submit to Sales Manager')}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DELETE INVOICE MODAL */}
      {deleteTarget && (
        <div className="sv-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="sv-modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={18} color="#EF4444" />
                <h3 style={{ margin: 0 }}>Delete Invoice</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className="sv-form">
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 16px' }}>
                Are you sure you want to delete invoice <strong>{deleteTarget.invoiceNumber}</strong> for <strong>{deleteTarget.clientName}</strong>? This action cannot be undone.
              </p>
              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="sv-btn-primary" onClick={handleDeleteInvoice} disabled={deleting} style={{ background: '#EF4444' }}>
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW / PRINT INVOICE PREVIEW MODAL */}
      {showPreviewModal && selectedInvoice && (
        <div className="sv-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#2563EB" />
                <h3 style={{ margin: 0 }}>Invoice Preview ({selectedInvoice.invoiceNumber})</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  title="Download / Print PDF"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '7px',
                    background: '#1E3A5F', color: '#fff', border: 'none',
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <Download size={14} /> Download PDF
                </button>
                <button onClick={() => setShowPreviewModal(false)}><X size={18} /></button>
              </div>
            </div>

            <div style={{ maxHeight: '76vh', overflowY: 'auto', padding: '4px' }}>
              
              {/* Rejection / Approval Alerts */}
              {selectedInvoice.status === 'Rejected' && (
                <div className="sv-inv-rejection-alert">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Invoice Rejected by Sales Manager</strong>
                    <div style={{ marginTop: '2px' }}>
                      Reason: {selectedInvoice.rejectionReason || 'Please review items and re-submit.'}
                    </div>
                  </div>
                </div>
              )}

              {selectedInvoice.status === 'Approved' && (
                <div className="sv-inv-approval-alert">
                  <CheckCircle2 size={18} color="#059669" />
                  <div>
                    <strong>Approved by Sales Manager</strong>
                    <div style={{ fontSize: '0.8rem', color: '#065F46' }}>
                      This invoice is validated and synced with the Finance / Accounting department.
                    </div>
                  </div>
                </div>
              )}

              {/* Tax Invoice Formatted Card */}
              <div className="sv-invoice-preview-card">
                <div className="sv-inv-top-bar">
                  <div>
                    <div className="sv-inv-brand-title">Fortline CRM</div>
                    <div style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '4px' }}>
                      Commercial Sales & Services Invoice
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="sv-inv-number">{selectedInvoice.invoiceNumber}</div>
                    <div style={{ marginTop: '6px' }}>
                      <span className="sv-badge" style={{
                        backgroundColor: INVOICE_STATUS_STYLES[selectedInvoice.status]?.bg || '#F1F5F9',
                        color: INVOICE_STATUS_STYLES[selectedInvoice.status]?.color || '#475569',
                        border: `1px solid ${INVOICE_STATUS_STYLES[selectedInvoice.status]?.border || '#CBD5E1'}`
                      }}>
                        {selectedInvoice.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sv-inv-grid-2">
                  <div>
                    <div className="sv-inv-meta-label">Billed To</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                      {selectedInvoice.clientName}
                    </div>
                    {selectedInvoice.customerEmail && (
                      <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                        {selectedInvoice.customerEmail}
                      </div>
                    )}
                    {selectedInvoice.customerPhone && (
                      <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                        {selectedInvoice.customerPhone}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="sv-inv-meta-label">Invoice Details</div>
                    <div className="sv-inv-meta-value">
                      <strong>Issue Date:</strong> {new Date(selectedInvoice.issueDate || selectedInvoice.createdAt).toLocaleDateString()}
                    </div>
                    <div className="sv-inv-meta-value">
                      <strong>Due Date:</strong> {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'Upon Receipt'}
                    </div>
                    <div className="sv-inv-meta-value">
                      <strong>Terms:</strong> {selectedInvoice.paymentTerms || 'Net 30'}
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
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
                    {(selectedInvoice.items && selectedInvoice.items.length > 0 ? selectedInvoice.items : [
                      { description: selectedInvoice.dealTitle || 'Commercial Sales Services', quantity: 1, unitPrice: selectedInvoice.amount, total: selectedInvoice.amount }
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

                {/* Calculations Summary */}
                <div className="sv-inv-summary-box">
                  <div className="sv-inv-summary-row">
                    <span>Subtotal:</span>
                    <span>Rs. {Number(selectedInvoice.subtotal || selectedInvoice.amount).toLocaleString()}</span>
                  </div>
                  {selectedInvoice.tax > 0 && (
                    <div className="sv-inv-summary-row">
                      <span>Tax ({selectedInvoice.taxRate || 0}%):</span>
                      <span>+Rs. {Number(selectedInvoice.tax).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedInvoice.discount > 0 && (
                    <div className="sv-inv-summary-row">
                      <span>Discount:</span>
                      <span>-Rs. {Number(selectedInvoice.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="sv-inv-summary-total">
                    <span>Total Due:</span>
                    <span>Rs. {Number(selectedInvoice.amount).toLocaleString()}</span>
                  </div>
                </div>

                {/* QR Code & Notes Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginTop: '18px', flexWrap: 'wrap' }}>
                  {selectedInvoice.notes ? (
                    <div style={{ flex: 1, minWidth: '220px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Notes & Payment Instructions
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                        {selectedInvoice.notes}
                      </div>
                    </div>
                  ) : <div style={{ flex: 1 }}></div>}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 14px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <QRCodeSVG
                      value={`INVOICE: ${selectedInvoice.invoiceNumber}\nCUSTOMER: ${selectedInvoice.clientName}\nAMOUNT: PKR ${Number(selectedInvoice.amount || 0).toLocaleString()}\nREFERENCE: ${selectedInvoice.dealTitle || selectedInvoice.saleReference || 'Direct'}\nDATE: ${new Date(selectedInvoice.issueDate || selectedInvoice.createdAt).toLocaleDateString()}`}
                      size={84}
                      level="M"
                    />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Scan to Verify
                    </span>
                  </div>
                </div>
              </div>

              <div className="sv-modal-actions" style={{ marginTop: '16px', justifyContent: 'space-between' }}>
                <button type="button" className="sv-btn-cancel" onClick={() => setShowPreviewModal(false)}>
                  Close
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(selectedInvoice)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: '8px',
                      background: '#1E3A5F', color: '#fff', border: 'none',
                      fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <Download size={15} /> Download PDF
                  </button>
                  {selectedInvoice.status !== 'Approved' && selectedInvoice.status !== 'Paid' && (
                    <button
                      type="button"
                      className="sv-btn-primary"
                      onClick={() => {
                        setShowPreviewModal(false);
                        openEdit(selectedInvoice);
                      }}
                    >
                      <Edit2 size={14} /> Edit Invoice
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
