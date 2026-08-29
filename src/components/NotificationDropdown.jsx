import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Trash2, X, RefreshCw } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './NotificationDropdown.css';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { response, data } = await apiRequest('/api/notifications');
      if (response.ok && data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const { response, data } = await apiRequest(`/api/notifications/${id}/read`, {
        method: 'PATCH'
      });
      if (response.ok && data.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Mark notification read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      const { response, data } = await apiRequest('/api/notifications/read-all', {
        method: 'PATCH'
      });
      if (response.ok && data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Mark all read error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const { response, data } = await apiRequest(`/api/notifications/${id}`, {
        method: 'DELETE'
      });
      if (response.ok && data.success) {
        setNotifications(prev => {
          const target = prev.find(n => n._id === id);
          if (target && !target.isRead) {
            setUnreadCount(uc => Math.max(0, uc - 1));
          }
          return prev.filter(n => n._id !== id);
        });
      }
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  return (
    <div className="notif-dropdown-wrapper" ref={dropdownRef}>
      <button
        className="notif-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notif-badge-count">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-popover">
          <div className="notif-popover-header">
            <div className="notif-header-left">
              <h4>Notifications</h4>
              {unreadCount > 0 && (
                <span className="notif-unread-pill">{unreadCount} new</span>
              )}
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  className="notif-mark-all-btn"
                  onClick={handleMarkAllRead}
                  disabled={loading}
                >
                  Mark all as read
                </button>
              )}
              <button
                className="notif-close-btn"
                onClick={() => setIsOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="notif-list-container">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  className={`notif-item ${notif.isRead ? 'read' : 'unread'}`}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                >
                  <div className={`notif-indicator ${notif.type || 'system'}`} />
                  <div className="notif-content">
                    <div className="notif-item-top">
                      <span className="notif-title">{notif.title}</span>
                      <span className="notif-time">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="notif-message">{notif.message}</p>
                  </div>
                  <div className="notif-item-actions">
                    {!notif.isRead && (
                      <button
                        className="notif-action-btn check"
                        title="Mark as read"
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                    <button
                      className="notif-action-btn delete"
                      title="Delete"
                      onClick={(e) => handleDeleteNotification(notif._id, e)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="notif-empty-state">
                <Bell size={32} color="#94A3B8" />
                <p>No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
