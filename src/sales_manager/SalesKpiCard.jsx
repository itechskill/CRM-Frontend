import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './SalesKpiCard.css';

export default function SalesKpiCard({ title, value, change, isPositive, subtext, icon: Icon, colorTheme = 'blue', progress }) {
  return (
    <div className={`sales-kpi-card theme-${colorTheme}`}>
      <div className="sales-kpi-top">
        <div className="sales-kpi-title">{title}</div>
        <div className="sales-kpi-icon-wrap">
          {Icon && <Icon size={20} />}
        </div>
      </div>

      <div className="sales-kpi-main">
        <div className="sales-kpi-value">{value}</div>
        <div className={`sales-kpi-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          <span>{change}</span>
        </div>
      </div>

      {progress !== undefined && (
        <div className="sales-kpi-progress-bar">
          <div className="sales-kpi-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      <div className="sales-kpi-subtext">{subtext}</div>
    </div>
  );
}
