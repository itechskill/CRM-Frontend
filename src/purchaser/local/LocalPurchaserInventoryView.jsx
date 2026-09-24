import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';
import { apiRequest } from '../../utils/api';

export default function LocalPurchaserInventoryView({ searchQuery }) {
  const [inventory, setInventory] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState('');

  // Add Product to Inventory Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'General',
    unit: 'pcs',
    quantityOnHand: 1,
    minStockLevel: 5,
    unitPrice: 0,
    location: '',
    description: ''
  });

  // View Product Modal State
  const [viewModalItem, setViewModalItem] = useState(null);

  // Edit Product Modal State
  const [editModalItem, setEditModalItem] = useState(null);
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    sku: '',
    category: 'General',
    unit: 'pcs',
    quantityOnHand: 1,
    minStockLevel: 5,
    unitPrice: 0,
    location: '',
    description: ''
  });

  // Local PO + GRN Modal State for Shortage
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [procureOrder, setProcureOrder] = useState(null);
  const [procureForm, setProcureForm] = useState({
    supplierName: '',
    poNumber: `LPO-${Date.now().toString().slice(-6)}`,
    grnNumber: `GRN-${Date.now().toString().slice(-6)}`,
    paymentTerms: 'Net 30',
    remarks: ''
  });
  const [submittingProcure, setSubmittingProcure] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, ordRes] = await Promise.all([
        apiRequest('/api/purchaser/inventory'),
        apiRequest('/api/purchaser/pending-orders?subDept=Local')
      ]);
      if (invRes.success) setInventory(invRes.inventory || invRes.data || []);
      if (ordRes.success) setPendingOrders(ordRes.orders || ordRes.data || []);
    } catch (err) {
      console.error('Error fetching inventory and pending orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInStockSendToSupport = async (order) => {
    setProcessingId(order._id);
    try {
      const res = await apiRequest(`/api/purchaser/orders/${order._id}/inventory-check`, 'POST', { isFullyInStock: true });
      if (res.success) {
        setToast(`Order ${order.orderReference || order.orderNumber} marked In Stock & forwarded directly to Support!`);
        fetchData();
        setTimeout(() => setToast(''), 4500);
      } else {
        alert(res.message || 'Error processing inventory check.');
      }
    } catch (err) {
      alert('Failed to send order to Support.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenProcurement = (order) => {
    setProcureOrder(order);
    setProcureForm({
      supplierName: '',
      poNumber: `LPO-${Date.now().toString().slice(-6)}`,
      grnNumber: `GRN-${Date.now().toString().slice(-6)}`,
      paymentTerms: 'Net 30',
      remarks: `Local Procurement for Sales Order ${order.orderReference || order.orderNumber}`
    });
    setShowProcurementModal(true);
  };

  const handleCompleteProcurement = async (e) => {
    e.preventDefault();
    if (!procureOrder) return;
    if (!procureForm.supplierName.trim()) {
      alert('Please enter supplier name.');
      return;
    }

    setSubmittingProcure(true);
    try {
      const payload = {
        supplierName: procureForm.supplierName,
        poNumber: procureForm.poNumber,
        grnNumber: procureForm.grnNumber,
        paymentTerms: procureForm.paymentTerms,
        remarks: procureForm.remarks,
        totalAmountPKR: Number(procureOrder.netAmount || procureOrder.totalAmount || 0),
        items: procureOrder.items && procureOrder.items.length > 0 ? procureOrder.items.map(i => ({
          productName: i.description || 'Item',
          quantity: Number(i.quantity) || 1,
          unitPricePKR: Number(i.unitPrice) || 0,
          totalPricePKR: Number(i.total) || 0
        })) : [{ productName: procureOrder.productSummary || 'Local Item', quantity: 1, unitPricePKR: Number(procureOrder.netAmount || 0), totalPricePKR: Number(procureOrder.netAmount || 0) }]
      };

      const res = await apiRequest(`/api/purchaser/orders/${procureOrder._id}/complete-procurement`, 'POST', payload);
      if (res.success) {
        setToast(`Local PO & GRN generated for ${procureOrder.orderReference || procureOrder.orderNumber}. Order forwarded to Support!`);
        setShowProcurementModal(false);
        setProcureOrder(null);
        fetchData();
        setTimeout(() => setToast(''), 4500);
      } else {
        alert(res.message || 'Error saving procurement.');
      }
    } catch (err) {
      alert('Failed to complete procurement.');
    } finally {
      setSubmittingProcure(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      alert('Product name is required.');
      return;
    }
    setAddingProduct(true);
    try {
      const res = await apiRequest('/api/purchaser/inventory', 'POST', productForm);
      if (res.success) {
        setToast(res.message || 'Product saved to inventory successfully!');
        setShowAddModal(false);
        setProductForm({
          name: '',
          sku: '',
          category: 'General',
          unit: 'pcs',
          quantityOnHand: 1,
          minStockLevel: 5,
          unitPrice: 0,
          location: '',
          description: ''
        });
        fetchData();
        setTimeout(() => setToast(''), 4500);
      } else {
        alert(res.message || 'Error saving product to inventory.');
      }
    } catch (err) {
      console.error('Save inventory product error:', err);
      alert('Failed to save product to inventory.');
    } finally {
      setAddingProduct(false);
    }
  };

  const openEditModal = (item) => {
    setEditModalItem(item);
    setEditForm({
      name: item.name || item.productName || '',
      sku: item.sku || item.productCode || '',
      category: item.category || 'General',
      unit: item.unit || 'pcs',
      quantityOnHand: item.quantityOnHand !== undefined ? item.quantityOnHand : (item.quantity || 0),
      minStockLevel: item.minStockLevel !== undefined ? item.minStockLevel : 5,
      unitPrice: item.unitPrice || 0,
      location: item.location || '',
      description: item.description || ''
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editModalItem || !editForm.name.trim()) {
      alert('Product name is required.');
      return;
    }
    setUpdatingProduct(true);
    try {
      const res = await apiRequest(`/api/purchaser/inventory/${editModalItem._id}`, 'PUT', editForm);
      if (res.success) {
        setToast(`Product "${editForm.name}" updated successfully!`);
        setEditModalItem(null);
        fetchData();
        setTimeout(() => setToast(''), 4500);
      } else {
        alert(res.message || 'Error updating product.');
      }
    } catch (err) {
      console.error('Update inventory product error:', err);
      alert('Failed to update product in inventory.');
    } finally {
      setUpdatingProduct(false);
    }
  };

  const handleDeleteProduct = async (item) => {
    const itemName = item.name || item.productName || 'this product';
    if (!window.confirm(`Are you sure you want to delete "${itemName}" from inventory? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await apiRequest(`/api/purchaser/inventory/${item._id}`, 'DELETE');
      if (res.success) {
        setToast(`Product "${itemName}" deleted from inventory successfully!`);
        fetchData();
        setTimeout(() => setToast(''), 4500);
      } else {
        alert(res.message || 'Error deleting product.');
      }
    } catch (err) {
      console.error('Delete inventory product error:', err);
      alert('Failed to delete product from inventory.');
    }
  };

  const searchVal = (filterText || searchQuery || '').toLowerCase();
  const filtered = inventory.filter(item =>
    (item.productName || item.name || '').toLowerCase().includes(searchVal) ||
    (item.productCode || item.sku || '').toLowerCase().includes(searchVal) ||
    (item.category || '').toLowerCase().includes(searchVal) ||
    (item.location || '').toLowerCase().includes(searchVal)
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Warehouse &amp; Local Inventory</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>Real-time stock level, product directory, item editing, and manual stock entry</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#059669',
              color: '#FFF',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
            }}
          >
            <Plus size={16} />
            <span>+ Add Goods to Inventory</span>
          </button>
          <button
            onClick={fetchData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ECFDF5',
              color: '#059669',
              border: '1px solid #A7F3D0',
              borderRadius: '8px',
              padding: '9px 16px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh Stock</span>
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 18px', borderRadius: '10px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="#059669" /> {toast}
        </div>
      )}

      {/* PENDING GREEN FILE SALES ORDERS FOR INVENTORY CHECK */}
      {pendingOrders.length > 0 && (
        <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: '1.5px solid #10B981', padding: '20px', marginBottom: '28px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="#059669" /> Green File Sales Orders — Pending Inventory Check ({pendingOrders.length})
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Verify warehouse stock availability for Green File orders from Finance
              </p>
            </div>
            <span style={{ padding: '4px 12px', background: '#ECFDF5', color: '#059669', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800 }}>
              Action Required
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Order Ref #</th>
                  <th style={{ padding: '10px 14px' }}>Customer</th>
                  <th style={{ padding: '10px 14px' }}>Product Summary / Scope</th>
                  <th style={{ padding: '10px 14px' }}>Order Value</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Handoff Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map(ord => (
                  <tr key={ord._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                      {ord.orderReference || ord.orderNumber}
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>Green File</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{ord.clientName}</td>
                    <td style={{ padding: '12px 14px', color: '#475569', maxWidth: '240px' }}>
                      {ord.items && ord.items.length > 0
                        ? ord.items.map(i => `${i.description || 'Item'} (${i.quantity || 1})`).join(', ')
                        : (ord.productSummary || 'Green File Deliverables')}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#059669' }}>
                      Rs. {Number(ord.netAmount || ord.totalAmount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleInStockSendToSupport(ord)}
                          disabled={processingId === ord._id}
                          style={{ background: '#059669', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                          title="If goods are fully in stock, forward directly to Support to issue Delivery Note"
                        >
                          {processingId === ord._id ? 'Processing...' : '✓ In Stock -> Send to Support'}
                        </button>
                        <button
                          onClick={() => handleOpenProcurement(ord)}
                          style={{ background: '#D97706', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                          title="If stock shortage, issue Local PO & GRN"
                        >
                          + Procure via Local PO &amp; GRN
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter search */}
      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '400px' }}>
        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Filter by name, code, category, or rack location..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 12px 9px 36px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Main Inventory Table */}
      <div style={{ backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Product Name</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Product Code / SKU</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Category</th>
              <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Available Stock</th>
              <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Min Stock</th>
              <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Unit Cost (PKR)</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Location</th>
              <th style={{ padding: '12px 18px', fontWeight: 700 }}>Status</th>
              <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                  <RefreshCw size={20} className="spin" style={{ display: 'inline', marginRight: '8px' }} /> Loading warehouse inventory...
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((item, idx) => {
                const stock = item.quantityOnHand !== undefined ? item.quantityOnHand : (item.quantity || item.availableStock || 0);
                const minStock = item.minStockLevel !== undefined ? item.minStockLevel : 5;
                return (
                  <tr key={item._id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>
                      {item.productName || item.name}
                      {item.description && (
                        <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 400, marginTop: '2px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#2563EB', fontWeight: 700 }}>
                      {item.productCode || item.sku || '—'}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#475569' }}>
                      <span style={{ padding: '3px 8px', background: '#F1F5F9', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                        {item.category || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: stock > minStock ? '#059669' : stock > 0 ? '#D97706' : '#DC2626' }}>
                      {stock} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>{item.unit || 'pcs'}</span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
                      {minStock}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                      {item.unitPrice ? `Rs. ${Number(item.unitPrice).toLocaleString()}` : '—'}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#475569', fontSize: '0.82rem' }}>
                      {item.location || 'WH/Stock'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {stock > minStock ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#ECFDF5', padding: '3px 9px', borderRadius: '20px' }}>
                          <CheckCircle2 size={12} /> In Stock
                        </span>
                      ) : stock > 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#D97706', fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#FEF3C7', padding: '3px 9px', borderRadius: '20px' }}>
                          <AlertCircle size={12} /> Low Stock
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#FEE2E2', padding: '3px 9px', borderRadius: '20px' }}>
                          <AlertCircle size={12} /> Out of Stock
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => setViewModalItem(item)}
                          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="View Product Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Edit Product"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(item)}
                          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#94A3B8' }}>
                  No products found in warehouse inventory. Click "+ Add Goods to Inventory" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW PRODUCT MODAL */}
      {viewModalItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setViewModalItem(null)}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '580px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <Package size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                    {viewModalItem.name || viewModalItem.productName}
                  </h3>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#2563EB', fontWeight: 700 }}>
                    SKU: {viewModalItem.sku || viewModalItem.productCode || 'N/A'}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewModalItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Available Stock</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                  {viewModalItem.quantityOnHand !== undefined ? viewModalItem.quantityOnHand : (viewModalItem.quantity || 0)} {viewModalItem.unit || 'pcs'}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Minimum Alert Stock</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706', marginTop: '2px' }}>
                  {viewModalItem.minStockLevel || 5} {viewModalItem.unit || 'pcs'}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Unit Cost / Price</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  Rs. {Number(viewModalItem.unitPrice || 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Category &amp; Location</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                  {viewModalItem.category || 'General'} &bull; {viewModalItem.location || 'WH/Stock'}
                </div>
              </div>
            </div>

            {viewModalItem.description && (
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '18px' }}>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Description / Specifications</div>
                <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                  {viewModalItem.description}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  const item = viewModalItem;
                  setViewModalItem(null);
                  openEditModal(item);
                }}
                style={{ backgroundColor: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit3 size={14} /> Edit Item
              </button>
              <button
                onClick={() => setViewModalItem(null)}
                style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editModalItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={20} color="#059669" /> Edit Inventory Product
              </h3>
              <button onClick={() => setEditModalItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Product / Item Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Product Code / SKU
                  </label>
                  <input
                    type="text"
                    value={editForm.sku}
                    onChange={(e) => setEditForm(prev => ({ ...prev, sku: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    <option value="General">General Goods</option>
                    <option value="Electronics">Electrical &amp; Electronics</option>
                    <option value="Mechanical">Mechanical &amp; Hardware</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Consumables">Consumables &amp; Packaging</option>
                    <option value="Spare Parts">Spare Parts</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Quantity on Hand <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.quantityOnHand}
                    onChange={(e) => setEditForm(prev => ({ ...prev, quantityOnHand: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, color: '#059669' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Unit of Measurement
                  </label>
                  <select
                    value={editForm.unit}
                    onChange={(e) => setEditForm(prev => ({ ...prev, unit: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="units">Units</option>
                    <option value="meters">Meters</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="boxes">Boxes</option>
                    <option value="sets">Sets</option>
                    <option value="liters">Liters</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Minimum Stock Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.minStockLevel}
                    onChange={(e) => setEditForm(prev => ({ ...prev, minStockLevel: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Unit Price / Cost (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.unitPrice}
                    onChange={(e) => setEditForm(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Warehouse Location / Rack
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rack A-3, Bin 12"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Description / Specifications
                  </label>
                  <textarea
                    rows="2"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditModalItem(null)}
                  style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProduct}
                  style={{ backgroundColor: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Package size={16} />
                  {updatingProduct ? 'Updating Product...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOCAL PROCUREMENT & GRN MODAL FOR SHORTAGE */}
      {showProcurementModal && procureOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                Complete Local Procurement &amp; Send to Support
              </h3>
              <button onClick={() => setShowProcurementModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCompleteProcurement} style={{ padding: '24px' }}>
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', color: '#065F46', fontSize: '0.85rem' }}>
                Order Ref: <strong>{procureOrder.orderReference || procureOrder.orderNumber}</strong> &bull; Client: {procureOrder.clientName} &bull; Total Value: <strong>Rs. {Number(procureOrder.netAmount || procureOrder.totalAmount || 0).toLocaleString()}</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Local Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Supplier / Vendor Company"
                    value={procureForm.supplierName}
                    onChange={(e) => setProcureForm({ ...procureForm, supplierName: e.target.value })}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Local PO Number *</label>
                  <input
                    type="text"
                    required
                    value={procureForm.poNumber}
                    onChange={(e) => setProcureForm({ ...procureForm, poNumber: e.target.value })}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', fontWeight: 700, color: '#059669' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>GRN Receipt Number *</label>
                  <input
                    type="text"
                    required
                    value={procureForm.grnNumber}
                    onChange={(e) => setProcureForm({ ...procureForm, grnNumber: e.target.value })}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', fontWeight: 700, color: '#2563EB' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Payment Terms</label>
                  <input
                    type="text"
                    value={procureForm.paymentTerms}
                    onChange={(e) => setProcureForm({ ...procureForm, paymentTerms: e.target.value })}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Remarks / Inspection Notes</label>
                <textarea
                  rows="3"
                  value={procureForm.remarks}
                  onChange={(e) => setProcureForm({ ...procureForm, remarks: e.target.value })}
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowProcurementModal(false)} style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submittingProcure} style={{ backgroundColor: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>
                  {submittingProcure ? 'Generating PO & GRN...' : 'Issue Local PO + GRN & Forward to Support'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD GOODS TO INVENTORY MODAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="#059669" /> Add Goods to Warehouse Inventory
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Product / Item Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electric Motor 5HP, Heavy Duty Bearing"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Product Code / SKU
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-10492"
                    value={productForm.sku}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    <option value="General">General Goods</option>
                    <option value="Electronics">Electrical &amp; Electronics</option>
                    <option value="Mechanical">Mechanical &amp; Hardware</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Consumables">Consumables &amp; Packaging</option>
                    <option value="Spare Parts">Spare Parts</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Quantity to Add / In Stock <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={productForm.quantityOnHand}
                    onChange={(e) => setProductForm(prev => ({ ...prev, quantityOnHand: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, color: '#059669' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Unit of Measurement
                  </label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="units">Units</option>
                    <option value="meters">Meters</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="boxes">Boxes</option>
                    <option value="sets">Sets</option>
                    <option value="liters">Liters</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Unit Price / Cost (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={productForm.unitPrice}
                    onChange={(e) => setProductForm(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Warehouse Location / Rack
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rack A-3, Bin 12"
                    value={productForm.location}
                    onChange={(e) => setProductForm(prev => ({ ...prev, location: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Description / Specifications
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Optional item details, model number, or manufacturer notes..."
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingProduct}
                  style={{ backgroundColor: '#059669', color: '#FFF', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Package size={16} />
                  {addingProduct ? 'Adding to Stock...' : 'Save Product to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
