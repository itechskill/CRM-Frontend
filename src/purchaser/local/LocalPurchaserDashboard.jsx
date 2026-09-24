import React, { useState, useEffect } from 'react';
import {
  FileText,
  ClipboardCheck,
  CreditCard,
  Building2,
  Plus,
  ArrowRight,
  TrendingUp,
  PackageCheck,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { apiRequest } from '../../utils/api';

export default function LocalPurchaserDashboard({ currentUser, onNavigateTab }) {
  const [stats, setStats] = useState({
    totalPOs: 0,
    totalGRNs: 0,
    totalPayablesAmount: 0,
    totalSuppliers: 0,
    pendingOrdersCount: 0,
    recentPOs: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/purchaser/stats?type=Local');
      if (res.success) {
        setStats(res.stats || res.data);
      }
    } catch (err) {
      console.error('Error fetching local purchaser stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const formatPKR = (num) => {
    return `PKR ${Number(num || 0).toLocaleString('en-PK')}`;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          color: '#FFFFFF',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px rgba(5, 150, 105, 0.2)'
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
            Local Procurement Portal
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '6px 0 4px 0' }}>
            Welcome, {currentUser?.fullName || 'Local Purchaser'}
          </h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
            Manage warehouse stock, local supplier POs, Goods Received Notes (GRN), and local payables.
          </p>
        </div>
        <button
          onClick={fetchDashboardStats}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '10px',
            color: '#FFF',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            backdropFilter: 'blur(10px)'
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Actionable Banner for Pending Green File Orders */}
      {stats.pendingOrdersCount > 0 && (
        <div
          onClick={() => onNavigateTab && onNavigateTab('pending_orders')}
          style={{
            background: '#ECFDF5',
            border: '1.5px solid #10B981',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#059669', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#065F46' }}>
                {stats.pendingOrdersCount} Green File Sales Order{stats.pendingOrdersCount > 1 ? 's' : ''} Awaiting Inventory Check / Procurement
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Approved by Finance. Check stock in inventory; if available, dispatch directly to Support; if short, issue Local Supplier PO.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>
            <span>Check Inventory &amp; Process</span>
            <ArrowRight size={16} />
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div
          onClick={() => onNavigateTab && onNavigateTab('pending_orders')}
          style={{
            backgroundColor: '#FFF',
            borderRadius: '14px',
            padding: '20px',
            border: stats.pendingOrdersCount > 0 ? '2px solid #059669' : '1px solid #E2E8F0',
            borderLeft: '5px solid #059669',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#065F46', fontSize: '0.88rem', fontWeight: 700 }}>Green File Orders Pending</span>
            <div style={{ background: '#ECFDF5', padding: '10px', borderRadius: '10px', color: '#059669' }}>
              <ShoppingBag size={22} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#065F46', margin: '0 0 4px 0' }}>{stats.pendingOrdersCount || 0}</h3>
          <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Awaiting Local Procurement &rarr;
          </span>
        </div>

        <div style={{ backgroundColor: '#FFF', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#64748B', fontSize: '0.88rem', fontWeight: 600 }}>Local POs Issued</span>
            <div style={{ background: '#ECFDF5', padding: '10px', borderRadius: '10px', color: '#059669' }}>
              <FileText size={22} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>{stats.totalPOs}</h3>
          <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>Issued to Local Suppliers</span>
        </div>

        <div style={{ backgroundColor: '#FFF', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#64748B', fontSize: '0.88rem', fontWeight: 600 }}>Local GRNs Processed</span>
            <div style={{ background: '#EFF6FF', padding: '10px', borderRadius: '10px', color: '#2563EB' }}>
              <ClipboardCheck size={22} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>{stats.totalGRNs}</h3>
          <span style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>Supplier &amp; Warehouse Receipts</span>
        </div>

        <div style={{ backgroundColor: '#FFF', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#64748B', fontSize: '0.88rem', fontWeight: 600 }}>Local Payables</span>
            <div style={{ background: '#FEF3C7', padding: '10px', borderRadius: '10px', color: '#D97706' }}>
              <CreditCard size={22} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>{formatPKR(stats.totalPayablesAmount)}</h3>
          <span style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 600 }}>Cash, Cheque &amp; PDC</span>
        </div>

        <div style={{ backgroundColor: '#FFF', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#64748B', fontSize: '0.88rem', fontWeight: 600 }}>Local Suppliers</span>
            <div style={{ background: '#F3E8FF', padding: '10px', borderRadius: '10px', color: '#9333EA' }}>
              <Building2 size={22} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>{stats.totalSuppliers}</h3>
          <span style={{ fontSize: '0.8rem', color: '#9333EA', fontWeight: 600 }}>Registered Suppliers</span>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <button
          onClick={() => onNavigateTab && onNavigateTab('supplier_pos')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            padding: '20px',
            backgroundColor: '#FFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease'
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#0F172A', fontWeight: 700 }}>PO Issued to Supplier</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Create and manage local supplier purchase orders</p>
          </div>
          <ArrowRight size={20} color="#059669" />
        </button>

        <button
          onClick={() => onNavigateTab && onNavigateTab('grn')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            padding: '20px',
            backgroundColor: '#FFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease'
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#0F172A', fontWeight: 700 }}>Goods Received Notes (GRN)</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Record received products &amp; warehouse verification</p>
          </div>
          <ArrowRight size={20} color="#2563EB" />
        </button>

        <button
          onClick={() => onNavigateTab && onNavigateTab('local_payables')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            padding: '20px',
            backgroundColor: '#FFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease'
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#0F172A', fontWeight: 700 }}>Local Payable</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Manage Cash, Cheque &amp; PDC payments to suppliers</p>
          </div>
          <ArrowRight size={20} color="#D97706" />
        </button>
      </div>

      {/* Recent POs Table */}
      <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Recent Local Purchase Orders</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>Latest POs issued to local vendors</p>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('supplier_pos')}
            style={{ backgroundColor: '#ECFDF5', color: '#059669', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
          >
            View All POs
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>PO Number</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Supplier</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>PO Date</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Total Amount</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPOs && stats.recentPOs.length > 0 ? (
                stats.recentPOs.map((po) => (
                  <tr key={po._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#059669' }}>{po.poNumber}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0F172A' }}>{po.supplierName}</td>
                    <td style={{ padding: '14px 20px', color: '#64748B' }}>
                      {po.poDate ? new Date(po.poDate).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>{formatPKR(po.totalAmountPKR)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: po.status === 'Completed' ? '#DEF7EC' : po.status === 'Cancelled' ? '#FDE8E8' : '#FEF3C7',
                          color: po.status === 'Completed' ? '#03543F' : po.status === 'Cancelled' ? '#9B1C1C' : '#92400E'
                        }}
                      >
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
                    No local purchase orders issued yet. Click "PO Issued to Supplier" to create your first order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
