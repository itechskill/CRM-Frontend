import React from 'react';
import { Bell, AlertTriangle, CheckCircle, Target, Megaphone, DollarSign } from 'lucide-react';
import './MarketingViews.css';

const notifications = [
  { id: 1, type: 'campaign', title: 'Campaign Milestone Reached', desc: 'Q3 Enterprise SaaS Launch surpassed 400 MQLs with 5.2% CTR.', time: '1 hour ago', icon: Megaphone, color: '#EC4899' },
  { id: 2, type: 'lead', title: 'High Intent Lead Alert', desc: 'Jonathan Ross from Nexus Corp scored 94/100 and requested a demo.', time: '3 hours ago', icon: Target, color: '#8B5CF6' },
  { id: 3, type: 'budget', title: 'Ad Spend Threshold Warning', desc: 'Google Ads account reached 85% of monthly budget limit.', time: '1 day ago', icon: DollarSign, color: '#F59E0B' },
  { id: 4, type: 'content', title: 'Social Post Published', desc: 'Case Study post published to LinkedIn Corporate with 2.4k impressions in 2h.', time: '2 days ago', icon: CheckCircle, color: '#10B981' },
];

export default function MarketingNotificationsView() {
  return (
    <div className="mkt-view-container">
      <div className="mkt-page-header">
        <div className="mkt-page-header-title">
          <h2>Marketing Alerts & Campaign Notifications</h2>
          <p>Real-time campaign updates, lead scoring alerts, and ad spend notifications.</p>
        </div>
      </div>

      <div className="mkt-card" style={{ padding: '8px' }}>
        {notifications.map((n) => {
          const Icon = n.icon;
          return (
            <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: n.color, flexShrink: 0 }}>
                <Icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>{n.title}</h4>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{n.time}</span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#475569' }}>{n.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
