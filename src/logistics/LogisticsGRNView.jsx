import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Search, Trash2, X, Eye, CheckCircle2, ArrowRight, PackageCheck, Truck } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function LogisticsGRNView({ searchQuery, onNavigateTab }) {
  const [grns, setGrns] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewGrn, setViewGrn] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [toast, setToast] = useState('');

  // Form State for creating GRN
  const [formData, setFormData] = useState({
    grnNumber: `GRN-LOG-${Date.now().toString().slice(-6)}`,
    grnType: 'Logistics',
    salesOrderId: '',
    salesOrderNumber: '',
    supplierName: '',
    supplierPONumber: '',
    deliveryNoteNumber: '',
    inspectionStatus: 'Accepted',
    items: [{ productName: '', orderedQty: 1, quantityReceived: 1, condition: 'Good' }],
    remarks: 'Goods received in Logistics. Checked and verified.'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [grnRes, pendingRes] = await Promise.all([
        apiRequest('/api/logistics/grns'),
        apiRequest('/api/logistics/pending-grns')
      ]);

      if (grnRes.success) {
        const list = Array.isArray(grnRes.grns)
          ? grnRes.grns
          : (Array.isArray(grnRes.data) ? grnRes.data : []);
        setGrns(list);
      } else {
        setGrns([]);
      }

      if (pendingRes.success) {
        const pendingList = Array.isArray(pendingRes.orders)
          ? pendingRes.orders
          : (Array.isArray(pendingRes.data) ? pendingRes.data : []);
        setPendingOrders(pendingList);
      } else {
        setPendingOrders([]);
      }
    } catch (err) {
      console.error('Error fetching Logistics GRN data:', err);
      setGrns([]);
      setPendingOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOrderSelect = (e) => {
    const orderId = e.target.value;
    if (!orderId) {
      setFormData(prev => ({
        ...prev,
        salesOrderId: '',
        salesOrderNumber: '',
        supplierName: '',
        supplierPONumber: '',
        deliveryNoteNumber: '',
        items: [{ productName: '', orderedQty: 1, quantityReceived: 1, condition: 'Good' }]
      }));
      return;
    }

    const order = pendingOrders.find(o => o._id === orderId);
    if (order) {
      const orderItems = order.items && order.items.length > 0
        ? order.items.map(i => ({
          productName: i.productName || i.description || i.item || 'Product Item',
          orderedQty: Number(i.quantity) || 1,
          quantityReceived: Number(i.quantity) || 1,
          condition: 'Good'
        }))
        : [{ productName: order.orderReference || 'Goods from Order', orderedQty: 1, quantityReceived: 1, condition: 'Good' }];

      setFormData(prev => ({
        ...prev,
        salesOrderId: order._id,
        salesOrderNumber: order.orderNumber || order.orderReference || '',
        supplierName: order.supplierName || order.clientName || 'Logistics Supplier',
        supplierPONumber: order.supplierPoNumber || order.poNumber || '',
        deliveryNoteNumber: order.trackingNumber || order.deliveryNoteNumber || '',
        items: orderItems,
        remarks: `Logistics GRN for Order #${order.orderNumber || order.orderReference}. Goods received and verified.`
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
      items: [...prev.items, { productName: '', orderedQty: 1, quantityReceived: 1, condition: 'Good' }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const openCreateModal = () => {
    setFormData({
      grnNumber: `GRN-LOG-${Date.now().toString().slice(-6)}`,
      grnType: 'Logistics',
      salesOrderId: '',
      salesOrderNumber: '',
      supplierName: '',
      supplierPONumber: '',
      deliveryNoteNumber: '',
      inspectionStatus: 'Accepted',
      items: [{ productName: '', orderedQty: 1, quantityReceived: 1, condition: 'Good' }],
      remarks: 'Goods received in Logistics. Checked and verified.'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        grnNumber: formData.grnNumber,
        grnType: 'Logistics',
        salesOrderId: formData.salesOrderId || undefined,
        salesOrderNumber: formData.salesOrderNumber || undefined,
        supplierName: formData.supplierName || 'Logistics Incoming',
        supplierPONumber: formData.supplierPONumber || '',
        deliveryNoteNumber: formData.deliveryNoteNumber || '',
        inspectionStatus: formData.inspectionStatus || 'Accepted',
        remarks: formData.remarks || 'Logistics Goods Receipt Note',
        items: formData.items.map(it => ({
          productName: it.productName || 'Item',
          orderedQty: Number(it.orderedQty) || 1,
          receivedQty: Number(it.quantityReceived) || 1,
          quantityReceived: Number(it.quantityReceived) || 1,
          condition: it.condition || 'Good'
        }))
      };

      const res = await apiRequest('/api/logistics/grn', 'POST', payload);
      if (res.success) {
        setToast(`Goods Receipt Note #${formData.grnNumber} saved successfully! ${formData.salesOrderId ? 'Order moved to Support.' : ''}`);
        setShowModal(false);
        fetchData();
        setTimeout(() => setToast(''), 4500);
      } else {
        alert(res.message || 'Error creating Goods Receipt Note.');
      }
    } catch (err) {
      console.error('Error submitting GRN:', err);
      alert('Failed to save Goods Receipt Note.');
    } finally {
      setSubmitting(false);
    }
  };

  const searchVal = (filterText || searchQuery || '').toLowerCase();
  const filtered = grns.filter(g =>
    (g.grnNumber || '').toLowerCase().includes(searchVal) ||
    (g.supplierName || '').toLowerCase().includes(searchVal) ||
    (g.poNumber || '').toLowerCase().includes(searchVal) ||
    (g.salesOrderNumber || '').toLowerCase().includes(searchVal) ||
    (g.remarks || '').toLowerCase().includes(searchVal)
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Page Header matching Local Purchaser portal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <ClipboardCheck size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Goods Received NO (GRN)</h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
              Verify &amp; record incoming goods against Orders/Shipments, then forward verified goods to Support
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
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
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            transition: 'all 0.2s'
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

      {/* Search Input */}
      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '420px' }}>
        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search GRN#, Order#, Supplier, or Carrier..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
        />
      </div>

      {/* Pending Orders Table */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>Pending Blue File Orders Awaiting GRN</h3>
        <div style={{ backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Order Number</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Client Name</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>File Type</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>Loading pending orders...</td></tr>
              ) : pendingOrders.length > 0 ? (
                pendingOrders.map(order => (
                  <tr key={order._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#2563EB' }}>{order.orderNumber || order.orderReference}</td>
                    <td style={{ padding: '14px 20px', color: '#0F172A' }}>{order.clientName || 'N/A'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                        {order.fileType || 'Blue'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748B' }}>{order.workflowStatus || order.status}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          openCreateModal();
                          handleOrderSelect({ target: { value: order._id } });
                        }}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #2563EB', background: '#EFF6FF', color: '#2563EB', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Create GRN
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                    No pending blue file orders awaiting GRN.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>Goods Received Notes (History)</h3>
      {/* Table of GRNs */}
      <div style={{ backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>GRN Number</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Type</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Source / Supplier</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Linked Order / PO #</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Received Date</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>Loading GRN records...</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map((grn) => (
                <tr key={grn._id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#2563EB' }}>
                    {grn.grnNumber}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: grn.grnType === 'Logistics' ? '#EFF6FF' : '#F3E8FF', color: grn.grnType === 'Logistics' ? '#1D4ED8' : '#7E22CE' }}>
                      {grn.grnType || 'Logistics'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0F172A' }}>
                    {grn.supplierName || 'Logistics Receiving'}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>
                    {grn.salesOrderNumber ? (
                      <span style={{ fontWeight: 600, color: '#059669' }}>SO: {grn.salesOrderNumber}</span>
                    ) : grn.poNumber ? (
                      <span>PO: {grn.poNumber}</span>
                    ) : grn.deliveryNoteNumber ? (
                      <span>Ref: {grn.deliveryNoteNumber}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748B' }}>
                    {grn.createdAt ? new Date(grn.createdAt).toLocaleDateString() : (grn.grnDate ? new Date(grn.grnDate).toLocaleDateString() : '-')}
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
                    <button
                      onClick={() => setViewGrn(grn)}
                      style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={14} /> View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8' }}>
                  <PackageCheck size={40} style={{ margin: '0 auto 12px', display: 'block', color: '#CBD5E1' }} />
                  <p style={{ margin: 0, fontWeight: 600, color: '#64748B' }}>No Goods Received Notes found.</p>
                  <p style={{ margin: '6px 0 16px', fontSize: '0.85rem' }}>Record incoming shipment goods to create a GRN and forward to Support.</p>
                  <button
                    onClick={openCreateModal}
                    style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Record First GRN
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* RECORD GRN MODAL (Identical in form & function to Local Purchaser portal) */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '780px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EFF6FF' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1E40AF' }}>Record Goods Received Note (GRN)</h3>
                <span style={{ fontSize: '0.82rem', color: '#3B82F6' }}>Select Sales Order / Shipment to auto-pull items or record custom received goods</span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Select Pending Sales Order / Shipment
                  </label>
                  <select
                    value={formData.salesOrderId}
                    onChange={handleOrderSelect}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    <option value="">-- Manual / Custom Incoming Goods --</option>
                    {pendingOrders.map(o => (
                      <option key={o._id} value={o._id}>
                        {o.orderNumber || o.orderReference} — {o.clientName || 'Order'} ({o.items?.length || 0} items)
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Source / Supplier / Carrier *</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                    placeholder="e.g. DHL / Supplier Name / Courier"
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Delivery Slip / Tracking #</label>
                  <input
                    type="text"
                    value={formData.deliveryNoteNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryNoteNumber: e.target.value }))}
                    placeholder="AWB / Tracking / Slip number"
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Inspection Status</label>
                  <select
                    value={formData.inspectionStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, inspectionStatus: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    <option value="Accepted">Accepted (Good Condition)</option>
                    <option value="Partial">Partial Acceptance</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Linked PO # (Optional)</label>
                  <input
                    type="text"
                    value={formData.supplierPONumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierPONumber: e.target.value }))}
                    placeholder="Supplier PO #"
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
                  gridTemplateColumns: '1fr 90px 90px 160px 36px',
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
                  <div style={{ textAlign: 'center' }}>Ordered</div>
                  <div style={{ textAlign: 'center' }}>Received</div>
                  <div>Condition</div>
                  <div></div>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 160px 36px', gap: '10px', alignItems: 'center', marginBottom: '8px', backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <input
                      type="text"
                      placeholder="Product Description / Name"
                      value={item.productName}
                      onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                      required
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
                    />
                    <input
                      type="number"
                      placeholder="Ordered"
                      min="1"
                      value={item.orderedQty}
                      onChange={(e) => handleItemChange(idx, 'orderedQty', e.target.value)}
                      required
                      title="Ordered Quantity"
                      style={{ padding: '7px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600, width: '100%', boxSizing: 'border-box' }}
                    />
                    <input
                      type="number"
                      placeholder="Received"
                      min="1"
                      value={item.quantityReceived}
                      onChange={(e) => handleItemChange(idx, 'quantityReceived', e.target.value)}
                      required
                      title="Received Quantity"
                      style={{ padding: '7px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', textAlign: 'center', fontWeight: 700, color: '#2563EB', width: '100%', boxSizing: 'border-box' }}
                    />
                    <select
                      value={item.condition}
                      onChange={(e) => handleItemChange(idx, 'condition', e.target.value)}
                      style={{ padding: '7px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="Good">Good Condition</option>
                      <option value="Damaged">Damaged</option>
                      <option value="Partial">Partial Defect</option>
                      <option value="Wrong Item">Wrong Item</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={formData.items.length <= 1}
                      style={{ background: 'none', border: 'none', color: formData.items.length <= 1 ? '#CBD5E1' : '#EF4444', cursor: formData.items.length <= 1 ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Remarks */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>GRN Remarks / Physical Inspection Notes</label>
                <textarea
                  rows="3"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Notes on packaging, condition, invoice references, or handover details..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                {formData.salesOrderId ? (
                  <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRight size={16} /> Saving this GRN will automatically forward the Blue File to Support.
                  </span>
                ) : (
                  <span></span>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#FFF', fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? 'Saving GRN...' : 'Save Goods Received Note'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW GRN MODAL */}
      {viewGrn && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>{viewGrn.grnNumber}</h3>
                <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  Recorded on {new Date(viewGrn.createdAt || viewGrn.grnDate).toLocaleString()} {viewGrn.createdByName ? `by ${viewGrn.createdByName}` : ''}
                </span>
              </div>
              <button onClick={() => setViewGrn(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Source / Supplier</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{viewGrn.supplierName || 'Logistics Transfer'}</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Linked Sales Order</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563EB', marginTop: '2px' }}>{viewGrn.salesOrderNumber || '—'}</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Delivery Slip / Challan #</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>{viewGrn.poNumber || viewGrn.deliveryNoteNumber || '—'}</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Inspection Status</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669', marginTop: '2px' }}>{viewGrn.status || viewGrn.inspectionStatus || 'Accepted'}</div>
                </div>
              </div>

              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Received Items &amp; Quantity</h4>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Product</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Ordered</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Received</th>
                      <th style={{ padding: '10px 14px' }}>Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewGrn.items && viewGrn.items.length > 0) ? (
                      viewGrn.items.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0F172A' }}>{it.productName || it.description}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', color: '#64748B' }}>{it.orderedQty || it.quantity || 1}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#2563EB' }}>{it.quantityReceived || it.receivedQty || it.quantity || 1}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#DEF7EC', color: '#03543F' }}>
                              {it.condition || 'Good'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#94A3B8' }}>No items recorded</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {viewGrn.remarks && (
                <div style={{ backgroundColor: '#F1F5F9', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Remarks / Inspection Note:</span>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>{viewGrn.remarks}</div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setViewGrn(null)}
                  style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
