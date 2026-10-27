import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Clock3,
  FileCheck2,
  FileText,
  PackageCheck,
  Receipt,
  ShoppingCart
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import '../employee/EmployeeDashboard.css';
import './FinanceDashboard.css';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const money = cents => `PKR ${(Number(cents || 0) / 100).toLocaleString('en-PK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;

const Tile = ({ icon: Icon, label, value, tone = '#2563EB', amount = true, rateNote = false }) => (
  <button type="button" className="sales-dashboard-nine-tile" disabled>
    <span className="sales-dashboard-nine-icon" style={{ color: tone, background: `${tone}14` }}><Icon size={21} /></span>
    <span className="sales-dashboard-nine-label">{label}</span>
    <span className="sales-dashboard-nine-count">{value?.count || 0}</span>
    {amount && <span className="sales-dashboard-nine-amount">{money(value?.amountCents)}</span>}
    {rateNote && Number(value?.missingExchangeRateCount || 0) > 0 && (
      <span className="sales-dashboard-nine-note">rate missing: {value.missingExchangeRateCount}</span>
    )}
  </button>
);

export default function FinanceDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest(`/api/finance/dashboard-stats?month=${selectedMonth}`)
      .then(({ response, data }) => {
        if (active && response.ok && data.success) setStats(data.data);
      })
      .catch(error => console.error('[Finance Dashboard Stats Error]:', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedMonth]);

  const tiles = stats?.tiles || {};

  return (
    <div className="emp-dashboard-container">
      <div className="sales-dashboard-section-header">
        <div><h2>Finance Dashboard</h2><p>Company-wide Finance activity for the selected month</p></div>
        <label className="sales-dashboard-month">
          <span>Month</span>
          <input type="month" value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)} />
        </label>
      </div>

      {loading ? <div className="sv-empty">Loading dashboard…</div> : (
        <div className="finance-dashboard-rows">
          <div className="sales-dashboard-nine-grid finance-dashboard-row-four">
            <Tile icon={ShoppingCart} label="SO" value={tiles.so} tone="#2563EB" />
            <Tile icon={FileText} label="Local PO Issued" value={tiles.localPoIssued} tone="#D97706" rateNote />
            <Tile icon={FileText} label="Global PO Issued" value={tiles.globalPoIssued} tone="#7C3AED" rateNote />
            <Tile icon={PackageCheck} label="Local GRN Input" value={tiles.localGrnInput} tone="#059669" amount={false} />
          </div>

          <div className="sales-dashboard-nine-grid">
            <Tile icon={PackageCheck} label="Global GRN Input" value={tiles.globalGrnInput} tone="#0F766E" amount={false} />
            <Tile icon={FileCheck2} label="Delivery Note" value={tiles.deliveryNote} tone="#0284C7" amount={false} />
            <Tile icon={Receipt} label="Invoiced" value={tiles.invoiced} tone="#059669" />
          </div>

          <div className="sales-dashboard-nine-grid">
            <Tile icon={Clock3} label="Receivable 1-30" value={tiles.receivable1To30} tone="#2563EB" />
            <Tile icon={AlertTriangle} label="Overdue Grace 31-45" value={tiles.overdueGrace31To45} tone="#D97706" />
            <Tile icon={AlertTriangle} label="Overdue 45+" value={tiles.overdue45Plus} tone="#DC2626" />
          </div>
        </div>
      )}
    </div>
  );
}
