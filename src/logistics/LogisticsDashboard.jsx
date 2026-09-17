import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  Plane,
  Truck,
  Clock,
  Calendar,
  AlertTriangle,
  PackageCheck,
  FileText,
  Boxes,
  ArrowRight,
  Search,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Compass
} from 'lucide-react';
import '../employee/EmployeeDashboard.css';
import '../employee/sales/SalesViews.css';
import './LogisticsPortal.css';

export default function LogisticsDashboard({ currentUser, onNavigateTab }) {
  const [stats, setStats] = useState({
    pendingShipments: 0,
    internationalSupplierPOs: 0,
    inTransit: 0,
    expectedArrivals: 0,
    shipmentsReceived: 0,
    delayedShipments: 0,
    totalActiveShipments: 0,
    recentShipments: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/logistics/stats');
      if (response.ok && data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('[Logistics Stats Fetch Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Incoming Blue File POs',
      value: stats.internationalSupplierPOs || stats.pendingShipments || 0,
      subtitle: 'Awaiting Shipment Initialization',
      icon: Clock,
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A',
      tab: 'incoming_shipments'
    },
    {
      title: 'In-Transit Shipments',
      value: stats.inTransit || 0,
      subtitle: 'Active Flights & Carriers',
      icon: Plane,
      color: '#0284C7',
      bg: '#F0F9FF',
      border: '#BAE6FD',
      tab: 'shipment_tracking'
    },
    {
      title: 'Received in Office',
      value: stats.shipmentsReceived || 0,
      subtitle: 'Delivered to Fortline Warehouse',
      icon: PackageCheck,
      color: '#16A34A',
      bg: '#F0FDF4',
      border: '#BBF7D0',
      tab: 'shipment_received'
    },
    {
      title: 'Total Active Shipments',
      value: stats.totalActiveShipments || 0,
      subtitle: 'Open International Logistics Pipeline',
      icon: Truck,
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      tab: 'shipments'
    }
  ];

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

  return (
    <div className="emp-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Executive Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 25px rgba(30, 58, 138, 0.2)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            Logistics &amp; Shipment Tracking Overview
          </h2>
          <p style={{ margin: '6px 0 0', color: '#BFDBFE', fontSize: '0.86rem', maxWidth: '680px', lineHeight: 1.5 }}>
            Manage Blue File international shipments, carrier tracking, customs clearing reference documents, and physical office receiving.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchStats}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Refresh statistics"
          >
            <RefreshCw size={14} className={loading ? 'logistics-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => onNavigateTab && onNavigateTab('shipments')}
            style={{
              background: '#2563EB',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)'
            }}
          >
            <span>Manage Shipments</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateTab && onNavigateTab(card.tab)}
              style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                padding: '18px 20px',
                border: '1px solid #E2E8F0',
                borderTop: `4px solid ${card.color}`,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '120px',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              title={`View ${card.title}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {card.title}
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: card.bg,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: card.color, lineHeight: 1.1, marginTop: '8px' }}>
                  {loading ? '—' : card.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', fontWeight: 500 }}>
                  {card.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent International Shipments Table */}
      <div className="sv-card" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plane size={18} color="#2563EB" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Recent International Shipments (Blue File)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('shipments')}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563EB',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            View All Shipments &rarr;
          </button>
        </div>

        <div className="sv-table-wrap">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              <RefreshCw size={24} className="logistics-spin" />
              <p style={{ marginTop: '8px', fontSize: '0.86rem' }}>Loading recent shipments...</p>
            </div>
          ) : stats.recentShipments && stats.recentShipments.length > 0 ? (
            <table className="sv-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', minWidth: '130px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Shipment ID</th>
                  <th style={{ padding: '12px 16px', minWidth: '120px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Sales Order</th>
                  <th style={{ padding: '12px 16px', minWidth: '140px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Sales Person</th>
                  <th style={{ padding: '12px 16px', minWidth: '130px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Customer</th>
                  <th style={{ padding: '12px 16px', minWidth: '140px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Supplier &amp; Country</th>
                  <th style={{ padding: '12px 16px', minWidth: '130px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Flight / Vessel #</th>
                  <th style={{ padding: '12px 16px', minWidth: '110px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>ETA</th>
                  <th style={{ padding: '12px 16px', minWidth: '110px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Status</th>
                  <th style={{ padding: '12px 16px', minWidth: '100px', textAlign: 'right', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentShipments.map((shp) => {
                  const badge = getStatusBadge(shp.status);
                  const salesPersonName = shp.salePerson || shp.salesPerson?.fullName || 'Sales Person';
                  return (
                    <tr key={shp._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '13px 16px' }}>
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
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontWeight: 700, color: '#1E293B' }}>
                          {shp.salesOrderNumber || shp.salesOrder?.orderNumber || '—'}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 700 }}>
                          Blue File
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ color: '#0F172A', fontWeight: 600 }}>{salesPersonName}</span>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#334155' }}>
                        {shp.clientName || '—'}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1E293B' }}>{shp.supplierName || '—'}</div>
                        {shp.supplierCountry && (
                          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{shp.supplierCountry}</div>
                        )}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563EB' }}>
                          {shp.flightNumber || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {shp.eta ? (
                          <span style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 500 }}>
                            {new Date(shp.eta).toLocaleDateString()}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 9px',
                          borderRadius: '20px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          backgroundColor: badge.bg,
                          color: badge.color
                        }}>
                          {badge.text}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => onNavigateTab && onNavigateTab('shipment_tracking')}
                          style={{
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#2563EB',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Track &rarr;
                        </button>
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
                No Active Shipments Found
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#94A3B8', maxWidth: '440px', marginInline: 'auto' }}>
                International shipments for Blue File orders will appear here automatically once international supplier POs are issued.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
