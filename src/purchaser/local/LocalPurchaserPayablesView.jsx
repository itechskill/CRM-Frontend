import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Search, X, CheckCircle2, AlertCircle, Clock, Check } from 'lucide-react';
import { apiRequest } from '../../utils/api';

export default function LocalPurchaserPayablesView({ searchQuery }) {
  const [payables, setPayables] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierPOs, setSupplierPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [toast, setToast] = useState('');

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, suppRes, poRes] = await Promise.all([
        apiRequest('/api/purchaser/payables'),
        apiRequest('/api/purchaser/suppliers?type=Local'),
        apiRequest('/api/purchaser/pos?subType=Local')
      ]);
      if (payRes.success) {
        setPayables(Array.isArray(payRes.payables) ? payRes.payables : (Array.isArray(payRes.data) ? payRes.data : []));
      }
      if (suppRes.success) {
        setSuppliers(Array.isArray(suppRes.suppliers) ? suppRes.suppliers : (Array.isArray(suppRes.data) ? suppRes.data : []));
      }
      if (poRes.success) {
        setSupplierPOs(Array.isArray(poRes.pos) ? poRes.pos : (Array.isArray(poRes.data) ? poRes.data : []));
      }
    } catch (err) {
      console.error('Error fetching Local Payables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleSupplierSelect = (e) => {
    const val = e.target.value;
    const s = (Array.isArray(suppliers) ? suppliers : []).find(sup => sup.name === val);
    if (s) {
      setFormData(prev => ({
        ...prev,
        supplierId: s._id,
        supplierName: s.name,
        supplierContact: s.phone || s.email || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, supplierName: val }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierName || !formData.amountPKR) {
      alert('Please fill supplier name and amount in PKR.');
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
        setToast(`Payable of PKR ${Number(formData.amountPKR).toLocaleString()} recorded successfully!`);
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

  const handleMarkPaid = async (payable) => {
    if (!window.confirm(`Mark payment to "${payable.supplierName}" of PKR ${Number(payable.amount || payable.amountPKR || 0).toLocaleString()} as Settled / Paid?`)) {
      return;
    }
    try {
      const res = await apiRequest(`/api/purchaser/payables/${payable._id}`, 'PUT', { status: 'Paid', paymentStatus: 'Paid' });
      if (res.success) {
        setToast(`Payable #${payable.payableNumber || payable._id} marked as Paid!`);
        fetchData();
        setTimeout(() => setToast(''), 4000);
      } else {
        alert(res.message || 'Failed to update payable status.');
      }
    } catch (err) {
      alert('Error updating payable status.');
    }
  };

  const formatPKR = (num) => `PKR ${Number(num || 0).toLocaleString('en-PK')}`;

  const searchVal = (filterText || searchQuery || '').toLowerCase();
  const filtered = payables.filter(p =>
    (p.supplierName || '').toLowerCase().includes(searchVal) ||
    (p.payableNumber || '').toLowerCase().includes(searchVal) ||
    (p.chequeNumber || '').toLowerCase().includes(searchVal) ||
    (p.pdcNumber || '').toLowerCase().includes(searchVal) ||
    (p.supplierPONumber || '').toLowerCase().includes(searchVal)
  );

  const totalPending = filtered.filter(p => p.status === 'Pending').reduce((sum, p) => sum + (Number(p.amount || p.amountPKR) || 0), 0);
  const totalPaid = filtered.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (Number(p.amount || p.amountPKR) || 0), 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Local Payables</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>Record and monitor Cash, Cheque, and Post-Dated Cheque (PDC) payments to local suppliers</p>
        </div>
        <button
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
        </button>
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
      <div style={{ backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Payable # / PO</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Supplier</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Payment Method</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Instrument / Ref #</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Amount (PKR)</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Due / PDC Date</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
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
                    {pay.payableNumber || (pay.supplierPONumber ? `PO: ${pay.supplierPONumber}` : 'Payable')}
                    {pay.grnNumber && <span style={{ display: 'block', fontSize: '0.74rem', color: '#2563EB' }}>{pay.grnNumber}</span>}
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0F172A' }}>{pay.supplierName}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: pay.paymentMethod === 'Cash' ? '#DEF7EC' : pay.paymentMethod === 'PDC' ? '#EFF6FF' : '#FEF3C7', color: pay.paymentMethod === 'Cash' ? '#03543F' : pay.paymentMethod === 'PDC' ? '#1D4ED8' : '#92400E' }}>
                      {pay.paymentMethod}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748B' }}>{pay.chequeNumber || pay.pdcNumber || '-'}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>{formatPKR(pay.amount || pay.amountPKR)}</td>
                  <td style={{ padding: '14px 20px', color: '#64748B' }}>
                    {pay.dueDate ? new Date(pay.dueDate).toLocaleDateString() : (pay.pdcDate ? new Date(pay.pdcDate).toLocaleDateString() : '-')}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: pay.status === 'Paid' ? '#DEF7EC' : '#FEF3C7', color: pay.status === 'Paid' ? '#03543F' : '#92400E' }}>
                      {pay.status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    {pay.status !== 'Paid' && (
                      <button
                        onClick={() => handleMarkPaid(pay)}
                        style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Check size={13} /> Settle
                      </button>
                    )}
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
      {showModal && (
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
                  Link to Local Supplier PO (Optional)
                </label>
                <select
                  value={formData.supplierPONumber}
                  onChange={handlePOSelect}
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                >
                  <option value="">-- Manual Entry or Select Supplier PO --</option>
                  {(Array.isArray(supplierPOs) ? supplierPOs : []).map(po => (
                    <option key={po._id} value={po.poNumber}>
                      {po.poNumber} — {po.supplierName} (PKR {Number(po.totalAmount || po.totalAmountPKR || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Supplier Name *</label>
                  <input
                    type="text"
                    list="supplier-options"
                    value={formData.supplierName}
                    onChange={handleSupplierSelect}
                    placeholder="Enter or select supplier"
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                  <datalist id="supplier-options">
                    {(Array.isArray(suppliers) ? suppliers : []).map(s => <option key={s._id} value={s.name} />)}
                  </datalist>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Amount (PKR) *</label>
                  <input
                    type="number"
                    min="1"
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
    </div>
  );
}
