import React, { useEffect, useState } from 'react';
import { Boxes, FileText, ShoppingCart } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import '../../employee/EmployeeDashboard.css';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const money = cents => `PKR ${(Number(cents || 0) / 100).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const Tile = ({ icon: Icon, label, value, tone }) => (
  <button type="button" className="sales-dashboard-nine-tile" disabled>
    <span className="sales-dashboard-nine-icon" style={{ color: tone, background: `${tone}14` }}><Icon size={21} /></span>
    <span className="sales-dashboard-nine-label">{label}</span>
    <span className="sales-dashboard-nine-count">{value?.count || 0}</span>
    <span className="sales-dashboard-nine-amount">{money(value?.amountCents)}</span>
  </button>
);

export default function LocalPurchaserDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest(`/api/purchaser/stats?type=Local&month=${selectedMonth}`)
      .then(({ response, data }) => { if (active && response.ok && data.success) setStats(data.data); })
      .catch(error => console.error('Error fetching Local Purchaser dashboard:', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedMonth]);

  const tiles = stats?.tiles || {};
  return (
    <div className="employee-dashboard-container">
      <div className="sales-dashboard-section-header">
        <div><h2>Local Purchase Dashboard</h2><p>Local Purchase queue activity for the selected month</p></div>
        <label className="sales-dashboard-month"><span>Month</span><input type="month" value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)} /></label>
      </div>
      {loading ? <div className="sv-empty">Loading dashboard…</div> : (
        <div className="sales-dashboard-nine-grid">
          <Tile icon={ShoppingCart} label="Sale Order Received" value={tiles.saleOrderReceived} tone="#2563EB" />
          <Tile icon={Boxes} label="SO Stock" value={tiles.soStock} tone="#059669" />
          <Tile icon={FileText} label="PO Issued" value={tiles.poIssued} tone="#D97706" />
        </div>
      )}
    </div>
  );
}
