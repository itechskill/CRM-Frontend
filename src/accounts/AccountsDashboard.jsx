import React, { useEffect, useState } from 'react';
import { DollarSign, FileText, RefreshCw, Truck } from 'lucide-react';
import { apiRequest } from '../utils/api';
import '../employee/EmployeeDashboard.css';

const cards = [
  { step: 1, label: 'Total Delivery Notes Received', key: 'dnsReceived', icon: Truck, color: '#2563EB', background: '#EFF6FF' },
  { step: 2, label: 'Draft Invoices Created', key: 'draftsCreated', icon: FileText, color: '#059669', background: '#ECFDF5' },
  { step: 3, label: 'Total Value of Draft Invoices', key: 'pendingAmount', icon: DollarSign, color: '#6366F1', background: '#EEF2FF', money: true }
];

export default function AccountsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      let url = `/api/sales-employee/accounts/stats?filter=${filterPeriod}`;
      if (filterPeriod === 'custom' && customStart && customEnd) url += `&startDate=${customStart}&endDate=${customEnd}`;
      const { response, data } = await apiRequest(url);
      if (response.ok && data.success) setStats(data.data);
    } catch (error) {
      console.error('[Fetch Accounts Stats Error]:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filterPeriod]);

  return (
    <div className="emp-dashboard-container">
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #2563EB 100%)', borderRadius: 16, padding: '24px 28px',
        color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
        boxShadow: '0 10px 25px rgba(37, 99, 235, 0.2)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Accounts &amp; Invoicing Dashboard</h2>
          <p style={{ margin: '6px 0 0', color: '#BFDBFE', fontSize: '0.88rem' }}>Confirmed delivery notes, draft invoice queue, and submission to Finance</p>
        </div>
        <button onClick={fetchStats} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: '#FFFFFF', borderRadius: 8, padding: '8px 14px', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Stats
        </button>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '12px 18px', border: '1px solid #E2E8F0', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#64748B', marginRight: 6, textTransform: 'uppercase' }}>Filter Period:</span>
          {[
            ['all', 'All Time'], ['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'],
            ['last_month', 'Last Month'], ['year', 'This Year'], ['custom', 'Custom Range']
          ].map(([key, label]) => (
            <button key={key} onClick={() => setFilterPeriod(key)} style={{ padding: '6px 12px', borderRadius: 6, fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', border: filterPeriod === key ? '1px solid #2563EB' : '1px solid #E2E8F0', background: filterPeriod === key ? '#EFF6FF' : '#FFFFFF', color: filterPeriod === key ? '#2563EB' : '#64748B' }}>{label}</button>
          ))}
        </div>
        {filterPeriod === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input type="date" value={customStart} onChange={event => setCustomStart(event.target.value)} style={{ padding: '5px 8px', fontSize: '.8rem', borderRadius: 6, border: '1px solid #CBD5E1' }} />
            <span style={{ fontSize: '.8rem', color: '#64748B' }}>to</span>
            <input type="date" value={customEnd} onChange={event => setCustomEnd(event.target.value)} style={{ padding: '5px 8px', fontSize: '.8rem', borderRadius: 6, border: '1px solid #CBD5E1' }} />
            <button onClick={() => customStart && customEnd && fetchStats()} style={{ padding: '5px 12px', background: '#2563EB', color: '#FFFFFF', border: 0, borderRadius: 6, fontSize: '.8rem', fontWeight: 600, cursor: 'pointer' }}>Apply</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {cards.map(({ step, label, key, icon: Icon, color, background, money }) => (
          <div key={key} style={{ background: '#FFFFFF', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', borderLeft: `4px solid ${color}`, boxShadow: '0 2px 6px rgba(15,23,42,.05)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ alignSelf: 'flex-start', fontSize: '.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em' }}>Step {step}</span>
            <div style={{ width: 42, height: 42, flex: '0 0 42px', borderRadius: 9, background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={color} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '.82rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: '1.55rem', fontWeight: 800, color, marginTop: 6 }}>{money ? `Rs. ${loading ? '...' : Number(stats?.[key] || 0).toLocaleString()}` : (loading ? '...' : stats?.[key] || 0)}</div>
              {key === 'draftsCreated' && <div style={{ fontSize: '.8rem', color: '#64748B', marginTop: 4 }}>Awaiting draft invoice: {loading ? '...' : stats?.pendingDrafts || 0}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
