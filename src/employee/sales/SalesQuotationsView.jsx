import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../../utils/api';
import {
  Plus,
  FileText,
  Edit2,
  X,
  Save,
  Eye,
  Trash2,
  Search,
  Calendar,
  User,
  Hash,
  Tag,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  FileCheck,
  Layers,
  Info,
  Building,
  Download,
  LayoutGrid,
  List,
  Clock,
  TrendingUp,
  Sparkles,
  Package,
  Percent,
  Minus,
  FileSpreadsheet
} from 'lucide-react';
import './SalesViews.css';
import { CUSTOMER_PO_ATTACHMENT_ACCEPT, readCustomerPOAttachment } from './customerPOAttachment';
import { getUser } from '../../utils/authStorage';
import { DOCUMENT_TYPES, companiesFor, companyName } from '../../utils/companies';
import { drawSalesDocumentHeader, getClientContactLayout, getDocumentIssuerName } from '../../utils/salesDocumentPdfLayout';
import { downloadQuotationPdf, DEFAULT_TERMS } from '../../utils/quotationPdf';
import { buildQuotationPayload, calculateQuotationFinancials, quotationGrandTotal } from '../../utils/quotationFinancials';

const STATUS_COLORS = {
  Quotation: '#2563EB',
  Draft: '#64748B',
  Sent: '#0284C7',
  'Under Review': '#8B5CF6',
  Accepted: '#10B981',
  'Converted to Sales Order': '#059669',
  Converted: '#059669',
  Rejected: '#EF4444',
  Expired: '#F59E0B'
};

const EMPTY_FORM = {
  issuingCompanyCode: '',
  orderReference: '',
  clientName: '',
  clientAddress: '',
  salePerson: '',
  fileNo: '',
  productSummary: '',
  clientEmail: '',
  clientPhone: '',
  items: [
    { inventoryItem: null, inventorySearch: '', sku: '', partNumber: '', description: '', quantity: 1, unitPrice: 0, total: 0 }
  ],
  totalAmount: 0,
  discount: 0,
  discountPercentage: 0,
  tax: 0,
  taxPercentage: 18,
  netAmount: 0,
  currency: DEFAULT_TERMS.currency,
  reference: '',
  availability: DEFAULT_TERMS.availability,
  paymentTerms: DEFAULT_TERMS.paymentTerms,
  priceValidity: DEFAULT_TERMS.priceValidity,
  commercialNote: DEFAULT_TERMS.commercialNote,
  status: 'Quotation',
  creationDate: '',
  validUntil: '',
  notes: ''
};

export default function SalesQuotationsView() {
  const currentUser = getUser();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [showModal, setShowModal] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [viewQ, setViewQ] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [recordingPO, setRecordingPO] = useState(false);
  const [convertingId, setConvertingId] = useState(null);
  const [forwardQuote, setForwardQuote] = useState(null);
  const [forwardTargets, setForwardTargets] = useState([]);
  const [forwardTargetId, setForwardTargetId] = useState('');
  const [forwardNote, setForwardNote] = useState('');
  const [forwarding, setForwarding] = useState(false);
  const [inventoryOptions, setInventoryOptions] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchQ = useCallback(async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/quotations');
      if (response.ok && data.success) {
        setQuotations(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQ();
  }, [fetchQ]);

  useEffect(() => {
    if (!showModal) return;
    let cancelled = false;
    apiRequest('/api/sales-employee/inventory').then(({ response, data }) => {
      if (!cancelled && response.ok && data.success) setInventoryOptions(data.data || []);
    });
    return () => { cancelled = true; };
  }, [showModal]);

  const openForward = async (quote) => {
    setError('');
    const { response, data } = await apiRequest('/api/sales-employee/quotations/forward-targets');
    if (!response.ok || !data.success) {
      setFeedback(data.message || 'You do not have permission to forward quotations.');
      return;
    }
    setForwardTargets(data.data || []);
    setForwardTargetId('');
    setForwardNote('');
    setForwardQuote(quote);
  };

  const submitForward = async (event) => {
    event.preventDefault();
    if (!forwardQuote || !forwardTargetId) return;
    setForwarding(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/quotations/${forwardQuote._id}/forward`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId: forwardTargetId, note: forwardNote })
      });
      if (!response.ok || !data.success) {
        setError(data.message || 'Could not forward quotation.');
        return;
      }
      setForwardQuote(null);
      setFeedback(data.message || 'Quotation forwarded.');
      await fetchQ();
    } finally {
      setForwarding(false);
    }
  };

  const [poModalQuote, setPoModalQuote] = useState(null);
  const [poNumberInput, setPoNumberInput] = useState('');
  const [poDateInput, setPoDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [poNotesInput, setPoNotesInput] = useState('');
  const [poUploadedDocument, setPoUploadedDocument] = useState('');
  const [poDocumentName, setPoDocumentName] = useState('');
  const [convertingToPO, setConvertingToPO] = useState(false);

  // Real KPI calculations - strictly adhering to Pending Workflow Model
  // Active quotations exclude converted records (to Sales Order or Customer PO)
  const activeQuotes = useMemo(() => quotations.filter(q => q.status !== 'Converted to Sales Order' && q.status !== 'Converted' && q.status !== 'Converted to Customer PO'), [quotations]);
  const activeValue = useMemo(() => activeQuotes.reduce((sum, q) => sum + (Number(q.netAmount !== undefined ? q.netAmount : (q.totalAmount || 0))), 0), [activeQuotes]);

  const convertedQuotes = useMemo(() => quotations.filter(q => q.status === 'Converted to Sales Order' || q.status === 'Converted' || q.status === 'Converted to Customer PO'), [quotations]);
  const convertedValue = useMemo(() => convertedQuotes.reduce((sum, q) => sum + (Number(q.netAmount !== undefined ? q.netAmount : (q.totalAmount || 0))), 0), [convertedQuotes]);

  const acceptedQuotes = useMemo(() => quotations.filter(q => q.status === 'Accepted'), [quotations]);
  const acceptedValue = useMemo(() => acceptedQuotes.reduce((sum, q) => sum + (Number(q.netAmount !== undefined ? q.netAmount : (q.totalAmount || 0))), 0), [acceptedQuotes]);

  const pendingQuotes = useMemo(() => quotations.filter(q => ['Quotation', 'Draft', 'Sent', 'Under Review'].includes(q.status)), [quotations]);
  const pendingValue = useMemo(() => pendingQuotes.reduce((sum, q) => sum + (Number(q.netAmount !== undefined ? q.netAmount : (q.totalAmount || 0))), 0), [pendingQuotes]);

  const totalVolume = useMemo(() => quotations.reduce((sum, q) => sum + (Number(q.netAmount !== undefined ? q.netAmount : (q.totalAmount || 0))), 0), [quotations]);
  const avgValue = useMemo(() => activeQuotes.length ? Math.round(activeValue / activeQuotes.length) : 0, [activeValue, activeQuotes.length]);
  const conversionRate = useMemo(() => quotations.length ? ((convertedQuotes.length / quotations.length) * 100).toFixed(1) : '0.0', [convertedQuotes.length, quotations.length]);

  // Convert Quotation to Customer PO handler
  const handleOpenConvertToPO = (quote) => {
    setPoModalQuote(quote);
    setPoNumberInput('');
    setPoDateInput(new Date().toISOString().split('T')[0]);
    setPoNotesInput('');
    setPoUploadedDocument('');
    setPoDocumentName('');
    setError('');
  };

  const handlePOAttachmentChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const attachment = await readCustomerPOAttachment(file);
      setPoUploadedDocument(attachment.uploadedDocument);
      setPoDocumentName(attachment.documentName);
      setError('');
    } catch (err) {
      e.target.value = '';
      setPoUploadedDocument('');
      setPoDocumentName('');
      setError(err.message);
    }
  };

  const handleConfirmConvertToPO = async (e) => {
    e.preventDefault();
    if (!poModalQuote) return;
    if (!poUploadedDocument || !poDocumentName) {
      setError('Attach the Customer PO as a PDF, Excel file, or screenshot.');
      return;
    }
    setConvertingToPO(true);
    setError('');
    setFeedback('');
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/quotations/${poModalQuote._id}/convert-to-po`, {
        method: 'POST',
        body: JSON.stringify({
          poNumber: poNumberInput,
          poDate: poDateInput,
          notes: poNotesInput,
          uploadedDocument: poUploadedDocument,
          documentName: poDocumentName
        })
      });
      if (response.ok && data.success) {
        setFeedback(data.message || 'Quotation successfully converted to Customer PO!');
        setQuotations(prev => prev.map(q => q._id === poModalQuote._id ? {
          ...q,
          status: 'Converted to Customer PO',
          customerPOId: data.data?.po?._id
        } : q));
        setPoModalQuote(null);
        setTimeout(() => setFeedback(''), 4000);
      } else {
        setError(data.message || 'Failed to convert quotation to Customer PO.');
      }
    } catch (e) {
      setError(e.message || 'Error converting quotation to Customer PO.');
    } finally {
      setConvertingToPO(false);
    }
  };

  // Convert Quotation to Sales Order handler (removes quotation from active list instantly)
  const handleConvertToOrder = async (quote) => {
    if (convertingId) return;
    setConvertingId(quote._id);
    setError('');
    setFeedback('');
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/quotations/${quote._id}/convert-to-order`, {
        method: 'POST'
      });
      if (response.ok && data.success) {
        setFeedback(data.message || 'Quotation successfully converted to Sales Order!');
        setQuotations(prev => prev.map(q => q._id === quote._id ? {
          ...q,
          status: 'Converted to Sales Order',
          salesOrderId: data.data?.order?._id,
          salesOrderNumber: data.data?.order?.orderNumber
        } : q));
        if (viewQ && viewQ._id === quote._id) {
          setViewQ({
            ...viewQ,
            status: 'Converted to Sales Order',
            salesOrderId: data.data?.order?._id,
            salesOrderNumber: data.data?.order?.orderNumber
          });
        }
      } else {
        setError(data.message || 'Failed to convert quotation to Sales Order.');
      }
    } catch (e) {
      setError(e.message || 'Error converting quotation to Sales Order.');
    } finally {
      setConvertingId(null);
    }
  };

  // Comprehensive search matching exact PDF columns and status filters
  const filteredQuotations = useMemo(() => {
    let list = quotations;
    if (filter === 'active') {
      list = list.filter(q => q.status !== 'Converted to Sales Order' && q.status !== 'Converted' && q.status !== 'Converted to Customer PO');
    } else if (filter === 'converted') {
      list = list.filter(q => q.status === 'Converted to Sales Order' || q.status === 'Converted' || q.status === 'Converted to Customer PO');
    } else if (filter === 'pending') {
      list = list.filter(q => ['Quotation', 'Draft', 'Sent', 'Under Review'].includes(q.status));
    } else if (filter === 'accepted' || filter === 'Accepted') {
      list = list.filter(q => q.status === 'Accepted');
    } else if (filter !== 'all') {
      list = list.filter(q => q.status === filter);
    }

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(q =>
      (q.orderReference && q.orderReference.toLowerCase().includes(term)) ||
      (q.quotationNumber && q.quotationNumber.toLowerCase().includes(term)) ||
      (q.clientName && q.clientName.toLowerCase().includes(term)) ||
      (q.customerName && q.customerName.toLowerCase().includes(term)) ||
      (q.salePerson && q.salePerson.toLowerCase().includes(term)) ||
      (q.createdBy?.fullName && q.createdBy.fullName.toLowerCase().includes(term)) ||
      (q.productSummary && q.productSummary.toLowerCase().includes(term)) ||
      (q.fileNo && q.fileNo.toLowerCase().includes(term))
    );
  }, [quotations, filter, searchTerm]);

  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage) || 1;
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuotations.slice(start, start + itemsPerPage);
  }, [filteredQuotations, currentPage, itemsPerPage]);

  /**
   * Universal Financial Recalculation Engine
   * Handles subtotal, discount percentage/amount, tax percentage/amount, and complete net total.
   */
  const recalculateForm = (items, _currentDiscountPct, currentDiscountAmt, currentTaxPct) =>
    calculateQuotationFinancials({
      items,
      discount: currentDiscountAmt === '' || currentDiscountAmt === null ? 0 : currentDiscountAmt,
      taxPercentage: currentTaxPct === '' || currentTaxPct === null ? 0 : currentTaxPct
    });

  const openCreate = () => {
    const today = new Date().toISOString().substring(0, 10);
    setForm({
      ...EMPTY_FORM,
      salePerson: currentUser?.fullName || '',
      creationDate: today,
      discount: 0,
      discountPercentage: 0,
      tax: 0,
      taxPercentage: 18,
      totalAmount: 0,
      netAmount: 0,
      items: [{ inventoryItem: null, inventorySearch: '', sku: '', partNumber: '', description: '', quantity: 1, unitPrice: 0, total: 0 }]
    });
    setEditQ(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (q) => {
    let rawItems = [];
    if (q.items && q.items.length > 0) {
      rawItems = q.items.map(it => {
        const qty = Math.max(1, Number(it.quantity) || 1);
        const unitP = Number(it.unitPrice) || 0;
        const lineTotal = Number(it.total !== undefined ? it.total : qty * unitP);
        return {
          inventoryItem: it.inventoryItem?._id || it.inventoryItem || null,
          inventorySearch: '',
          sku: it.sku || '',
          partNumber: it.partNumber || '',
          description: it.description || '',
          quantity: qty,
          unitPrice: unitP,
          total: lineTotal
        };
      });
    } else {
      const initialTotal = Number(q.totalAmount || q.netAmount || 0);
      rawItems = [{
        inventoryItem: null,
        inventorySearch: '',
        sku: '', partNumber: '',
        description: q.productSummary || '',
        quantity: 1,
        unitPrice: initialTotal,
        total: initialTotal
      }];
    }

    const calculatedSubtotal = rawItems.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    const discountVal = Number(q.discount) || 0;
    const discountPct = q.discountPercentage !== undefined && q.discountPercentage !== null 
      ? Number(q.discountPercentage)
      : (calculatedSubtotal > 0 && discountVal > 0 ? Math.round(((discountVal / calculatedSubtotal) * 100) * 100) / 100 : 0);
    
    const taxableBase = Math.max(0, calculatedSubtotal - discountVal);
    const taxVal = Number(q.tax) || 0;
    const taxPct = q.taxPercentage !== undefined && q.taxPercentage !== null
      ? Number(q.taxPercentage)
      : (taxableBase > 0 && taxVal > 0 ? Math.round(((taxVal / taxableBase) * 100) * 100) / 100 : (calculatedSubtotal > 0 && taxVal > 0 ? Math.round(((taxVal / calculatedSubtotal) * 100) * 100) / 100 : 0));
      
    const calculatedNet = Math.max(0, Math.round((calculatedSubtotal - discountVal + taxVal) * 100) / 100);

    setForm({
      issuingCompanyCode: q.issuingCompany?.code || '',
      orderReference: q.orderReference || q.quotationNumber || '',
      clientName: q.clientName || q.customerName || '',
      clientAddress: q.clientAddress || '',
      salePerson: q.salePerson || q.createdBy?.fullName || '',
      fileNo: q.fileNo || '',
      productSummary: q.productSummary || '',
      clientEmail: q.clientEmail || '',
      clientPhone: q.clientPhone || '',
      items: rawItems,
      totalAmount: calculatedSubtotal,
      discount: discountVal,
      discountPercentage: discountPct,
      tax: taxVal,
      taxPercentage: taxPct,
      netAmount: q.netAmount !== undefined ? Number(q.netAmount) : calculatedNet,
      currency: q.currency || DEFAULT_TERMS.currency,
      reference: q.reference || '',
      availability: q.availability || DEFAULT_TERMS.availability,
      paymentTerms: q.paymentTerms || DEFAULT_TERMS.paymentTerms,
      priceValidity: q.priceValidity || DEFAULT_TERMS.priceValidity,
      commercialNote: q.commercialNote || DEFAULT_TERMS.commercialNote,
      status: q.status || 'Quotation',
      creationDate: q.creationDate ? new Date(q.creationDate).toISOString().substring(0, 10) : '',
      validUntil: q.validUntil ? new Date(q.validUntil).toISOString().substring(0, 10) : '',
      notes: q.notes || ''
    });
    setEditQ(q);
    setError('');
    setShowModal(true);
  };

  const handleItemChange = (index, field, value) => {
    setForm(prev => {
      const newItems = prev.items.map((it, idx) => {
        if (idx !== index) return it;
        const updated = { ...it };

        if (field === 'description' || field === 'sku') {
          updated[field] = value;
          if (field === 'description' || field === 'sku') updated.inventoryItem = null;
        } else if (field === 'quantity') {
          const parsedQty = value === '' ? '' : Math.max(1, parseInt(value, 10) || 1);
          updated.quantity = parsedQty;
          const currentPrice = Number(updated.unitPrice) || 0;
          updated.total = (typeof parsedQty === 'number' ? parsedQty : 1) * currentPrice;
        } else if (field === 'unitPrice') {
          const parsedPrice = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
          updated.unitPrice = parsedPrice;
          const currentQty = Math.max(1, parseInt(updated.quantity, 10) || 1);
          updated.total = currentQty * (typeof parsedPrice === 'number' ? parsedPrice : 0);
        }

        return updated;
      });

      const financials = recalculateForm(
        newItems,
        prev.discountPercentage,
        prev.discount,
        prev.taxPercentage,
        prev.tax,
        'items'
      );
      const summary = newItems.map(it => it.description).filter(Boolean).join(', ');

      return {
        ...prev,
        items: newItems,
        ...financials,
        productSummary: summary || prev.productSummary
      };
    });
  };

  const handleInventoryPickerChange = (index, value) => {
    const match = inventoryOptions.find(item => {
      const label = `${item.name}${item.sku ? ` [${item.sku}]` : ''}`;
      return label === value || item.name === value || (item.sku && item.sku === value);
    });
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => itemIndex === index ? {
        ...item,
        inventorySearch: value,
        inventoryItem: match?._id || null,
        sku: match ? (match.sku || '') : item.sku,
        partNumber: match ? (match.partNumber || '') : item.partNumber,
        description: match ? (match.description || match.name || '') : item.description
      } : item)
    }));
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

  const stepTaxPct = (delta) => {
    const current = Number(form.taxPercentage) || 0;
    const nextVal = Math.max(0, Math.min(100, Math.round((current + delta) * 10) / 10));
    handleTaxPctChange(nextVal);
  };

  const handleAddItem = () => {
    setForm(prev => {
      const newItems = [...prev.items, { inventoryItem: null, inventorySearch: '', sku: '', partNumber: '', description: '', quantity: 1, unitPrice: 0, total: 0 }];
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
      const summary = newItems.map(it => it.description).filter(Boolean).join(', ');

      return {
        ...prev,
        items: newItems,
        ...financials,
        productSummary: summary
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.clientName.trim()) {
      setError('Customer / Client name is required.');
      return;
    }
    if (!editQ && !form.issuingCompanyCode) {
      setError('Select an issuing company.');
      return;
    }
    // Validate items
    const invalidItem = form.items.find(it => !it.description || !it.description.trim());
    if (invalidItem) {
      setError('Please provide a description for all product items.');
      return;
    }

    const cleanedItems = form.items.map(it => {
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      const unitP = Math.max(0, parseFloat(it.unitPrice) || 0);
      return {
        inventoryItem: it.inventoryItem || null,
        sku: String(it.sku || '').trim(),
        partNumber: String(it.partNumber || '').trim(),
        description: it.description.trim(),
        quantity: qty,
        unitPrice: unitP,
        total: qty * unitP
      };
    });

    setSaving(true);
    setError('');
    try {
      const payload = buildQuotationPayload({ ...form, items: cleanedItems });
      if (editQ && !payload.issuingCompanyCode) delete payload.issuingCompanyCode;
      const url = editQ ? `/api/sales-employee/quotations/${editQ._id}` : '/api/sales-employee/quotations';
      const method = editQ ? 'PATCH' : 'POST';
      const { response, data } = await apiRequest(url, { method, body: JSON.stringify(payload) });
      if (response.ok && data.success) {
        setShowModal(false);
        fetchQ();
      } else {
        setError(data.message || 'Failed to save quotation.');
      }
    } catch (e) {
      setError('Server error.');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordCustomerPO = async (q) => {
    setRecordingPO(true);
    try {
      const completeAmt = Number(q.netAmount !== undefined ? q.netAmount : (q.totalAmount || 0));
      const poPayload = {
        customerName: q.clientName || q.customerName,
        quotationId: q._id,
        quotationNumber: q.orderReference || q.quotationNumber,
        amount: completeAmt,
        notes: `Customer PO against Quotation: ${q.orderReference || q.quotationNumber} (Complete Amount: Rs. ${completeAmt.toLocaleString()} PKR)`,
        status: 'Received'
      };
      const { response, data } = await apiRequest('/api/sales-employee/customer-pos', {
        method: 'POST',
        body: JSON.stringify(poPayload)
      });
      if (response.ok && data.success) {
        await apiRequest(`/api/sales-employee/quotations/${q._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'Accepted' })
        });
        setFeedback(`Customer PO "${data.data.poNumber}" recorded and linked to Quotation!`);
        setViewQ(null);
        fetchQ();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        setFeedback(data.message || 'Failed to record Customer PO.');
      }
    } catch (e) {
      setFeedback('Error recording customer PO.');
    } finally {
      setRecordingPO(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/quotations/${deleteTarget._id}`, { method: 'DELETE' });
      if (response.ok && data.success) {
        setFeedback(`Quotation "${deleteTarget.orderReference || deleteTarget.quotationNumber}" deleted.`);
        setDeleteTarget(null);
        fetchQ();
        setTimeout(() => setFeedback(''), 3000);
      } else {
        setFeedback(data.message || 'Failed to delete quotation.');
      }
    } catch (e) {
      setFeedback('Server error.');
    } finally {
      setDeleting(false);
    }
  };

  const _handleDownloadSinglePDFLegacy = (q) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const orderRef = q.orderReference || q.quotationNumber || 'QUO-001';
    const customer = q.clientName || q.customerName || 'Client Organization';
    const salePerson = q.salePerson || q.createdBy?.fullName || 'Sales Executive';
    const issuerName = getDocumentIssuerName(q);
    const creationDate = q.creationDate ? new Date(q.creationDate).toLocaleDateString('en-GB') : (q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-GB') : '—');
    const validUntil = q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-GB') : '—';
    
    const subtotal = Number(q.totalAmount || 0);
    const discount = Number(q.discount || 0);
    const discountPct = q.discountPercentage !== undefined && q.discountPercentage !== null && Number(q.discountPercentage) > 0
      ? Number(q.discountPercentage)
      : (subtotal > 0 && discount > 0 ? Math.round(((discount / subtotal) * 100) * 10) / 10 : 0);
    const taxableBase = Math.max(0, subtotal - discount);
    const tax = Number(q.tax || 0);
    const taxPct = q.taxPercentage !== undefined && q.taxPercentage !== null && Number(q.taxPercentage) > 0
      ? Number(q.taxPercentage)
      : (taxableBase > 0 && tax > 0 ? Math.round(((tax / taxableBase) * 100) * 10) / 10 : (subtotal > 0 && tax > 0 ? Math.round(((tax / subtotal) * 100) * 10) / 10 : 0));
    const completeAmount = Number(q.netAmount !== undefined ? q.netAmount : (subtotal - discount + tax));

    drawSalesDocumentHeader(doc, {
      issuerName,
      subtitle: 'Commercial Sales & Operations Portal - Commercial Quotation Proposal',
      documentTitle: 'FORMAL QUOTATION',
      referenceLabel: 'Quote Ref',
      reference: orderRef
    });

    const contactLayout = getClientContactLayout(doc, {
      customer,
      email: q.clientEmail || '—',
      phone: q.clientPhone || '—',
      address: q.clientAddress || 'Direct Commercial Quotation'
    });

    // Customer & Quotation Details Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 44, 182, contactLayout.boxBottom - 44, 2.5, 2.5, 'FD');

    // Left Column: Customer Details
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('PROPOSED TO CLIENT:', 19, 52);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(contactLayout.customerLines, 19, contactLayout.customerY);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(contactLayout.contactLines, 19, contactLayout.contactY);
    doc.text(contactLayout.addressLines, 19, contactLayout.addressY);

    // Vertical Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.line(108, 48, 108, contactLayout.boxBottom - 4);

    // Right Column: Quotation Meta
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION PROPOSAL META:', 114, 52);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Sales Executive:', 114, 58);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(salePerson, 155, 58);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Issue Date:', 114, 70);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(creationDate, 155, 70);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Valid Until:', 114, 76);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(validUntil, 155, 76);

    const items = q.items && q.items.length ? q.items : [
      { description: q.productSummary || 'Scope of Supply Items', quantity: 1, unitPrice: subtotal || completeAmount, total: subtotal || completeAmount }
    ];

    const tableRows = items.map((it, idx) => {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const unitP = Number(it.unitPrice !== undefined ? it.unitPrice : (subtotal || completeAmount));
      const lineTotal = Number(it.total !== undefined ? it.total : qty * unitP);
      return [
        idx + 1,
        it.description || it.product || q.productSummary || 'Product Scope',
        qty,
        `Rs. ${unitP.toLocaleString()}`,
        `Rs. ${lineTotal.toLocaleString()}`
      ];
    });

    autoTable(doc, {
      startY: contactLayout.boxBottom + 6,
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      head: [['#', 'Item Description / Scope of Supply', 'Qty', 'Unit Price (PKR)', 'Total Amount (PKR)']],
      body: tableRows,
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

    // Terms & Conditions Box (Left, X=14, Width=100)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, finalY, 100, 42, 2, 2, 'FD');

    doc.setTextColor(30, 58, 138);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('COMMERCIAL TERMS & VALIDITY:', 18, finalY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.text(`• Status: ${q.status || 'Active Quotation'}`, 18, finalY + 14);
    doc.text(`• Currency: Pakistani Rupee (PKR)`, 18, finalY + 20);
    doc.text(`• Validity Period: Valid until ${validUntil}`, 18, finalY + 26);
    if (q.notes) {
      doc.text(`• Notes & Terms: ${q.notes}`, 18, finalY + 34, { maxWidth: 92 });
    }

    // Financial Breakdown Box (Right, X=118, Width=78)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(118, finalY, 78, 42, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Subtotal (Scope):', 122, finalY + 7);
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
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(122, finalY + 24, 70, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(4, 120, 87);
    doc.text('COMPLETE AMOUNT (PKR):', 126, finalY + 30);

    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${completeAmount.toLocaleString()}`, 188, finalY + 35, { align: 'right' });

    // Signature Block
    const sigY = 252;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);

    doc.line(14, sigY + 12, 75, sigY + 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Prepared By:', 14, sigY + 17);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Commercial Sales Representative', 14, sigY + 21);

    doc.line(135, sigY + 12, 196, sigY + 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Client Acceptance & Signature:', 135, sigY + 17);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Commercial Approval', 135, sigY + 21);

    // Document Footer Note
    doc.setDrawColor(241, 245, 249);
    doc.line(14, 280, 196, 280);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated via Fortline CRM • Official Commercial Quotation Proposal • System Generated', 105, 285, { align: 'center' });

    doc.save(`Quotation_${orderRef}.pdf`);
  };

  const handleDownloadSinglePDF = async (quotation) => {
    try {
      await downloadQuotationPdf(quotation);
    } catch (pdfError) {
      console.error(pdfError);
      setFeedback('Could not generate the quotation PDF.');
    }
  };

  // ── COMPLETE QUOTATIONS LEDGER EXPORT (PDF) ──
  const downloadCompleteQuotationsPDF = () => {
    const dataset = filteredQuotations.length > 0 ? filteredQuotations : quotations;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const nowStr = new Date().toLocaleDateString('en-GB');

    doc.setFillColor(15, 23, 42); // Navy
    doc.rect(0, 0, 297, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM — SALES QUOTATIONS MASTER LEDGER', 14, 12);

    const totalAmt = dataset.reduce((sum, q) => sum + quotationGrandTotal(q), 0);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${nowStr} | Total Records: ${dataset.length} | Grand Total Volume: Rs. ${totalAmt.toLocaleString()} PKR`, 14, 19);

    const rows = dataset.map((q, idx) => [
      idx + 1,
      q.orderReference || q.quotationNumber || '—',
      q.clientName || '—',
      q.customerPONumber || '—',
      q.orderDate ? new Date(q.orderDate).toLocaleDateString('en-GB') : '—',
      q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-GB') : '—',
      q.status || 'Draft',
      (q.items || []).length,
      `Rs. ${quotationGrandTotal(q).toLocaleString()}`
    ]);

    try {
      autoTable(doc, {
        startY: 28,
        head: [['#', 'Quotation #', 'Customer / Client', 'Customer PO #', 'Quote Date', 'Valid Until', 'Status', 'Items', 'Grand Total (PKR)']],
        body: rows,
        foot: [[
          { content: 'GRAND TOTAL / SUMMARY', colSpan: 8, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
          { content: `Rs. ${totalAmt.toLocaleString()}`, styles: { halign: 'left', fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [4, 120, 87] } }
        ]],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      doc.save(`Sales_Quotations_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Quotations PDF export error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // ── COMPLETE QUOTATIONS LEDGER EXPORT (EXCEL / CSV) ──
  const downloadCompleteQuotationsExcel = () => {
    const dataset = filteredQuotations.length > 0 ? filteredQuotations : quotations;
    const totalAmt = dataset.reduce((sum, q) => sum + quotationGrandTotal(q), 0);

    const headers = ['#', 'Quotation Reference', 'Client Name', 'Customer Email', 'Customer Phone', 'Customer PO #', 'Quotation Date', 'Valid Until', 'Status', 'Payment Terms', 'Subtotal', 'Tax Rate (%)', 'Tax (PKR)', 'Discount (PKR)', 'Total Amount (PKR)', 'Notes'];
    const rows = dataset.map((q, idx) => [
      idx + 1,
      `"${q.orderReference || q.quotationNumber || ''}"`,
      `"${(q.clientName || '').replace(/"/g, '""')}"`,
      `"${q.customerEmail || ''}"`,
      `"${q.customerPhone || ''}"`,
      `"${q.customerPONumber || ''}"`,
      `"${q.orderDate ? new Date(q.orderDate).toLocaleDateString('en-GB') : ''}"`,
      `"${q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-GB') : ''}"`,
      `"${q.status || 'Draft'}"`,
      `"${q.paymentTerms || 'Net 30'}"`,
      Number(q.totalAmount || 0),
      Number(q.taxPercentage || 0),
      Number(q.tax || 0),
      Number(q.discount || 0),
      quotationGrandTotal(q),
      `"${(q.notes || '').replace(/"/g, '""')}"`
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
      totalAmt,
      '""'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sales_Quotations_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statuses = ['all', 'Quotation', 'Draft', 'Sent', 'Under Review', 'Accepted', 'Rejected', 'Expired'];

  // Summary KPI values - pending workflow model
  const filterTabs = [
    { id: 'active', label: 'Active Quotations', count: activeQuotes.length },
    { id: 'converted', label: 'Converted to Orders', count: convertedQuotes.length },
    { id: 'all', label: 'All Quotations (History)', count: quotations.length },
    { id: 'pending', label: 'Pending Proposal', count: pendingQuotes.length },
    { id: 'accepted', label: 'Accepted PO', count: acceptedQuotes.length },
    { id: 'Draft', label: 'Draft', count: quotations.filter(q => q.status === 'Draft').length },
    { id: 'Sent', label: 'Sent', count: quotations.filter(q => q.status === 'Sent').length }
  ];

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><FileText size={20} color="#2563EB" /> Formal Sales Quotations</h2>
          <p className="sv-subtitle">Generate, manage, and convert commercial quotations with dynamic product quantities</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button className="sv-btn-secondary" onClick={downloadCompleteQuotationsPDF} title="Download Complete Quotations (PDF)">
            <Download size={15} color="#DC2626" /> Export PDF
          </button>
          <button className="sv-btn-secondary" onClick={downloadCompleteQuotationsExcel} title="Download Complete Quotations (Excel)">
            <FileSpreadsheet size={15} color="#059669" /> Export Excel
          </button>

          {/* View Mode Switcher */}
          <div style={{
            display: 'inline-flex',
            background: '#F1F5F9',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid #E2E8F0'
          }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'cards' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'cards' ? '#2563EB' : '#64748B',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <LayoutGrid size={14} /> Cards View
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'table' ? '#2563EB' : '#64748B',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <List size={14} /> Data Table
            </button>
          </div>

          <button className="sv-btn-primary" onClick={openCreate}><Plus size={16} /> New Quotation</button>
        </div>
      </div>

      {feedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#059669" /> {feedback}
        </div>
      )}

      {/* Modern KPI Cards Grid strictly adhering to Pending Workflow Model */}
      <div className="quote-kpi-grid">
        <div className="quote-kpi-card">
          <div className="quote-kpi-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <FileText size={22} />
          </div>
          <div className="quote-kpi-content">
            <div className="quote-kpi-label">Active Quotations</div>
            <div className="quote-kpi-value">{activeQuotes.length}</div>
            <div className="quote-kpi-sub">Rs. {activeValue.toLocaleString()} PKR Active Volume</div>
          </div>
        </div>

        <div className="quote-kpi-card">
          <div className="quote-kpi-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="quote-kpi-content">
            <div className="quote-kpi-label">Converted to Orders</div>
            <div className="quote-kpi-value" style={{ color: '#059669' }}>{convertedQuotes.length}</div>
            <div className="quote-kpi-sub">
              Rs. {convertedValue.toLocaleString()} PKR · {conversionRate}% Converted
            </div>
          </div>
        </div>

        <div className="quote-kpi-card">
          <div className="quote-kpi-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
            <Clock size={22} />
          </div>
          <div className="quote-kpi-content">
            <div className="quote-kpi-label">Pending Proposals</div>
            <div className="quote-kpi-value" style={{ color: '#7C3AED' }}>{pendingQuotes.length}</div>
            <div className="quote-kpi-sub">
              Rs. {pendingValue.toLocaleString()} PKR · Awaiting PO/SO
            </div>
          </div>
        </div>

        <div className="quote-kpi-card">
          <div className="quote-kpi-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
            <DollarSign size={22} />
          </div>
          <div className="quote-kpi-content">
            <div className="quote-kpi-label">Avg Active Value</div>
            <div className="quote-kpi-value" style={{ color: '#0F172A' }}>Rs. {avgValue.toLocaleString()}</div>
            <div className="quote-kpi-sub">PKR average commercial proposal</div>
          </div>
        </div>
      </div>

      <div className="sv-filters">
        <div className="sv-search-box">
          <Search size={15} />
          <input
            placeholder="Search quotations by ref#, customer, salesperson, product, file#..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="sv-status-tabs">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              className={`sv-tab ${filter === tab.id ? 'active' : ''}`}
              onClick={() => { setFilter(tab.id); setCurrentPage(1); }}
            >
              {tab.label} <span style={{ opacity: 0.75, fontSize: '0.72rem', marginLeft: '4px' }}>({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="sv-loading">Loading quotations...</div>
      ) : filteredQuotations.length === 0 ? (
        <div className="sv-table-wrap" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
          No quotations match your criteria.
        </div>
      ) : viewMode === 'cards' ? (
        /* ── CARDS VIEW WITH CLEAN WHITE BACKGROUND & SMOOTH TRANSITIONS ── */
        <div>
          <div className="quote-cards-grid">
            {paginatedQuotations.map(q => {
              const color = STATUS_COLORS[q.status] || '#64748B';
              const totalAmt = quotationGrandTotal(q);
              const itemCount = q.items && q.items.length ? q.items.length : 1;
              const dateStr = q.creationDate
                ? new Date(q.creationDate).toLocaleDateString('en-GB')
                : (q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-GB') : '—');

              return (
                <div key={q._id} className="quote-card" onClick={() => setViewQ(q)}>
                  {/* Card Header: Ref # & Status */}
                  <div className="quote-card-header">
                    <div className="quote-card-ref">
                      <FileText size={16} />
                      <span>{q.orderReference || q.quotationNumber}</span>
                    </div>
                    <span
                      className="sv-badge"
                      style={{
                        background: color + '18',
                        color: color,
                        border: `1px solid ${color}40`,
                        fontSize: '0.75rem',
                        padding: '3px 10px'
                      }}
                    >
                      {q.status}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h4 className="quote-card-client">
                      <Building size={16} color="#475569" />
                      <span>{q.clientName || q.customerName}</span>
                    </h4>
                    <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '3px' }}>Issuer: {companyName(q)}</div>
                    {q.isForwardedReadOnly && (
                      <div style={{ marginTop: '6px', color: '#B45309', fontSize: '0.75rem', fontWeight: 700 }}>
                        Forwarded to {q.owner?.fullName || 'another salesperson'} · Read-only
                      </div>
                    )}
                  </div>

                  {/* Meta tags */}
                  <div className="quote-card-meta-row">
                    <span className="quote-card-tag">
                      <User size={12} color="#64748B" />
                      {q.salePerson || q.createdBy?.fullName || 'Sales Rep'}
                    </span>
                    <span className="quote-card-tag">
                      <Calendar size={12} color="#64748B" />
                      {dateStr}
                    </span>
                  </div>

                  {/* Scope of Supply Box */}
                  <div className="quote-card-scope-box">
                    <div className="quote-card-scope-desc" title={q.productSummary || 'Scope of Supply'}>
                      {q.productSummary || (q.items && q.items[0]?.description) || 'Product Scope'}
                    </div>
                    {itemCount > 1 && (
                      <div style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 600, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Package size={12} /> {itemCount} product items included
                      </div>
                    )}
                  </div>

                  {/* Price Row */}
                  <div className="quote-card-price-row">
                    <div>
                      <div className="quote-card-price-label">Grand Total</div>
                      <div className="quote-card-price-val">
                        Rs. {totalAmt.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>PKR</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Action Buttons */}
                  <div className="quote-card-footer" onClick={e => e.stopPropagation()}>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {q.validUntil ? `Valid till: ${new Date(q.validUntil).toLocaleDateString('en-GB')}` : 'Ready for PO'}
                    </span>

                    <div className="quote-card-actions">
                      {!q.isForwardedReadOnly && q.status !== 'Converted to Customer PO' && q.status !== 'Converted to Sales Order' && q.status !== 'Converted' ? (
                        <button
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#059669',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(5,150,105,0.2)'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenConvertToPO(q);
                          }}
                          title="Convert Quotation to Customer Purchase Order (PO)"
                        >
                          <FileCheck size={13} /> Convert to PO
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: q.isForwardedReadOnly ? '#B45309' : '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle2 size={13} /> {q.isForwardedReadOnly ? `Forwarded to ${q.owner?.fullName || 'Sales'}` : (q.status === 'Converted to Customer PO' ? 'Converted to PO' : 'Converted')}
                        </span>
                      )}
                      <button
                        className="sv-btn-action-icon"
                        style={{ color: '#2563EB', background: '#EFF6FF' }}
                        onClick={() => handleDownloadSinglePDF(q)}
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        className="sv-btn-action-icon"
                        onClick={() => setViewQ(q)}
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      {!q.isForwardedReadOnly && (
                        <>
                          {q.status !== 'Converted to Customer PO' && q.status !== 'Converted to Sales Order' && q.status !== 'Converted' && (
                            <button className="sv-btn-action-icon" onClick={() => openForward(q)} title="Forward Quotation" style={{ color: '#7C3AED' }}><ArrowRight size={14} /></button>
                          )}
                          <button className="sv-btn-action-icon" onClick={() => openEdit(q)} title="Edit Quotation"><Edit2 size={14} /></button>
                          <button className="sv-btn-action-icon" onClick={() => setDeleteTarget(q)} title="Delete Quotation" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls for Cards */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px', marginTop: '12px' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredQuotations.length)} of {filteredQuotations.length} quotations
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '0.8rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '0.8rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── DATA TABLE VIEW ── */
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Order Ref #</th>
                <th>Creation Date</th>
                <th>Customer Name</th>
                <th>Issuing Company</th>
                <th>Sale Person</th>
                <th>Product Summary & Items</th>
                <th style={{ textAlign: 'right' }}>Total Amount (PKR)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQuotations.map(q => {
                const color = STATUS_COLORS[q.status] || '#64748B';
                const totalAmt = quotationGrandTotal(q);
                const itemCount = q.items && q.items.length ? q.items.length : 1;

                return (
                  <tr key={q._id}>
                    <td className="sv-name" style={{ fontWeight: 800, color: '#2563EB', whiteSpace: 'nowrap' }}>
                      {q.orderReference || q.quotationNumber}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: '#475569' }}>
                      {q.creationDate ? new Date(q.creationDate).toLocaleDateString('en-GB') : (q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-GB') : '—')}
                    </td>
                    <td style={{ fontWeight: 600, color: '#1E293B' }}>
                      {q.clientName || q.customerName}
                      {q.isForwardedReadOnly && <div style={{ color: '#B45309', fontSize: '0.7rem', marginTop: '3px' }}>Forwarded to {q.owner?.fullName || 'another salesperson'} · Read-only</div>}
                    </td>
                    <td style={{ color: '#475569' }}>{companyName(q)}</td>
                    <td style={{ color: '#475569' }}>
                      {q.salePerson || q.createdBy?.fullName || 'Sales Executive'}
                    </td>
                    <td style={{ maxWidth: '280px', color: '#334155' }}>
                      <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={q.productSummary}>
                        {q.productSummary || (q.items && q.items[0]?.description) || 'Product Scope'}
                      </div>
                      {itemCount > 1 && (
                        <div style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 600, marginTop: '2px' }}>
                          + {itemCount} itemized products
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 800, color: '#059669', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      Rs. {totalAmt.toLocaleString()}
                    </td>
                    <td>
                      <span
                        className="sv-badge"
                        style={{
                          background: color + '18',
                          color: color,
                          border: `1px solid ${color}40`,
                          fontSize: '0.75rem',
                          padding: '2px 8px'
                        }}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {!q.isForwardedReadOnly && q.status !== 'Converted to Customer PO' && q.status !== 'Converted to Sales Order' && q.status !== 'Converted' ? (
                          <button
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#059669',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '5px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            onClick={() => handleOpenConvertToPO(q)}
                            title="Convert Quotation to Customer PO"
                          >
                            <FileCheck size={12} /> Convert to PO
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                            {q.isForwardedReadOnly ? `Forwarded to ${q.owner?.fullName || 'Sales'}` : (q.status === 'Converted to Customer PO' ? 'Converted to PO' : 'Converted')}
                          </span>
                        )}
                        <button
                          className="sv-btn-action-icon"
                          style={{ color: '#2563EB', background: '#EFF6FF' }}
                          onClick={() => handleDownloadSinglePDF(q)}
                          title="Download Quotation PDF"
                        >
                          <Download size={14} />
                        </button>
                        <button className="sv-btn-action-icon" onClick={() => setViewQ(q)} title="View Details"><Eye size={14} /></button>
                        {!q.isForwardedReadOnly && (
                          <>
                            {q.status !== 'Converted to Customer PO' && q.status !== 'Converted to Sales Order' && q.status !== 'Converted' && (
                              <button className="sv-btn-action-icon" onClick={() => openForward(q)} title="Forward Quotation" style={{ color: '#7C3AED' }}><ArrowRight size={14} /></button>
                            )}
                            <button className="sv-btn-action-icon" onClick={() => openEdit(q)} title="Edit Quotation"><Edit2 size={14} /></button>
                            <button className="sv-btn-action-icon" onClick={() => setDeleteTarget(q)} title="Delete Quotation" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredQuotations.length)} of {filteredQuotations.length} records
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '0.8rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '0.8rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {forwardQuote && (
        <div className="sv-modal-overlay" onClick={() => setForwardQuote(null)}>
          <div className="sv-modal" style={{ maxWidth: '520px' }} onClick={(event) => event.stopPropagation()}>
            <div className="sv-modal-header">
              <h3 style={{ margin: 0 }}>Forward {forwardQuote.orderReference || forwardQuote.quotationNumber}</h3>
              <button type="button" onClick={() => setForwardQuote(null)}><X size={18} /></button>
            </div>
            <form onSubmit={submitForward} className="sv-form">
              {error && <div className="sv-error">{error}</div>}
              <div className="sv-field">
                <label>Active Sales account *</label>
                <select value={forwardTargetId} onChange={(event) => setForwardTargetId(event.target.value)} required>
                  <option value="">Select salesperson</option>
                  {forwardTargets.map((target) => <option key={target._id} value={target._id}>{target.fullName} — {target.email}</option>)}
                </select>
              </div>
              <div className="sv-field">
                <label>Note (optional)</label>
                <textarea value={forwardNote} onChange={(event) => setForwardNote(event.target.value)} rows={3} placeholder="Reason or handoff context" />
              </div>
              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setForwardQuote(null)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={forwarding || !forwardTargetId}><ArrowRight size={14} /> {forwarding ? 'Forwarding...' : 'Forward quotation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewQ && (
        <div className="sv-modal-overlay" onClick={() => setViewQ(null)}>
          <div className="sv-modal" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#2563EB" />
                <h3 style={{ margin: 0 }}>Quotation: {viewQ.orderReference || viewQ.quotationNumber}</h3>
              </div>
              <button onClick={() => setViewQ(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{viewQ.clientName || viewQ.customerName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Sale Person: {viewQ.salePerson || viewQ.createdBy?.fullName || 'Sales Rep'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Issuing Company: {companyName(viewQ)}</div>
                  {viewQ.isForwardedReadOnly && <div style={{ marginTop: '6px', color: '#B45309', fontWeight: 700 }}>Forwarded to {viewQ.owner?.fullName || 'another salesperson'} · Read-only</div>}
                </div>
                <span className="sv-badge" style={{ background: (STATUS_COLORS[viewQ.status] || '#64748B') + '22', color: STATUS_COLORS[viewQ.status] || '#64748B', border: `1px solid ${(STATUS_COLORS[viewQ.status] || '#64748B')}44`, fontSize: '0.85rem', padding: '4px 12px' }}>
                  {viewQ.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Complete Amount (PKR)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    Rs. {Number(viewQ.netAmount !== undefined ? viewQ.netAmount : (viewQ.totalAmount || 0)).toLocaleString()}
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>Creation Date</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                    {viewQ.creationDate ? new Date(viewQ.creationDate).toLocaleDateString('en-GB') : (viewQ.createdAt ? new Date(viewQ.createdAt).toLocaleDateString('en-GB') : 'N/A')}
                  </div>
                </div>
              </div>

              {/* Itemized Products Breakdown Table */}
              <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>
                  Product Scope & Quantities
                </div>
                <table style={{ width: '100%', fontSize: '0.825rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #CBD5E1', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px', width: '30px' }}>#</th>
                      <th style={{ padding: '6px 8px' }}>SKU</th>
                      <th style={{ padding: '6px 8px' }}>Part Number</th>
                      <th style={{ padding: '6px 8px' }}>Description / Product</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Unit Price (PKR)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((viewQ.items && viewQ.items.length > 0) ? viewQ.items : [{ description: viewQ.productSummary || 'Scope of Supply', quantity: 1, unitPrice: Number(viewQ.totalAmount || viewQ.netAmount || 0), total: Number(viewQ.totalAmount || viewQ.netAmount || 0) }]).map((it, idx) => {
                      const qty = Math.max(1, Number(it.quantity) || 1);
                      const unitP = Number(it.unitPrice !== undefined ? it.unitPrice : (viewQ.totalAmount || 0));
                      const total = Number(it.total !== undefined ? it.total : qty * unitP);
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '6px 8px', color: '#94A3B8' }}>{idx + 1}</td>
                          <td style={{ padding: '6px 8px', color: '#475569' }}>{it.sku || '—'}</td>
                          <td style={{ padding: '6px 8px', color: '#475569' }}>{it.partNumber || '—'}</td>
                          <td style={{ padding: '6px 8px', fontWeight: 600, color: '#1E293B', whiteSpace: 'pre-wrap' }}>{it.description || 'Product Item'}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', color: '#475569' }}>Rs. {unitP.toLocaleString()}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: '#2563EB' }}>{qty}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>Rs. {total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #CBD5E1' }}>
                      <td colSpan={6} style={{ padding: '6px 8px', textAlign: 'right', color: '#64748B', fontWeight: 600 }}>Subtotal (Sum of Products):</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#1E293B', fontWeight: 700 }}>
                        Rs. {Number(viewQ.totalAmount || 0).toLocaleString()}
                      </td>
                    </tr>
                    {Number(viewQ.discount || 0) > 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '4px 8px', textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>
                          Discount (- {Number(viewQ.discountPercentage !== undefined && viewQ.discountPercentage !== null && Number(viewQ.discountPercentage) > 0 ? viewQ.discountPercentage : ((Number(viewQ.discount) / Math.max(1, Number(viewQ.totalAmount || 0))) * 100)).toFixed(1)}%):
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#DC2626', fontWeight: 700 }}>
                          - Rs. {Number(viewQ.discount || 0).toLocaleString()}
                        </td>
                      </tr>
                    )}
                    {Number(viewQ.tax || 0) > 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '4px 8px', textAlign: 'right', color: '#475569', fontWeight: 600 }}>
                          Tax / GST (+ {Number(viewQ.taxPercentage !== undefined && viewQ.taxPercentage !== null && Number(viewQ.taxPercentage) > 0 ? viewQ.taxPercentage : ((Number(viewQ.tax) / Math.max(1, Number(viewQ.totalAmount || 0) - Number(viewQ.discount || 0))) * 100)).toFixed(1)}%):
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#475569', fontWeight: 700 }}>
                          + Rs. {Number(viewQ.tax || 0).toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '1px solid #CBD5E1', fontWeight: 800 }}>
                      <td colSpan={6} style={{ padding: '8px', textAlign: 'right', color: '#0F172A', fontSize: '0.9rem' }}>Complete Grand Total ({viewQ.currency || 'PKR'}):</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#059669', fontSize: '1.05rem' }}>
                        Rs. {Number(viewQ.netAmount !== undefined ? viewQ.netAmount : (viewQ.totalAmount || 0)).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '6px' }}>Commercial Terms</div>
                <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
                  <div><strong>Currency:</strong> {viewQ.currency || DEFAULT_TERMS.currency}</div>
                  <div><strong>Reference:</strong> {viewQ.reference || '—'}</div>
                  <div><strong>Availability:</strong> {viewQ.availability || DEFAULT_TERMS.availability}</div>
                  <div><strong>Payment Terms:</strong> {viewQ.paymentTerms || DEFAULT_TERMS.paymentTerms}</div>
                  <div><strong>Price Validity:</strong> {viewQ.priceValidity || DEFAULT_TERMS.priceValidity}</div>
                  <div><strong>Note:</strong> {viewQ.commercialNote || DEFAULT_TERMS.commercialNote}</div>
                </div>
              </div>

              {viewQ.notes && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '4px' }}>Terms & Remarks</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>{viewQ.notes}</div>
                </div>
              )}

              <div className="sv-modal-actions" style={{ marginTop: '16px' }}>
                <button className="sv-btn-cancel" onClick={() => setViewQ(null)}>Close</button>
                {!viewQ.isForwardedReadOnly && viewQ.status !== 'Converted to Customer PO' && viewQ.status !== 'Converted to Sales Order' && viewQ.status !== 'Converted' ? (
                  <button
                    className="sv-btn-primary"
                    style={{ background: '#059669' }}
                    onClick={() => {
                      const target = viewQ;
                      setViewQ(null);
                      handleOpenConvertToPO(target);
                    }}
                  >
                    <FileCheck size={14} /> Convert to Customer PO
                  </button>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 8px' }}>
                    <CheckCircle2 size={16} /> {viewQ.isForwardedReadOnly ? `Forwarded to ${viewQ.owner?.fullName || 'Sales'}` : (viewQ.status === 'Converted to Customer PO' ? 'Converted to Customer PO' : `Converted to Sales Order ${viewQ.salesOrderNumber ? `(${viewQ.salesOrderNumber})` : ''}`)}
                  </span>
                )}
                <button
                  className="sv-btn-primary"
                  style={{ background: '#2563EB' }}
                  onClick={() => handleDownloadSinglePDF(viewQ)}
                >
                  <Download size={14} /> Download PDF
                </button>
                {!viewQ.isForwardedReadOnly && <button className="sv-btn-primary" onClick={() => { setViewQ(null); openEdit(viewQ); }}><Edit2 size={14} /> Edit Quote</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL - MULTI-PRODUCT QUANTITY, DISCOUNT, TAX & COMPLETE AMOUNT CALCULATOR */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '1160px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  {editQ ? `Edit Quotation (${editQ.orderReference || editQ.quotationNumber})` : 'New Quotation'}
                </h3>
                <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                  Build the quotation lines, commercial terms, GST, currency, and customer reference.
                </p>
              </div>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="sv-error" style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #FECACA', marginBottom: '14px' }}>{error}</div>}
            
            <form onSubmit={handleSave} className="sv-form">
              {/* Section 1: Customer & Identification */}
              <div className="sv-form-section">
                <div className="sv-form-section-title"><Building size={14} color="#2563EB" /> Customer & Identification</div>
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Quotation Number</label>
                    <input value={editQ ? form.orderReference : ''} placeholder="Assigned on save (QO-000001)" readOnly style={{ background: '#F1F5F9' }} />
                  </div>
                  <div className="sv-field">
                    <label>Customer Name *</label>
                    <input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Company / Customer name" required />
                  </div>
                  <div className="sv-field">
                    <label>Issuing Company {!editQ && '*'}</label>
                    <select
                      value={form.issuingCompanyCode}
                      onChange={e => setForm(p => ({ ...p, issuingCompanyCode: e.target.value }))}
                      required={!editQ}
                    >
                      <option value="">{editQ ? 'No company (legacy quotation)' : 'Select issuing company'}</option>
                      {companiesFor(DOCUMENT_TYPES.QUOTATION).map(company => (
                        <option key={company.code} value={company.code}>{company.legalName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sv-field">
                  <label>Customer Address</label>
                  <textarea rows={2} value={form.clientAddress} onChange={e => setForm(p => ({ ...p, clientAddress: e.target.value }))} placeholder="Customer address for the quotation" />
                </div>

                <div className="sv-field">
                  <label>Sale Person</label>
                  <input value={form.salePerson} readOnly placeholder="Logged-in sales person" />
                </div>
              </div>

              {/* Section 2: Products & Dynamic Quantity / Unit Price Calculation */}
              <div className="sv-form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div className="sv-form-section-title" style={{ margin: 0 }}>
                    <DollarSign size={14} color="#059669" /> Products & Scope of Supply
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#2563EB',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} /> Add Another Product
                  </button>
                </div>

                {/* Line Items Table */}
                <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                  <table style={{ width: '100%', fontSize: '0.825rem', borderCollapse: 'collapse', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', color: '#475569', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '8px', width: '30px' }}>#</th>
                        <th style={{ padding: '8px', minWidth: '190px' }}>Inventory Product (optional)</th>
                        <th style={{ padding: '8px', minWidth: '110px' }}>SKU</th>
                        <th style={{ padding: '8px', minWidth: '130px' }}>Part Number</th>
                        <th style={{ padding: '8px', minWidth: '260px' }}>Description / Specifications *</th>
                        <th style={{ padding: '8px', width: '140px' }}>Unit Price (PKR) *</th>
                        <th style={{ padding: '8px', width: '90px', textAlign: 'center' }}>Quantity *</th>
                        <th style={{ padding: '8px', width: '130px', textAlign: 'right' }}>Total (PKR)</th>
                        <th style={{ padding: '8px', width: '40px', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((it, idx) => {
                        const lineTotal = (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0);
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '8px', color: '#94A3B8', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '6px 8px' }}>
                              <input
                                list="quotation-inventory-options"
                                value={it.inventorySearch || ''}
                                onChange={e => handleInventoryPickerChange(idx, e.target.value)}
                                placeholder="Search name or SKU"
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  fontSize: '0.82rem',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  background: '#FFFFFF'
                                }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input
                                value={it.sku || ''}
                                onChange={e => handleItemChange(idx, 'sku', e.target.value)}
                                placeholder="SKU"
                                style={{ width: '100%', padding: '7px 10px', fontSize: '0.82rem', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#FFFFFF' }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input
                                value={it.partNumber || ''}
                                onChange={e => handleItemChange(idx, 'partNumber', e.target.value)}
                                placeholder="Part Number"
                                style={{ width: '100%', padding: '7px 10px', fontSize: '0.82rem', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#FFFFFF' }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <textarea
                                rows={3}
                                value={it.description}
                                onChange={e => handleItemChange(idx, 'description', e.target.value)}
                                placeholder="Multi-line product specifications"
                                required
                                style={{ width: '100%', minWidth: '250px', resize: 'vertical', padding: '7px 10px', fontSize: '0.82rem', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#FFFFFF' }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={it.unitPrice === '' ? '' : it.unitPrice}
                                onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                                placeholder="e.g. 5000"
                                required
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  fontSize: '0.82rem',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  background: '#FFFFFF'
                                }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={it.quantity}
                                onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                                placeholder="1"
                                required
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  fontSize: '0.82rem',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  textAlign: 'center',
                                  fontWeight: 700,
                                  background: '#FFFFFF'
                                }}
                              />
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: '#059669', whiteSpace: 'nowrap' }}>
                              Rs. {lineTotal.toLocaleString()}
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                              {form.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  title="Remove Item"
                                  style={{
                                    background: '#FEE2E2',
                                    border: '1px solid #FECACA',
                                    color: '#DC2626',
                                    borderRadius: '6px',
                                    padding: '5px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <datalist id="quotation-inventory-options">
                    {inventoryOptions.map(item => (
                      <option key={item._id} value={`${item.name}${item.sku ? ` [${item.sku}]` : ''}`} />
                    ))}
                  </datalist>
                </div>

                {/* Section 2B: Dynamic Percentage & PKR Discount and Tax Calculator */}
                <div className="quote-calc-card">
                  <div className="quote-calc-grid">
                    {/* Discount Control Column */}
                    <div className="quote-calc-col">
                      <div className="quote-calc-col-header" style={{ color: '#DC2626' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tag size={14} /> Discount
                        </span>
                        <span style={{ fontSize: '0.75rem', background: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          - PKR {Number(form.discount || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="quote-calc-input-row">
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
                            readOnly
                            aria-readonly="true"
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
                              background: '#F8FAFC'
                            }}
                          />
                        </div>
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
                          Discount
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
                        Formula: <strong>Complete Amount = Subtotal - Discount + Tax</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: 800, color: '#047857' }}>
                          Complete Grand Total:
                        </span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
                          Rs. {Number(form.netAmount || 0).toLocaleString()} <span style={{ fontSize: '0.85rem' }}>PKR</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Quotation Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="Quotation">Quotation</option>
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                  <div className="sv-field">
                    <label>Creation Date</label>
                    <input type="date" value={form.creationDate} onChange={e => setForm(p => ({ ...p, creationDate: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Section 3: Contact & Notes */}
              <div className="sv-form-section">
                <div className="sv-form-section-title"><Info size={14} color="#6366F1" /> Contact Info & Terms</div>
                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label>Client Email</label>
                    <input type="email" value={form.clientEmail} onChange={e => setForm(p => ({ ...p, clientEmail: e.target.value }))} placeholder="procurement@client.com" />
                  </div>
                  <div className="sv-field">
                    <label>Client Phone</label>
                    <input value={form.clientPhone} onChange={e => setForm(p => ({ ...p, clientPhone: e.target.value }))} placeholder="+92 300 0000000" />
                  </div>
                  <div className="sv-field">
                    <label>Currency</label>
                    <input value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} placeholder="Pakistani Rupee" />
                  </div>
                  <div className="sv-field">
                    <label>Reference</label>
                    <input value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} placeholder="Customer enquiry / RFQ reference" />
                  </div>
                  <div className="sv-field">
                    <label>Availability</label>
                    <input value={form.availability} onChange={e => setForm(p => ({ ...p, availability: e.target.value }))} />
                  </div>
                  <div className="sv-field">
                    <label>Payment Terms</label>
                    <input value={form.paymentTerms} onChange={e => setForm(p => ({ ...p, paymentTerms: e.target.value }))} />
                  </div>
                  <div className="sv-field">
                    <label>Price Validity</label>
                    <input value={form.priceValidity} onChange={e => setForm(p => ({ ...p, priceValidity: e.target.value }))} />
                  </div>
                </div>
                <div className="sv-field">
                  <label>Commercial Note</label>
                  <textarea rows={3} value={form.commercialNote} onChange={e => setForm(p => ({ ...p, commercialNote: e.target.value }))} />
                </div>
                <div className="sv-field">
                  <label>Internal Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes (not printed as commercial terms)" />
                </div>
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONVERT QUOTATION TO CUSTOMER PO MODAL */}
      {poModalQuote && (
        <div className="sv-modal-overlay" onClick={() => setPoModalQuote(null)}>
          <div className="sv-modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={20} color="#059669" />
                <h3 style={{ margin: 0 }}>Convert to Customer Purchase Order (PO)</h3>
              </div>
              <button onClick={() => setPoModalQuote(null)}><X size={18} /></button>
            </div>
            
            {error && (
              <div className="sv-error" style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #FECACA', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleConfirmConvertToPO} className="sv-form">
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Quotation Linkage</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
                  {poModalQuote.orderReference || poModalQuote.quotationNumber} — {poModalQuote.clientName || poModalQuote.customerName}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
                  Amount: Rs. {Number(poModalQuote.netAmount !== undefined ? poModalQuote.netAmount : (poModalQuote.totalAmount || 0)).toLocaleString()} PKR
                </div>
              </div>

              <div className="sv-field">
                <label>PO Date</label>
                <input
                  type="date"
                  value={poDateInput}
                  onChange={e => setPoDateInput(e.target.value)}
                  required
                />
              </div>

              <div className="sv-field">
                <label>Notes / PO Scope</label>
                <textarea
                  rows={3}
                  value={poNotesInput}
                  onChange={e => setPoNotesInput(e.target.value)}
                  placeholder="Customer purchase order terms, references, and acceptance notes..."
                />
              </div>

              <div className="sv-field">
                <label>Customer PO Attachment *</label>
                <input
                  type="file"
                  accept={CUSTOMER_PO_ATTACHMENT_ACCEPT}
                  onChange={handlePOAttachmentChange}
                  required
                />
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                  {poDocumentName || 'Accepted: PDF, Excel, or screenshot (maximum 3 MB).'}
                </div>
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setPoModalQuote(null)}>Cancel</button>
                <button type="submit" className="sv-btn-primary" style={{ background: '#059669' }} disabled={convertingToPO}>
                  <FileCheck size={15} /> {convertingToPO ? 'Converting...' : 'Confirm & Move to Customer PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className="sv-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="sv-modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={18} color="#EF4444" />
                <h3 style={{ margin: 0 }}>Delete Quotation</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className="sv-form">
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 16px' }}>
                Are you sure you want to permanently delete quotation <strong>{deleteTarget.orderReference || deleteTarget.quotationNumber}</strong>?
              </p>
              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="sv-btn-primary" onClick={handleDelete} disabled={deleting} style={{ background: '#EF4444' }}>
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Quotation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
