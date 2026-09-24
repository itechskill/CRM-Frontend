import React, { useState, useEffect } from 'react';
import { Globe, Plus, Search, Trash2, X, Eye, Edit3, Ship, Plane, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiRequest } from '../../utils/api';

export default function GlobalPurchaserPOsView({ searchQuery }) {
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [selectedPoForLogistics, setSelectedPoForLogistics] = useState(null);
  const [viewPo, setViewPo] = useState(null);
  const [editPo, setEditPo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [linkedOrder, setLinkedOrder] = useState(null);
  const [toast, setToast] = useState('');

  // Create PO Form State
  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
    supplierCountry: 'China',
    poNumber: `GPO-${Date.now().toString().slice(-6)}`,
    portOfLoading: '',
    portOfDischarge: 'Karachi Port',
    estimatedArrival: '',
    paymentTerms: 'LC at Sight',
    items: [{ productName: '', quantity: 1, unitPricePKR: 0, totalPricePKR: 0 }],
    remarks: ''
  });

  // Edit PO Form State
  const [editFormData, setEditFormData] = useState({
    supplierName: '',
    supplierCountry: 'China',
    portOfLoading: '',
    portOfDischarge: 'Karachi Port',
    estimatedArrival: '',
    paymentTerms: 'LC at Sight',
    notes: '',
    items: []
  });

  // Logistics Form State
  const [logisticsForm, setLogisticsForm] = useState({
    carrier: '',
    flightNumber: '',
    trackingNumber: '',
    shippingMethod: 'Air Freight',
    portOfLoading: '',
    portOfDischarge: 'Karachi Port',
    etd: '',
    eta: '',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posRes, suppRes, ordRes] = await Promise.all([
        apiRequest('/api/purchaser/pos?subType=Global'),
        apiRequest('/api/purchaser/suppliers?type=Global'),
        apiRequest('/api/purchaser/pending-orders?subDept=Global')
      ]);
      if (posRes.success) setPos(Array.isArray(posRes.pos) ? posRes.pos : (Array.isArray(posRes.data) ? posRes.data : []));
      if (suppRes.success) setSuppliers(Array.isArray(suppRes.suppliers) ? suppRes.suppliers : (Array.isArray(suppRes.data) ? suppRes.data : []));
      if (ordRes.success) setPendingOrders(Array.isArray(ordRes.orders) ? ordRes.orders : (Array.isArray(ordRes.data) ? ordRes.data : []));
    } catch (err) {
      console.error('Error fetching Global POs and pending orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenLinkedGlobalPO = (order) => {
    setLinkedOrder(order);
    setFormData({
      supplierId: '',
      supplierName: '',
      supplierCountry: 'China',
      poNumber: `GPO-${Date.now().toString().slice(-6)}`,
      portOfLoading: '',
      portOfDischarge: 'Karachi Port',
      estimatedArrival: '',
      paymentTerms: 'LC at Sight',
      items: order.items && order.items.length > 0 ? order.items.map(i => ({
        productName: i.description || i.productName || 'Imported Machine',
        quantity: Number(i.quantity) || 1,
        unitPricePKR: Number(i.unitPrice) || 0,
        totalPricePKR: Number(i.total) || ((Number(i.quantity) || 1) * (Number(i.unitPrice) || 0))
      })) : [{ productName: order.productSummary || 'Global Item', quantity: 1, unitPricePKR: Number(order.netAmount || 0), totalPricePKR: Number(order.netAmount || 0) }],
      remarks: `Global PO linked to Sales Order ${order.orderReference || order.orderNumber}`
    });
    setShowModal(true);
  };

  const handleSupplierSelect = (e) => {
    const id = e.target.value;
    if (id === 'NEW') {
      setFormData(prev => ({ ...prev, supplierId: 'NEW', supplierName: '', supplierCountry: 'China' }));
    } else {
      const s = (Array.isArray(suppliers) ? suppliers : []).find(sup => sup._id === id);
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
      alert('Please enter or select a global supplier.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        poNumber: formData.poNumber,
        subType: 'Global',
        poType: 'Global',
        supplierId: formData.supplierId !== 'NEW' ? formData.supplierId : undefined,
        supplierName: formData.supplierName,
        supplierCountry: formData.supplierCountry,
        portOfLoading: formData.portOfLoading,
        portOfDischarge: formData.portOfDischarge,
        estimatedArrival: formData.estimatedArrival,
        paymentTerms: formData.paymentTerms,
        items: formData.items,
        totalAmountPKR: calculateTotalPKR(),
        totalAmount: calculateTotalPKR(),
        remarks: formData.remarks,
        notes: formData.remarks
      };

      if (linkedOrder) {
        const res = await apiRequest(`/api/purchaser/orders/${linkedOrder._id}/global-po`, 'POST', payload);
        if (res.success) {
          setToast(`Global PO issued for Sales Order ${linkedOrder.orderReference || linkedOrder.orderNumber}! Order routed to Logistics.`);
          setShowModal(false);
          setLinkedOrder(null);
          setFormData({
            supplierId: '',
            supplierName: '',
            supplierCountry: 'China',
            poNumber: `GPO-${Date.now().toString().slice(-6)}`,
            portOfLoading: '',
            portOfDischarge: 'Karachi Port',
            estimatedArrival: '',
            paymentTerms: 'LC at Sight',
            items: [{ productName: '', quantity: 1, unitPricePKR: 0, totalPricePKR: 0 }],
            remarks: ''
          });
          fetchData();
          setTimeout(() => setToast(''), 4500);
        } else {
          alert(res.message || 'Error saving Global PO.');
        }
      } else {
        const res = await apiRequest('/api/purchaser/pos', 'POST', payload);
        if (res.success) {
          setToast(`Global PO #${formData.poNumber} created successfully!`);
          setShowModal(false);
          setFormData({
            supplierId: '',
            supplierName: '',
            supplierCountry: 'China',
            poNumber: `GPO-${Date.now().toString().slice(-6)}`,
            portOfLoading: '',
            portOfDischarge: 'Karachi Port',
            estimatedArrival: '',
            paymentTerms: 'LC at Sight',
            items: [{ productName: '', quantity: 1, unitPricePKR: 0, totalPricePKR: 0 }],
            remarks: ''
          });
          fetchData();
          setTimeout(() => setToast(''), 4500);
        } else {
          alert(res.message || 'Error creating Global PO');
        }
      }
    } catch (err) {
      console.error('Error saving Global PO:', err);
      alert('Failed to save Global PO.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Global PO Modal
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
      supplierCountry: po.supplierCountry || 'China',
      portOfLoading: po.portOfLoading || '',
      portOfDischarge: po.portOfDischarge || 'Karachi Port',
      estimatedArrival: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toISOString().split('T')[0] : (po.estimatedArrival ? new Date(po.estimatedArrival).toISOString().split('T')[0] : ''),
      paymentTerms: po.paymentTerms || 'LC at Sight',
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
        supplierCountry: editFormData.supplierCountry,
        portOfLoading: editFormData.portOfLoading,
        portOfDischarge: editFormData.portOfDischarge,
        expectedDeliveryDate: editFormData.estimatedArrival || undefined,
        paymentTerms: editFormData.paymentTerms,
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
        remarks: 'Direct PO edit by Global Purchaser'
      };

      const res = await apiRequest(`/api/purchaser/pos/${editPo._id}`, 'PUT', payload);
      if (res.success) {
        setToast(`Global PO #${editPo.poNumber} updated successfully!`);
        setEditPo(null);
        fetchData();
        setTimeout(() => setToast(''), 4500);
      } else {
        alert(res.message || 'Error updating PO');
      }
    } catch (err) {
      console.error('Error updating Global PO:', err);
      alert('Failed to update Purchase Order.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePO = async (po) => {
    if (!window.confirm(`Are you sure you want to delete Global Supplier PO #${po.poNumber} for "${po.supplierName}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(po._id);
    try {
      const res = await apiRequest(`/api/purchaser/pos/${po._id}`, 'DELETE');
      if (res.success) {
        setToast(`Global Supplier PO #${po.poNumber} deleted successfully.`);
        fetchData();
        setTimeout(() => setToast(''), 4500);
      } else {
        alert(res.message || 'Failed to delete PO.');
      }
    } catch (err) {
      console.error('Error deleting Global PO:', err);
      alert('Error deleting Purchase Order.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenLogisticsModal = (po) => {
    setSelectedPoForLogistics(po);
    setLogisticsForm({
      carrier: po.carrier || '',
      flightNumber: po.flightNumber || '',
      trackingNumber: po.trackingNumber || '',
      shippingMethod: po.shippingMethod || 'Air Freight',
      portOfLoading: po.portOfLoading || '',
      portOfDischarge: po.portOfDischarge || 'Karachi Port',
      etd: po.etd ? new Date(po.etd).toISOString().split('T')[0] : '',
      eta: po.estimatedArrival ? new Date(po.estimatedArrival).toISOString().split('T')[0] : '',
      notes: po.notes || ''
    });
    setShowLogisticsModal(true);
  };

  const handleSubmitLogistics = async (e) => {
    e.preventDefault();
    if (!selectedPoForLogistics) return;
    setSubmitting(true);
    try {
      const orderOrPoId = selectedPoForLogistics.salesOrderId || selectedPoForLogistics._id;
      const payload = {
        ...logisticsForm,
        supplierName: selectedPoForLogistics.supplierName,
        supplierCountry: selectedPoForLogistics.supplierCountry,
        supplierPoNumber: selectedPoForLogistics.poNumber,
        salesOrderId: selectedPoForLogistics.salesOrderId,
        salesOrderNumber: selectedPoForLogistics.salesOrderNumber
      };
      const res = await apiRequest(`/api/purchaser/orders/${orderOrPoId}/send-to-logistics`, 'POST', payload);
      if (res.success) {
        setToast(`Supplier PO #${selectedPoForLogistics.poNumber} successfully moved to Logistics Department with flight & tracking info!`);
        setShowLogisticsModal(false);
        setSelectedPoForLogistics(null);
        fetchData();
        setTimeout(() => setToast(''), 5000);
      } else {
        alert(res.message || 'Error moving PO to Logistics.');
      }
    } catch (err) {
      console.error('Error sending order to logistics:', err);
      alert('Failed to send order to logistics.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPKR = (num) => `PKR ${Number(num || 0).toLocaleString('en-PK')}`;

  const searchVal = (filterText || searchQuery || '').toLowerCase();
  const filtered = pos.filter(po =>
    (po.poNumber || '').toLowerCase().includes(searchVal) ||
    (po.supplierName || '').toLowerCase().includes(searchVal) ||
    (po.supplierCountry || '').toLowerCase().includes(searchVal) ||
    (po.salesOrderNumber || '').toLowerCase().includes(searchVal)
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>PO Issued to Supplier (Global / Overseas)</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>Issue, view, edit, delete and track overseas Purchase Orders and forward to Logistics</p>
        </div>
        <button
          onClick={() => {
            setLinkedOrder(null);
            setShowModal(true);
          }}
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
          <span>Create Global Supplier PO</span>
        </button>
      </div>

      {toast && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', padding: '12px 18px', borderRadius: '10px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="#2563EB" /> {toast}
        </div>
      )}

      {/* PENDING SALES ORDERS FOR GLOBAL PROCUREMENT */}
      {pendingOrders.length > 0 && (
        <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: '1.5px solid #3B82F6', padding: '20px', marginBottom: '28px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={20} color="#2563EB" /> Blue File Sales Orders — Pending International PO ({pendingOrders.length})
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Customer advance verified &amp; approved by Finance. Issue International Supplier PO and route to Logistics.
              </p>
            </div>
            <span style={{ padding: '4px 12px', background: '#EFF6FF', color: '#2563EB', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800 }}>
              Action Required
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Order Ref #</th>
                  <th style={{ padding: '10px 14px' }}>Customer</th>
                  <th style={{ padding: '10px 14px' }}>Import Scope / Machine</th>
                  <th style={{ padding: '10px 14px' }}>Order Value</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map(ord => (
                  <tr key={ord._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                      {ord.orderReference || ord.orderNumber}
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#2563EB', fontWeight: 700 }}>Blue File</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{ord.clientName}</td>
                    <td style={{ padding: '12px 14px', color: '#475569', maxWidth: '240px' }}>
                      {ord.items && ord.items.length > 0
                        ? ord.items.map(i => `${i.description || i.productName || 'Item'} (${i.quantity || 1})`).join(', ')
                        : (ord.productSummary || 'International Import')}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#2563EB' }}>
                      Rs. {Number(ord.netAmount || ord.totalAmount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenLinkedGlobalPO(ord)}
                        style={{ background: '#2563EB', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={14} /> Issue Global PO
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '400px' }}>
        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search by PO#, Supplier, Country or Sales Order..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
        />
      </div>

      {/* Global POs Table */}
      <div style={{ backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>PO Number</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Supplier Name</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Country</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Linked Order</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Loading Port</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Total (PKR)</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>Loading Global POs...</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map((po) => (
                <tr key={po._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#2563EB' }}>{po.poNumber}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0F172A' }}>{po.supplierName}</td>
                  <td style={{ padding: '14px 20px', color: '#64748B' }}>{po.supplierCountry || 'Overseas'}</td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>{po.salesOrderNumber || (po.salesOrderId ? 'Linked SO' : '—')}</td>
                  <td style={{ padding: '14px 20px', color: '#64748B' }}>{po.portOfLoading || '-'}</td>
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
                        po.status === 'In Logistics' || po.status === 'In Transit' ? '#EFF6FF' :
                        po.status === 'Completed' || po.status === 'Fully Received' ? '#DEF7EC' : '#FEF3C7',
                      color:
                        po.status === 'In Logistics' || po.status === 'In Transit' ? '#1D4ED8' :
                        po.status === 'Completed' || po.status === 'Fully Received' ? '#03543F' : '#92400E'
                    }}>
                      {po.status || 'Issued'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setViewPo(po)}
                        style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="View Global PO Details"
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(po)}
                        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: '#1D4ED8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Direct Edit PO (No CEO permission required)"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeletePO(po)}
                        disabled={deletingId === po._id}
                        style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: '#DC2626', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Direct Delete PO"
                      >
                        <Trash2 size={13} /> {deletingId === po._id ? '...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => handleOpenLogisticsModal(po)}
                        style={{
                          background: po.status === 'In Logistics' || po.status === 'In Transit' ? '#F1F5F9' : '#0284C7',
                          color: po.status === 'In Logistics' || po.status === 'In Transit' ? '#475569' : '#FFF',
                          border: po.status === 'In Logistics' || po.status === 'In Transit' ? '1px solid #CBD5E1' : 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Send PO details, flight/vessel and tracking number to Logistics Department"
                      >
                        <Plane size={13} /> {po.status === 'In Logistics' || po.status === 'In Transit' ? 'Logistics Info' : 'Move to Logistics'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>No Global POs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Global PO Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EFF6FF' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1E40AF' }}>
                {linkedOrder ? `Issue Global PO for ${linkedOrder.orderReference || linkedOrder.orderNumber}` : 'Create Global Supplier Purchase Order'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Select Overseas Supplier</label>
                  <select
                    value={formData.supplierId}
                    onChange={handleSupplierSelect}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    <option value="">-- Choose Existing Supplier --</option>
                    {(Array.isArray(suppliers) ? suppliers : []).map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.country || 'Global'})</option>
                    ))}
                    <option value="NEW">+ Enter New Supplier</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Supplier PO Number</label>
                  <input
                    type="text"
                    value={formData.poNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, color: '#2563EB' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Supplier Name *</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                    placeholder="e.g. Shenzhen Machinery Ltd."
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Supplier Country</label>
                  <input
                    type="text"
                    value={formData.supplierCountry}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierCountry: e.target.value }))}
                    placeholder="China, Germany, USA, etc."
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Port of Loading (Departure)</label>
                  <input
                    type="text"
                    placeholder="e.g. Shanghai Port"
                    value={formData.portOfLoading}
                    onChange={(e) => setFormData(prev => ({ ...prev, portOfLoading: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Port of Discharge (Destination)</label>
                  <input
                    type="text"
                    value={formData.portOfDischarge}
                    onChange={(e) => setFormData(prev => ({ ...prev, portOfDischarge: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Payment / LC Terms</label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    placeholder="e.g. LC at Sight, 30% Advance + 70% BL"
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Estimated Arrival (ETA)</label>
                  <input
                    type="date"
                    value={formData.estimatedArrival}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedArrival: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Items &amp; Scope</h4>
                  <button type="button" onClick={addItem} style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr 2fr 40px', gap: '10px', alignItems: 'center', marginBottom: '10px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <input
                      type="text"
                      placeholder="Machine / Item Name"
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
                    <div style={{ textAlign: 'right', fontWeight: 700, color: '#2563EB', fontSize: '0.85rem' }}>
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
                  Total PO Amount: <span style={{ color: '#2563EB' }}>{formatPKR(calculateTotalPKR())}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={submitting} style={{ backgroundColor: '#2563EB', color: '#FFF', border: 'none', borderRadius: '8px', padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>
                    {submitting ? 'Creating PO...' : (linkedOrder ? 'Issue Global PO & Route to Logistics' : 'Issue Global Supplier PO')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Global PO Modal */}
      {editPo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EFF6FF' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1E40AF' }}>Edit Global PO #{editPo.poNumber}</h3>
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Supplier Country</label>
                  <input
                    type="text"
                    value={editFormData.supplierCountry}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, supplierCountry: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Port of Loading</label>
                  <input
                    type="text"
                    value={editFormData.portOfLoading}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, portOfLoading: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Port of Discharge</label>
                  <input
                    type="text"
                    value={editFormData.portOfDischarge}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, portOfDischarge: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Estimated Arrival (ETA)</label>
                  <input
                    type="date"
                    value={editFormData.estimatedArrival}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, estimatedArrival: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Payment / LC Terms</label>
                  <input
                    type="text"
                    value={editFormData.paymentTerms}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
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

              {/* Items */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Items &amp; Scope</h4>
                  <button type="button" onClick={addEditItem} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                {editFormData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr 2fr 40px', gap: '10px', alignItems: 'center', marginBottom: '10px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <input
                      type="text"
                      placeholder="Item Name"
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
                    <div style={{ textAlign: 'right', fontWeight: 700, color: '#2563EB', fontSize: '0.85rem' }}>
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
                  Updated Total: <span style={{ color: '#2563EB' }}>{formatPKR(editFormData.items.reduce((s, it) => s + (Number(it.totalPricePKR) || 0), 0))}</span>
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
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#2563EB' }}>Global PO #{viewPo.poNumber}</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Supplier: <strong>{viewPo.supplierName}</strong> ({viewPo.supplierCountry || 'Overseas'})</span>
              </div>
              <button onClick={() => setViewPo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', marginBottom: '16px', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
              <div><strong>Status:</strong> {viewPo.status || 'Issued'}</div>
              <div><strong>Linked Sales Order:</strong> {viewPo.salesOrderNumber || 'None'}</div>
              <div><strong>Loading Port:</strong> {viewPo.portOfLoading || 'N/A'}</div>
              <div><strong>Discharge Port:</strong> {viewPo.portOfDischarge || 'Karachi Port'}</div>
              <div><strong>Payment Terms:</strong> {viewPo.paymentTerms || 'LC at Sight'}</div>
              <div><strong>ETA:</strong> {viewPo.expectedDeliveryDate ? new Date(viewPo.expectedDeliveryDate).toLocaleDateString() : (viewPo.estimatedArrival ? new Date(viewPo.estimatedArrival).toLocaleDateString() : 'N/A')}</div>
              {viewPo.notes && <div style={{ gridColumn: 'span 2' }}><strong>Notes:</strong> {viewPo.notes}</div>}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: '16px' }}>
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

            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#0F172A', marginBottom: '20px' }}>
              <span>Total Global PO Value:</span>
              <span style={{ color: '#2563EB' }}>{formatPKR(viewPo.totalAmount || viewPo.totalAmountPKR)}</span>
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

      {/* Move to Logistics Modal */}
      {showLogisticsModal && selectedPoForLogistics && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F9FF' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0369A1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plane size={20} color="#0284C7" /> Handover PO to Logistics Department
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  PO #{selectedPoForLogistics.poNumber} — {selectedPoForLogistics.supplierName} ({selectedPoForLogistics.supplierCountry || 'Overseas'})
                </span>
              </div>
              <button onClick={() => setShowLogisticsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmitLogistics} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Shipping Method <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={logisticsForm.shippingMethod}
                    onChange={(e) => setLogisticsForm(prev => ({ ...prev, shippingMethod: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    <option value="Air Freight">Air Freight</option>
                    <option value="Sea Freight">Sea Freight</option>
                    <option value="Courier (DHL/FedEx)">Courier (DHL/FedEx)</option>
                    <option value="Land Freight">Land Freight</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Carrier / Airline / Shipping Line <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Emirates SkyCargo, DHL, Maersk"
                    value={logisticsForm.carrier}
                    onChange={(e) => setLogisticsForm(prev => ({ ...prev, carrier: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Flight # / Vessel # <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EK-601 / Voyage MS-102"
                    value={logisticsForm.flightNumber}
                    onChange={(e) => setLogisticsForm(prev => ({ ...prev, flightNumber: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Tracking # / AWB / B/L Number <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 176-12345678 or MSCU1234567"
                    value={logisticsForm.trackingNumber}
                    onChange={(e) => setLogisticsForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Port of Loading (Departure)</label>
                  <input
                    type="text"
                    placeholder="e.g. Shanghai Pudong (PVG)"
                    value={logisticsForm.portOfLoading}
                    onChange={(e) => setLogisticsForm(prev => ({ ...prev, portOfLoading: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Port of Discharge (Destination)</label>
                  <input
                    type="text"
                    placeholder="e.g. Karachi Airport (KHI) / Karachi Port"
                    value={logisticsForm.portOfDischarge}
                    onChange={(e) => setLogisticsForm(prev => ({ ...prev, portOfDischarge: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>ETD (Estimated Departure)</label>
                  <input
                    type="date"
                    value={logisticsForm.etd}
                    onChange={(e) => setLogisticsForm(prev => ({ ...prev, etd: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>ETA (Estimated Arrival)</label>
                  <input
                    type="date"
                    value={logisticsForm.eta}
                    onChange={(e) => setLogisticsForm(prev => ({ ...prev, eta: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Logistics Handling Notes / Remarks</label>
                <textarea
                  rows="3"
                  placeholder="Additional instructions for clearance, warehouse storage or customs broker..."
                  value={logisticsForm.notes}
                  onChange={(e) => setLogisticsForm(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowLogisticsModal(false)}
                  style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: '#0284C7', color: '#FFF', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Send size={16} />
                  {submitting ? 'Transferring...' : 'Dispatch to Logistics'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
