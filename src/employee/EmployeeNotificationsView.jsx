import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { Bell, Check, Trash2, MessageSquare, AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import './EmployeeNotificationsView.css';

export default function EmployeeNotificationsView() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/notifications');
      if (response.ok && data.success) {
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error('Fetch employee notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    try {
      await apiRequest('/api/notifications', { method: 'DELETE' });
      setNotifications([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRead = async (id, currentRead) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = notifications.filter(n => {
    if (activeCategory === 'Unread') return !n.isRead;
    if (activeCategory === 'All') return true;
    return (n.type || '').toLowerCase() === activeCategory.toLowerCase();
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="employee-notifications-container">
      {/* Top Header Controls */}
      <div className="notif-control-bar">
        <div className="notif-title-group">
          <h3>Notifications Feed</h3>
          {unreadCount > 0 && (
            <span className="unread-counter-badge">{unreadCount} unread</span>
          )}
        </div>

        <div className="notif-actions">
          <button className="notif-action-btn" onClick={handleMarkAllRead}>
            <Check size={14} /> Mark all read
          </button>
          <button className="notif-action-btn danger" onClick={handleClearAll}>
            <Trash2 size={14} /> Clear all
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="notif-categories">
        {['All', 'Unread'].map(cat => (
          <button 
            key={cat} 
            className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="notif-list-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-notif-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Bell size={36} color="#CBD5E1" style={{ margin: '0 auto 10px', display: 'block' }} />
            <p style={{ margin: 0, color: '#64748B', fontWeight: 600 }}>No notifications in this category</p>
          </div>
        ) : (
          filtered.map(notif => (
            <div key={notif._id} className={`notif-item ${!notif.isRead ? 'unread' : ''}`}>
              <div className="notif-icon-box" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                <Bell size={18} />
              </div>

              <div className="notif-body">
                <div className="notif-row-top">
                  <h4 className="notif-item-title">{notif.title}</h4>
                  <span className="notif-item-time">
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="notif-item-msg">{notif.message}</p>
              </div>

              <div className="notif-item-right">
                <button 
                  className="read-toggle-btn"
                  onClick={() => handleToggleRead(notif._id, notif.isRead)}
                  title={!notif.isRead ? "Mark as Read" : "Read"}
                >
                  {!notif.isRead ? <Check size={14} /> : <Bell size={14} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
