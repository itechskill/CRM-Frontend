import React, { useState } from 'react';
import { MessageSquare, Calendar, AlertCircle, Check, Bell } from 'lucide-react';
import './SalesNotificationsView.css';

const filterTabs = ['All', 'Unread', 'Mentions', 'Tasks', 'System'];

const iconMap = {
  mention: { icon: MessageSquare, bg: '#DBEAFE', color: '#2563EB' },
  reminder: { icon: Calendar, bg: '#FEF3C7', color: '#D97706' },
  system: { icon: AlertCircle, bg: '#EDE9FE', color: '#7C3AED' },
  approved: { icon: Check, bg: '#DCFCE7', color: '#16A34A' },
};

const initialNotifications = [
  {
    id: 1,
    type: 'mention',
    category: 'Mentions',
    title: 'Daniel Torres mentioned you in a comment',
    message: '"@Marcus Chen could you review the OAuth token refresh response payload?"',
    time: '20m ago',
    read: false,
  },
  {
    id: 2,
    type: 'reminder',
    category: 'Tasks',
    title: 'Task Due Reminder: Dark Mode Theme Toggle',
    message: 'This task is due today at 5:00 PM (Proxima Platform Migration).',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 3,
    type: 'system',
    category: 'System',
    title: 'Sprint 14 Review Scheduled',
    message: 'Sarah Mitchell scheduled Sprint 14 demo for Thursday at 3:00 PM.',
    time: '5 hours ago',
    read: false,
  },
  {
    id: 4,
    type: 'approved',
    category: 'Tasks',
    title: 'Task Approved: Setup React Router Navigation',
    message: 'Daniel Torres marked your task as completed and left a 5-star rating.',
    time: 'Yesterday',
    read: true,
  },
];

export default function SalesNotificationsView() {
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
    <div className="notifications-view">
      <div className="notifications-feed-card">
        <div className="notifications-feed-header">
          <div className="notifications-feed-title">
            <h2>Notifications Feed</h2>
            {unreadCount > 0 && <span className="unread-badge">{unreadCount} unread</span>}
          </div>
          <div className="notifications-feed-actions">
            <button className="btn-secondary" onClick={markAllRead}>
              <Check size={14} /> Mark all read
            </button>
            <button className="btn-secondary" onClick={clearAll}>
              <Bell size={14} /> Clear all
            </button>
          </div>
        </div>
      </div>

      <div className="notifications-filter-row">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            className={`filter-pill ${activeFilter === tab ? 'filter-pill-active' : ''}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="notifications-list-card">
        {filteredNotifications.length === 0 && (
          <div className="notifications-empty">No notifications</div>
        )}
        {filteredNotifications.map((n) => {
          const { icon: Icon, bg, color } = iconMap[n.type] || iconMap.system;
          return (
            <div
              key={n.id}
              className={`notification-row ${!n.read ? 'notification-row-unread' : ''}`}
            >
              <span className="notification-icon" style={{ background: bg, color }}>
                <Icon size={18} />
              </span>
              <div className="notification-content">
                <h4>{n.title}</h4>
                <p>{n.message}</p>
              </div>
              <div className="notification-meta">
                <span className="notification-time">{n.time}</span>
                <button
                  className={`notification-check-btn ${n.read ? 'notification-check-btn-read' : ''}`}
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