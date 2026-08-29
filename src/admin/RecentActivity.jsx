import React from 'react';
import { ArrowRight } from 'lucide-react';
import './RecentActivity.css';

const activities = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    initials: 'SJ',
    bg: '#3B82F6',
    action: 'Created a new deal for',
    target: 'Acme Inc.',
    time: '2 mins ago',
  },
  {
    id: 2,
    name: 'Daniel Torres',
    initials: 'DT',
    bg: '#10B981',
    action: 'Upgraded plan to',
    target: 'Enterprise Tier',
    time: '15 mins ago',
  },
  {
    id: 3,
    name: 'Joshua Reed',
    initials: 'JR',
    bg: '#F59E0B',
    action: 'Updated deal status for',
    target: 'Apex Global ($32k)',
    time: '1 hour ago',
  },
  {
    id: 4,
    name: 'Emma Field',
    initials: 'EF',
    bg: '#8B5CF6',
    action: 'Won deal with',
    target: 'TechCorp ($45,000)',
    time: '2 hours ago',
  },
  {
    id: 5,
    name: 'Ryan Cooper',
    initials: 'RC',
    bg: '#EF4444',
    action: 'Scheduled a demo meeting with',
    target: 'Innovate Labs',
    time: '4 hours ago',
  },
];

export default function RecentActivity({ onViewAll }) {
  return (
    <div className="widget-card" style={{ height: '340px' }}>
      <div className="widget-header">
        <div className="widget-title-group">
          <h3>Recent Activity</h3>
          <p>Live team actions & deal updates</p>
        </div>
        <button 
          onClick={onViewAll}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#2563EB',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          View All <ArrowRight size={14} />
        </button>
      </div>

      <div className="activity-list" style={{ overflowY: 'auto', paddingRight: '4px' }}>
        {activities.map((act) => (
          <div key={act.id} className="activity-item">
            <div className="activity-avatar" style={{ backgroundColor: act.bg }}>
              {act.initials}
            </div>
            <div className="activity-content">
              <div className="activity-text">
                <strong>{act.name}</strong> {act.action} <strong>{act.target}</strong>
              </div>
              <div className="activity-time">{act.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
