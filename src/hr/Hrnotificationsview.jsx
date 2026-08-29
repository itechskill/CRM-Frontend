import React, { useState } from 'react';
import { UserPlus, CalendarClock, ClipboardCheck, AlertCircle, Check, Bell } from 'lucide-react';
import './HRNotificationsView.css';

const filterTabs = ['All', 'Unread', 'Leave Requests', 'Onboarding', 'Reviews', 'System'];

const iconMap = {
  leave: { icon: CalendarClock, bg: '#FEF3C7', color: '#D97706' },
  onboarding: { icon: UserPlus, bg: '#DBEAFE', color: '#2563EB' },
  review: { icon: ClipboardCheck, bg: '#DCFCE7', color: '#16A34A' },
  system: { icon: AlertCircle, bg: '#EDE9FE', color: '#7C3AED' },
};

const initialNotifications = [
  {
    id: 1,
    type: 'leave',
    category: 'Leave Requests',
    title: 'New leave request from Daniel Torres',
    message: 'Requested 3 days off (Dec 22 – Dec 24) for personal leave.',
    time: '15m ago',
    read: false,
  },
  {
    id: 2,
    type: 'onboarding',
    category: 'Onboarding',
    title: 'New hire onboarding: Priya Shah',
    message: 'Start date is Monday. Onboarding checklist is 60% complete.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 3,
    type: 'review',
    category: 'Reviews',
    title: 'Performance review due: Aisha Nkosi',
    message: 'Q4 performance review is due for submission by Friday.',
    time: '3 hours ago',
    read: false,
  },
  {
    id: 4,
    type: 'system',
    category: 'System',
    title: 'Payroll run scheduled',
    message: 'December payroll will be processed automatically on the 28th.',
    time: 'Yesterday',
    read: true,
  },
  {
    id: 5,
    type: 'leave',
    category: 'Leave Requests',
    title: 'Leave request approved: Marcus Vance',
    message: 'Your approval for sick leave (Dec 10 – Dec 11) was recorded.',
    time: '2 days ago',
    read: true,
  },
];

export default function HRNotificationsView() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState('All');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return !n.read;
    return n.category === activeFilter;
  });

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="hr-notifications-view">
      <div className="hr-notifications-feed-card">
        <div className="hr-notifications-feed-header">
          <div className="hr-notifications-feed-title">
            <h2>Notifications</h2>
            {unreadCount > 0 && <span className="hr-unread-badge">{unreadCount} unread</span>}
          </div>
          <div className="hr-notifications-feed-actions">
            <button className="hr-btn-secondary" onClick={markAllRead}>
              <Check size={14} /> Mark all read
            </button>
            <button className="hr-btn-secondary" onClick={clearAll}>
              <Bell size={14} /> Clear all
            </button>
          </div>
        </div>
      </div>

      <div className="hr-notifications-filter-row">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            className={`hr-filter-pill ${activeFilter === tab ? 'hr-filter-pill-active' : ''}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="hr-notifications-list-card">
        {filteredNotifications.length === 0 && (
          <div className="hr-notifications-empty">No notifications</div>
        )}
        {filteredNotifications.map((n) => {
          const { icon: Icon, bg, color } = iconMap[n.type] || iconMap.system;
          return (
            <div
              key={n.id}
              className={`hr-notification-row ${!n.read ? 'hr-notification-row-unread' : ''}`}
            >
              <span className="hr-notification-icon" style={{ background: bg, color }}>
                <Icon size={18} />
              </span>
              <div className="hr-notification-content">
                <h4>{n.title}</h4>
                <p>{n.message}</p>
              </div>
              <div className="hr-notification-meta">
                <span className="hr-notification-time">{n.time}</span>
                <button
                  className={`hr-notification-check-btn ${n.read ? 'hr-notification-check-btn-read' : ''}`}
                  onClick={() => markAsRead(n.id)}
                  title={n.read ? 'Read' : 'Mark as read'}
                >
                  {n.read ? <Bell size={14} /> : <Check size={14} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
