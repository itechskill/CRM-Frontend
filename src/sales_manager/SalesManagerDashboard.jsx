import React, { useEffect, useState } from 'react';
import { AlertTriangle, Calculator, CircleDollarSign, FileCheck2, FileText, RefreshCw, ShoppingCart, Target } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './SalesManagerDashboard.css';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const money = value => `Rs. ${Number(value || 0).toLocaleString()}`;

const DashboardTile = ({ icon: Icon, label, count, amount, note, onClick, tone = '#2563EB' }) => (
  <button type="button" className="sales-dashboard-nine-tile" onClick={onClick} disabled={!onClick}>
    <span className="sales-dashboard-nine-icon" style={{ color: tone, background: `${tone}14` }}><Icon size={21} /></span>
    <span className="sales-dashboard-nine-label">{label}</span>
    {count != null && <span className="sales-dashboard-nine-count">{count}</span>}
    <span className="sales-dashboard-nine-amount">{amount}</span>
    {note && <span className="sales-dashboard-nine-note">{note}</span>}
  </button>
);

export default function SalesManagerDashboard({ currentUser, onNavigateTab }) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [stats, setStats] = useState(null);
  const [targetPerformance, setTargetPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const [statsResult, targetResult] = await Promise.all([
        apiRequest(`/api/sales-manager/dashboard-stats?month=${selectedMonth}`),
        apiRequest(`/api/target-performance/me?month=${selectedMonth}`)
      ]);
      if (statsResult.response.ok && statsResult.data.success) setStats(statsResult.data.data);
      if (targetResult.response.ok && targetResult.data.success) setTargetPerformance(targetResult.data.data || null);
      else setTargetPerformance(null);
    } catch (error) {
      console.error('Fetch sales manager dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, [selectedMonth]);

  const tiles = stats?.dashboardTiles || {};
  const targetIsSet = Boolean(targetPerformance?.visible && Number(targetPerformance?.salaryCents || 0) > 0);
  const targetUnavailableText = targetPerformance?.visible === false ? 'Hidden by Admin' : 'Target not set';
  const targetAmount = targetIsSet ? Number(targetPerformance.targetCents || 0) / 100 : null;
  const achievedGP = targetIsSet ? Number(targetPerformance.achievedGrossProfitCents || 0) / 100 : null;
  const remainingTarget = targetIsSet ? Math.max(0, targetAmount - achievedGP) : null;
  const go = tab => () => onNavigateTab?.(tab);
  const dashboardTiles = [
    { label: 'Price Requested', ...tiles.priceRequested, amount: 'requests created', icon: CircleDollarSign, onClick: go('price_requests') },
    { label: 'Price Received', ...tiles.priceReceived, amount: 'priced requests', icon: FileCheck2, tone: '#059669', onClick: go('price_requests') },
    { label: 'Quotation Sent', ...tiles.quotationSent, amount: money(tiles.quotationSent?.amount), icon: FileText, onClick: go('my_quotations') },
    { label: 'Sale Order', ...tiles.saleOrder, amount: money(tiles.saleOrder?.amount), icon: ShoppingCart, onClick: go('orders') },
    { label: 'Invoiced', ...tiles.invoiced, amount: money(tiles.invoiced?.amount), icon: Calculator, tone: '#7C3AED', onClick: go('invoices') },
    { label: 'Safe Receivable', ...tiles.safeReceivable, amount: money(tiles.safeReceivable?.amount), note: '1-30 days', icon: CircleDollarSign, tone: '#0284C7', onClick: go('invoices') },
    { label: 'Due Receivable', ...tiles.dueReceivable, amount: money(tiles.dueReceivable?.amount), note: '31-45 days, grace period', icon: AlertTriangle, tone: '#D97706', onClick: go('invoices') },
    { label: 'GP Target', count: null, amount: targetIsSet ? money(targetAmount) : targetUnavailableText, note: targetIsSet ? 'Salary × 5 for selected month' : '', icon: Target, tone: '#D97706', onClick: go('target_performance') },
    { label: 'Remaining Target', count: null, amount: targetIsSet ? money(remainingTarget) : targetUnavailableText, icon: Target, tone: '#EA580C', onClick: go('target_performance') },
    { label: 'Above 45 days', ...tiles.above45Days, amount: money(tiles.above45Days?.amount), icon: AlertTriangle, tone: '#DC2626', onClick: go('invoices') },
    { label: 'GP Achieved', count: null, amount: targetIsSet ? money(achievedGP) : targetUnavailableText, icon: FileCheck2, tone: '#059669', onClick: go('target_performance') }
  ];

  return (
    <div className="smd-dashboard-container">
      <div className="smd-top-banner">
        <div><h1 className="smd-title">My Sales Dashboard</h1><p className="smd-subtitle">Own records only · {currentUser?.fullName || 'Sales Manager'}</p></div>
        <div className="smd-actions-row">
          <label className="sales-dashboard-month"><span>Month</span><input type="month" value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)} /></label>
          <button className="smd-refresh-btn" onClick={() => { setRefreshing(true); fetchDashboard(); }} disabled={refreshing}><RefreshCw size={15} className={refreshing ? 'spinning' : ''} />{refreshing ? 'Syncing…' : 'Refresh'}</button>
        </div>
      </div>
      {loading ? <div className="smd-loading-container"><div className="smd-spinner" /><p>Loading Sales Dashboard…</p></div> : <div className="sales-dashboard-nine-grid">{dashboardTiles.map(tile => <DashboardTile key={tile.label} {...tile} />)}</div>}
    </div>
  );
}
