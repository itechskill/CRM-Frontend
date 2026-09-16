import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  ShoppingCart,
  Clock,
  FileCheck,
  Truck,
  Boxes,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import '../employee/EmployeeDashboard.css';
import './SupportPortal.css';

export default function SupportDashboard({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchStats = async (filterParam = dateFilter) => {
    setLoading(true);
    try {
      let url = `/api/sales-employee/support/stats?filter=${filterParam}`;
      if (filterParam === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const { response, data } = await apiRequest(url);
      if (response.ok && data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error('[Fetch Support Stats Error]:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(dateFilter);
  }, [dateFilter]);

  return (
    <div className="support-dashboard-container">
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #0284C7 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        boxShadow: '0 10px 25px rgba(2, 132, 199, 0.2)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Support & Operations Dashboard</h2>
          <p style={{ margin: '6px 0 0', color: '#BAE6FD', fontSize: '0.88rem' }}>
            Real-time pending orders queue, warehouse stock, and delivery note processing
          </p>
        </div>
        <button
          onClick={() => fetchStats(dateFilter)}
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
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Stats
        </button>
      </div>

      {/* Date Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '12px 18px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Period:</span>
          {['all', 'today', 'week', 'month', 'last_month', 'year', 'custom'].map((f) => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: dateFilter === f ? '1px solid #0284C7' : '1px solid #E2E8F0',
                background: dateFilter === f ? '#E0F2FE' : '#F8FAFC',
                color: dateFilter === f ? '#0369A1' : '#64748B',
                cursor: 'pointer'
              }}
            >
              {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : f === 'last_month' ? 'Last Month' : f === 'year' ? 'This Year' : 'Custom'}
            </button>
          ))}
        </div>
        {dateFilter === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
            <button onClick={() => fetchStats('custom')} style={{ padding: '4px 10px', background: '#0284C7', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>Apply</button>
          </div>
        )}
      </div>

      {/* KPI Grid */}
      <div className="support-kpi-grid">
        <div className="support-kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Orders Received</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={18} color="#0284C7" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '10px' }}>
            {loading ? '...' : (stats?.ordersReceived || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Sent by Sales Person in Period</div>
        </div>

        <div className="support-kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Delivery Notes Created</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '10px' }}>
            {loading ? '...' : (stats?.deliveryNotesCount || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Created in Period</div>
        </div>

        <div className="support-kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Pending Delivery Notes</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#D97706" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', marginTop: '10px' }}>
            {loading ? '...' : (stats?.ordersPendingDelivery || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Orders Awaiting DN Creation (Active Queue)</div>
        </div>

        <div className="support-kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Completed Deliveries</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={18} color="#4F46E5" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4F46E5', marginTop: '10px' }}>
            {loading ? '...' : (stats?.completedDeliveries || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Confirmed & Handed off to Accounts</div>
        </div>
      </div>

      {/* Warehouse Inventory Status Grid */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Boxes size={20} color="#0284C7" /> Warehouse Inventory Summary
        </h3>

        <div className="support-summary-grid">
          <div style={{ padding: '16px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total SKU Products</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
              {loading ? '...' : (stats?.totalInventoryItems || 0)}
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <div style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} /> Low Stock Products
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', marginTop: '6px' }}>
              {loading ? '...' : (stats?.lowStockCount || 0)}
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
            <div style={{ fontSize: '0.78rem', color: '#991B1B', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <XCircle size={14} /> Out of Stock Products
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#DC2626', marginTop: '6px' }}>
              {loading ? '...' : (stats?.outOfStockCount || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="support-action-grid">
        <button
          onClick={() => onNavigateTab('support_orders')}
          className="support-action-card"
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>Process Sales Orders</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>Review orders sent from Sales team</div>
          </div>
          <ArrowRight size={18} color="#0284C7" />
        </button>

        <button
          onClick={() => onNavigateTab('inventory')}
          className="support-action-card"
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>Manage Inventory</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>Update stock levels & product SKUs</div>
          </div>
          <ArrowRight size={18} color="#0284C7" />
        </button>

        <button
          onClick={() => onNavigateTab('delivery_notes')}
          className="support-action-card"
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>Confirm Delivery Notes</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>Confirm dispatches and notify Accounts</div>
          </div>
          <ArrowRight size={18} color="#0284C7" />
        </button>
      </div>
    </div>
  );
}
