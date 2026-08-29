import React, { useState, useEffect } from 'react';
import { MessageSquare, Calendar, AlertCircle, Check, Bell, Trash2 } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './SalesNotificationsView.css';

const filterTabs = ['All', 'Unread', 'Deal', 'Lead', 'System'];

const iconMap = {
  deal: { icon: MessageSquare, bg: '#DBEAFE', color: '#2563EB' },
  lead: { icon: Calendar, bg: '#FEF3C7', color: '#D97706' },
  system: { icon: AlertCircle, bg: '#EDE9FE', color: '#7C3AED' },
  approved: { icon: Check, bg: '#DCFCE7', color: '#16A34A' },
};

export default function SalesNotificationsView() {
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
      console.error('Fetch sales notifications error:', err);
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
      console.error('Mark notification read error:', err);
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
    <div className="notifications-view">
      <div className="notifications-feed-card">
        <div className="notifications-feed-header">
          <div className="notifications-feed-title">
            <h2>Sales Notifications Feed</h2>
            {unreadCount > 0 && <span className="unread-badge">{unreadCount} unread</span>}
          </div>
          <div className="notifications-feed-actions">
            <button className="btn-secondary" onClick={markAllRead}>
              <Check size={14} /> Mark all read
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
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notifications-empty">No notifications</div>
        ) : (
          filteredNotifications.map((n) => {
            const { icon: Icon, bg, color } = iconMap[n.type] || iconMap.system;
            return (
              <div
                key={n._id}
                className={`notification-row ${!n.isRead ? 'notification-row-unread' : ''}`}
              >
                <span className="notification-icon" style={{ background: bg, color }}>
                  <Icon size={18} />
                </span>
                <div className="notification-content">
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                </div>
                <div className="notification-meta">
                  <span className="notification-time">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {!n.isRead && (
                      <button
                        className="notification-check-btn"
                        onClick={() => markAsRead(n._id)}
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      className="notification-check-btn"
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