import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { fileTypeLabel, formatFileClassification } from '../utils/fileClassification';
import {
  ShoppingCart,
  Search,
  Eye,
  Truck,
  Boxes,
  X,
  User,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  FileText,
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import '../employee/sales/SalesViews.css';
import './SupportPortal.css';
import { companyName } from '../utils/companies';

export default function SupportOrdersView({ onNavigateDeliveryNotes }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewOrder, setViewOrder] = useState(null);
  const [tabFilter, setTabFilter] = useState('pending'); // 'pending' | 'completed' | 'all'

  // Stock check state
  const [checkingStock, setCheckingStock] = useState(false);
  const [stockCheckResult, setStockCheckResult] = useState(null);

  const [receivingOrder, setReceivingOrder] = useState(null);
  const [receivingPreview, setReceivingPreview] = useState(null);
  const [loadingReceivingPreview, setLoadingReceivingPreview] = useState(false);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [receivingForm, setReceivingForm] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/orders');
      if (response.ok && data.success) {
        // Filter orders that have entered Support workflow
        const supportOrders = (data.data || []).filter(o => {
          if (o.isOverdueBlocked || o.workflowStatus === 'Order Blocked / Hold') return false;

          // An order should ONLY enter Support if assigned to Support or has reached a Support/downstream stage
          const isAssignedToSupport = o.currentDepartment === 'Support' || o.departmentResponsible === 'Support';
          const isSupportStage = [
            'Pending Delivery Note',
            'Goods Arrived / Awaiting Support Verification',
            'Goods Received in Office',
            'Shipment Received in Office',
            'Delivery Note Created',
            'DN Created',
            'Delivery Note Confirmed',
            'Delivery Note Delivered',
            'Sent to Accounts',
            'Draft Invoice Created',
            'Invoice Finalized',
            'Payment Received',
            'Order Completed',
            'Completed'
          ].includes(o.workflowStatus);

          return isAssignedToSupport || isSupportStage;
        });
        setOrders(supportOrders);
      }
    } catch (e) {
      console.error('[Fetch Support Orders Error]:', e);
    } finally {
      setLoading(false);
    }
  };

  const createReceiptId = () => globalThis.crypto?.randomUUID?.() || `REC-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const openReceiveGoodsModal = async (o) => {
    setReceivingOrder(o);
    setReceivingPreview(null);
    setReceivingForm(null);
    setLoadingReceivingPreview(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/orders/${o._id}/receiving-preview`);
      if (!response.ok || !data.success) {
        alert(data.message || 'Failed to load inventory matches.');
        setReceivingOrder(null);
        return;
      }

      const shipment = o.shipmentDetails || {};
      const lines = (data.data.items || []).map((line, index) => {
        const recommended = line.matches?.find(match => String(match._id) === String(line.recommendedInventoryItemId));
        return {
          ...line,
          receivedQty: line.remainingQty,
          selectionMode: recommended ? 'existing' : ((line.matches || []).length === 0 ? 'new' : 'select'),
          inventoryItemId: recommended?._id || '',
          confirmedSelection: false,
          newProduct: {
            name: line.productName,
            sku: line.sku || `SKU-${Date.now().toString().slice(-6)}-${index + 1}`,
            category: o.fileType === 'Blue' ? 'Imported Goods' : o.fileType === 'Green' ? 'General' : '',
            unit: 'pcs',
            location: 'WH/Stock'
          }
        };
      });

      setReceivingPreview(data.data);
      setReceivingForm({
        receiptId: createReceiptId(),
        supplierName: data.data.supplierPO?.supplierName || o.supplierPO?.supplierName || shipment.supplierName || '-',
        remarks: '',
        items: lines
      });
    } catch {
      alert('Error loading the Receive Goods form.');
      setReceivingOrder(null);
    } finally {
      setLoadingReceivingPreview(false);
    }
  };

  const updateReceivingLine = (index, changes) => {
    setReceivingForm(current => ({
      ...current,
      items: current.items.map((line, lineIndex) => lineIndex === index ? { ...line, ...changes } : line)
    }));
  };

  const handleReceiveGoods = async (e) => {
    e.preventDefault();
    if (!receivingOrder || !receivingForm) return;
    setSubmittingReceipt(true);
    try {
      const payload = {
        ...receivingForm,
        items: receivingForm.items.map(line => ({
          orderItemId: line.orderItemId,
          receivedQty: Number(line.receivedQty) || 0,
          inventoryItemId: line.selectionMode === 'existing' ? line.inventoryItemId : undefined,
          createNew: line.selectionMode === 'new',
          confirmedSelection: line.confirmedSelection === true,
          newProduct: line.selectionMode === 'new' ? line.newProduct : undefined
        }))
      };
      const { response, data } = await apiRequest(`/api/sales-employee/orders/${receivingOrder._id}/goods-received`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (response.ok && data.success) {
        setToastMsg(data.message || 'Inventory IN recorded.');
        setReceivingOrder(null);
        setReceivingForm(null);
        fetchOrders();
        setTimeout(() => setToastMsg(''), 4500);
      } else {
        alert(data.message || 'Failed to record Inventory IN.');
      }
    } catch {
      alert('Error recording Inventory IN.');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCheckStock = async (order) => {
    setCheckingStock(true);
    try {
      const { response, data } = await apiRequest(`/api/sales-employee/orders/${order._id}/stock-check`);
      if (response.ok && data.success) {
        setStockCheckResult(data.data);
      } else {
        alert(data.message || 'Failed to check warehouse inventory stock.');
      }
    } catch (e) {
      alert('Error connecting to inventory system.');
    } finally {
      setCheckingStock(false);
    }
  };

  const openOrderModal = (order) => {
    setViewOrder(order);
    setStockCheckResult(null);
    // Auto trigger stock check for immediate visibility
    handleCheckStock(order);
  };

  const getSalesPersonName = (o) => {
    return o.salePerson || o.createdBy?.fullName || o.salesPerson?.fullName || 'Sales Person';
  };

  const isOrderCompletedInSupport = (o) => {
    return !!o.deliveryNoteId || ['DN Created', 'Delivery Note Created', 'Delivery Note Confirmed', 'Sent to Accounts', 'Draft Invoice Created', 'Sent to Finance', 'Pending Finance Finalization', 'Completed'].includes(o.workflowStatus);
  };

  const pendingOrders = orders.filter(o => !isOrderCompletedInSupport(o));
  const completedOrders = orders.filter(o => isOrderCompletedInSupport(o));

  const filteredOrders = orders.filter(o => {
    if (tabFilter === 'pending' && isOrderCompletedInSupport(o)) return false;
    if (tabFilter === 'completed' && !isOrderCompletedInSupport(o)) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const salesPerson = getSalesPersonName(o).toLowerCase();
    return (
      (o.orderReference && o.orderReference.toLowerCase().includes(term)) ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
      (o.clientName && o.clientName.toLowerCase().includes(term)) ||
      salesPerson.includes(term) ||
      (o.productSummary && o.productSummary.toLowerCase().includes(term))
    );
  });

  return (
    <div className="sv-container">
      {toastMsg && (
        <div style={{
          padding: '12px 16px',
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '10px',
          color: '#065F46',
          fontWeight: 700,
          fontSize: '0.88rem',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Bar & Tabs */}
      <div className="sv-filters">
        <div className="sv-search-box">
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search orders sent to support..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sv-status-tabs">
          <button className={`sv-tab ${tabFilter === 'pending' ? 'active' : ''}`} onClick={() => setTabFilter('pending')}>
            Pending Sales Orders ({pendingOrders.length})
          </button>
          <button className={`sv-tab ${tabFilter === 'completed' ? 'active' : ''}`} onClick={() => setTabFilter('completed')}>
            DN Created / History ({completedOrders.length})
          </button>
          <button className={`sv-tab ${tabFilter === 'all' ? 'active' : ''}`} onClick={() => setTabFilter('all')}>
            All Support Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="sv-loading">Loading support orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="sv-empty">
          <ShoppingCart size={40} color="#94A3B8" />
          <h3>No Orders Sent to Support Yet</h3>
          <p>When a Sales Person clicks "Send to Support" on a Sales Order, it will automatically appear here.</p>
        </div>
      ) : (
        <div className="sv-table-wrap support-table-card">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Order Ref #</th>
                <th>Client / Customer</th>
                <th>Issuing Company</th>
                <th>Sales Person</th>
                <th style={{ textAlign: 'center' }}>File Type</th>
                <th>Product Summary</th>
                <th>Net Amount</th>
                <th>Workflow Status</th>
                <th style={{ textAlign: 'center' }}>Receive Goods / Inventory IN</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o._id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>
                    {o.orderReference || o.orderNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1E293B' }}>{o.clientName}</div>
                    {o.clientPhone && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{o.clientPhone}</div>}
                  </td>
                  <td>{companyName(o)}</td>
                  <td style={{ fontWeight: 600, color: '#2563EB' }}>
                    {getSalesPersonName(o)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {o.fileType === 'Blue' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        border: '1px solid #BFDBFE'
                      }}>
                        🌐 Blue (Imported)
                      </span>
                    ) : o.fileType === 'Green' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: '#F0FDF4',
                        color: '#15803D',
                        border: '1px solid #BBF7D0'
                      }}>
                        🇵🇰 Green (Local)
                      </span>
                    ) : <span style={{ color: '#64748B', fontWeight: 700 }}>Unassigned</span>}
                  </td>
                  <td style={{ maxWidth: '180px', fontSize: '0.82rem' }}>{o.productSummary || '—'}</td>
                  <td style={{ fontWeight: 800, color: '#059669' }}>
                    Rs. {Number(o.netAmount || o.totalAmount || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className="sv-badge" style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>
                      {o.workflowStatus || 'Sent to Support'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    {o.inventoryFulfilledFromExistingStock ? (
                      <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={12} /> Using existing warehouse stock
                      </span>
                    ) : o.inventoryReceived || isOrderCompletedInSupport(o) ? (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: '#ECFDF5',
                        color: '#047857',
                        border: '1px solid #A7F3D0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }} title={`Inventory received: ${o.goodsReceivedInOffice?.receivedQuantity || ''} of ${o.goodsReceivedInOffice?.orderedQuantity || ''}`}>
                        <CheckCircle2 size={12} /> {o.inventoryReceived ? 'Inventory Received' : 'Completed (Legacy)'}
                      </span>
                    ) : (
                      <button
                        onClick={() => openReceiveGoodsModal(o)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: '#F0FDF4',
                          color: '#16A34A',
                          border: '1px solid #86EFAC',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title="Receive goods and add quantities to inventory"
                      >
                        <PackageCheck size={12} /> {(o.inventoryReceipts || []).length ? 'Receive Remaining' : 'Receive Goods'}
                      </button>
                    )}
                    {(o.inventoryGrnNumbers || []).length > 0 && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563EB' }}>
                        GRN: {o.inventoryGrnNumbers.join(', ')}
                      </span>
                    )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <button className="sv-btn-action-icon" onClick={() => openOrderModal(o)} title="View Complete Order Details">
                        <Eye size={14} />
                      </button>
                      {!isOrderCompletedInSupport(o) ? (
                        <button
                          className="sv-btn-primary"
                          disabled={!o.goodsReceivedInOffice?.received}
                          title={!o.goodsReceivedInOffice?.received ? 'Receive all goods before creating the Delivery Note.' : 'Create Delivery Note'}
                          style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px', opacity: o.goodsReceivedInOffice?.received ? 1 : 0.55 }}
                          onClick={() => {
                            if (onNavigateDeliveryNotes) onNavigateDeliveryNotes(o);
                          }}
                        >
                          <Truck size={13} /> Create DN
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle2 size={13} /> DN Created
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW ORDER MODAL - COMPLETE SALES ORDER STRUCTURE & INVENTORY VERIFICATION */}
      {viewOrder && (
        <div className="sv-modal-overlay" onClick={() => setViewOrder(null)}>
          <div className="sv-modal" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={20} color="#2563EB" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                    Sales Order: {viewOrder.orderReference || viewOrder.orderNumber}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                    Created on {new Date(viewOrder.creationDate || viewOrder.createdAt).toLocaleDateString()} by <strong>{getSalesPersonName(viewOrder)}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setViewOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Customer & Order Reference Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94A3B8', fontWeight: 700 }}>Customer Details</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{viewOrder.clientName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>Issuing Company: {companyName(viewOrder)}</div>
                  {viewOrder.clientPhone && <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>📞 {viewOrder.clientPhone}</div>}
                  {viewOrder.clientEmail && <div style={{ fontSize: '0.8rem', color: '#64748B' }}>✉️ {viewOrder.clientEmail}</div>}
                  {viewOrder.clientAddress && <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px' }}>📍 {viewOrder.clientAddress}</div>}
                </div>

                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94A3B8', fontWeight: 700 }}>Sales Person & References</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>
                    👤 {getSalesPersonName(viewOrder)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                    <strong>Customer PO #:</strong> {viewOrder.customerPONumber || '—'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    <strong>Product File #:</strong> {formatFileClassification(viewOrder.fileNo, viewOrder.fileType)}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94A3B8', fontWeight: 700 }}>Financial Value</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    Rs. {Number(viewOrder.netAmount || viewOrder.totalAmount || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                    Workflow: <span style={{ color: '#4F46E5', fontWeight: 700 }}>{viewOrder.workflowStatus || 'Sent to Support'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Delivery: <span style={{ color: '#059669', fontWeight: 600 }}>{viewOrder.deliveryStatus || 'Not Delivered'}</span>
                  </div>
                </div>
              </div>

              {viewOrder.fileType === 'Blue' && viewOrder.shipmentDetails && (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E3A8A', marginBottom: '8px' }}>
                    International Shipment Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 14px', fontSize: '0.8rem', color: '#334155' }}>
                    <div><strong>Shipment:</strong> {viewOrder.shipmentDetails.shipmentId || viewOrder.shipmentNumber || 'ΓÇö'}</div>
                    <div><strong>AWB:</strong> {viewOrder.shipmentDetails.awbNumber || 'ΓÇö'}</div>
                    <div><strong>Tracking / B/L:</strong> {viewOrder.shipmentDetails.trackingNumber || 'ΓÇö'}</div>
                    <div><strong>Carrier / Flight:</strong> {[viewOrder.shipmentDetails.carrier, viewOrder.shipmentDetails.flightNumber].filter(Boolean).join(' / ') || 'ΓÇö'}</div>
                    <div><strong>Route:</strong> {[viewOrder.shipmentDetails.departureLocation, viewOrder.shipmentDetails.transitLocation, viewOrder.shipmentDetails.arrivalLocation].filter(Boolean).join(' ΓåÆ ') || 'ΓÇö'}</div>
                    <div><strong>ETD:</strong> {viewOrder.shipmentDetails.etd ? new Date(viewOrder.shipmentDetails.etd).toLocaleString() : 'ΓÇö'}</div>
                    <div><strong>ETA:</strong> {viewOrder.shipmentDetails.eta ? new Date(viewOrder.shipmentDetails.eta).toLocaleString() : 'ΓÇö'}</div>
                    <div><strong>Customs:</strong> {viewOrder.shipmentDetails.customsClearanceStatus || 'ΓÇö'}</div>
                    <div><strong>Shipment Status:</strong> {viewOrder.shipmentDetails.status || 'ΓÇö'}</div>
                  </div>
                </div>
              )}

              {(viewOrder.inventoryGrnNumbers || []).length > 0 && (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', color: '#1E3A8A', fontSize: '0.82rem' }}>
                  <strong>Inventory IN GRN:</strong> {viewOrder.inventoryGrnNumbers.join(', ')}
                </div>
              )}

              {/* Ordered Products Table */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} color="#2563EB" /> Ordered Line Items
                </div>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '8px 12px' }}>#</th>
                        <th style={{ padding: '8px 12px' }}>Item Description</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Ordered Qty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Price (PKR)</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total (PKR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewOrder.items && viewOrder.items.length > 0 ? (
                        viewOrder.items.map((it, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '8px 12px', color: '#94A3B8' }}>{idx + 1}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1E293B' }}>
                              {it.description || viewOrder.productSummary || 'Product Scope Item'}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>
                              {it.quantity || 1}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>
                              {Number(it.unitPrice || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                              {Number(it.total || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td style={{ padding: '8px 12px', color: '#94A3B8' }}>1</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1E293B' }}>
                            {viewOrder.productSummary || 'General Delivery Scope'}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>1</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>
                            {Number(viewOrder.netAmount || viewOrder.totalAmount || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                            {Number(viewOrder.netAmount || viewOrder.totalAmount || 0).toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LIVE INVENTORY STOCK VERIFICATION (Requirement 8) */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Boxes size={18} color="#0284C7" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                      Warehouse Inventory Stock Verification
                    </span>
                  </div>
                  <button
                    className="sv-btn-action-icon"
                    onClick={() => handleCheckStock(viewOrder)}
                    disabled={checkingStock}
                    style={{ width: 'auto', minWidth: '112px', minHeight: '32px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                    title="Re-check actual warehouse inventory"
                  >
                    {checkingStock ? 'Verifying...' : '🔄 Re-check Stock'}
                  </button>
                </div>

                {checkingStock ? (
                  <div style={{ fontSize: '0.85rem', color: '#64748B', textAlign: 'center', padding: '12px' }}>
                    Querying warehouse inventory databases...
                  </div>
                ) : stockCheckResult ? (
                  <div>
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      marginBottom: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      background: stockCheckResult.isFullyInStock ? '#ECFDF5' : '#FEF2F2',
                      color: stockCheckResult.isFullyInStock ? '#047857' : '#B91C1C',
                      border: `1px solid ${stockCheckResult.isFullyInStock ? '#A7F3D0' : '#FECACA'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {stockCheckResult.isFullyInStock ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <AlertTriangle size={16} />
                      )}
                      <span>
                        {stockCheckResult.isFullyInStock
                          ? '✓ All ordered items are Available in stock. Ready to create Delivery Note.'
                          : 'Insufficient stock. Use Receive Goods / Inventory IN before creating the Delivery Note.'}
                      </span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: '#E2E8F0', color: '#334155', textAlign: 'left' }}>
                          <th style={{ padding: '6px 8px' }}>Product</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center' }}>Ordered</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center' }}>Available</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center' }}>Shortage</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center' }}>Stock Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockCheckResult.items && stockCheckResult.items.map((it, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                              {it.productName}
                              {it.quantityAssumed && <div style={{ fontSize: '0.68rem', color: '#D97706', marginTop: '2px' }}>Quantity unknown, assumed 1</div>}
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>{it.requiredQty} {it.unit}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>{it.availableQty} {it.unit}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center', color: it.shortageQty > 0 ? '#DC2626' : '#64748B', fontWeight: 700 }}>
                              {it.shortageQty > 0 ? `-${it.shortageQty}` : '0'}
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: it.status === 'In Stock' ? '#ECFDF5' : '#FEF2F2',
                                color: it.status === 'In Stock' ? '#047857' : '#DC2626',
                                border: `1px solid ${it.status === 'In Stock' ? '#A7F3D0' : '#FECACA'}`
                              }}>
                                {it.status === 'In Stock' ? 'Available' : (it.status || 'Insufficient Stock')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#64748B', padding: '8px' }}>
                    Click "Re-check Stock" to verify warehouse items against inventory database.
                  </div>
                )}
              </div>

              {/* Workflow Audit Trail History */}
              {viewOrder.workflowHistory && viewOrder.workflowHistory.length > 0 && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '8px' }}>
                    Workflow Handoff Audit Trail
                  </div>
                  {viewOrder.workflowHistory.map((h, idx) => (
                    <div key={idx} style={{ fontSize: '0.78rem', color: '#475569', padding: '4px 0', borderBottom: idx < viewOrder.workflowHistory.length - 1 ? '1px dashed #CBD5E1' : 'none' }}>
                      <strong>{h.userName || 'User'}</strong> ({h.department || 'CRM'}) — {h.action} on {new Date(h.timestamp).toLocaleString()}
                      {h.notes && <span style={{ color: '#64748B', fontStyle: 'italic', display: 'block', marginLeft: '12px' }}>"{h.notes}"</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Actions */}
              <div className="sv-modal-actions" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '12px' }}>
                <button className="sv-btn-cancel" onClick={() => setViewOrder(null)}>Close</button>
                <button
                  className="sv-btn-primary"
                  disabled={!viewOrder.goodsReceivedInOffice?.received || checkingStock || !stockCheckResult?.isFullyInStock}
                  title={!viewOrder.goodsReceivedInOffice?.received
                    ? 'Confirm goods received in office before creating the Delivery Note.'
                    : (!stockCheckResult?.isFullyInStock ? 'Add inventory first using Receive Goods / Inventory IN.' : '')}
                  onClick={() => {
                    const orderToDeliver = viewOrder;
                    setViewOrder(null);
                    if (onNavigateDeliveryNotes) onNavigateDeliveryNotes(orderToDeliver);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: viewOrder.goodsReceivedInOffice?.received && stockCheckResult?.isFullyInStock ? 1 : 0.55 }}
                >
                  <Truck size={15} /> Create Delivery Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReceiveGoodsModal
        order={receivingOrder}
        preview={receivingPreview}
        form={receivingForm}
        loading={loadingReceivingPreview}
        submitting={submittingReceipt}
        onClose={() => setReceivingOrder(null)}
        onChange={setReceivingForm}
        onUpdateLine={updateReceivingLine}
        onSubmit={handleReceiveGoods}
      />

    </div>
  );
}

function ReceiveGoodsModal({ order, preview, form, loading, submitting, onClose, onChange, onUpdateLine, onSubmit }) {
  if (!order) return null;

  const labelStyle = { display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' };

  return (
    <div className="sv-modal-overlay" onClick={onClose}>
      <div className="sv-modal" style={{ maxWidth: '860px', maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="sv-modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageCheck size={20} color="#059669" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Receive Goods (Inventory IN)</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                Order: <strong>{order.orderReference || order.orderNumber}</strong> | {fileTypeLabel(order.fileType, { detailed: true })}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>

        {loading || !form ? (
          <div className="sv-loading" style={{ padding: '28px' }}>Loading order lines and inventory matches...</div>
        ) : (
          <form onSubmit={onSubmit} style={{ marginTop: '16px' }}>
            {preview?.supplierPO && <div style={{ marginBottom: 16, padding: 14, border: '1px solid #BFDBFE', borderRadius: 10, background: '#EFF6FF' }}>
              <div style={{ fontWeight: 800, color: '#1E3A8A', marginBottom: 6 }}>Check against Local Supplier PO</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: '0.82rem', color: '#334155' }}>
                <div><strong>Supplier PO:</strong> {preview.supplierPO.poNumber || '-'}</div>
                <div><strong>Supplier:</strong> {preview.supplierPO.supplierName || '-'}</div>
                <div><strong>Supplier GRN reference:</strong> {preview.supplierPO.goodsReceiptReference || '-'}</div>
                <div><strong>Receipt date:</strong> {preview.supplierPO.goodsReceiptDate ? new Date(preview.supplierPO.goodsReceiptDate).toLocaleDateString() : '-'}</div>
              </div>
              <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#334155' }}>
                {(preview.supplierPO.items || []).map((item, index) => <div key={`${item.productName}-${index}`}><strong>{item.productName}</strong>{item.description ? ` — ${item.description}` : ''} × {item.orderedQty}</div>)}
              </div>
            </div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {form.items.map((line, index) => {
                const selectedInventory = (preview?.inventoryOptions || []).find(item => String(item._id) === String(line.inventoryItemId));
                const isAutomaticMatch = (line.matches || []).some(match => String(match._id) === String(line.inventoryItemId));
                const needsConfirmation = line.selectionMode === 'existing' && selectedInventory && (!isAutomaticMatch || selectedInventory.contextMismatch);

                return (
                  <div key={line.orderItemId} style={{ border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px', background: '#FFFFFF' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) 110px 130px', gap: '12px', alignItems: 'end' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>{line.productName}</div>
                        {line.quantityAssumed && <div style={{ fontSize: '0.72rem', color: '#D97706', marginTop: '2px', fontWeight: 700 }}>Quantity unknown, assumed 1</div>}
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Ordered: {line.orderedQty} | Previously received: {line.previouslyReceivedQty} | Remaining: {line.remainingQty}
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Received qty</label>
                        <input type="number" min="0" max={line.remainingQty} step="1" className="sv-input" value={line.receivedQty} disabled={line.remainingQty <= 0} onChange={(e) => onUpdateLine(index, { receivedQty: e.target.value })} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: line.remainingQty <= 0 ? '#059669' : '#475569', fontWeight: 700 }}>
                        {line.remainingQty <= 0 ? 'Fully received' : 'Partial receipts allowed'}
                      </div>
                    </div>

                    {line.remainingQty > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <label style={labelStyle}>Inventory row to increment</label>
                        <select
                          className="sv-input"
                          required={Number(line.receivedQty) > 0}
                          value={line.selectionMode === 'new' ? '__new' : line.inventoryItemId}
                          onChange={(e) => onUpdateLine(index, e.target.value === '__new'
                            ? { selectionMode: 'new', inventoryItemId: '', confirmedSelection: false }
                            : { selectionMode: 'existing', inventoryItemId: e.target.value, confirmedSelection: false })}
                        >
                          <option value="">Select the correct inventory row</option>
                          {(preview?.inventoryOptions || []).map(item => (
                            <option key={item._id} value={item._id}>
                              {item.name} | {item.sku || 'No SKU'} | {item.category || 'General'} | {item.location || 'WH/Stock'}
                            </option>
                          ))}
                          <option value="__new">Create this product once</option>
                        </select>

                        {selectedInventory && line.selectionMode === 'existing' && (
                          <div style={{ marginTop: '8px', padding: '9px 10px', borderRadius: '7px', border: `1px solid ${needsConfirmation ? '#F59E0B' : '#A7F3D0'}`, background: needsConfirmation ? '#FFFBEB' : '#ECFDF5', fontSize: '0.76rem', color: '#334155' }}>
                            <strong>Selected:</strong> {selectedInventory.name} | SKU: {selectedInventory.sku || 'None'} | Category: {selectedInventory.category || 'General'} | Location: {selectedInventory.location || 'WH/Stock'} | On hand: {selectedInventory.quantityOnHand || 0}
                            {needsConfirmation && (
                              <label style={{ display: 'flex', gap: '7px', alignItems: 'flex-start', marginTop: '8px', color: '#92400E', fontWeight: 700 }}>
                                <input type="checkbox" required checked={line.confirmedSelection} onChange={(e) => onUpdateLine(index, { confirmedSelection: e.target.checked })} />
                                I confirm this row is correct even though its product, category, or location does not automatically fit this order.
                              </label>
                            )}
                          </div>
                        )}

                        {line.selectionMode === 'new' && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginTop: '10px', padding: '10px', background: '#F8FAFC', borderRadius: '8px' }}>
                            <input required className="sv-input" placeholder="Product name" value={line.newProduct.name} onChange={(e) => onUpdateLine(index, { newProduct: { ...line.newProduct, name: e.target.value } })} />
                            <input className="sv-input" placeholder="SKU" value={line.newProduct.sku} onChange={(e) => onUpdateLine(index, { newProduct: { ...line.newProduct, sku: e.target.value } })} />
                            <input className="sv-input" placeholder="Category" value={line.newProduct.category} onChange={(e) => onUpdateLine(index, { newProduct: { ...line.newProduct, category: e.target.value } })} />
                            <input required className="sv-input" placeholder="Warehouse location" value={line.newProduct.location} onChange={(e) => onUpdateLine(index, { newProduct: { ...line.newProduct, location: e.target.value } })} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Receiving remarks</label>
              <textarea rows="2" className="sv-input" value={form.remarks} onChange={(e) => onChange({ ...form, remarks: e.target.value })} />
            </div>

            <div className="sv-modal-actions" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
              <button type="button" className="sv-btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" disabled={submitting} className="sv-btn-primary" style={{ background: '#059669', borderColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <PackageCheck size={15} /> {submitting ? 'Saving Inventory IN...' : 'Save Receipt & Inventory IN'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
