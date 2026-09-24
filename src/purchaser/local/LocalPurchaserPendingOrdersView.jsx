import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  PackageCheck,
  AlertTriangle,
  Send,
  Plus,
  X,
  Eye,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ClipboardList,
  Layers
} from 'lucide-react';
import { apiRequest } from '../../utils/api';

export default function LocalPurchaserPendingOrdersView({ searchQuery, onNavigateTab }) {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState(null);
  const [toast, setToast] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Inventory check result modal
  const [analysisModal, setAnalysisModal] = useState(null);

  // Supplier PO creation modal
  const [showPoModal, setShowPoModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submittingPo, setSubmittingPo] = useState(false);
  const [poForm, setPoForm] = useState({
    supplierId: '',
    supplierName: '',
    poNumber: '',
    expectedDeliveryDate: '',
    items: [],
    notes: ''
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [ordRes, suppRes] = await Promise.all([
        apiRequest('/api/purchaser/pending-orders?subDept=Local'),
        apiRequest('/api/purchaser/suppliers?type=Local')
      ]);
      if (ordRes.success) setOrders(Array.isArray(ordRes.orders) ? ordRes.orders : (Array.isArray(ordRes.data) ? ordRes.data : []));
      if (suppRes.success) setSuppliers(Array.isArray(suppRes.suppliers) ? suppRes.suppliers : (Array.isArray(suppRes.data) ? suppRes.data : []));
    } catch (err) {
      console.error('Error fetching pending local orders:', err);
      setOrders([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatPKR = (num) => `PKR ${Number(num || 0).toLocaleString('en-PK')}`;

  // 1. Check Inventory Handler
  const handleCheckInventory = async (order) => {
    setCheckingId(order._id);
    try {
      const res = await apiRequest(`/api/purchaser/orders/${order._id}/inventory-check`, 'POST');
      if (res.success) {
        setAnalysisModal({
          order,
          analysis: res.data?.itemAnalysis || order.inventoryAnalysis || [],
          status: res.data?.status || (order.inventoryCheckStatus || 'In Stock'),
          totalOrdered: res.data?.totalOrdered || 0,
          totalAvailable: res.data?.totalAvailable || 0,
          totalStockValue: res.data?.totalStockValue || 0,
          orderTotalAmount: res.data?.orderTotalAmount || Number(order.netAmount || order.totalAmount || 0),
          message: res.message
        });
        fetchOrders();
      } else {
        alert(res.message || 'Error checking inventory.');
      }
    } catch (err) {
      console.error('Error performing inventory check:', err);
      alert('Failed to perform inventory check.');
    } finally {
      setCheckingId(null);
    }
  };

  // 2. Open Supplier PO Modal for Shortage
  const handleOpenPoModal = (order, customItems = null) => {
    setSelectedOrder(order);
    const orderItems = customItems || (order.items && order.items.length > 0 ? order.items.map(i => ({
      productName: i.description || i.productName || 'Stock Item',
      quantity: Number(i.quantity) || 1,
      unitPrice: Number(i.unitPrice) || 0,
      totalAmount: Number(i.total) || ((Number(i.quantity) || 1) * (Number(i.unitPrice) || 0))
    })) : [{
      productName: order.productSummary || 'Local Item',
      quantity: 1,
      unitPrice: Number(order.netAmount || 0),
      totalAmount: Number(order.netAmount || 0)
    }]);

    setPoForm({
      supplierId: '',
      supplierName: '',
      poNumber: `LPO-${Date.now().toString().slice(-6)}`,
      expectedDeliveryDate: '',
      items: orderItems,
      notes: `Local Supplier PO for Sales Order #${order.orderNumber || order.orderReference} (${order.clientName})`
    });

    if (analysisModal) setAnalysisModal(null);
    setShowPoModal(true);
  };

  const handleSupplierSelect = (e) => {
    const val = e.target.value;
    if (val === 'NEW') {
      setPoForm(prev => ({ ...prev, supplierId: 'NEW', supplierName: '' }));
    } else {
      const sup = (Array.isArray(suppliers) ? suppliers : []).find(s => s._id === val);
      if (sup) {
        setPoForm(prev => ({ ...prev, supplierId: sup._id, supplierName: sup.name }));
      }
    }
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...poForm.items];
    updated[idx][field] = val;
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(updated[idx].quantity || 0);
      const u = Number(updated[idx].unitPrice || 0);
      updated[idx].totalAmount = q * u;
    }
    setPoForm(prev => ({ ...prev, items: updated }));
  };

  const addItemRow = () => {
    setPoForm(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: 1, unitPrice: 0, totalAmount: 0 }]
    }));
  };

  const removeItemRow = (idx) => {
    if (poForm.items.length === 1) return;
    setPoForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const calculateTotalPoValue = () => {
    return poForm.items.reduce((sum, it) => sum + (Number(it.totalAmount) || 0), 0);
  };

  const handleSubmitPo = async (e) => {
    e.preventDefault();
    if (!poForm.supplierName.trim()) {
      alert('Please select or specify a local supplier.');
      return;
    }
    setSubmittingPo(true);
    try {
      const payload = {
        poNumber: poForm.poNumber,
        supplierId: poForm.supplierId !== 'NEW' ? poForm.supplierId : undefined,
        supplierName: poForm.supplierName,
        poType: 'Local',
        expectedDeliveryDate: poForm.expectedDeliveryDate || undefined,
        salesOrderId: selectedOrder ? selectedOrder._id : undefined,
        salesOrderNumber: selectedOrder ? (selectedOrder.orderNumber || selectedOrder.orderReference) : undefined,
        items: poForm.items,
        totalAmount: calculateTotalPoValue(),
        notes: poForm.notes
      };

      const res = await apiRequest('/api/purchaser/pos', 'POST', payload);
      if (res.success) {
        setToast(`Local Supplier PO #${payload.poNumber} created successfully! You can now receive goods via GRN.`);
        setShowPoModal(false);
        setSelectedOrder(null);
        fetchOrders();
        setTimeout(() => setToast(''), 5000);
      } else {
        alert(res.message || 'Error creating Local Supplier PO.');
      }
    } catch (err) {
      console.error('Error submitting PO:', err);
      alert('Failed to create Local Supplier PO.');
    } finally {
      setSubmittingPo(false);
    }
  };

  // 3. Complete Procurement & Route to Support
  const handleRouteToSupport = async (order) => {
    if (!window.confirm(`Are you sure you want to mark procurement complete and route Sales Order #${order.orderNumber || order.orderReference} to Support for Delivery Note creation?`)) {
      return;
    }
    try {
      const res = await apiRequest(`/api/purchaser/orders/${order._id}/complete-procurement`, 'POST');
      if (res.success) {
        setToast(`Sales Order #${order.orderNumber || order.orderReference} successfully routed to Support Department!`);
        fetchOrders();
        setTimeout(() => setToast(''), 5000);
      } else {
        alert(res.message || 'Error routing order to Support.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to route order to Support.');
    }
  };

  const effectiveSearch = (searchTerm || searchQuery || '').toLowerCase();
  const filteredOrders = orders.filter(ord =>
    (ord.orderNumber || '').toLowerCase().includes(effectiveSearch) ||
    (ord.orderReference || '').toLowerCase().includes(effectiveSearch) ||
    (ord.clientName || '').toLowerCase().includes(effectiveSearch) ||
    (ord.productSummary || '').toLowerCase().includes(effectiveSearch)
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={26} color="#059669" /> Pending Sales Orders (Local Procurement)
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
            Finance-approved Green File orders. Check warehouse inventory: if available, dispatch directly to Support; if short, issue Local Supplier PO &rarr; GRN &rarr; Local Payable.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ECFDF5',
            color: '#059669',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {toast && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 18px', borderRadius: '10px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="#059669" /> {toast}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', borderLeft: '4px solid #059669', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Total Pending Orders</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: '4px 0 0 0' }}>{orders.length}</h3>
        </div>
        <div style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', borderLeft: '4px solid #10B981', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Awaiting Inventory Check</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981', margin: '4px 0 0 0' }}>
            {orders.filter(o => !o.inventoryCheckStatus || o.inventoryCheckStatus === 'Pending').length}
          </h3>
        </div>
        <div style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', borderLeft: '4px solid #F59E0B', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Shortage (PO Required)</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', margin: '4px 0 0 0' }}>
            {orders.filter(o => o.inventoryCheckStatus === 'Shortage').length}
          </h3>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '400px' }}>
        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search by Order #, Customer or Product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
        />
      </div>

      {/* Orders Table */}
      <div style={{ backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>Order Ref #</th>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>Customer</th>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>Ordered Items / Scope</th>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>Order Value</th>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>Inventory Status</th>
              <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'center' }}>Procurement Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>Loading pending local orders...</td></tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map(order => {
                const isChecking = checkingId === order._id;
                const invStatus = order.inventoryCheckStatus || 'Not Checked';
                return (
                  <tr key={order._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>
                      {order.orderNumber || order.orderReference}
                      <span style={{ display: 'block', fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>Green File</span>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#334155' }}>
                      {order.clientName}
                      <span style={{ display: 'block', fontSize: '0.74rem', color: '#64748B' }}>{order.clientPhone || ''}</span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#475569', maxWidth: '260px' }}>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((it, idx) => (
                          <div key={idx} style={{ fontSize: '0.82rem', marginBottom: '2px' }}>
                            • <strong>{it.description || it.productName || 'Item'}</strong> &times; {it.quantity || 1}
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.85rem' }}>{order.productSummary || 'Local procurement goods'}</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#059669' }}>
                      {formatPKR(order.netAmount || order.totalAmount || 0)}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor:
                            invStatus === 'In Stock' ? '#DEF7EC' :
                            invStatus === 'Shortage' ? '#FEF3C7' :
                            invStatus === 'Procurement Completed' ? '#E0E7FF' : '#F1F5F9',
                          color:
                            invStatus === 'In Stock' ? '#03543F' :
                            invStatus === 'Shortage' ? '#92400E' :
                            invStatus === 'Procurement Completed' ? '#3730A3' : '#475569'
                        }}
                      >
                        {invStatus}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* 1. Check Inventory */}
                        <button
                          onClick={() => handleCheckInventory(order)}
                          disabled={isChecking}
                          style={{
                            background: '#059669',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Check warehouse stock. If available, will route directly to Support."
                        >
                          <PackageCheck size={14} />
                          {isChecking ? 'Checking...' : 'Check Inventory'}
                        </button>

                        {/* 2. Procure Shortage / Issue PO */}
                        <button
                          onClick={() => handleOpenPoModal(order)}
                          style={{
                            background: '#F8FAFC',
                            color: '#1E40AF',
                            border: '1px solid #BFDBFE',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Issue Local Supplier PO for this order"
                        >
                          <Plus size={14} /> Issue Local PO
                        </button>

                        {/* 3. Route directly to Support if already fulfilled */}
                        <button
                          onClick={() => handleRouteToSupport(order)}
                          style={{
                            background: '#F0FDF4',
                            color: '#047857',
                            border: '1px solid #A7F3D0',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Mark procurement completed and send directly to Support for DN creation"
                        >
                          <Send size={13} /> Route to Support
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94A3B8' }}>No pending Green File sales orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Inventory Check Analysis Modal */}
      {analysisModal && (() => {
        const isAllInStock = analysisModal.status === 'In Stock' || (analysisModal.analysis || []).every(it => (it.shortageQuantity || it.shortageQty || 0) === 0);
        const order = analysisModal.order;

        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: isAllInStock ? '#ECFDF5' : '#FEF3C7'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isAllInStock ? <CheckCircle2 size={24} color="#059669" /> : <AlertTriangle size={24} color="#D97706" />}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: isAllInStock ? '#065F46' : '#92400E' }}>
                      {isAllInStock ? 'Inventory Check: All Goods Present in Warehouse Stock' : 'Inventory Check: Stock Shortage Detected'}
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: isAllInStock ? '#047857' : '#78350F' }}>
                      Order #{order.orderNumber || order.orderReference} &bull; Customer: {order.clientName}
                    </span>
                  </div>
                </div>
                <button onClick={() => setAnalysisModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ padding: '24px' }}>
                {/* Status Notice Banner */}
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '0.88rem',
                  lineHeight: '1.4',
                  background: isAllInStock ? '#F0FDF4' : '#FFFBEB',
                  border: `1px solid ${isAllInStock ? '#BBF7D0' : '#FDE68A'}`,
                  color: isAllInStock ? '#166534' : '#92400E'
                }}>
                  {isAllInStock ? (
                    <span>
                      <strong>Inventory Available:</strong> All line items for this Sales Order are present in warehouse stock. You can directly release these goods and move the order to the <strong>Support Department</strong> for Delivery Note (DN) creation.
                    </span>
                  ) : (
                    <span>
                      <strong>Shortage Alert:</strong> Some items are unavailable or insufficient in warehouse inventory. You can issue a <strong>Local Supplier PO</strong> for the shortage quantities below.
                    </span>
                  )}
                </div>

                {/* Items & Pricing Breakdown Table */}
                <div style={{ overflowX: 'auto', marginBottom: '16px', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Item Description</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Required Qty</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>In Stock Qty</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Shortage Qty</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Unit Price (PKR)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Value</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Stock Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analysisModal.analysis || []).map((it, idx) => {
                        const reqQ = Number(it.requiredQuantity || it.orderedQty) || 1;
                        const availQ = Number(it.availableQuantity || it.availableQty) || 0;
                        const shortQ = Number(it.shortageQuantity || it.shortageQty) || 0;
                        const uPrice = Number(it.unitPrice) || 0;
                        const tPrice = Number(it.totalPrice) || (reqQ * uPrice);
                        const hasShortage = shortQ > 0;

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: hasShortage ? '#FFFDF5' : '#FFFFFF' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0F172A' }}>{it.productName}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{reqQ}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>{availQ}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', color: hasShortage ? '#DC2626' : '#64748B', fontWeight: 700 }}>
                              {shortQ}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>
                              {uPrice > 0 ? formatPKR(uPrice) : '—'}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                              {tPrice > 0 ? formatPKR(tPrice) : '—'}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                backgroundColor: hasShortage ? '#FEE2E2' : '#DEF7EC',
                                color: hasShortage ? '#991B1B' : '#03543F'
                              }}>
                                {hasShortage ? `Shortage (${shortQ})` : '✓ In Stock'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary Box */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Total Order Value</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                      {formatPKR(analysisModal.orderTotalAmount || order.netAmount || order.totalAmount || 0)}
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Warehouse Stock Value Available</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669' }}>
                      {formatPKR(analysisModal.totalStockValue || 0)}
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Inventory Status</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: isAllInStock ? '#059669' : '#D97706' }}>
                      {isAllInStock ? 'Ready for Support Dispatch' : 'Procurement Required'}
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setAnalysisModal(null)}
                    style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Close
                  </button>

                  {/* 1. BUTTON TO MOVE TO SUPPORT */}
                  <button
                    type="button"
                    onClick={() => {
                      const targetOrd = analysisModal.order;
                      setAnalysisModal(null);
                      handleRouteToSupport(targetOrd);
                    }}
                    style={{
                      backgroundColor: '#059669',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 22px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    <Send size={16} /> Move to Support Department (Generate DN)
                  </button>

                  {/* 2. BUTTON TO ISSUE SUPPLIER PO (IF SHORTAGE) */}
                  {!isAllInStock && (
                    <button
                      type="button"
                      onClick={() => {
                        const shortageItems = (analysisModal.analysis || [])
                          .filter(it => (it.shortageQuantity || it.shortageQty || 0) > 0)
                          .map(it => ({
                            productName: it.productName,
                            quantity: it.shortageQuantity || it.shortageQty || 1,
                            unitPrice: Number(it.unitPrice) || 0,
                            totalAmount: (Number(it.shortageQuantity || it.shortageQty) || 1) * (Number(it.unitPrice) || 0)
                          }));
                        handleOpenPoModal(analysisModal.order, shortageItems.length > 0 ? shortageItems : null);
                      }}
                      style={{
                        backgroundColor: '#D97706',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Plus size={16} /> Issue Supplier PO for Shortage
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create Local Supplier PO Modal */}
      {showPoModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={20} color="#059669" /> Issue Local Supplier PO
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#047857' }}>
                  Linked to Sales Order #{selectedOrder.orderNumber || selectedOrder.orderReference} — {selectedOrder.clientName}
                </span>
              </div>
              <button onClick={() => setShowPoModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmitPo} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Select Local Supplier <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={poForm.supplierId}
                    onChange={handleSupplierSelect}
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    <option value="">-- Choose Supplier --</option>
                    {Array.isArray(suppliers) && suppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.city || 'Local'})</option>
                    ))}
                    <option value="NEW">+ Add New Supplier Name Directly</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Supplier Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter local vendor / shop name"
                    value={poForm.supplierName}
                    onChange={(e) => setPoForm(prev => ({ ...prev, supplierName: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Supplier PO Number <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={poForm.poNumber}
                    onChange={(e) => setPoForm(prev => ({ ...prev, poNumber: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={poForm.expectedDeliveryDate}
                    onChange={(e) => setPoForm(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Items to Procure</h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    style={{ background: '#ECFDF5', color: '#059669', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> Add Item Row
                  </button>
                </div>

                {poForm.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr 2fr 36px', gap: '10px', alignItems: 'center', marginBottom: '8px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <input
                      type="text"
                      placeholder="Product Name / Spec"
                      required
                      value={it.productName}
                      onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                      style={{ padding: '7px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      required
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      style={{ padding: '7px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Unit Price (PKR)"
                      required
                      value={it.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      style={{ padding: '7px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A', textAlign: 'right', paddingRight: '4px' }}>
                      {formatPKR(it.totalAmount)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div style={{ backgroundColor: '#ECFDF5', borderRadius: '10px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontWeight: 700, color: '#065F46' }}>Total Local PO Value (PKR)</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>{formatPKR(calculateTotalPoValue())}</span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>PO Notes / Instructions</label>
                <textarea
                  rows="2"
                  value={poForm.notes}
                  onChange={(e) => setPoForm(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPo}
                  style={{ backgroundColor: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {submittingPo ? 'Issuing PO...' : 'Issue Local Supplier PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
