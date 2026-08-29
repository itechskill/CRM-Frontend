import React from 'react';
import { DollarSign, TrendingUp, CreditCard, PieChart } from 'lucide-react';
import './SalesFinanceView.css';

export default function SalesFinanceView() {
  return (
    <div className="ceo-view-container">
      <div className="ceo-grid-3">
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Monthly Recurring Revenue (MRR)</span>
          <span className="ceo-stat-num">$356,800</span>
          <span className="ceo-stat-trend positive">+12.4% vs last month</span>
        </div>
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Average Deal Size</span>
          <span className="ceo-stat-num">$48,200</span>
          <span className="ceo-stat-trend positive">+8.5% YoY</span>
        </div>
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Customer Lifetime Value (LTV)</span>
          <span className="ceo-stat-num">$182,000</span>
          <span className="ceo-stat-trend neutral">LTV:CAC ratio 4.8:1</span>
        </div>
      </div>

      <div className="ceo-card-panel">
        <div className="ceo-card-title">
          <span>Enterprise Financial Performance Overview</span>
        </div>
        <div className="ceo-chart-placeholder">
          [ Executive Sales & Finance Revenue Breakdown Chart Placeholder ]
        </div>
      </div>
    </div>
  );
}