import React, { useState, useEffect } from 'react';
import {
  Globe,
  FileText,
  Building2,
  DollarSign,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '../../utils/api';

export default function GlobalPurchaserDashboard({ currentUser, onNavigateTab }) {
  const [stats, setStats] = useState({
    totalPOs: 0,
    totalSuppliers: 0,
    totalValuePKR: 0,
    pendingOrdersCount: 0,
    recentPOs: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/purchaser/stats?type=Global&subDept=Global');
      if (res.success && (res.stats || res.data)) {
        setStats(res.stats || res.data);
      }
    } catch (err) {
      console.error('Error fetching global stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatPKR = (num) => `PKR ${Number(num || 0).toLocaleString('en-PK')}`;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          color: '#FFFFFF',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px rgba(37, 99, 235, 0.25)'
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
            Global Procurement Portal
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '6px 0 4px 0' }}>
            Welcome, {currentUser?.fullName || 'Global Purchaser'}
          </h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
            Manage overseas suppliers, international Purchase Orders, shipping ports, and LC terms.
          </p>
        </div>
        <button
          onClick={fetchStats}
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

      {/* Actionable Banner for Pending Blue File Orders */}
      {stats.pendingOrdersCount > 0 && (
        <div
          onClick={() => onNavigateTab && onNavigateTab('pending_orders')}
          style={{
            background: '#EFF6FF',
            border: '1.5px solid #3B82F6',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.12)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E3A8A' }}>
                {stats.pendingOrdersCount} Blue File Sales Order{stats.pendingOrdersCount > 1 ? 's' : ''} Awaiting International PO
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Cleared by Finance for overseas procurement. Click here to open Pending Orders tab and issue International PO.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563EB', fontWeight: 700, fontSize: '0.85rem' }}>
            <span>Review &amp; Issue PO</span>
            <ArrowRight size={16} />
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div
          onClick={() => onNavigateTab && onNavigateTab('pending_orders')}
          style={{
            backgroundColor: '#FFF',
            borderRadius: '14px',
            padding: '20px',
            border: stats.pendingOrdersCount > 0 ? '2px solid #2563EB' : '1px solid #E2E8F0',
            borderLeft: '5px solid #2563EB',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#1E40AF', fontSize: '0.88rem', fontWeight: 700 }}>Blue File Orders Pending</span>
            <div style={{ background: '#EFF6FF', padding: '10px', borderRadius: '10px', color: '#2563EB' }}>
              <Globe size={22} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E40AF', margin: '0 0 4px 0' }}>{stats.pendingOrdersCount || 0}</h3>
          <span style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Awaiting International PO &rarr;
          </span>
        </div>

        <div style={{ backgroundColor: '#FFF', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#64748B', fontSize: '0.88rem', fontWeight: 600 }}>Global POs Issued</span>
            <div style={{ background: '#EFF6FF', padding: '10px', borderRadius: '10px', color: '#2563EB' }}>
              <FileText size={22} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>{stats.totalPOs}</h3>
          <span style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>International Orders</span>
        </div>

        <div style={{ backgroundColor: '#FFF', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#64748B', fontSize: '0.88rem', fontWeight: 600 }}>Overseas Suppliers</span>
            <div style={{ background: '#F3E8FF', padding: '10px', borderRadius: '10px', color: '#9333EA' }}>
              <Building2 size={22} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>{stats.totalSuppliers}</h3>
          <span style={{ fontSize: '0.8rem', color: '#9333EA', fontWeight: 600 }}>Registered Global Vendors</span>
        </div>

        <div style={{ backgroundColor: '#FFF', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#64748B', fontSize: '0.88rem', fontWeight: 600 }}>Total Global PO Spend</span>
            <div style={{ background: '#ECFDF5', padding: '10px', borderRadius: '10px', color: '#059669' }}>
              <DollarSign size={22} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>{formatPKR(stats.totalValuePKR)}</h3>
          <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>Converted to PKR</span>
        </div>
      </div>

      {/* Quick Action */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => onNavigateTab && onNavigateTab('supplier_pos')}
          style={{
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            padding: '20px',
            backgroundColor: '#FFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#0F172A', fontWeight: 700 }}>Global Supplier Purchase Orders</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Manage international POs, ports &amp; LC terms</p>
          </div>
          <ArrowRight size={20} color="#2563EB" />
        </button>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Recent Global Purchase Orders</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>Latest international POs issued</p>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('supplier_pos')}
            style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
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
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Country</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Total Amount (PKR)</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPOs && stats.recentPOs.length > 0 ? (
                stats.recentPOs.map((po) => (
                  <tr key={po._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#2563EB' }}>{po.poNumber}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0F172A' }}>{po.supplierName}</td>
                    <td style={{ padding: '14px 20px', color: '#64748B' }}>{po.supplierCountry || 'Overseas'}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>{formatPKR(po.totalAmountPKR)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: po.status === 'Completed' ? '#DEF7EC' : '#FEF3C7', color: po.status === 'Completed' ? '#03543F' : '#92400E' }}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
                    No global purchase orders issued yet.
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
