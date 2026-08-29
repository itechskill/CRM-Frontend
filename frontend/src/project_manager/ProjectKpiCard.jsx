import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './ProjectKpiCard.css';

const THEME_STYLES = {
  blue: { bg: '#EFF6FF', color: '#2563EB' },
  indigo: { bg: '#EEF2FF', color: '#6366F1' },
  green: { bg: '#ECFDF5', color: '#10B981' },
  teal: { bg: '#F0FDFA', color: '#0D9488' },
  amber: { bg: '#FFFBEB', color: '#D97706' },
  purple: { bg: '#FAF5FF', color: '#A855F7' },
};

export default function ProjectKpiCard({
  title,
  value,
  subtext,
  subtextType = 'positive',
  icon: Icon,
  colorTheme = 'blue',
  isUp = true,
}) {
  const theme = THEME_STYLES[colorTheme] || THEME_STYLES.blue;
  const subtextColor = subtextType === 'warning' ? '#D97706' : '#16A34A';
  const arrowColor = isUp ? '#16A34A' : '#D97706';

  return (
    <div className="project-kpi-card">
      <div className="project-kpi-top">
        <div className="project-kpi-icon" style={{ backgroundColor: theme.bg, color: theme.color }}>
          {Icon ? <Icon size={18} /> : null}
        </div>
        <div className="project-kpi-trend-icon" style={{ color: arrowColor }}>
          {isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        </div>
      </div>

      <div className="project-kpi-bottom">
        <div className="project-kpi-value">{value}</div>
        <div className="project-kpi-label">{title}</div>
        <div className="project-kpi-subtext" style={{ color: subtextColor }}>
          {subtext}
        </div>
      </div>
    </div>
  );
}


