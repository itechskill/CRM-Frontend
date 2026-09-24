import React, { useState, useEffect } from 'react';
import { Globe, Plus, Search, Eye, RefreshCw, CheckCircle2, ShoppingBag, X, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../utils/api';

export default function GlobalPurchaserPendingOrdersView({ searchQuery, onNavigateTab }) {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
    supplierCountry: 'China',
    poNumber: '',
    portOfLoading: '',
    portOfDischarge: 'Karachi Port',
    estimatedArrival: '',
    paymentTerms: 'LC at Sight',
    items: [],
    remarks: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordRes, suppRes] = await Promise.all([
        apiRequest('/api/purchaser/pending-orders?subDept=Global'),
        apiRequest('/api/purchaser/suppliers?type=Global')
      ]);
      if (ordRes.success) setOrders(ordRes.orders || ordRes.data || []);
      if (suppRes.success) setSuppliers(suppRes.suppliers || suppRes.data || []);
    } catch (err) {
      console.error('Error fetching global pending orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenPOModal = (order) => {
    setSelectedOrder(order);
    const orderItems = order.items && order.items.length > 0
      ? order.items.map(i => ({
          productName: i.description || i.productName || 'Imported Machine',
          description: i.description || '',
          quantity: Number(i.quantity) || 1,
          unitPricePKR: Number(i.unitPrice) || 0,
          totalPricePKR: Number(i.total) || (Number(i.quantity || 1) * Number(i.unitPrice || 0))
        }))
      : [{
          productName: order.productSummary || 'Global Imported Scope',
          description: order.productSummary || '',
          quantity: 1,
          unitPricePKR: Number(order.netAmount || order.totalAmount || 0),
          totalPricePKR: Number(order.netAmount || order.totalAmount || 0)
        }];

    setFormData({
      supplierId: '',
      supplierName: '',
      supplierCountry: 'China',
      poNumber: `GPO-${Date.now().toString().slice(-6)}`,
      portOfLoading: '',
      portOfDischarge: 'Karachi Port',
      estimatedArrival: '',
      paymentTerms: 'LC at Sight',
      items: orderItems,
      remarks: `International PO for Sales Order ${order.orderNumber || order.orderReference}`
    });
  };

  const handleSupplierSelect = (e) => {
    const val = e.target.value;
    if (val === 'NEW') {
      setFormData(prev => ({ ...prev, supplierId: 'NEW', supplierName: '', supplierCountry: 'China' }));
    } else {
      const s = (Array.isArray(suppliers) ? suppliers : []).find(sup => sup._id === val);
      if (s) {
        setFormData(prev => ({
          ...prev,
          supplierId: s._id,
          supplierName: s.name,
          supplierCountry: s.country || 'China'
        }));
      }
    }
  };

  const handleItemChange = (index, field, val) => {
    const updated = [...formData.items];
    updated[index][field] = val;
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
      items: [...prev.items, { productName: '', description: '', quantity: 1, unitPricePKR: 0, totalPricePKR: 0 }]
    }));
  };

  const removeItem = (idx) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, it) => sum + (Number(it.totalPricePKR) || 0), 0);
  };

  const handleSubmitPO = async (e) => {
    e.preventDefault();
    if (!formData.supplierName.trim()) {
      alert('Please select or enter an overseas supplier name.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        salesOrderId: selectedOrder._id,
        poNumber: formData.poNumber,
        poType: 'Global',
        subType: 'Global',
        supplierId: formData.supplierId && formData.supplierId !== 'NEW' ? formData.supplierId : undefined,
        supplierName: formData.supplierName.trim(),
        supplierCountry: formData.supplierCountry || 'China',
        portOfLoading: formData.portOfLoading,
        portOfDischarge: formData.portOfDischarge,
        estimatedArrival: formData.estimatedArrival,
        paymentTerms: formData.paymentTerms,
        items: formData.items,
        totalAmountPKR: calculateTotal(),
        notes: formData.remarks
      };

      const res = await apiRequest('/api/purchaser/pos', 'POST', payload);
      if (res.success) {
        setToast(`Supplier PO #${formData.poNumber} issued successfully for Sales Order ${selectedOrder.orderNumber || selectedOrder.orderReference}!`);
        setSelectedOrder(null);
        fetchData();
        setTimeout(() => setToast(''), 5000);
      } else {
        alert(res.message || 'Error creating Global Purchase Order.');
      }
    } catch (err) {
      console.error('Error creating global PO:', err);
      alert('Server error creating Purchase Order.');
    } finally {
      setSubmitting(false);
    }
  };

  const searchVal = (filterText || searchQuery || '').toLowerCase();
  const filtered = orders.filter(o =>
    (o.orderNumber || o.orderReference || '').toLowerCase().includes(searchVal) ||
    (o.clientName || '').toLowerCase().includes(searchVal) ||
    (o.workflowStatus || '').toLowerCase().includes(searchVal)
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={24} color="#2563EB" /> Pending Sales Orders (Blue File)
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
            Sales orders cleared by Finance department awaiting International Supplier PO creation
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#2563EB',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 16px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {toast && (
        <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', color: '#1E40AF', padding: '14px 18px', borderRadius: '10px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} color="#2563EB" /> {toast}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div style={{ backgroundColor: '#FFF', padding: '14px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={16} color="#94A3B8" />
        <input
          type="text"
          placeholder="Filter by Order #, Customer name, or status..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: '#1E293B' }}
        />
      </div>

      {/* Orders Table */}
      <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, color: '#1E3A8A', fontSize: '0.95rem' }}>
            Queue: {filtered.length} Blue File Order{filtered.length !== 1 ? 's' : ''} Waiting for Overseas PO
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
            All orders here are verified clear by Finance
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading pending orders...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
            <CheckCircle2 size={40} color="#059669" style={{ marginBottom: '10px' }} />
            <h4 style={{ margin: 0, color: '#0F172A', fontSize: '1.1rem' }}>No Pending Blue File Orders</h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>All Blue File orders from Finance have been issued international POs.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Sales Order #</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Customer</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Product Scope / Items</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Order Amount</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Current Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Order Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ord => (
                  <tr key={ord._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A' }}>
                      {ord.orderNumber || ord.orderReference}
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#2563EB', fontWeight: 700 }}>Blue File (Imported)</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1E293B' }}>
                      {ord.clientName}
                      {ord.clientPhone && <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B' }}>{ord.clientPhone}</span>}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', maxWidth: '280px' }}>
                      {ord.items && ord.items.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {ord.items.map((it, idx) => (
                            <span key={idx} style={{ fontSize: '0.8rem' }}>
                              • <strong>{it.description || it.productName || 'Item'}</strong> ({it.quantity || 1} {it.unit || 'pcs'})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span>{ord.productSummary || 'General Imported Scope'}</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#2563EB' }}>
                      PKR {Number(ord.netAmount || ord.totalAmount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                        {ord.workflowStatus || ord.status || 'Pending Procurement'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#64748B' }}>
                      {ord.orderDate ? new Date(ord.orderDate).toLocaleDateString() : (ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : '—')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenPOModal(ord)}
                        style={{
                          background: '#2563EB',
                          color: '#FFF',
                          border: 'none',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)'
                        }}
                      >
                        <Plus size={14} /> Create Supplier PO
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE SUPPLIER PO MODAL */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1E3A8A' }}>
                  Issue International Supplier PO
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                  Linked to Sales Order: <strong style={{ color: '#0F172A' }}>{selectedOrder.orderNumber || selectedOrder.orderReference}</strong> ({selectedOrder.clientName})
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSubmitPO}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    PO Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.poNumber}
                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', fontWeight: 700, color: '#2563EB', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Select Existing Overseas Vendor
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={handleSupplierSelect}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Choose Vendor or Enter New --</option>
                    {(Array.isArray(suppliers) ? suppliers : []).map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.country || 'Global'})</option>
                    ))}
                    <option value="NEW">+ Type New Global Supplier</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shanghai Machinery Co."
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Supplier Country
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. China, Germany, USA"
                    value={formData.supplierCountry}
                    onChange={(e) => setFormData({ ...formData, supplierCountry: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Port of Loading
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ningbo / Shanghai Port"
                    value={formData.portOfLoading}
                    onChange={(e) => setFormData({ ...formData, portOfLoading: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Port of Discharge
                  </label>
                  <input
                    type="text"
                    value={formData.portOfDischarge}
                    onChange={(e) => setFormData({ ...formData, portOfDischarge: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Estimated Arrival Date (ETA)
                  </label>
                  <input
                    type="date"
                    value={formData.estimatedArrival}
                    onChange={(e) => setFormData({ ...formData, estimatedArrival: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Items Section */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E3A8A' }}>
                    PO Items &amp; Cost Breakdown (PKR)
                  </label>
                  <button type="button" onClick={addItem} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                    + Add Item
                  </button>
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <tr>
                        <th style={{ padding: '8px 12px' }}>Product / Description</th>
                        <th style={{ padding: '8px 12px', width: '90px' }}>Qty</th>
                        <th style={{ padding: '8px 12px', width: '130px' }}>Unit Price (PKR)</th>
                        <th style={{ padding: '8px 12px', width: '140px' }}>Total (PKR)</th>
                        <th style={{ padding: '8px 12px', width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '6px 10px' }}>
                            <input
                              type="text"
                              required
                              value={it.productName}
                              onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <input
                              type="number"
                              min="0"
                              value={it.unitPricePKR}
                              onChange={(e) => handleItemChange(idx, 'unitPricePKR', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px', fontWeight: 700, color: '#2563EB' }}>
                            Rs. {Number(it.totalPricePKR || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            {formData.items.length > 1 && (
                              <button type="button" onClick={() => removeItem(idx)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                                <X size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                  Total PO Amount: <span style={{ color: '#2563EB' }}>PKR {calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              {/* Remarks */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  PO Notes / Specifications
                </label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '9px 18px', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: '#2563EB', border: 'none', padding: '9px 22px', borderRadius: '8px', fontWeight: 800, color: '#FFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {submitting ? 'Issuing PO...' : 'Confirm & Issue Supplier PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
