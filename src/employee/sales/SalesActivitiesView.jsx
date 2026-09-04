import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { ClipboardList } from 'lucide-react';
import './SalesViews.css';

const ACTIVITY_ICONS = {
  'Lead Created': '🎯', 'Lead Updated': '✏️', 'Lead Converted': '🏆',
  'Quotation Created': '📄', 'Quotation Sent': '📤', 'Quotation Accepted': '✅', 'Quotation Rejected': '❌',
  'Sales Order Created': '🛒', 'Sales Order Updated': '🔄',
  'Delivery Note Created': '📦',
  'Follow-up Created': '📅', 'Follow-up Completed': '✔️',
  'Customer Contacted': '📞',
  'Target Updated': '🎯',
  'Other': '📋'
};

const ACTIVITY_COLORS = {
  'Lead Created': '#6366F1', 'Lead Converted': '#F59E0B',
  'Quotation Created': '#3B82F6', 'Quotation Accepted': '#10B981', 'Quotation Rejected': '#EF4444',
  'Sales Order Created': '#2563EB',
  'Follow-up Completed': '#10B981', 'Follow-up Created': '#EC4899',
  'Customer Contacted': '#8B5CF6',
  default: '#64748B'
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

export default function SalesActivitiesView() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const { response, data } = await apiRequest('/api/sales-employee/activities');
        if (response.ok && data.success) setActivities(data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><ClipboardList size={20} /> Activity Log</h2>
          <p className="sv-subtitle">Your complete sales activity history</p>
        </div>
      </div>

      {loading ? <div className="sv-loading">Loading activities...</div>
        : activities.length === 0 ? (
          <div className="sv-empty-card" style={{ marginTop: '24px' }}>
            <ClipboardList size={48} color="#374151" />
            <p style={{ color: '#64748B', marginTop: '12px' }}>No activities yet. Your actions will appear here.</p>
          </div>
        ) : (
          <div className="sv-activity-timeline">
            {activities.map((act, idx) => {
              const color = ACTIVITY_COLORS[act.type] || ACTIVITY_COLORS.default;
              return (
                <div key={act._id} className="sv-activity-item">
                  <div className="sv-activity-node" style={{ background: color, boxShadow: `0 0 0 4px ${color}22` }}>
                    <span style={{ fontSize: '12px' }}>{ACTIVITY_ICONS[act.type] || '📋'}</span>
                  </div>
                  <div className="sv-activity-body">
                    <div className="sv-activity-row">
                      <span className="sv-activity-type" style={{ color }}>{act.type}</span>
                      <span className="sv-activity-time">{timeAgo(act.createdAt)}</span>
                    </div>
                    {act.description && <p className="sv-activity-desc">{act.description}</p>}
                    <span className="sv-activity-date">{new Date(act.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
