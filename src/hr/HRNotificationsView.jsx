import React, { useState, useEffect } from 'react';
import { UserPlus, CalendarClock, ClipboardCheck, AlertCircle, Check, Bell, Trash2 } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './HRNotificationsView.css';

const filterTabs = ['All', 'Unread', 'Leave', 'Attendance', 'System'];

const iconMap = {
  leave: { icon: CalendarClock, bg: '#FEF3C7', color: '#D97706' },
  attendance: { icon: ClipboardCheck, bg: '#DCFCE7', color: '#16A34A' },
  role: { icon: UserPlus, bg: '#DBEAFE', color: '#2563EB' },
  system: { icon: AlertCircle, bg: '#EDE9FE', color: '#7C3AED' },
};

export default function HRNotificationsView() {
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/notifications');
      if (response.ok && data.success) {
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return !n.isRead;
    return (n.type || 'system').toLowerCase() === activeFilter.toLowerCase();
  });

  const markAsRead = async (id) => {
    try {
      const { response, data } = await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (response.ok && data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const markAllRead = async () => {
    try {
      const { response, data } = await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
      if (response.ok && data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { response, data } = await apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
      if (response.ok && data.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      console.error('Delete notification error:', err);
    }
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
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="hr-notifications-empty">No notifications</div>
        ) : (
          filteredNotifications.map((n) => {
            const { icon: Icon, bg, color } = iconMap[n.type] || iconMap.system;
            return (
              <div
                key={n._id}
                className={`hr-notification-row ${!n.isRead ? 'hr-notification-row-unread' : ''}`}
              >
                <span className="hr-notification-icon" style={{ background: bg, color }}>
                  <Icon size={18} />
                </span>
                <div className="hr-notification-content">
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                </div>
                <div className="hr-notification-meta">
                  <span className="hr-notification-time">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {!n.isRead && (
                      <button
                        className="hr-notification-check-btn"
                        onClick={() => markAsRead(n._id)}
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      className="hr-notification-check-btn"
                      onClick={() => handleDelete(n._id)}
                      title="Delete"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
