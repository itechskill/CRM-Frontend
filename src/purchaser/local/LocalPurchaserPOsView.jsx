import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Trash2, X, Eye, Edit3, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { apiRequest } from '../../utils/api';

export default function LocalPurchaserPOsView({ searchQuery }) {
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewPo, setViewPo] = useState(null);
  const [editPo, setEditPo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [toast, setToast] = useState('');

  // Create PO Form State
  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
    supplierContact: '',
    poNumber: `LPO-${Date.now().toString().slice(-6)}`,
    expectedDeliveryDate: '',
    items: [{ productName: '', quantity: 1, unitPricePKR: 0, totalPricePKR: 0 }],
    paymentTerms: 'Net 30',
    remarks: ''
  });

  // Edit PO Form State
  const [editFormData, setEditFormData] = useState({
    supplierName: '',
    expectedDeliveryDate: '',
    notes: '',
    items: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posRes, suppRes] = await Promise.all([
        apiRequest('/api/purchaser/pos?subType=Local'),
        apiRequest('/api/purchaser/suppliers?type=Local')
      ]);
      if (posRes.success) {
        setPos(Array.isArray(posRes.pos) ? posRes.pos : (Array.isArray(posRes.data) ? posRes.data : []));
      }
      if (suppRes.success) {
        setSuppliers(Array.isArray(suppRes.suppliers) ? suppRes.suppliers : (Array.isArray(suppRes.data) ? suppRes.data : []));
      }
    } catch (err) {
      console.error('Error fetching Local POs:', err);
      setPos([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSupplierSelect = (e) => {
    const id = e.target.value;
    if (id === 'NEW') {
      setFormData(prev => ({ ...prev, supplierId: 'NEW', supplierName: '', supplierContact: '' }));
    } else {
      const s = (Array.isArray(suppliers) ? suppliers : []).find(sup => sup._id === id);
      if (s) {
        setFormData(prev => ({
          ...prev,
          supplierId: s._id,
          supplierName: s.name,
          supplierContact: s.phone || s.email || ''
        }));
      }
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'unitPricePKR') {
      const q = Number(updated[index].quantity || 0);
      const p = Number(updated[index].unitPricePKR || 0);
      updated[index].totalPricePKR = q * p;
    }
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: 1, unitPricePKR: 0, totalPricePKR: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalPKR = () => {
    return formData.items.reduce((sum, item) => sum + (Number(item.totalPricePKR) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierName) {
      alert('Please enter or select a supplier.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        poNumber: formData.poNumber,
        subType: 'Local',
        poType: 'Local',
        supplierId: formData.supplierId !== 'NEW' ? formData.supplierId : undefined,
        supplierName: formData.supplierName,
        supplierContact: formData.supplierContact,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        items: formData.items,
        totalAmountPKR: calculateTotalPKR(),
        totalAmount: calculateTotalPKR(),
        paymentTerms: formData.paymentTerms,
        remarks: formData.remarks,
        notes: formData.remarks
      };

      const res = await apiRequest('/api/purchaser/pos', 'POST', payload);
      if (res.success) {
        setToast(`Local Supplier PO #${formData.poNumber} created successfully and added to list!`);
        setShowModal(false);
        setFormData({
          supplierId: '',
          supplierName: '',
          supplierContact: '',
          poNumber: `LPO-${Date.now().toString().slice(-6)}`,
          expectedDeliveryDate: '',
          items: [{ productName: '', quantity: 1, unitPricePKR: 0, totalPricePKR: 0 }],
          paymentTerms: 'Net 30',
          remarks: ''
        });
        fetchData();
        setTimeout(() => setToast(''), 4500);
      } else {
        alert(res.message || 'Error creating PO');
      }
    } catch (err) {
      console.error('Error creating local PO:', err);
      alert('Failed to save Purchase Order.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit PO Modal
  const handleOpenEditModal = (po) => {
    setEditPo(po);
    const poItems = po.items && po.items.length > 0 ? po.items.map(it => ({
      productName: it.productName || it.description || '',
      quantity: Number(it.quantity) || 1,
      unitPricePKR: Number(it.unitPrice || it.unitPricePKR) || 0,
      totalPricePKR: Number(it.totalAmount || it.totalPricePKR) || ((Number(it.quantity) || 1) * (Number(it.unitPrice || it.unitPricePKR) || 0))
    })) : [{ productName: '', quantity: 1, unitPricePKR: 0, totalPricePKR: 0 }];

    setEditFormData({
      supplierName: po.supplierName || '',
      expectedDeliveryDate: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toISOString().split('T')[0] : '',
      notes: po.notes || po.remarks || '',
      items: poItems
    });
  };

  const handleEditItemChange = (index, field, value) => {
    const updated = [...editFormData.items];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'unitPricePKR') {
      const q = Number(updated[index].quantity || 0);
      const p = Number(updated[index].unitPricePKR || 0);
      updated[index].totalPricePKR = q * p;
    }
    setEditFormData(prev => ({ ...prev, items: updated }));
  };

  const addEditItem = () => {
    setEditFormData(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: 1, unitPricePKR: 0, totalPricePKR: 0 }]
    }));
  };

  const removeEditItem = (index) => {
    if (editFormData.items.length === 1) return;
    setEditFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdatePO = async (e) => {
    e.preventDefault();
    if (!editPo) return;
    setUpdating(true);
    try {
      const totalAmount = editFormData.items.reduce((s, it) => s + (Number(it.totalPricePKR) || 0), 0);
      const payload = {
        supplierName: editFormData.supplierName,
        expectedDeliveryDate: editFormData.expectedDeliveryDate || undefined,
        notes: editFormData.notes,
        items: editFormData.items.map(it => ({
          productName: it.productName,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPricePKR) || 0,
          unitPricePKR: Number(it.unitPricePKR) || 0,
          totalAmount: Number(it.totalPricePKR) || 0,
          totalPricePKR: Number(it.totalPricePKR) || 0
        })),
        totalAmount,
        totalAmountPKR: totalAmount,
        remarks: 'Direct PO edit by Local Purchaser'
      };

      const res = await apiRequest(`/api/purchaser/pos/${editPo._id}`, 'PUT', payload);
      if (res.success) {
        setToast(`Supplier PO #${editPo.poNumber} updated successfully!`);
        setEditPo(null);
        fetchData();
        setTimeout(() => setToast(''), 4500);
      } else {
        alert(res.message || 'Error updating PO');
      }
    } catch (err) {
      console.error('Error updating PO:', err);
      alert('Failed to update Purchase Order.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePO = async (po) => {
    if (!window.confirm(`Are you sure you want to delete Local Supplier PO #${po.poNumber} for "${po.supplierName}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(po._id);
    try {
      const res = await apiRequest(`/api/purchaser/pos/${po._id}`, 'DELETE');
      if (res.success) {
        setToast(`Supplier PO #${po.poNumber} deleted successfully.`);
        fetchData();
        setTimeout(() => setToast(''), 4500);
      } else {
        alert(res.message || 'Failed to delete PO.');
      }
    } catch (err) {
      console.error('Error deleting PO:', err);
      alert('Error deleting Purchase Order.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatPKR = (num) => `PKR ${Number(num || 0).toLocaleString('en-PK')}`;

  const searchVal = (filterText || searchQuery || '').toLowerCase();
  const filtered = pos.filter(po =>
    (po.poNumber || '').toLowerCase().includes(searchVal) ||
    (po.supplierName || '').toLowerCase().includes(searchVal) ||
    (po.salesOrderNumber || '').toLowerCase().includes(searchVal)
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>PO Issued to Supplier (Local)</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>Issue, view, edit &amp; track purchase orders for local vendors</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#059669',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
          }}
        >
          <Plus size={18} />
          <span>Create Local Supplier PO</span>
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
          placeholder="Search by PO#, Supplier Name, or Sales Order #..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
        />
      </div>

      {/* PO Table */}
      <div style={{ backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>PO Number</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Supplier</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Linked Order</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Issued Date</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Items Count</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Total (PKR)</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>Loading POs...</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map((po) => (
                <tr key={po._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#059669' }}>{po.poNumber}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0F172A' }}>
                    {po.supplierName}
                    {po.supplierContact && <span style={{ display: 'block', fontSize: '0.74rem', color: '#64748B' }}>{po.supplierContact}</span>}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>
                    {po.salesOrderNumber || (po.salesOrderId ? 'Linked SO' : '—')}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748B' }}>
                    {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : (po.poDate ? new Date(po.poDate).toLocaleDateString() : '-')}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748B' }}>{po.items ? po.items.length : 0} items</td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>
                    {formatPKR(po.totalAmount || po.totalAmountPKR || 0)}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor:
                        po.status === 'Fully Received' || po.status === 'Completed' ? '#DEF7EC' :
                        po.status === 'Partially Received' ? '#EFF6FF' : '#FEF3C7',
                      color:
                        po.status === 'Fully Received' || po.status === 'Completed' ? '#03543F' :
                        po.status === 'Partially Received' ? '#1D4ED8' : '#92400E'
                    }}>
                      {po.status || 'Issued'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setViewPo(po)}
                        style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="View PO Details"
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(po)}
                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: '#1D4ED8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Edit Supplier PO"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeletePO(po)}
                        disabled={deletingId === po._id}
                        style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: '#DC2626', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Delete Supplier PO"
                      >
                        <Trash2 size={13} /> {deletingId === po._id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>No Local POs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal Form */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#065F46' }}>Create Local Supplier Purchase Order</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Select Supplier</label>
                  <select
                    value={formData.supplierId}
                    onChange={handleSupplierSelect}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    <option value="">-- Choose Existing Supplier --</option>
                    {(Array.isArray(suppliers) ? suppliers : []).map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.phone || 'Local'})</option>
                    ))}
                    <option value="NEW">+ Enter New Supplier</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>PO Number</label>
                  <input
                    type="text"
                    value={formData.poNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, color: '#059669' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Supplier Name *</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                    placeholder="Company or Contact Person Name"
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Supplier Phone / Contact</label>
                  <input
                    type="text"
                    value={formData.supplierContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierContact: e.target.value }))}
                    placeholder="Phone or Email"
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Expected Delivery Date</label>
                  <input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Payment Terms</label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Items Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Items &amp; Pricing</h4>
                  <button type="button" onClick={addItem} style={{ background: '#ECFDF5', color: '#059669', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr 2fr 40px', gap: '10px', alignItems: 'center', marginBottom: '10px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <input
                      type="text"
                      placeholder="Product Name / Description"
                      value={item.productName}
                      onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                      required
                      style={{ padding: '7px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                      style={{ padding: '7px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', textAlign: 'center' }}
                    />
                    <input
                      type="number"
                      placeholder="Unit Price (PKR)"
                      min="0"
                      value={item.unitPricePKR}
                      onChange={(e) => handleItemChange(idx, 'unitPricePKR', e.target.value)}
                      required
                      style={{ padding: '7px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', textAlign: 'right' }}
                    />
                    <div style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '0.85rem' }}>
                      {formatPKR(item.totalPricePKR)}
                    </div>
                    {formData.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total & Submit */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                  Total PO Amount: <span style={{ color: '#059669' }}>{formatPKR(calculateTotalPKR())}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={submitting} style={{ backgroundColor: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>
                    {submitting ? 'Creating PO...' : 'Issue Local Supplier PO'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit PO Modal */}
      {editPo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EFF6FF' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1E40AF' }}>Edit Supplier PO #{editPo.poNumber}</h3>
                <span style={{ fontSize: '0.82rem', color: '#3B82F6' }}>Category A Direct Edit (No CEO permission required)</span>
              </div>
              <button onClick={() => setEditPo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdatePO} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Supplier Name *</label>
                  <input
                    type="text"
                    value={editFormData.supplierName}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Expected Delivery Date</label>
                  <input
                    type="date"
                    value={editFormData.expectedDeliveryDate}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Notes / Remarks</label>
                  <input
                    type="text"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Edit Items Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>PO Line Items</h4>
                  <button type="button" onClick={addEditItem} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                {editFormData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr 2fr 40px', gap: '10px', alignItems: 'center', marginBottom: '10px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={item.productName}
                      onChange={(e) => handleEditItemChange(idx, 'productName', e.target.value)}
                      required
                      style={{ padding: '7px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleEditItemChange(idx, 'quantity', e.target.value)}
                      required
                      style={{ padding: '7px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', textAlign: 'center' }}
                    />
                    <input
                      type="number"
                      placeholder="Unit Price"
                      min="0"
                      value={item.unitPricePKR}
                      onChange={(e) => handleEditItemChange(idx, 'unitPricePKR', e.target.value)}
                      required
                      style={{ padding: '7px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', textAlign: 'right' }}
                    />
                    <div style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '0.85rem' }}>
                      {formatPKR(item.totalPricePKR)}
                    </div>
                    {editFormData.items.length > 1 && (
                      <button type="button" onClick={() => removeEditItem(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                  Updated Total: <span style={{ color: '#059669' }}>{formatPKR(editFormData.items.reduce((s, it) => s + (Number(it.totalPricePKR) || 0), 0))}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setEditPo(null)} style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={updating} style={{ backgroundColor: '#1D4ED8', color: '#FFF', border: 'none', borderRadius: '8px', padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>
                    {updating ? 'Saving Changes...' : 'Save PO Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewPo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '680px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>PO #{viewPo.poNumber}</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Supplier: <strong>{viewPo.supplierName}</strong> {viewPo.supplierContact ? `(${viewPo.supplierContact})` : ''}
                </span>
              </div>
              <button onClick={() => setViewPo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', marginBottom: '16px', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
              <div><strong>Status:</strong> {viewPo.status || 'Issued'}</div>
              <div><strong>Linked Sales Order:</strong> {viewPo.salesOrderNumber || 'None'}</div>
              <div><strong>Issued Date:</strong> {viewPo.createdAt ? new Date(viewPo.createdAt).toLocaleDateString() : '-'}</div>
              <div><strong>Expected Delivery:</strong> {viewPo.expectedDeliveryDate ? new Date(viewPo.expectedDeliveryDate).toLocaleDateString() : 'N/A'}</div>
              {viewPo.notes && <div style={{ gridColumn: 'span 2' }}><strong>Notes:</strong> {viewPo.notes}</div>}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Price (PKR)</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {viewPo.items && viewPo.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.productName}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatPKR(item.unitPrice || item.unitPricePKR)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{formatPKR(item.totalAmount || item.totalPricePKR)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#0F172A', marginBottom: '20px' }}>
              <span>Total PO Value:</span>
              <span style={{ color: '#059669' }}>{formatPKR(viewPo.totalAmount || viewPo.totalAmountPKR)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => {
                  const target = viewPo;
                  setViewPo(null);
                  handleOpenEditModal(target);
                }}
                style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit3 size={14} /> Edit PO
              </button>
              <button onClick={() => setViewPo(null)} style={{ backgroundColor: '#475569', color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
