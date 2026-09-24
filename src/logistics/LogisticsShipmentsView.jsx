import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  Truck,
  Compass,
  PackageCheck,
  Search,
  Filter,
  RefreshCw,
  X,
  CheckCircle2,
  Calendar,
  Eye,
  Edit3,
  ExternalLink,
  ClipboardCheck
} from 'lucide-react';
import '../employee/sales/SalesViews.css';
import './LogisticsPortal.css';

export default function LogisticsShipmentsView({
  activeTab,
  filterMode,
  searchQuery,
  currentUser,
  onNavigateTab
}) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedback, setFeedback] = useState('');

  // Determine current mode: 'tracking' | 'received' | 'all'
  const currentMode = filterMode || (
    activeTab === 'shipment_tracking' || activeTab === 'tracking'
      ? 'tracking'
      : activeTab === 'shipment_received' || activeTab === 'received'
      ? 'received'
      : 'all'
  );

  // Synchronize with header search
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== searchTerm) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  // Selected shipment for tracking update modal
  const [trackingModalShipment, setTrackingModalShipment] = useState(null);
  const [trackingForm, setTrackingForm] = useState({
    etd: '',
    eta: '',
    actualDepartureDate: '',
    actualArrivalDate: '',
    flightNumber: '',
    carrier: '',
    shippingMethod: 'Air Freight',
    trackingNumber: '',
    departureLocation: '',
    arrivalLocation: '',
    description: '',
    referenceDocs: '',
    remarks: '',
    status: '',
    trackingNote: ''
  });
  const [submittingTracking, setSubmittingTracking] = useState(false);

  // Office receipt modal
  const [receiveModalShipment, setReceiveModalShipment] = useState(null);
  const [receiveForm, setReceiveForm] = useState({
    receivedDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [submittingReceive, setSubmittingReceive] = useState(false);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      let url = `/api/logistics/shipments?`;
      const params = new URLSearchParams();
      const effectiveSearch = (searchTerm || '').trim();
      if (effectiveSearch) params.append('search', effectiveSearch);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      if (currentMode === 'received') {
        params.append('received', 'true');
      } else if (currentMode === 'tracking') {
        params.append('received', 'false');
      }

      url += params.toString();
      const { response, data } = await apiRequest(url);
      if (response.ok && data.success) {
        setShipments(data.data || []);
      }
    } catch (err) {
      console.error('[Fetch Shipments Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [currentMode, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchShipments();
  };

  const openTrackingModal = (shp) => {
    setTrackingModalShipment(shp);
    setTrackingForm({
      etd: shp.etd ? new Date(shp.etd).toISOString().split('T')[0] : '',
      eta: shp.eta ? new Date(shp.eta).toISOString().split('T')[0] : '',
      actualDepartureDate: shp.actualDepartureDate ? new Date(shp.actualDepartureDate).toISOString().split('T')[0] : '',
      actualArrivalDate: shp.actualArrivalDate ? new Date(shp.actualArrivalDate).toISOString().split('T')[0] : '',
      flightNumber: shp.flightNumber || '',
      carrier: shp.carrier || '',
      shippingMethod: shp.shippingMethod || 'Air Freight',
      trackingNumber: shp.trackingNumber || '',
      departureLocation: shp.departureLocation || '',
      arrivalLocation: shp.arrivalLocation || '',
      description: shp.description || '',
      referenceDocs: shp.referenceDocs || '',
      remarks: shp.remarks || '',
      status: shp.status || 'In Transit',
      trackingNote: ''
    });
  };

  const handleUpdateTracking = async (e) => {
    e.preventDefault();
    if (!trackingModalShipment) return;
    setSubmittingTracking(true);
    try {
      const { response, data } = await apiRequest(`/api/logistics/shipments/${trackingModalShipment._id}/tracking`, {
        method: 'PATCH',
        body: JSON.stringify(trackingForm)
      });
      if (response.ok && data.success) {
        setFeedback(`Tracking updated for shipment ${trackingModalShipment.shipmentId}!`);
        setTrackingModalShipment(null);
        fetchShipments();
        setTimeout(() => setFeedback(''), 4500);
      } else {
        alert(data.message || 'Failed to update tracking information.');
      }
    } catch (err) {
      alert('Error updating tracking information.');
    } finally {
      setSubmittingTracking(false);
    }
  };

  const openReceiveModal = (shp) => {
    setReceiveModalShipment(shp);
    setReceiveForm({
      receivedDate: new Date().toISOString().split('T')[0],
      remarks: ''
    });
  };

  const handleConfirmReceived = async (e) => {
    e.preventDefault();
    if (!receiveModalShipment) return;
    setSubmittingReceive(true);
    try {
      const { response, data } = await apiRequest(`/api/logistics/shipments/${receiveModalShipment._id}/receive-in-office`, {
        method: 'POST',
        body: JSON.stringify(receiveForm)
      });
      if (response.ok && data.success) {
        setFeedback(`Shipment ${receiveModalShipment.shipmentId} confirmed received in office! Redirecting to Goods Receipt Note (GRN)...`);
        setReceiveModalShipment(null);
        fetchShipments();
        if (onNavigateTab) {
          setTimeout(() => {
            onNavigateTab('grn_creation');
          }, 1000);
        } else {
          setTimeout(() => setFeedback(''), 5000);
        }
      } else {
        alert(data.message || 'Failed to confirm office receipt.');
      }
    } catch (err) {
      alert('Error confirming office receipt.');
    } finally {
      setSubmittingReceive(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'PO Issued': return { bg: '#EFF6FF', color: '#1D4ED8', text: 'PO Issued' };
      case 'Shipment Pending': return { bg: '#FFFBEB', color: '#D97706', text: 'Pending' };
      case 'Booked': return { bg: '#F5F3FF', color: '#6D28D9', text: 'Booked' };
      case 'Dispatched': return { bg: '#ECFDF5', color: '#059669', text: 'Dispatched' };
      case 'In Transit': return { bg: '#E0F2FE', color: '#0369A1', text: 'In Transit' };
      case 'Arrived': return { bg: '#FEF3C7', color: '#B45309', text: 'Arrived at Port' };
      case 'Received in Office': return { bg: '#DCFCE7', color: '#15803D', text: 'Received in Office' };
      case 'Delayed': return { bg: '#FEE2E2', color: '#B91C1C', text: 'Delayed' };
      case 'Cancelled': return { bg: '#F1F5F9', color: '#64748B', text: 'Cancelled' };
      default: return { bg: '#F3F4F6', color: '#4B5563', text: st || 'Active' };
    }
  };

  // Filter list by currentMode
  const displayedList = shipments.filter(shp => {
    if (currentMode === 'tracking') {
      return ['In Transit', 'Dispatched', 'Booked', 'Arrived'].includes(shp.status) && !shp.receivedInOffice;
    }
    if (currentMode === 'received') {
      return shp.receivedInOffice || shp.status === 'Received in Office';
    }
    return true;
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

      {/* Header Bar */}
      <div className="sv-header">
        <div>
          <h2 className="sv-title">
            {currentMode === 'tracking' ? (
              <>
                <Compass size={22} color="#0284C7" /> Active Shipment Tracking
              </>
            ) : currentMode === 'received' ? (
              <>
                <PackageCheck size={22} color="#16A34A" /> Shipments Received in Office
              </>
            ) : (
              <>
                <Truck size={22} color="#2563EB" /> International Shipments &amp; Tracking
              </>
            )}
          </h2>
          <p className="sv-subtitle">
            {currentMode === 'tracking'
              ? 'In-transit international cargo, flight numbers, airway bills (AWB), and live ETA schedules'
              : currentMode === 'received'
              ? 'Shipments physically inspected and confirmed in Fortline warehouse, transitioned to Support'
              : 'Complete register of Blue File international shipments, carrier tracking, and receiving'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              border: '1px solid #BFDBFE'
            }}
          >
            {displayedList.length} Shipments
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="sv-filters">
        <form onSubmit={handleSearchSubmit} className="sv-search-box" style={{ flex: 1, maxWidth: '440px' }}>
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search Shipment ID, AWB, Flight #, Sales Order, Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sv-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); fetchShipments(); }}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Clear
            </button>
          )}
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {currentMode === 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} color="#64748B" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="sv-select"
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="PO Issued">PO Issued</option>
                <option value="Shipment Pending">Shipment Pending</option>
                <option value="Booked">Booked</option>
                <option value="Dispatched">Dispatched</option>
                <option value="In Transit">In Transit</option>
                <option value="Arrived">Arrived at Port</option>
                <option value="Received in Office">Received in Office</option>
                <option value="Delayed">Delayed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          )}

          <button
            onClick={fetchShipments}
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
            title="Reload shipment data"
          >
            <RefreshCw size={14} className={loading ? 'logistics-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Card with Shipments Table */}
      <div className="sv-card" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div className="sv-table-wrap">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
              <RefreshCw size={24} className="logistics-spin" />
              <p style={{ marginTop: '10px', fontSize: '0.88rem' }}>Loading international shipment records...</p>
            </div>
          ) : displayedList.length > 0 ? (
            <table className="sv-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', minWidth: '130px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Shipment ID</th>
                  <th style={{ padding: '12px 16px', minWidth: '120px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Sales Order</th>
                  <th style={{ padding: '12px 16px', minWidth: '130px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Sales Person</th>
                  <th style={{ padding: '12px 16px', minWidth: '130px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Customer</th>
                  <th style={{ padding: '12px 16px', minWidth: '140px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Supplier &amp; Country</th>
                  <th style={{ padding: '12px 16px', minWidth: '140px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Carrier &amp; Flight #</th>
                  <th style={{ padding: '12px 16px', minWidth: '120px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>ETD / ETA</th>
                  <th style={{ padding: '12px 16px', minWidth: '110px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Status</th>
                  <th style={{ padding: '12px 16px', minWidth: '140px', textAlign: 'right', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedList.map((shp) => {
                  const badge = getStatusBadge(shp.status);
                  const salesPersonName = shp.salePerson || shp.salesPerson?.fullName || 'Sales Person';
                  const isReceived = shp.receivedInOffice || shp.status === 'Received in Office';

                  return (
                    <tr key={shp._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          background: '#F1F5F9',
                          color: '#0F172A',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          display: 'inline-block'
                        }}>
                          {shp.shipmentId}
                        </span>
                        {shp.trackingNumber && (
                          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '3px' }}>
                            Trk: {shp.trackingNumber}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 700, color: '#1E293B', display: 'block' }}>
                          {shp.salesOrderNumber || shp.salesOrder?.orderNumber || '—'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 700 }}>
                          Blue File
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ color: '#0F172A', fontWeight: 600 }}>{salesPersonName}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#334155' }}>
                        {shp.clientName || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1E293B' }}>
                          {shp.supplierName || '—'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                          {shp.supplierCountry || 'Overseas'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#2563EB', fontSize: '0.84rem' }}>
                          {shp.carrier || 'Carrier: —'}
                        </div>
                        {shp.flightNumber && (
                          <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#0F172A' }}>
                            Flt: {shp.flightNumber}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                          <strong>ETD:</strong> {shp.etd ? new Date(shp.etd).toLocaleDateString() : '—'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 600 }}>
                          <strong>ETA:</strong> {shp.eta ? new Date(shp.eta).toLocaleDateString() : '—'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 9px',
                            borderRadius: '20px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            backgroundColor: badge.bg,
                            color: badge.color
                          }}
                        >
                          {badge.text}
                        </span>
                        {isReceived && shp.receivedInOfficeDate && (
                          <div style={{ fontSize: '0.72rem', color: '#15803D', marginTop: '3px', fontWeight: 500 }}>
                            Office: {new Date(shp.receivedInOfficeDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="sv-btn-primary"
                            onClick={() => openTrackingModal(shp)}
                            style={{
                              padding: '5px 9px',
                              fontSize: '0.78rem',
                              backgroundColor: '#EFF6FF',
                              color: '#2563EB',
                              border: '1px solid #BFDBFE',
                              boxShadow: 'none'
                            }}
                            title="Update Tracking, Flight #, ETA"
                          >
                            <Compass size={13} />
                            <span>Tracking</span>
                          </button>

                          {!isReceived ? (
                            <button
                              className="sv-btn-primary"
                              onClick={() => openReceiveModal(shp)}
                              style={{
                                padding: '5px 9px',
                                fontSize: '0.78rem',
                                backgroundColor: '#16A34A',
                                border: 'none',
                                boxShadow: 'none'
                              }}
                              title="Confirm Shipment Received in Office"
                            >
                              <PackageCheck size={13} />
                              <span>Receive</span>
                            </button>
                          ) : (
                            <button
                              className="sv-btn-primary"
                              onClick={() => onNavigateTab && onNavigateTab('grn_creation')}
                              style={{
                                padding: '5px 9px',
                                fontSize: '0.78rem',
                                backgroundColor: '#2563EB',
                                border: 'none',
                                boxShadow: 'none'
                              }}
                              title="Record Goods Receipt Note (GRN)"
                            >
                              <ClipboardCheck size={13} />
                              <span>Create GRN</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '56px 24px', color: '#64748B' }}>
              <Truck size={44} color="#94A3B8" style={{ marginBottom: '10px' }} />
              <h4 style={{ margin: '4px 0 6px 0', fontSize: '1.05rem', fontWeight: 700, color: '#1E293B' }}>
                {currentMode === 'tracking'
                  ? 'No Active Shipments in Transit'
                  : currentMode === 'received'
                  ? 'No Shipments Received in Office Yet'
                  : 'No Shipments Found'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#94A3B8', maxWidth: '440px', marginInline: 'auto' }}>
                {currentMode === 'tracking'
                  ? 'There are currently no shipments in transit. When shipments are dispatched, track their flights and schedules here.'
                  : currentMode === 'received'
                  ? 'Confirmed office deliveries will be catalogued here for warehouse inspection and Support handoff.'
                  : 'No international shipment records match your search or filter parameters.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Update Shipment Tracking */}
      {trackingModalShipment && (
        <div className="logistics-modal-overlay">
          <div className="logistics-modal-box">
            <div className="logistics-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={20} color="#2563EB" />
                <div>
                  <h3 className="logistics-modal-title">
                    Logistics Tracking — {trackingModalShipment.shipmentId}
                  </h3>
                  <p className="logistics-modal-sub">
                    Sales Order: {trackingModalShipment.salesOrderNumber} &bull; Sales Person: {trackingModalShipment.salePerson || trackingModalShipment.salesPerson?.fullName}
                  </p>
                </div>
              </div>
              <button
                className="logistics-modal-close"
                onClick={() => setTrackingModalShipment(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateTracking} className="logistics-modal-body">
              <div className="logistics-form-grid">
                <div className="logistics-form-group">
                  <label>Flight / Vessel Number</label>
                  <input
                    type="text"
                    placeholder="e.g. EK-605 / QR-610"
                    value={trackingForm.flightNumber}
                    onChange={(e) => setTrackingForm({ ...trackingForm, flightNumber: e.target.value })}
                  />
                </div>

                <div className="logistics-form-group">
                  <label>Carrier / Airline</label>
                  <input
                    type="text"
                    placeholder="e.g. Emirates SkyCargo, Qatar Airways"
                    value={trackingForm.carrier}
                    onChange={(e) => setTrackingForm({ ...trackingForm, carrier: e.target.value })}
                  />
                </div>

                <div className="logistics-form-group">
                  <label>Shipping Method</label>
                  <select
                    value={trackingForm.shippingMethod}
                    onChange={(e) => setTrackingForm({ ...trackingForm, shippingMethod: e.target.value })}
                  >
                    <option value="Air Freight">Air Freight</option>
                    <option value="Sea Freight">Sea Freight</option>
                    <option value="Courier">Courier (DHL/FedEx)</option>
                    <option value="Land">Land Freight</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="logistics-form-group">
                  <label>Tracking Number (AWB / B/L #)</label>
                  <input
                    type="text"
                    placeholder="e.g. 176-12345678"
                    value={trackingForm.trackingNumber}
                    onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                  />
                </div>

                <div className="logistics-form-group">
                  <label>ETD (Estimated Time of Departure)</label>
                  <input
                    type="date"
                    value={trackingForm.etd}
                    onChange={(e) => setTrackingForm({ ...trackingForm, etd: e.target.value })}
                  />
                </div>

                <div className="logistics-form-group">
                  <label>ETA (Estimated Time of Arrival)</label>
                  <input
                    type="date"
                    value={trackingForm.eta}
                    onChange={(e) => setTrackingForm({ ...trackingForm, eta: e.target.value })}
                  />
                </div>

                <div className="logistics-form-group">
                  <label>Departure Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Guangzhou (CAN), China"
                    value={trackingForm.departureLocation}
                    onChange={(e) => setTrackingForm({ ...trackingForm, departureLocation: e.target.value })}
                  />
                </div>

                <div className="logistics-form-group">
                  <label>Arrival Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Karachi Airport (KHI), Pakistan"
                    value={trackingForm.arrivalLocation}
                    onChange={(e) => setTrackingForm({ ...trackingForm, arrivalLocation: e.target.value })}
                  />
                </div>

                <div className="logistics-form-group">
                  <label>Shipment Status</label>
                  <select
                    value={trackingForm.status}
                    onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                  >
                    <option value="PO Issued">PO Issued</option>
                    <option value="Shipment Pending">Shipment Pending</option>
                    <option value="Booked">Booked</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Arrived">Arrived at Port / Airport</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="logistics-form-group">
                  <label>Ref. Docs (Reference Documents)</label>
                  <input
                    type="text"
                    placeholder="e.g. Commercial Inv #, Packing List Ref, COO #"
                    value={trackingForm.referenceDocs}
                    onChange={(e) => setTrackingForm({ ...trackingForm, referenceDocs: e.target.value })}
                  />
                </div>
              </div>

              <div className="logistics-form-group" style={{ marginTop: '12px' }}>
                <label>Shipment Description</label>
                <textarea
                  rows="2"
                  placeholder="Summary of goods or package contents..."
                  value={trackingForm.description}
                  onChange={(e) => setTrackingForm({ ...trackingForm, description: e.target.value })}
                />
              </div>

              <div className="logistics-form-group" style={{ marginTop: '12px' }}>
                <label>Tracking Update Note / Log Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Cargo loaded on flight, customs cleared at origin..."
                  value={trackingForm.trackingNote}
                  onChange={(e) => setTrackingForm({ ...trackingForm, trackingNote: e.target.value })}
                />
              </div>

              <div className="logistics-modal-footer">
                <button
                  type="button"
                  className="sv-btn-cancel"
                  onClick={() => setTrackingModalShipment(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sv-btn-primary"
                  disabled={submittingTracking}
                >
                  {submittingTracking ? 'Saving...' : 'Save Tracking Information'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Confirm Shipment Received in Office */}
      {receiveModalShipment && (
        <div className="logistics-modal-overlay">
          <div className="logistics-modal-box" style={{ maxWidth: '500px' }}>
            <div className="logistics-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PackageCheck size={20} color="#16A34A" />
                <div>
                  <h3 className="logistics-modal-title">Confirm Shipment Received in Office</h3>
                  <p className="logistics-modal-sub">
                    Shipment ID: {receiveModalShipment.shipmentId} &bull; Order: {receiveModalShipment.salesOrderNumber}
                  </p>
                </div>
              </div>
              <button
                className="logistics-modal-close"
                onClick={() => setReceiveModalShipment(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReceived} className="logistics-modal-body">
              <div className="logistics-confirm-notice">
                <p>
                  Confirming this shipment as <strong>Received in Office</strong> will officially transition the Blue File order to the <strong>Support Department</strong> for Goods Received confirmation, Inventory check, and Delivery Note creation.
                </p>
              </div>

              <div className="logistics-form-group" style={{ marginTop: '12px' }}>
                <label>Received Date</label>
                <input
                  type="date"
                  required
                  value={receiveForm.receivedDate}
                  onChange={(e) => setReceiveForm({ ...receiveForm, receivedDate: e.target.value })}
                />
              </div>

              <div className="logistics-form-group" style={{ marginTop: '12px' }}>
                <label>Received By (Authorized Staff)</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.fullName || 'Logistics Staff'}
                  style={{ backgroundColor: '#F8FAFC' }}
                />
              </div>

              <div className="logistics-form-group" style={{ marginTop: '12px' }}>
                <label>Office Receipt Remarks / Inspection Note</label>
                <textarea
                  rows="3"
                  placeholder="Packages inspected, all seals intact, delivered to Fortline warehouse..."
                  value={receiveForm.remarks}
                  onChange={(e) => setReceiveForm({ ...receiveForm, remarks: e.target.value })}
                />
              </div>

              <div className="logistics-modal-footer">
                <button
                  type="button"
                  className="sv-btn-cancel"
                  onClick={() => setReceiveModalShipment(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sv-btn-primary"
                  style={{ backgroundColor: '#16A34A' }}
                  disabled={submittingReceive}
                >
                  {submittingReceive ? 'Processing...' : 'Confirm Received in Office'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
