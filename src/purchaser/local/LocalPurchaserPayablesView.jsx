import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../utils/api';

export default function LocalPurchaserPayablesView({ searchQuery, readOnly = false, canRecordPayments = !readOnly, showCostingStatus = false }) {
  const [payables, setPayables] = useState([]);
  const [supplierPOs, setSupplierPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [toast, setToast] = useState('');
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'Bank Transfer',
    reference: '',
    note: ''
  });

  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
    supplierContact: '',
    supplierPoId: '',
    supplierPONumber: '',
    amountPKR: '',
    paymentMethod: 'Cash',
    chequeNumber: '',
    pdcNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'Pending',
    remarks: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [payRes, poRes] = await Promise.all([
        apiRequest('/api/purchaser/payables'),
        readOnly ? Promise.resolve({ success: true, data: [] }) : apiRequest('/api/purchaser/pos?subType=Local')
      ]);
      if (payRes.success) {
        setPayables(Array.isArray(payRes.payables) ? payRes.payables : (Array.isArray(payRes.data) ? payRes.data : []));
      }
      if (poRes.success) {
        setSupplierPOs(Array.isArray(poRes.pos) ? poRes.pos : (Array.isArray(poRes.data) ? poRes.data : []));
      }
    } catch (err) {
      console.error('Error fetching Local Payables:', err);
    } finally {
      setLoading(false);
    }
  }, [readOnly]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePOSelect = (e) => {
    const poNum = e.target.value;
    const po = (Array.isArray(supplierPOs) ? supplierPOs : []).find(p => p.poNumber === poNum);
    if (po) {
      setFormData(prev => ({
        ...prev,
        supplierPoId: po._id,
        supplierPONumber: po.poNumber,
        supplierName: po.supplierName,
        supplierId: po.supplier || '',
        amountPKR: po.totalAmount || po.totalAmountPKR || prev.amountPKR,
        remarks: `Payment for Supplier PO #${po.poNumber}${po.salesOrderNumber ? ` (SO #${po.salesOrderNumber})` : ''}`
      }));
    } else {
      setFormData(prev => ({ ...prev, supplierPONumber: poNum, supplierPoId: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierPoId || !formData.supplierName || !formData.amountPKR) {
      alert('Please select a Local Supplier PO and enter the amount in PKR.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        amountPKR: Number(formData.amountPKR),
        amount: Number(formData.amountPKR)
      };
      const res = await apiRequest('/api/purchaser/payables', 'POST', payload);
      if (res.success) {
        setToast(`Payable of ${formatPKR(formData.amountPKR)} recorded successfully!`);
        setShowModal(false);
        setFormData({
          supplierId: '',
          supplierName: '',
          supplierContact: '',
          supplierPoId: '',
          supplierPONumber: '',
          amountPKR: '',
          paymentMethod: 'Cash',
          chequeNumber: '',
          pdcNumber: '',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          status: 'Pending',
          remarks: ''
        });
        fetchData();
        setTimeout(() => setToast(''), 4500);
      } else {
        alert(res.message || 'Error recording payable');
      }
    } catch (err) {
      console.error('Error recording local payable:', err);
      alert('Failed to save payable transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPKR = (num) => `PKR ${Number(num || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const amountFromCents = (value) => (Number(value || 0) / 100);
  const payableTotal = (payable) => Number.isInteger(payable.totalAmountCents)
    ? amountFromCents(payable.totalAmountCents)
    : Number(payable.amount || payable.amountPKR || 0);
  const payablePaid = (payable) => Number.isInteger(payable.paidAmountCents)
    ? amountFromCents(payable.paidAmountCents)
    : (payable.status === 'Paid' ? payableTotal(payable) : 0);
  const payableOutstanding = (payable) => Number.isInteger(payable.outstandingAmountCents)
    ? amountFromCents(payable.outstandingAmountCents)
    : Math.max(0, payableTotal(payable) - payablePaid(payable));
  const createPaymentId = () => globalThis.crypto?.randomUUID?.()
    || `pay-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const openPaymentModal = (payable) => {
    setPaymentTarget(payable);
    setPaymentForm({
      paymentId: createPaymentId(),
      amount: payableOutstanding(payable).toFixed(2),
      date: new Date().toISOString().split('T')[0],
      method: 'Bank Transfer',
      reference: '',
      note: ''
    });
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    const amountCents = Math.round((Number(paymentForm.amount) + Number.EPSILON) * 100);
    if (!paymentTarget || !Number.isSafeInteger(amountCents) || amountCents <= 0) {
      alert('Enter a valid payment amount.');
      return;
    }
    setPaymentSubmitting(true);
    try {
      const result = await apiRequest(`/api/purchaser/payables/${paymentTarget._id}/payments`, 'POST', {
        paymentId: paymentForm.paymentId,
        amountCents,
        date: paymentForm.date,
        method: paymentForm.method,
        reference: paymentForm.reference,
        note: paymentForm.note
      });
      if (!result.success) {
        alert(result.message || 'Unable to record the payment.');
        return;
      }
      setToast(result.message || 'Supplier payment recorded successfully.');
      setPaymentTarget(null);
      await fetchData();
      setTimeout(() => setToast(''), 4500);
    } catch (err) {
      console.error('Error recording supplier payment:', err);
      alert('Unable to record the payment.');
    } finally {
      setPaymentSubmitting(false);
    }
  };
  const getPayableGrnNumbers = (payable) => Array.from(new Set([
    ...(Array.isArray(payable.grns) ? payable.grns.map((grn) => grn?.grnNumber) : []),
    payable.grn?.grnNumber
  ].filter(Boolean)));
  const getSupplierBills = (payable) => Array.from(new Map(
    (Array.isArray(payable.grns) ? payable.grns : [])
      .filter(grn => grn?.supplierBillNumber)
      .map(grn => [grn.supplierBillNumber, grn])
  ).values());

  const searchVal = (filterText || searchQuery || '').toLowerCase();
  const filtered = payables.filter(p =>
    (p.supplierName || '').toLowerCase().includes(searchVal) ||
    (p.payableNumber || '').toLowerCase().includes(searchVal) ||
    (p.chequeNumber || '').toLowerCase().includes(searchVal) ||
    (p.pdcNumber || '').toLowerCase().includes(searchVal) ||
    (p.poNumber || '').toLowerCase().includes(searchVal) ||
    (p.salesOrderNumber || '').toLowerCase().includes(searchVal) ||
    (p.paymentTerms || '').toLowerCase().includes(searchVal)
  );

  const totalPending = filtered.reduce((sum, payable) => sum + payableOutstanding(payable), 0);
  const totalPaid = filtered.reduce((sum, payable) => sum + payablePaid(payable), 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Local Payables</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>{readOnly ? 'Review Local Supplier PO payables' : 'Record and monitor local supplier payables'}</p>
        </div>
        {!readOnly && <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#D97706',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
          }}
        >
          <Plus size={18} />
          <span>Record Local Payment</span>
        </button>}
      </div>

      {toast && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 18px', borderRadius: '10px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="#059669" /> {toast}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', borderLeft: '4px solid #D97706', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Total Outstanding Payables</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', margin: '4px 0 0 0' }}>{formatPKR(totalPending)}</h3>
        </div>
        <div style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', borderLeft: '4px solid #059669', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Settled / Paid Amount</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', margin: '4px 0 0 0' }}>{formatPKR(totalPaid)}</h3>
        </div>
        <div style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', borderLeft: '4px solid #3B82F6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Total Payables Records</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '4px 0 0 0' }}>{payables.length}</h3>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '400px' }}>
        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search by Supplier, Cheque#, or PO#..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
        />
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflowX: 'auto', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', minWidth: '1250px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Payable # / PO</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Supplier</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Payment Method</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Instrument / Ref #</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Amounts (PKR)</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Due / PDC Date</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
              {showCostingStatus && <th style={{ padding: '12px 20px', fontWeight: 600 }}>Costing status</th>}
              <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>Loading Payables...</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map((pay) => (
                <tr key={pay._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#D97706' }}>
                    {pay.payableNumber || 'Payable'}
                    {pay.poNumber && <span style={{ display: 'block', fontSize: '0.74rem', color: '#475569' }}>PO: {pay.poNumber}</span>}
                    {pay.salesOrderNumber && <span style={{ display: 'block', fontSize: '0.74rem', color: '#2563EB' }}>SO: {pay.salesOrderNumber}</span>}
                    {pay.paymentTerms && <span style={{ display: 'block', fontSize: '0.74rem', color: '#64748B' }}>Terms: {pay.paymentTerms}</span>}
                    {getPayableGrnNumbers(pay).length > 0 && (
                      <span style={{ display: 'block', fontSize: '0.74rem', color: '#2563EB' }}>
                        GRN: {getPayableGrnNumbers(pay).join(', ')}
                      </span>
                    )}
                    {getSupplierBills(pay).map(grn => (
                      <span key={grn._id || grn.supplierBillNumber} style={{ display: 'block', fontSize: '0.74rem', color: '#475569' }}>
                        Supplier Bill: {grn.supplierBillNumber}{grn.supplierBillDate ? ` (${new Date(grn.supplierBillDate).toLocaleDateString()})` : ''}
                      </span>
                    ))}
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0F172A' }}>{pay.supplierName}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: pay.paymentMethod === 'Cash' ? '#DEF7EC' : pay.paymentMethod === 'PDC' ? '#EFF6FF' : '#FEF3C7', color: pay.paymentMethod === 'Cash' ? '#03543F' : pay.paymentMethod === 'PDC' ? '#1D4ED8' : '#92400E' }}>
                      {pay.paymentMethod || 'Not selected'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748B' }}>{pay.chequeNumber || pay.pdcNumber || '-'}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>
                    <span style={{ display: 'block' }}>Total: {formatPKR(payableTotal(pay))}</span>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: '#059669' }}>Paid: {formatPKR(payablePaid(pay))}</span>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: '#D97706' }}>Outstanding: {formatPKR(payableOutstanding(pay))}</span>
                    {(Number(pay.gstRate) > 0 || Number(pay.gstAmount) > 0) && (
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>
                        Subtotal {formatPKR(pay.subtotal)} + GST {Number(pay.gstRate || 0).toFixed(2)}% ({formatPKR(pay.gstAmount)})
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748B' }}>
                    {pay.dueDate ? new Date(pay.dueDate).toLocaleDateString() : (pay.pdcDate ? new Date(pay.pdcDate).toLocaleDateString() : '-')}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: pay.status === 'Paid' ? '#DEF7EC' : '#FEF3C7', color: pay.status === 'Paid' ? '#03543F' : '#92400E' }}>
                      {pay.status || 'Pending'}
                    </span>
                  </td>
                  {showCostingStatus && <td style={{ padding: '14px 20px' }}><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, background: pay.supplierPO?.costingStatus === 'Completed' ? '#DCFCE7' : '#FEF3C7', color: pay.supplierPO?.costingStatus === 'Completed' ? '#166534' : '#92400E' }}>{pay.supplierPO?.costingStatus === 'Completed' ? 'Completed' : 'Incomplete'}</span></td>}
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      {canRecordPayments && payableOutstanding(pay) > 0 && !pay.isBlockedByAdvance && (
                        <button
                          type="button"
                          onClick={() => openPaymentModal(pay)}
                          style={{ border: 'none', borderRadius: '6px', padding: '6px 9px', background: '#D97706', color: '#FFF', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Record Payment
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setHistoryTarget(pay)}
                        style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '6px 9px', background: '#FFF', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        History ({Array.isArray(pay.payments) ? pay.payments.length : 0})
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>No Local Payables found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {!readOnly && showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FEF3C7' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#92400E' }}>Record Local Supplier Payable / Payment</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {/* Linked PO selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Link to Local Supplier PO *
                </label>
                <select
                  value={formData.supplierPONumber}
                  onChange={handlePOSelect}
                  required
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                >
                  <option value="">-- Select Supplier PO --</option>
                  {(Array.isArray(supplierPOs) ? supplierPOs : []).map(po => (
                    <option key={po._id} value={po.poNumber}>
                      {po.poNumber} — {po.supplierName} ({formatPKR(po.totalAmount || po.totalAmountPKR || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Supplier Name *</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    readOnly
                    placeholder="Filled from the selected PO"
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', background: '#F8FAFC' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Amount (PKR) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.amountPKR}
                    onChange={(e) => setFormData(prev => ({ ...prev, amountPKR: e.target.value }))}
                    placeholder="e.g. 150000"
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, color: '#D97706' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Payment Mode</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="PDC">PDC (Post-Dated Cheque)</option>
                    <option value="Bank Transfer">Bank Transfer / Online</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Due Date / PDC Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                {(formData.paymentMethod === 'Cheque' || formData.paymentMethod === 'PDC') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Cheque / PDC Number</label>
                    <input
                      type="text"
                      placeholder="e.g. CHQ-990142"
                      value={formData.chequeNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, chequeNumber: e.target.value, pdcNumber: e.target.value }))}
                      style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Remarks / Notes</label>
                <textarea
                  rows="2"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Optional notes or reference particulars..."
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ backgroundColor: '#D97706', color: '#FFF', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
                  {submitting ? 'Recording...' : 'Save Local Payable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentTarget && canRecordPayments && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '560px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Record Supplier Payment</h3>
                <span style={{ color: '#64748B', fontSize: '0.82rem' }}>{paymentTarget.payableNumber} · Outstanding {formatPKR(payableOutstanding(paymentTarget))}</span>
              </div>
              <button type="button" onClick={() => setPaymentTarget(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>
            <form onSubmit={handlePaymentSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Amount (PKR) *
                  <input type="number" min="0.01" step="0.01" max={payableOutstanding(paymentTarget).toFixed(2)} required value={paymentForm.amount} onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: '5px', padding: '9px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                </label>
                <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Payment Date *
                  <input type="date" required value={paymentForm.date} onChange={e => setPaymentForm(prev => ({ ...prev, date: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: '5px', padding: '9px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                </label>
                <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Method *
                  <select required value={paymentForm.method} onChange={e => setPaymentForm(prev => ({ ...prev, method: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: '5px', padding: '9px', border: '1px solid #CBD5E1', borderRadius: '8px' }}>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="PDC">PDC</option>
                  </select>
                </label>
                <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Reference *
                  <input type="text" required value={paymentForm.reference} onChange={e => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: '5px', padding: '9px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                </label>
              </div>
              <label style={{ display: 'block', marginTop: '14px', fontSize: '0.82rem', fontWeight: 700 }}>Note (optional)
                <textarea rows="2" value={paymentForm.note} onChange={e => setPaymentForm(prev => ({ ...prev, note: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: '5px', padding: '9px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
              </label>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setPaymentTarget(null)} style={{ border: 'none', borderRadius: '8px', padding: '9px 16px', background: '#F1F5F9', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={paymentSubmitting} style={{ border: 'none', borderRadius: '8px', padding: '9px 16px', background: '#D97706', color: '#FFF', fontWeight: 700, cursor: paymentSubmitting ? 'not-allowed' : 'pointer' }}>{paymentSubmitting ? 'Recording...' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '720px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Payment History</h3>
                <span style={{ color: '#64748B', fontSize: '0.82rem' }}>{historyTarget.payableNumber} · {historyTarget.supplierName}</span>
              </div>
              <button type="button" onClick={() => setHistoryTarget(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '18px', fontWeight: 700 }}>
                <span>Total: {formatPKR(payableTotal(historyTarget))}</span>
                <span style={{ color: '#059669' }}>Paid: {formatPKR(payablePaid(historyTarget))}</span>
                <span style={{ color: '#D97706' }}>Outstanding: {formatPKR(payableOutstanding(historyTarget))}</span>
              </div>
              {Array.isArray(historyTarget.payments) && historyTarget.payments.length > 0 ? historyTarget.payments.map(payment => (
                <div key={payment.paymentId} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontWeight: 700 }}><span>{formatPKR(amountFromCents(payment.amountCents))}</span><span>{new Date(payment.date || payment.recordedAt).toLocaleDateString()}</span></div>
                  <div style={{ color: '#475569', fontSize: '0.82rem', marginTop: '5px' }}>{payment.method} · Ref: {payment.reference}</div>
                  <div style={{ color: '#64748B', fontSize: '0.78rem', marginTop: '3px' }}>Recorded by {payment.recordedByName || '-'}{payment.note ? ` · ${payment.note}` : ''}</div>
                </div>
              )) : <p style={{ color: '#64748B' }}>No payments have been recorded.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
