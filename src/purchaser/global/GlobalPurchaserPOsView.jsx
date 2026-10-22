import React, { useState, useEffect } from 'react';
import { Globe, Plus, Search, Trash2, X, Eye, Edit3, Plane, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import IssuingCompanySelect from '../../components/IssuingCompanySelect';
import { DOCUMENT_TYPES, companyName, defaultCompanyCode } from '../../utils/companies';

export default function GlobalPurchaserPOsView({ searchQuery }) {
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewPo, setViewPo] = useState(null);
  const [editPo, setEditPo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updatingCheckpoint, setUpdatingCheckpoint] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [linkedOrder, setLinkedOrder] = useState(null);
  const [toast, setToast] = useState('');

  // Create PO Form State
  const [formData, setFormData] = useState({
    issuingCompanyCode: '',
    supplierId: '',
    supplierName: '',
    supplierCountry: 'China',
    vatMode: 'none',
    vatRate: 0,
    paymentTerms: 'LC at Sight',
    items: [{ productName: '', quantity: 1, unitPricePKR: 0, totalPricePKR: 0 }],
    remarks: ''
  });

  // Edit PO Form State
  const [editFormData, setEditFormData] = useState({
    supplierName: '',
    supplierCountry: 'China',
    paymentTerms: 'LC at Sight',
    notes: '',
    vatMode: 'none',
    vatRate: 0,
    items: []
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
      if (ordRes.success) {
        const rows = Array.isArray(ordRes.orders) ? ordRes.orders : (Array.isArray(ordRes.data) ? ordRes.data : []);
        setPendingOrders(rows.filter(order => order.fileType === 'Blue'));
      }
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
      issuingCompanyCode: defaultCompanyCode(order, DOCUMENT_TYPES.GLOBAL_PO),
      supplierId: '',
      supplierName: '',
      supplierCountry: 'China',
      vatMode: 'none',
      vatRate: 0,
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

  const calculateSubtotalPKR = () => {
    return formData.items.reduce((sum, item) => sum + (Number(item.totalPricePKR) || 0), 0);
  };
  const calculateVatPKR = () => formData.vatMode === 'vat'
    ? calculateSubtotalPKR() * (Math.max(0, Number(formData.vatRate) || 0) / 100)
    : 0;
  const calculateTotalPKR = () => calculateSubtotalPKR() + calculateVatPKR();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierName) {
      alert('Please enter or select a global supplier.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        issuingCompanyCode: formData.issuingCompanyCode,
        subType: 'Global',
        poType: 'Global',
        supplierId: formData.supplierId !== 'NEW' ? formData.supplierId : undefined,
        supplierName: formData.supplierName,
        supplierCountry: formData.supplierCountry,
        paymentTerms: formData.paymentTerms,
        items: formData.items,
        subtotal: calculateSubtotalPKR(),
        vatRate: formData.vatMode === 'vat' ? Math.max(0, Number(formData.vatRate) || 0) : 0,
        totalAmountPKR: calculateTotalPKR(),
        totalAmount: calculateTotalPKR(),
        remarks: formData.remarks,
        notes: formData.remarks
      };

      if (linkedOrder) {
        const res = await apiRequest(`/api/purchaser/orders/${linkedOrder._id}/global-po`, 'POST', payload);
        if (res.success) {
          setToast(`Global PO #${res.data?.supplierPO?.poNumber || 'assigned'} issued for Sales Order ${linkedOrder.orderReference || linkedOrder.orderNumber}. Complete the procurement checkpoints before Logistics handoff.`);
          setShowModal(false);
          setLinkedOrder(null);
          setFormData({
            issuingCompanyCode: '',
            supplierId: '',
            supplierName: '',
            supplierCountry: 'China',
            vatMode: 'none',
            vatRate: 0,
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
          setToast(`Global PO #${res.data?.poNumber || res.po?.poNumber || 'assigned'} created successfully!`);
          setShowModal(false);
          setFormData({
            issuingCompanyCode: '',
            supplierId: '',
            supplierName: '',
            supplierCountry: 'China',
            vatMode: 'none',
            vatRate: 0,
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
      paymentTerms: po.paymentTerms || 'LC at Sight',
      notes: po.notes || po.remarks || '',
      vatMode: Number(po.vatRate) > 0 ? 'vat' : 'none',
      vatRate: Number(po.vatRate) || 0,
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
  const calculateEditSubtotalPKR = () => editFormData.items.reduce((sum, item) => sum + (Number(item.totalPricePKR) || 0), 0);
  const calculateEditVatPKR = () => editFormData.vatMode === 'vat'
    ? calculateEditSubtotalPKR() * (Math.max(0, Number(editFormData.vatRate) || 0) / 100)
    : 0;

  const handleUpdatePO = async (e) => {
    e.preventDefault();
    if (!editPo) return;
    setUpdating(true);
    try {
      const totalAmount = calculateEditSubtotalPKR() + calculateEditVatPKR();
      const payload = {
        supplierName: editFormData.supplierName,
        supplierCountry: editFormData.supplierCountry,
        paymentTerms: editFormData.paymentTerms,
        notes: editFormData.notes,
        vatRate: editFormData.vatMode === 'vat' ? Math.max(0, Number(editFormData.vatRate) || 0) : 0,
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

  const checkpoints = ['In Manufacturing', 'Ready to Pick Up'];

  const getLinkedOrder = (po) => {
    const salesOrderId = po.salesOrderId?._id || po.salesOrderId;
    return pendingOrders.find(order => String(order._id) === String(salesOrderId)) ||
      (po.salesOrderId && typeof po.salesOrderId === 'object' ? po.salesOrderId : null);
  };

  const getCheckpointIndex = (po) => {
    const status = getLinkedOrder(po)?.supplierPO?.status || po.status || '';
    if (['Ready to Pick Up', 'Picked Up', 'In Transit', 'In Logistics', 'Shipped', 'Partially Received', 'Fully Received', 'Completed'].includes(status)) return 1;
    return checkpoints.indexOf(status);
  };

  const hasMovedToLogistics = (po) => {
    const order = getLinkedOrder(po);
    const status = order?.supplierPO?.status || po.status;
    return order?.currentDepartment === 'Logistics' || order?.workflowStatus === 'In Logistics' || ['Picked Up', 'In Logistics', 'In Transit', 'Shipped', 'Partially Received', 'Fully Received', 'Completed'].includes(status);
  };

  const getPurchaserStatus = (po) => {
    if (hasMovedToLogistics(po)) return 'Ready to Pick Up / Sent to Logistics';
    const status = getLinkedOrder(po)?.supplierPO?.status || po.status;
    return ['Issued', 'In Manufacturing', 'Ready to Pick Up'].includes(status) ? status : 'Issued';
  };

  const renderCheckpoints = (po) => {
    if (!po.salesOrderId) return <span style={{ color: '#94A3B8' }}>Not linked</span>;

    const completedIndex = getCheckpointIndex(po);
    const movedToLogistics = hasMovedToLogistics(po);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '150px' }}>
        {checkpoints.map((checkpoint, index) => {
          const checked = index <= completedIndex;
          const updateKey = `${po._id}-${checkpoint}`;
          const disabled = checked || movedToLogistics || index !== completedIndex + 1 || Boolean(updatingCheckpoint);
          return (
            <label key={checkpoint} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: checked ? '#166534' : '#475569', fontSize: '0.76rem', fontWeight: checked ? 700 : 600, cursor: disabled ? 'default' : 'pointer' }}>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => handleCheckpointUpdate(po, checkpoint)}
              />
              {updatingCheckpoint === updateKey ? 'Updating...' : checkpoint}
            </label>
          );
        })}
      </div>
    );
  };

  const handleCheckpointUpdate = async (po, checkpoint) => {
    const order = getLinkedOrder(po);
    if (!order) {
      alert('The linked Blue Sales Order could not be found. Refresh the page and try again.');
      return;
    }

    const updateKey = `${po._id}-${checkpoint}`;
    setUpdatingCheckpoint(updateKey);
    try {
      const checkpointRes = await apiRequest(`/api/purchaser/orders/${order._id}/global-checkpoint`, 'POST', { checkpoint });
      if (!checkpointRes.success) {
        alert(checkpointRes.message || 'Error updating the procurement checkpoint.');
        return;
      }

      if (checkpoint === 'Ready to Pick Up') {
        setToast(`Ready to Pick Up completed for PO #${po.poNumber}. The order was sent to Logistics.`);
      } else {
        setToast(`${checkpoint} completed for PO #${po.poNumber}. The order remains with Global Purchasing.`);
      }

      await fetchData();
      setTimeout(() => setToast(''), 5000);
    } catch (err) {
      console.error('Error updating Global Purchasing checkpoint:', err);
      alert('Failed to update the Global Purchasing checkpoint.');
    } finally {
      setUpdatingCheckpoint('');
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
  const ordersAwaitingPO = pendingOrders.filter(order => !order.supplierPO?.poNumber);

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
            setFormData({
              issuingCompanyCode: '', supplierId: '', supplierName: '', supplierCountry: 'China',
              vatMode: 'none', vatRate: 0, paymentTerms: 'LC at Sight',
              items: [{ productName: '', quantity: 1, unitPricePKR: 0, totalPricePKR: 0 }], remarks: ''
            });
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
      {ordersAwaitingPO.length > 0 && (
        <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: '1.5px solid #3B82F6', padding: '20px', marginBottom: '28px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={20} color="#2563EB" /> Blue File Sales Orders — Pending International PO ({ordersAwaitingPO.length})
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Customer advance verified &amp; approved by Finance. Issue the International Supplier PO, then complete the two procurement checkpoints.
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
                  <th style={{ padding: '10px 14px' }}>Issuing Company</th>
                  <th style={{ padding: '10px 14px' }}>Import Scope / Machine</th>
                  <th style={{ padding: '10px 14px' }}>Order Value</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {ordersAwaitingPO.map(ord => (
                  <tr key={ord._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                      {ord.orderReference || ord.orderNumber}
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#2563EB', fontWeight: 700 }}>Blue File</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{ord.clientName}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{companyName(ord)}</td>
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
      <div style={{ backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflowX: 'auto', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', minWidth: '1400px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>PO Number</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Supplier Name</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Issuing Company</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Country</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Linked Order</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Total (PKR)</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Procurement Checkpoints</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>Loading Global POs...</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map((po) => (
                <tr key={po._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#2563EB' }}>{po.poNumber}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0F172A' }}>{po.supplierName}</td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>{companyName(po)}</td>
                  <td style={{ padding: '14px 20px', color: '#64748B' }}>{po.supplierCountry || 'Overseas'}</td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>{po.salesOrderNumber || (po.salesOrderId ? 'Linked SO' : '—')}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>
                    {formatPKR(po.totalAmount || po.totalAmountPKR || 0)}
                  </td>
                  <td style={{ padding: '14px 20px' }}>{renderCheckpoints(po)}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor:
                        hasMovedToLogistics(po) ? '#EFF6FF' : '#FEF3C7',
                      color:
                        hasMovedToLogistics(po) ? '#1D4ED8' : '#92400E'
                    }}>
                      {getPurchaserStatus(po)}
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
                      {!hasMovedToLogistics(po) && (
                        <>
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
                        </>
                      )}
                      {hasMovedToLogistics(po) && (
                        <span
                          style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="This order has already been handed to Logistics"
                        >
                          <Plane size={13} /> Sent to Logistics
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>No Global POs found.</td></tr>
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Issuing Company *</label>
                  <IssuingCompanySelect
                    documentType={DOCUMENT_TYPES.GLOBAL_PO}
                    value={formData.issuingCompanyCode}
                    onChange={value => setFormData(prev => ({ ...prev, issuingCompanyCode: value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                  {!formData.issuingCompanyCode && linkedOrder?.issuingCompany?.legalName && (
                    <div style={{ marginTop: '5px', fontSize: '0.75rem', color: '#B45309' }}>{linkedOrder.issuingCompany.legalName} is not allowed for a Global PO; select another company.</div>
                  )}
                </div>
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
                    value=""
                    placeholder="Assigned on issue"
                    readOnly
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F1F5F9', fontSize: '0.9rem', fontWeight: 700, color: '#2563EB' }}
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>VAT</label>
                  <select value={formData.vatMode}
                    onChange={(e) => setFormData(prev => ({ ...prev, vatMode: e.target.value, vatRate: e.target.value === 'vat' ? prev.vatRate : 0 }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}>
                    <option value="none">No VAT</option>
                    <option value="vat">VAT</option>
                  </select>
                </div>
                {formData.vatMode === 'vat' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>VAT Percentage *</label>
                    <input type="number" min="0" max="100" step="0.01" required value={formData.vatRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, vatRate: e.target.value }))}
                      style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }} />
                  </div>
                )}

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
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Subtotal {formatPKR(calculateSubtotalPKR())} · VAT {formatPKR(calculateVatPKR())}</div>
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Payment / LC Terms</label>
                  <input
                    type="text"
                    value={editFormData.paymentTerms}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>VAT</label>
                  <select value={editFormData.vatMode}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, vatMode: e.target.value, vatRate: e.target.value === 'vat' ? prev.vatRate : 0 }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}>
                    <option value="none">No VAT</option>
                    <option value="vat">VAT</option>
                  </select>
                </div>
                {editFormData.vatMode === 'vat' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>VAT Percentage *</label>
                    <input type="number" min="0" max="100" step="0.01" required value={editFormData.vatRate}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, vatRate: e.target.value }))}
                      style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }} />
                  </div>
                )}

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
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Subtotal {formatPKR(calculateEditSubtotalPKR())} · VAT {formatPKR(calculateEditVatPKR())}</div>
                  Updated Total: <span style={{ color: '#2563EB' }}>{formatPKR(calculateEditSubtotalPKR() + calculateEditVatPKR())}</span>
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
              <div><strong>Issuing Company:</strong> {companyName(viewPo)}</div>
              <div><strong>Linked Sales Order:</strong> {viewPo.salesOrderNumber || 'None'}</div>
              <div><strong>Payment Terms:</strong> {viewPo.paymentTerms || 'LC at Sight'}</div>
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

            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 16px', borderRadius: '8px', color: '#0F172A', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569', marginBottom: '4px' }}><span>Subtotal</span><span>{formatPKR(viewPo.subtotal)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569', marginBottom: '6px' }}><span>VAT ({Number(viewPo.vatRate || 0)}%)</span><span>{formatPKR(viewPo.vatAmount)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}><span>Total Global PO Value:</span><span style={{ color: '#2563EB' }}>{formatPKR(viewPo.totalAmount || viewPo.totalAmountPKR)}</span></div>
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
