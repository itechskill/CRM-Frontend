import React, { useEffect, useState } from 'react';
import { AlertTriangle, FileCheck, Headphones, PackageCheck, ShoppingCart, TicketCheck } from 'lucide-react';
import { apiRequest } from '../utils/api';
import '../employee/EmployeeDashboard.css';
import './SupportPortal.css';

const currentMonth = () => new Date().toISOString().slice(0, 7);

const Tile = ({ icon: Icon, label, count, children, tone = '#0284C7' }) => (
  <button type="button" className="sales-dashboard-nine-tile" disabled>
    <span className="sales-dashboard-nine-icon" style={{ color: tone, background: `${tone}14` }}><Icon size={21} /></span>
    <span className="sales-dashboard-nine-label">{label}</span>
    {count != null && <span className="sales-dashboard-nine-count">{count}</span>}
    {children}
  </button>
);

export default function SupportDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest(`/api/sales-employee/support/stats?month=${selectedMonth}`)
      .then(({ response, data }) => {
        if (active && response.ok && data.success) setStats(data.data);
      })
      .catch(error => console.error('[Fetch Support Stats Error]:', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedMonth]);

  const tiles = stats?.tiles || {};
  return (
    <div className="support-dashboard-container">
      <div className="sales-dashboard-section-header">
        <div><h2>Support Dashboard</h2><p>Support queue activity for the selected month</p></div>
        <label className="sales-dashboard-month"><span>Month</span><input type="month" value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)} /></label>
      </div>
      {loading ? <div className="sv-empty">Loading dashboard…</div> : (
        <div className="sales-dashboard-nine-grid">
          <Tile icon={ShoppingCart} label="Sale Order Received" count={tiles.saleOrderReceived?.count || 0} />
          <Tile icon={FileCheck} label="DN Created" count={tiles.dnCreated?.count || 0} tone="#2563EB" />
          <Tile icon={PackageCheck} label="GRN Input" count={tiles.grnInput?.total || 0} tone="#059669">
            <span className="sales-dashboard-nine-note">Local {tiles.grnInput?.local || 0} &nbsp;|&nbsp; Global {tiles.grnInput?.global || 0}</span>
          </Tile>
          <Tile icon={AlertTriangle} label="Expiry Date Notification" count={tiles.expiryDateNotification?.count || 0} tone="#D97706" />
          <Tile icon={Headphones} label="Ticket Received" count={tiles.ticketReceived?.count || 0} tone="#7C3AED" />
          <Tile icon={TicketCheck} label="Ticket Resolved" count={tiles.ticketResolved?.count || 0} tone="#16A34A" />
        </div>
      )}
    </div>
  );
}
