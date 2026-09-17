import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  Plane,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  Calendar,
  Truck,
  ExternalLink,
  FileText
} from 'lucide-react';
import '../employee/sales/SalesViews.css';
import './LogisticsPortal.css';

export default function LogisticsIncomingOrdersView({ onNavigateTab }) {
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  // Initialize Shipment Modal State
  const [createModalOrder, setCreateModalOrder] = useState(null);
  const [createForm, setCreateForm] = useState({
    supplierName: '',
    supplierCountry: '',
    supplierPoNumber: '',
    carrier: '',
    flightNumber: '',
    trackingNumber: '',
    shippingMethod: 'Air Freight',
    departureLocation: '',
    arrivalLocation: 'Karachi, Pakistan',
    etd: '',
    eta: '',
    description: '',
    referenceDocs: '',
    remarks: ''
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const fetchIncomingOrders = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/logistics/incoming-orders');
      if (response.ok && data.success) {
        setIncomingOrders(data.data || []);
      }
    } catch (err) {
      console.error('[Fetch Incoming Orders Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomingOrders();
  }, []);

  const openCreateModal = (order) => {
    setCreateModalOrder(order);
    setCreateForm({
      supplierName: order.supplierPO?.supplierName || '',
      supplierCountry: order.supplierPO?.supplierCountry || 'China',
      supplierPoNumber: order.supplierPO?.poNumber || '',
      carrier: '',
      flightNumber: '',
      trackingNumber: '',
      shippingMethod: 'Air Freight',
      departureLocation: '',
      arrivalLocation: 'Karachi, Pakistan',
      etd: '',
      eta: '',
      description: order.productSummary || 'Imported Goods',
      referenceDocs: '',
      remarks: ''
    });
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    if (!createModalOrder) return;
    setSubmittingCreate(true);
    try {
      const { response, data } = await apiRequest('/api/logistics/shipments', {
        method: 'POST',
        body: JSON.stringify({
          salesOrderId: createModalOrder._id,
          ...createForm
        })
      });
      if (response.ok && data.success) {
        setFeedback(`Shipment ${data.data?.shipmentId || ''} successfully initialized!`);
        setCreateModalOrder(null);
        fetchIncomingOrders();
        setTimeout(() => setFeedback(''), 4500);
      } else {
        alert(data.message || 'Failed to initialize shipment.');
      }
    } catch (err) {
      alert('Error initializing shipment.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const filteredOrders = incomingOrders.filter((ord) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const orderNum = (ord.orderNumber || ord.orderReference || '').toLowerCase();
    const client = (ord.clientName || '').toLowerCase();
    const salesPerson = (ord.salePerson || ord.salesPerson?.fullName || '').toLowerCase();
    const supplier = (ord.supplierPO?.supplierName || '').toLowerCase();
    const poNum = (ord.supplierPO?.poNumber || '').toLowerCase();
    return orderNum.includes(term) || client.includes(term) || salesPerson.includes(term) || supplier.includes(term) || poNum.includes(term);
  });

  return (
    <div className="sv-container">
      {/* Toast Feedback */}
      {feedback && (
        <div className="logistics-toast">
          <CheckCircle2 size={18} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="sv-header">
        <div>
          <h2 className="sv-title">
            <Plane size={22} color="#2563EB" /> Incoming Blue File Orders
          </h2>
          <p className="sv-subtitle">
            Sales orders with International Supplier PO awaiting shipment initialization and carrier booking
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              backgroundColor: filteredOrders.length > 0 ? '#EFF6FF' : '#F1F5F9',
              color: filteredOrders.length > 0 ? '#1D4ED8' : '#64748B',
              border: `1px solid ${filteredOrders.length > 0 ? '#BFDBFE' : '#E2E8F0'}`
            }}
          >
            {filteredOrders.length} Orders Ready
          </span>
          {onNavigateTab && (
            <button
              className="sv-btn-primary"
              onClick={() => onNavigateTab('shipments')}
              style={{ padding: '7px 14px', fontSize: '0.82rem' }}
            >
              <Truck size={14} /> View All Shipments
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="sv-filters">
        <div className="sv-search-box" style={{ flex: 1, maxWidth: '440px' }}>
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search sales order, customer, sales person, supplier PO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sv-search-input"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Clear
            </button>
          )}
        </div>

        <button
          onClick={fetchIncomingOrders}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            color: '#334155',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Reload incoming orders"
        >
          <RefreshCw size={14} className={loading ? 'logistics-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Main Card with Table */}
      <div className="sv-card" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div className="sv-table-wrap">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
              <RefreshCw size={24} className="logistics-spin" />
              <p style={{ marginTop: '10px', fontSize: '0.88rem' }}>Loading incoming Blue File orders...</p>
            </div>
          ) : filteredOrders.length > 0 ? (
            <table className="sv-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', minWidth: '130px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Sales Order</th>
                  <th style={{ padding: '12px 16px', minWidth: '140px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Sales Person</th>
                  <th style={{ padding: '12px 16px', minWidth: '140px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Customer</th>
                  <th style={{ padding: '12px 16px', minWidth: '150px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Int'l Supplier</th>
                  <th style={{ padding: '12px 16px', minWidth: '130px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Supplier PO #</th>
                  <th style={{ padding: '12px 16px', minWidth: '120px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Order Amount</th>
                  <th style={{ padding: '12px 16px', minWidth: '140px', textAlign: 'right', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => (
                  <tr key={ord._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, color: '#1E293B', display: 'block' }}>
                        {ord.orderNumber || ord.orderReference}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 700 }}>
                        Blue File
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ color: '#0F172A', fontWeight: 600 }}>
                        {ord.salePerson || ord.salesPerson?.fullName || 'Sales Person'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>
                      {ord.clientName || '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1E293B' }}>
                        {ord.supplierPO?.supplierName || 'International Supplier'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        {ord.supplierPO?.supplierCountry || 'Overseas'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        background: '#F1F5F9',
                        color: '#0F172A',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        display: 'inline-block'
                      }}>
                        {ord.supplierPO?.poNumber || 'IPO-Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#059669' }}>
                      Rs. {Number(ord.netAmount || ord.totalAmount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        className="sv-btn-primary"
                        onClick={() => openCreateModal(ord)}
                        style={{ padding: '6px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                      >
                        + Initialize Shipment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '56px 24px', color: '#64748B' }}>
              <Plane size={44} color="#94A3B8" style={{ marginBottom: '10px' }} />
              <h4 style={{ margin: '4px 0 6px 0', fontSize: '1.05rem', fontWeight: 700, color: '#1E293B' }}>
                No Pending Incoming Orders
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#94A3B8', maxWidth: '440px', marginInline: 'auto' }}>
                When Sales approves a Blue File order with an International Supplier PO, it appears here automatically for shipment creation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Initialize Shipment Modal */}
      {createModalOrder && (
        <div className="logistics-modal-overlay">
          <div className="logistics-modal-box">
            <div className="logistics-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plane size={20} color="#2563EB" />
                <div>
                  <h3 className="logistics-modal-title">Initialize International Shipment</h3>
                  <p className="logistics-modal-sub">
                    Sales Order: {createModalOrder.orderNumber || createModalOrder.orderReference} &bull; Sales Person: {createModalOrder.salePerson || createModalOrder.salesPerson?.fullName}
                  </p>
                </div>
              </div>
              <button
                className="logistics-modal-close"
                onClick={() => setCreateModalOrder(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="logistics-modal-body">
              <div className="logistics-form-grid">
                <div className="logistics-form-group">
                  <label>International Supplier Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.supplierName}
                    onChange={(e) => setCreateForm({ ...createForm, supplierName: e.target.value })}
                  />
                </div>

                <div className="logistics-form-group">
                  <label>Supplier Country</label>
                  <input
                    type="text"
                    value={createForm.supplierCountry}
                    onChange={(e) => setCreateForm({ ...createForm, supplierCountry: e.target.value })}
                  />
                </div>

                <div className="logistics-form-group">
                  <label>Supplier PO #</label>
                  <input
                    type="text"
                    value={createForm.supplierPoNumber}
                    onChange={(e) => setCreateForm({ ...createForm, supplierPoNumber: e.target.value })}
                  />
                </div>

                <div className="logistics-form-group">
                  <label>Carrier / Freight Line</label>
                  <input
                    type="text"
                    placeholder="e.g. Emirates SkyCargo / Maersk"
                    value={createForm.carrier}
                    onChange={(e) => setCreateForm({ ...createForm, carrier: e.target.value })}
                  />
                </div>

                <div className="logistics-form-group">
                  <label>Flight / Vessel #</label>
                  <input
                    type="text"
                    placeholder="e.g. EK-605"
                    value={createForm.flightNumber}
                    onChange={(e) => setCreateForm({ ...createForm, flightNumber: e.target.value })}
                  />
                </div>

                <div className="logistics-form-group">
                  <label>Tracking # / Airway Bill (AWB)</label>
                  <input
                    type="text"
                    placeholder="e.g. AWB-998877"
                    value={createForm.trackingNumber}
                    onChange={(e) => setCreateForm({ ...createForm, trackingNumber: e.target.value })}
                  />
                </div>

                <div className="logistics-form-group">
                  <label>Shipping Method</label>
                  <select
                    value={createForm.shippingMethod}
                    onChange={(e) => setCreateForm({ ...createForm, shippingMethod: e.target.value })}
                  >
                    <option value="Air Freight">Air Freight</option>
                    <option value="Sea Freight">Sea Freight</option>
                    <option value="Courier">Courier (DHL / FedEx)</option>
                    <option value="Land">Land Freight</option>
                  </select>
                </div>

                <div className="logistics-form-group">
                  <label>ETA (Estimated Arrival Date)</label>
                  <input
                    type="date"
                    value={createForm.eta}
                    onChange={(e) => setCreateForm({ ...createForm, eta: e.target.value })}
                  />
                </div>
              </div>

              <div className="logistics-form-group" style={{ marginTop: '12px' }}>
                <label>Shipment Description</label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>

              <div className="logistics-form-group" style={{ marginTop: '12px' }}>
                <label>Reference Documents / COO / Packing List Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Inv #, Packing List Ref, COO #"
                  value={createForm.referenceDocs}
                  onChange={(e) => setCreateForm({ ...createForm, referenceDocs: e.target.value })}
                />
              </div>

              <div className="logistics-modal-footer">
                <button
                  type="button"
                  className="sv-btn-cancel"
                  onClick={() => setCreateModalOrder(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sv-btn-primary"
                  disabled={submittingCreate}
                >
                  {submittingCreate ? 'Initializing...' : 'Initialize Shipment Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
