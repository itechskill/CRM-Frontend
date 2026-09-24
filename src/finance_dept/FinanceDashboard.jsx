import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  FileText,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  PieChart,
  Clock
} from 'lucide-react';
import '../employee/EmployeeDashboard.css';

export default function FinanceDashboard({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      let url = `/api/sales-employee/finance/stats?filter=${filterPeriod}`;
      if (filterPeriod === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const { response, data } = await apiRequest(url);
      if (response.ok && data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error('[Fetch Finance Stats Error]:', e);
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
        background: 'linear-gradient(135deg, #0F172A 0%, #059669 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        boxShadow: '0 10px 25px rgba(5, 150, 105, 0.2)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Finance &amp; Receivables Dashboard</h2>
          <p style={{ margin: '6px 0 0', color: '#A7F3D0', fontSize: '0.88rem' }}>
            Receivables calculations, invoice finalization queue, and customer collections
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
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Financials
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
                border: filterPeriod === p.key ? '1px solid #059669' : '1px solid #E2E8F0',
                background: filterPeriod === p.key ? '#ECFDF5' : '#FFFFFF',
                color: filterPeriod === p.key ? '#047857' : '#64748B'
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
              style={{ padding: '5px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* KPI Grid - 5 Specified Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Card 1: Sales Orders */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #2563EB', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sales Orders</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color="#2563EB" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '10px' }}>
            {loading ? '...' : (stats?.salesOrdersCount || 0)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 700, marginTop: '4px' }}>
            Total Amount: PKR {loading ? '...' : Math.round(Number(stats?.salesOrdersAmount || 0)).toLocaleString()}
          </div>
        </div>

        {/* Card 2: Delivery Notes */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #7C3AED', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Delivery Notes</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#7C3AED" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7C3AED', marginTop: '10px' }}>
            {loading ? '...' : (stats?.deliveryNotesCount || 0)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginTop: '4px' }}>
            Total Dispatched Deliveries
          </div>
        </div>

        {/* Card 3: Invoices */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #059669', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Invoices</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '10px' }}>
            {loading ? '...' : (stats?.invoicesCount || stats?.totalInvoices || 0)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
            Invoice Amount: PKR {loading ? '...' : Math.round(Number(stats?.invoicesAmount || stats?.totalInvoicedAmount || 0)).toLocaleString()}
          </div>
        </div>

        {/* Card 4: Receivables */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #0284C7', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Receivables</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} color="#0284C7" />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284C7', marginTop: '10px' }}>
            PKR {loading ? '...' : Math.round(Number(stats?.receivablesAmount || stats?.outstandingReceivables || 0)).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Invoice Amount - Valid Payments</div>
        </div>

        {/* Card 5: Overdue */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #DC2626', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Overdue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="#DC2626" />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626', marginTop: '10px' }}>
            PKR {loading ? '...' : Math.round(Number(stats?.overdueAmount || 0)).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Synced with Overdue Approvals</div>
        </div>
      </div>

      {/* Payment Collections Breakdown */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={20} color="#059669" /> Payment Types Breakdown
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Advance Payments</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563EB', marginTop: '6px' }}>
              {loading ? '...' : (stats?.advancePaymentsCount || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Recorded upfront payments</div>
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Partial Payments</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', marginTop: '6px' }}>
              {loading ? '...' : (stats?.partialPaymentsCount || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Partial installment payments</div>
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Full Payments</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
              {loading ? '...' : (stats?.fullPaymentsCount || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '2px' }}>Fully cleared invoices</div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <button
          onClick={() => onNavigateTab('finance_receivables')}
          style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>Accounts Receivable</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>View remaining balances & overdue status</div>
          </div>
          <ArrowRight size={18} color="#059669" />
        </button>

        <button
          onClick={() => onNavigateTab('finance_payments')}
          style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>Record Payment</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>Register customer collections</div>
          </div>
          <ArrowRight size={18} color="#059669" />
        </button>

        <button
          onClick={() => onNavigateTab('finance_reports')}
          style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>Financial Reports</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>Export PDF & Excel collection reports</div>
          </div>
          <ArrowRight size={18} color="#059669" />
        </button>
      </div>
    </div>
  );
}
