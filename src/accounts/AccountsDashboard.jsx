import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  FileCheck,
  Truck,
  FileText,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2
} from 'lucide-react';
import '../employee/EmployeeDashboard.css';

export default function AccountsDashboard({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filterPeriod, setFilterPeriod] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      let url = `/api/sales-employee/accounts/stats?filter=${filterPeriod}`;
      if (filterPeriod === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const { response, data } = await apiRequest(url);
      if (response.ok && data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error('[Fetch Accounts Stats Error]:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filterPeriod]);

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      fetchStats();
    }
  };

  return (
    <div className="emp-dashboard-container">
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #2563EB 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        boxShadow: '0 10px 25px rgba(37, 99, 235, 0.2)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Accounts &amp; Invoicing Dashboard</h2>
          <p style={{ margin: '6px 0 0', color: '#BFDBFE', fontSize: '0.88rem' }}>
            Confirmed delivery notes, draft invoice queue, and submission to Finance
          </p>
        </div>
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
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Stats
        </button>
      </div>

      {/* Date Filter Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '12px 18px',
        border: '1px solid #E2E8F0',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', marginRight: '6px', textTransform: 'uppercase' }}>
            Filter Period:
          </span>
          {[
            { key: 'all', label: 'All Time' },
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'last_month', label: 'Last Month' },
            { key: 'year', label: 'This Year' },
            { key: 'custom', label: 'Custom Range' }
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setFilterPeriod(p.key)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: filterPeriod === p.key ? '1px solid #2563EB' : '1px solid #E2E8F0',
                background: filterPeriod === p.key ? '#EFF6FF' : '#FFFFFF',
                color: filterPeriod === p.key ? '#2563EB' : '#64748B'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {filterPeriod === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              style={{ padding: '5px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
            />
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              style={{ padding: '5px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
            />
            <button
              onClick={handleCustomApply}
              style={{ padding: '5px 12px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #D97706', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Pending Draft Invoices</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#D97706" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', marginTop: '10px' }}>
            {loading ? '...' : (stats?.pendingDrafts || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>DNs awaiting draft or submission</div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #2563EB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Delivery Notes Received</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={18} color="#2563EB" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB', marginTop: '10px' }}>
            {loading ? '...' : (stats?.dnsReceived || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>In selected period</div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #10B981', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Draft Invoices Created</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '10px' }}>
            {loading ? '...' : (stats?.draftsCreated || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>In selected period</div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #6366F1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Draft Volume</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="#6366F1" />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6366F1', marginTop: '10px' }}>
            Rs. {loading ? '...' : Number(stats?.pendingAmount || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Commercial draft value</div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <button
          onClick={() => onNavigateTab('orders_ready')}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>Orders Ready</div>
            <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>View confirmed delivery notes and generate final invoices</div>
          </div>
          <ArrowRight size={20} color="#2563EB" />
        </button>

        <button
          onClick={() => onNavigateTab('invoices')}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>Invoice Management & Finance Handoff</div>
            <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>Review, edit, export PDFs, and submit invoices to Finance</div>
          </div>
          <ArrowRight size={20} color="#2563EB" />
        </button>
      </div>
    </div>
  );
}
