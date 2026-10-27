import React, { useEffect, useState } from 'react';
import { FileCheck, PackageCheck, Plane, ShoppingCart, Truck } from 'lucide-react';
import { apiRequest } from '../utils/api';
import '../employee/EmployeeDashboard.css';
import './LogisticsPortal.css';

const currentMonth = () => new Date().toISOString().slice(0, 7);

const Tile = ({ icon: Icon, label, count, tone = '#2563EB' }) => (
  <button type="button" className="sales-dashboard-nine-tile" disabled>
    <span className="sales-dashboard-nine-icon" style={{ color: tone, background: `${tone}14` }}><Icon size={21} /></span>
    <span className="sales-dashboard-nine-label">{label}</span>
    <span className="sales-dashboard-nine-count">{count}</span>
  </button>
);

export default function LogisticsDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest(`/api/logistics/stats?month=${selectedMonth}`)
      .then(({ response, data }) => {
        if (active && response.ok && data.success) setStats(data.data);
      })
      .catch(error => console.error('[Logistics Stats Fetch Error]:', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedMonth]);

  const tiles = stats?.tiles || {};

  return (
    <div className="logistics-dashboard-container">
      <div className="sales-dashboard-section-header">
        <div><h2>Logistics Dashboard</h2><p>Global order and logistics activity for the selected month</p></div>
        <label className="sales-dashboard-month"><span>Month</span><input type="month" value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)} /></label>
      </div>

      {loading ? <div className="sv-empty">Loading dashboard…</div> : (
        <>
          <div className="sales-dashboard-nine-grid">
            <Tile icon={ShoppingCart} label="SO Received" count={tiles.soReceived?.count || 0} />
            <Tile icon={FileCheck} label="PO Issued" count={tiles.poIssued?.count || 0} tone="#7C3AED" />
            <Tile icon={PackageCheck} label="Global GRN Input" count={tiles.globalGrnInput?.count || 0} tone="#059669" />
          </div>

          <section className="logistics-shipment-status-section">
            <h3>Shipment Status</h3>
            <div className="sales-dashboard-nine-grid logistics-shipment-status-grid">
              <Tile icon={Truck} label="Pickup" count={tiles.pickup?.count || 0} tone="#D97706" />
              <Tile icon={Plane} label="In transit" count={tiles.inTransit?.count || 0} tone="#0284C7" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
