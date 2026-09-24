import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Search, Trash2, X, Eye, CheckCircle2, ArrowRight, CreditCard } from 'lucide-react';
import { apiRequest } from '../../utils/api';

export default function LocalPurchaserGRNsView({ searchQuery, onNavigateTab }) {
  const [grns, setGrns] = useState([]);
  const [supplierPOs, setSupplierPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPayableModal, setShowPayableModal] = useState(false);
  const [selectedGrnForPayable, setSelectedGrnForPayable] = useState(null);
  const [viewGrn, setViewGrn] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittingPayable, setSubmittingPayable] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [toast, setToast] = useState('');

  // Create GRN Form State
  const [formData, setFormData] = useState({
    grnNumber: `GRN-${Date.now().toString().slice(-6)}`,
    grnType: 'Supplier',
    supplierPONumber: '',
    supplierPOId: '',
    supplierPoId: '',
    supplierName: '',
    salesOrderId: '',
    salesOrderNumber: '',
    deliveryNoteNumber: '',
    items: [{ productName: '', quantityReceived: 1, condition: 'Good' }],
    inspectionStatus: 'Accepted',
    remarks: ''
  });

  // Payable Form State (for moving GRN to Local Payable)
  const [payableForm, setPayableForm] = useState({
    supplierName: '',
    supplierPONumber: '',
    grnNumber: '',
    amountPKR: '',
    paymentMethod: 'Cash',
    chequeNumber: '',
    pdcNumber: '',
    dueDate: '',
    remarks: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [grnRes, poRes] = await Promise.all([
        apiRequest('/api/purchaser/grns?purchaserSubDept=Local'),
        apiRequest('/api/purchaser/pos?subType=Local')
      ]);
      if (grnRes.success) {
        setGrns(Array.isArray(grnRes.grns) ? grnRes.grns : (Array.isArray(grnRes.data) ? grnRes.data : []));
      }
      if (poRes.success) {
        setSupplierPOs(Array.isArray(poRes.pos) ? poRes.pos : (Array.isArray(poRes.data) ? poRes.data : []));
      }
    } catch (err) {
      console.error('Error fetching GRNs and POs:', err);
      setGrns([]);
      setSupplierPOs([]);
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
      const poItems = po.items && po.items.length > 0
        ? po.items.map(i => ({
          productName: i.productName || i.description || 'Item',
          quantityReceived: Number(i.quantity) || 1,
          condition: 'Good'
        }))
        : [{ productName: 'General Goods', quantityReceived: 1, condition: 'Good' }];

      setFormData(prev => ({
        ...prev,
        supplierPOId: po._id,
        supplierPoId: po._id,
        supplierPONumber: po.poNumber,
        supplierName: po.supplierName || '',
        supplierId: po.supplier || po.supplierId || '',
        salesOrderId: po.salesOrderId || null,
        salesOrderNumber: po.salesOrderNumber || '',
        items: poItems,
        remarks: `GRN for Supplier PO #${po.poNumber}${po.salesOrderNumber ? ` (SO #${po.salesOrderNumber})` : ''}`
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        supplierPONumber: poNum,
        supplierPOId: '',
        supplierPoId: '',
        salesOrderId: null,
        salesOrderNumber: ''
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', quantityReceived: 1, condition: 'Good' }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierName && formData.grnType === 'Supplier') {
      alert('Please enter or select supplier name.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        purchaserSubDept: 'Local',
        items: formData.items.map(it => ({
          productName: it.productName,
          quantity: Number(it.quantityReceived) || 1,
          receivedQty: Number(it.quantityReceived) || 1,
          condition: it.condition || 'Good'
        }))
      };

      const res = await apiRequest('/api/purchaser/grns', 'POST', payload);
      if (res.success) {
        setToast(`Goods Received Note #${formData.grnNumber} saved successfully to GRN records!`);
        setShowModal(false);
        setFormData({
          grnNumber: `GRN-${Date.now().toString().slice(-6)}`,
          grnType: 'Supplier',
          supplierPONumber: '',
          supplierPOId: '',
          supplierPoId: '',
          supplierName: '',
          salesOrderId: '',
          salesOrderNumber: '',
          deliveryNoteNumber: '',
          items: [{ productName: '', quantityReceived: 1, condition: 'Good' }],
          inspectionStatus: 'Accepted',
          remarks: ''
        });
        fetchData();
        setTimeout(() => setToast(''), 4500);
      } else {
        alert(res.message || 'Error creating GRN');
      }
    } catch (err) {
      console.error('Error submitting GRN:', err);
      alert('Failed to save Goods Received Note.');
    } finally {
      setSubmitting(false);
    }
  };

  // Move GRN to Local Payable
  const handleOpenMoveToPayableModal = (grn) => {
    setSelectedGrnForPayable(grn);
    // Find matching PO to estimate amount
    const matchingPo = (Array.isArray(supplierPOs) ? supplierPOs : []).find(
      p => p._id === grn.supplierPO || p.poNumber === grn.poNumber || p.poNumber === grn.supplierPONumber
    );
    const estimatedAmt = matchingPo ? (matchingPo.totalAmount || matchingPo.totalAmountPKR || '') : '';

    setPayableForm({
      supplierName: grn.supplierName || (matchingPo ? matchingPo.supplierName : ''),
      supplierPONumber: grn.poNumber || grn.supplierPONumber || (matchingPo ? matchingPo.poNumber : ''),
      supplierPoId: grn.supplierPO || (matchingPo ? matchingPo._id : ''),
      grnId: grn._id,
      grnNumber: grn.grnNumber,
      amountPKR: estimatedAmt,
      paymentMethod: 'Cash',
      chequeNumber: '',
      pdcNumber: '',
      dueDate: '',
      remarks: `Local payable generated from GRN #${grn.grnNumber}${grn.poNumber ? ` (PO #${grn.poNumber})` : ''}`
    });
    setShowPayableModal(true);
  };

  const handleSubmitPayable = async (e) => {
    e.preventDefault();
    if (!payableForm.supplierName || !payableForm.amountPKR) {
      alert('Please provide supplier name and payable amount.');
      return;
    }
    setSubmittingPayable(true);
    try {
      const payload = {
        ...payableForm,
        amountPKR: Number(payableForm.amountPKR),
        amount: Number(payableForm.amountPKR)
      };
      const res = await apiRequest('/api/purchaser/payables', 'POST', payload);
      if (res.success) {
        setToast(`GRN #${selectedGrnForPayable.grnNumber} successfully moved to Local Payables (PKR ${Number(payableForm.amountPKR).toLocaleString()})!`);
        setShowPayableModal(false);
        setSelectedGrnForPayable(null);
        if (onNavigateTab) {
          onNavigateTab('payables');
        }
        setTimeout(() => setToast(''), 5000);
      } else {
        alert(res.message || 'Error creating Local Payable.');
      }
    } catch (err) {
      console.error('Error submitting Local Payable:', err);
      alert('Failed to record Local Payable.');
    } finally {
      setSubmittingPayable(false);
    }
  };

  const searchVal = (filterText || searchQuery || '').toLowerCase();
  const filtered = grns.filter(g =>
    (g.grnNumber || '').toLowerCase().includes(searchVal) ||
    (g.supplierName || '').toLowerCase().includes(searchVal) ||
    (g.poNumber || '').toLowerCase().includes(searchVal) ||
    (g.supplierPONumber || '').toLowerCase().includes(searchVal) ||
    (g.salesOrderNumber || '').toLowerCase().includes(searchVal)
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Goods Received NO (GRN)</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
            Verify &amp; record incoming goods against Supplier POs, then move verified goods to Local Payables
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#2563EB',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
          }}
        >
          <Plus size={18} />
          <span>Record New GRN</span>
        </button>
      </div>

      {toast && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 18px', borderRadius: '10px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="#059669" /> {toast}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '400px' }}>
        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search GRN#, PO#, Supplier, or Sales Order #..."
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
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>GRN Number</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Type</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Supplier / Source</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Linked PO #</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Received Date</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>Loading GRNs...</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map((grn) => (
                <tr key={grn._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#2563EB' }}>{grn.grnNumber}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: grn.grnType === 'Logistics' ? '#EFF6FF' : '#F3E8FF', color: grn.grnType === 'Logistics' ? '#1D4ED8' : '#7E22CE' }}>
                      {grn.grnType || 'Supplier'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0F172A' }}>{grn.supplierName || 'Logistics Transfer'}</td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>
                    {grn.poNumber || grn.supplierPONumber || grn.deliveryNoteNumber || '-'}
                    {grn.salesOrderNumber && <span style={{ display: 'block', fontSize: '0.74rem', color: '#059669' }}>SO: {grn.salesOrderNumber}</span>}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748B' }}>
                    {grn.createdAt ? new Date(grn.createdAt).toLocaleDateString() : (grn.receivedDate ? new Date(grn.receivedDate).toLocaleDateString() : '-')}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor:
                        grn.status === 'Completed' || grn.inspectionStatus === 'Accepted' ? '#DEF7EC' :
                          grn.status === 'Partial' ? '#FEF3C7' : '#FDE8E8',
                      color:
                        grn.status === 'Completed' || grn.inspectionStatus === 'Accepted' ? '#03543F' :
                          grn.status === 'Partial' ? '#92400E' : '#9B1C1C'
                    }}>
                      {grn.status || grn.inspectionStatus || 'Completed'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setViewGrn(grn)}
                        style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        onClick={() => handleOpenMoveToPayableModal(grn)}
                        style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#B45309', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Link & Move GRN to Local Payables"
                      >
                        <CreditCard size={13} /> Move to Payable
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>No Goods Received Notes found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Record GRN Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EFF6FF' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1E40AF' }}>Record Goods Received Note (GRN)</h3>
                <span style={{ fontSize: '0.82rem', color: '#3B82F6' }}>Auto-select Supplier PO to link and pull items &amp; vendor details</span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Select Supplier PO to Link *
                  </label>
                  <select
                    value={formData.supplierPONumber}
                    onChange={handlePOSelect}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    <option value="">-- Choose Supplier PO --</option>
                    {(Array.isArray(supplierPOs) ? supplierPOs : []).map(p => (
                      <option key={p._id} value={p.poNumber}>
                        {p.poNumber} — {p.supplierName} ({p.items ? p.items.length : 0} items)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>GRN Receipt Number</label>
                  <input
                    type="text"
                    value={formData.grnNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, grnNumber: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, color: '#2563EB' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Supplier / Vendor Name *</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                    placeholder="Supplier or Vendor Name"
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Delivery Slip / Challan #</label>
                  <input
                    type="text"
                    value={formData.deliveryNoteNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryNoteNumber: e.target.value }))}
                    placeholder="Vendor delivery slip or invoice #"
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Items Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Received Products &amp; Verification</h4>
                  <button type="button" onClick={addItem} style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Add Item Row
                  </button>
                </div>

                {/* Table Header Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 90px 160px 36px',
                  gap: '10px',
                  padding: '6px 10px',
                  backgroundColor: '#E2E8F0',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}>
                  <div>Product Description</div>
                  <div style={{ textAlign: 'center' }}>Received Qty</div>
                  <div>Condition</div>
                  <div></div>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 160px 36px', gap: '10px', alignItems: 'center', marginBottom: '8px', backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={item.productName}
                      onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                      required
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantityReceived}
                      onChange={(e) => handleItemChange(idx, 'quantityReceived', e.target.value)}
                      required
                      style={{ padding: '7px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', textAlign: 'center', fontWeight: 700, color: '#2563EB', width: '100%', boxSizing: 'border-box' }}
                    />
                    <select
                      value={item.condition}
                      onChange={(e) => handleItemChange(idx, 'condition', e.target.value)}
                      style={{ padding: '7px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="Good">Good Condition</option>
                      <option value="Damaged">Damaged</option>
                      <option value="Missing Parts">Missing Parts</option>
                    </select>
                    {formData.items.length > 1 ? (
                      <button type="button" onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                        <Trash2 size={16} />
                      </button>
                    ) : <div></div>}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Inspection Outcome</label>
                  <select
                    value={formData.inspectionStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, inspectionStatus: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    <option value="Accepted">Accepted — Complete Stock Receipt</option>
                    <option value="Partial">Partial Acceptance</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Inspection Remarks</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Notes on packing condition, warehouse rack, etc."
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ backgroundColor: '#2563EB', color: '#FFF', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
                  {submitting ? 'Saving GRN...' : 'Save & Record GRN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move GRN to Local Payable Modal */}
      {showPayableModal && selectedGrnForPayable && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FEF3C7' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={20} color="#D97706" /> Move GRN to Local Payable
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#78350F' }}>
                  GRN #{selectedGrnForPayable.grnNumber} &rarr; Local Supplier {payableForm.supplierName}
                </span>
              </div>
              <button onClick={() => setShowPayableModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmitPayable} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={payableForm.supplierName}
                    onChange={(e) => setPayableForm({ ...payableForm, supplierName: e.target.value })}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Payable Amount (PKR) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Enter invoice / payable amount"
                    value={payableForm.amountPKR}
                    onChange={(e) => setPayableForm({ ...payableForm, amountPKR: e.target.value })}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, color: '#D97706' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Payment Mode *</label>
                  <select
                    value={payableForm.paymentMethod}
                    onChange={(e) => setPayableForm({ ...payableForm, paymentMethod: e.target.value })}
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
                    value={payableForm.dueDate}
                    onChange={(e) => setPayableForm({ ...payableForm, dueDate: e.target.value })}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                {(payableForm.paymentMethod === 'Cheque' || payableForm.paymentMethod === 'PDC') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Cheque / PDC Number</label>
                    <input
                      type="text"
                      placeholder="e.g. CHQ-990142"
                      value={payableForm.chequeNumber}
                      onChange={(e) => setPayableForm({ ...payableForm, chequeNumber: e.target.value, pdcNumber: e.target.value })}
                      style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Remarks / Payment Note</label>
                <textarea
                  rows="2"
                  value={payableForm.remarks}
                  onChange={(e) => setPayableForm({ ...payableForm, remarks: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowPayableModal(false)} style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submittingPayable} style={{ backgroundColor: '#D97706', color: '#FFF', border: 'none', borderRadius: '8px', padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>
                  {submittingPayable ? 'Recording Payable...' : 'Confirm & Move to Local Payables'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewGrn && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '650px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#2563EB' }}>GRN #{viewGrn.grnNumber}</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Supplier: <strong>{viewGrn.supplierName}</strong></span>
              </div>
              <button onClick={() => setViewGrn(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', marginBottom: '16px', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
              <div><strong>Linked PO:</strong> {viewGrn.poNumber || viewGrn.supplierPONumber || 'None'}</div>
              <div><strong>Linked Sales Order:</strong> {viewGrn.salesOrderNumber || 'None'}</div>
              <div><strong>Status:</strong> {viewGrn.status || viewGrn.inspectionStatus || 'Completed'}</div>
              <div><strong>Date:</strong> {viewGrn.createdAt ? new Date(viewGrn.createdAt).toLocaleDateString() : '-'}</div>
              {viewGrn.remarks && <div style={{ gridColumn: 'span 2' }}><strong>Remarks:</strong> {viewGrn.remarks}</div>}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty Received</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Condition</th>
                </tr>
              </thead>
              <tbody>
                {viewGrn.items && viewGrn.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.productName}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{item.quantityReceived || item.receivedQty}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: item.condition === 'Good' ? '#059669' : '#DC2626' }}>{item.condition || 'Good'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  const target = viewGrn;
                  setViewGrn(null);
                  handleOpenMoveToPayableModal(target);
                }}
                style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CreditCard size={14} /> Move to Local Payable
              </button>
              <button onClick={() => setViewGrn(null)} style={{ backgroundColor: '#475569', color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
