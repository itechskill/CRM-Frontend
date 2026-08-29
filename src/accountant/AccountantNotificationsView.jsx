import React from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, DollarSign, FileText } from 'lucide-react';
import './AccountantViews.css';

const notifications = [
  { id: 1, type: 'overdue', title: 'Overdue Invoice Alert', desc: 'Invoice INV-2026-091 from Starlight Ventures ($8,400) is 5 days overdue.', time: '2 hours ago', icon: AlertTriangle, color: '#EF4444' },
  { id: 2, type: 'payment', title: 'Payment Received', desc: 'Proxima Labs completed wire transfer payment of $14,500.00 for INV-2026-089.', time: '5 hours ago', icon: CheckCircle, color: '#10B981' },
  { id: 3, type: 'payroll', title: 'Payroll Approval Required', desc: 'August 2026 Payroll batch ready for accountant final sign-off.', time: '1 day ago', icon: DollarSign, color: '#3B82F6' },
  { id: 4, type: 'tax', title: 'Q3 Tax Filing Reminder', desc: 'Quarterly sales tax remittance due in 15 days.', time: '2 days ago', icon: FileText, color: '#F59E0B' },
];

export default function AccountantNotificationsView() {
  return (
    <div className="acc-view-container">
      <div className="acc-page-header">
        <div className="acc-page-header-title">
          <h2>Financial Alerts & Notifications</h2>
          <p>Real-time payment notifications, tax reminders, and invoice alerts.</p>
        </div>
      </div>

      <div className="acc-card" style={{ padding: '8px' }}>
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
