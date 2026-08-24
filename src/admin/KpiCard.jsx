import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './KpiCard.css';

export default function KpiCard({ title, value, change, isPositive, subtext, icon: Icon, colorTheme }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className={`kpi-icon-wrapper ${colorTheme}`}>
          <Icon size={22} />
        </div>
        <div className={`kpi-badge ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{change}</span>
        </div>
      </div>

      <div className="kpi-bottom">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{title}</div>
        <div className="kpi-subtext">{subtext}</div>
      </div>
    </div>
  );
}
