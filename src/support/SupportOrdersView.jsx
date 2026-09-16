import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
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

export default function SupportOrdersView({ onNavigateDeliveryNotes }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewOrder, setViewOrder] = useState(null);
  const [tabFilter, setTabFilter] = useState('pending'); // 'pending' | 'completed' | 'all'

  // Stock check state
  const [checkingStock, setCheckingStock] = useState(false);
  const [stockCheckResult, setStockCheckResult] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/orders');
      if (response.ok && data.success) {
        // Filter orders that have entered Support workflow
        const supportOrders = (data.data || []).filter(o =>
          o.workflowStatus && !['Sales Order Created', 'Pending Finance Approval', 'Finance Approved', 'Finance Rejected'].includes(o.workflowStatus)
        );
        setOrders(supportOrders);
      }
    } catch (e) {
      console.error('[Fetch Support Orders Error]:', e);
    } finally {
      setLoading(false);
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
    return !!o.deliveryNoteId || ['Delivery Note Created', 'Delivery Note Confirmed', 'Sent to Accounts', 'Draft Invoice Created', 'Sent to Finance', 'Pending Finance Finalization', 'Completed'].includes(o.workflowStatus);
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
                <th>Sales Person</th>
                <th>Product Summary</th>
                <th>Net Amount</th>
                <th>Workflow Status</th>
                <th style={{ textAlign: 'center' }}>Stock Availability</th>
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
                  <td style={{ fontWeight: 600, color: '#2563EB' }}>
                    {getSalesPersonName(o)}
                  </td>
                  <td style={{ maxWidth: '200px', fontSize: '0.82rem' }}>{o.productSummary || '—'}</td>
                  <td style={{ fontWeight: 800, color: '#059669' }}>
                    Rs. {Number(o.netAmount || o.totalAmount || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className="sv-badge" style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>
                      {o.workflowStatus || 'Sent to Support'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: o.stockStatus === 'Purchase Required' ? '#FEF2F2' : '#ECFDF5',
                      color: o.stockStatus === 'Purchase Required' ? '#DC2626' : '#047857',
                      border: `1px solid ${o.stockStatus === 'Purchase Required' ? '#FECACA' : '#A7F3D0'}`
                    }}>
                      <Boxes size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {o.stockStatus || 'Available'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <button className="sv-btn-action-icon" onClick={() => openOrderModal(o)} title="View Complete Order Details">
                        <Eye size={14} />
                      </button>
                      {!isOrderCompletedInSupport(o) ? (
                        <button
                          className="sv-btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
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
                    <strong>Product File #:</strong> {viewOrder.fileNo || '—'} {viewOrder.fileType ? `(${viewOrder.fileType})` : ''}
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
                    style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer' }}
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
                          : '⚠️ Insufficient Stock Detected. Delivery Note creation requires caution.'}
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
                            <td style={{ padding: '6px 8px', fontWeight: 600 }}>{it.productName}</td>
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
                                {it.status === 'In Stock' ? 'Available' : 'Insufficient Stock'}
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
                  onClick={() => {
                    const orderToDeliver = viewOrder;
                    setViewOrder(null);
                    if (onNavigateDeliveryNotes) onNavigateDeliveryNotes(orderToDeliver);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Truck size={15} /> Create Delivery Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
