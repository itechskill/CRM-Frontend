import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Plane,
  Truck,
  DollarSign,
  AlertCircle,
  Info,
  Clock,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import './LogisticsPortal.css';

export default function LogisticsNotificationsView() {
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
      console.error('[Fetch Logistics Notifications Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
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
      console.error('Mark read error:', err);
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

  const getNotificationIcon = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'order':
      case 'shipment':
        return { icon: Plane, bg: '#EFF6FF', color: '#2563EB' };
      case 'delivery':
        return { icon: Truck, bg: '#ECFDF5', color: '#059669' };
      case 'finance':
      case 'invoice':
      case 'payment':
        return { icon: DollarSign, bg: '#FEF3C7', color: '#D97706' };
      case 'alert':
      case 'delayed':
        return { icon: AlertCircle, bg: '#FEE2E2', color: '#EF4444' };
      default:
        return { icon: Info, bg: '#F1F5F9', color: '#64748B' };
    }
  };

  return (
    <div className="logistics-notif-view">
      {/* Top Banner */}
      <div className="logistics-welcome-banner">
        <div>
          <h2 className="logistics-welcome-title">Logistics Notifications &amp; Alerts</h2>
          <p className="logistics-welcome-sub">
            Real-time updates on international supplier POs, flight delays, customs clearance, and warehouse receipts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchNotifications}
            className="logistics-btn-secondary"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#FFF' }}
          >
            <RefreshCw size={14} className={loading ? 'logistics-spin' : ''} /> Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="logistics-btn-primary"
              style={{ background: '#FFFFFF', color: '#1E3A8A' }}
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Main Notification Card */}
      <div className="logistics-notif-card">
        <div className="logistics-notif-head">
          <div className="logistics-notif-title-area">
            <h2>Notifications Inbox</h2>
            {unreadCount > 0 && (
              <span className="logistics-notif-unread-pill">{unreadCount} Unread</span>
            )}
          </div>
          <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
            Showing {filtered.length} of {notifications.length} alerts
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="logistics-notif-filters">
          {['All', 'Unread', 'Order', 'Finance', 'System'].map((tab) => (
            <button
              key={tab}
              className={`logistics-notif-filter-btn ${activeFilter === tab ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab)}
            >
              {tab}
              {tab === 'Unread' && unreadCount > 0 && (
                <span style={{
                  background: activeFilter === tab ? '#FFFFFF' : '#EF4444',
                  color: activeFilter === tab ? '#2563EB' : '#FFFFFF',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: 700
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="logistics-notif-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
              <RefreshCw size={24} className="logistics-spin" />
              <p style={{ marginTop: '8px', fontSize: '0.86rem' }}>Loading notifications...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((item) => {
              const { icon: IconComp, bg, color } = getNotificationIcon(item.type);
              return (
                <div key={item._id} className={`logistics-notif-row ${!item.isRead ? 'unread' : ''}`}>
                  <div className="logistics-notif-icon" style={{ backgroundColor: bg, color }}>
                    <IconComp size={20} />
                  </div>
                  <div className="logistics-notif-body">
                    <div className="logistics-notif-headline">
                      <h4>{item.title}</h4>
                      <span className="logistics-notif-time">
                        {new Date(item.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="logistics-notif-desc">{item.message}</p>
                  </div>
                  {!item.isRead && (
                    <button
                      className="logistics-notif-action-btn"
                      onClick={() => markAsRead(item._id)}
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '56px 20px', color: '#94A3B8' }}>
              <Bell size={40} color="#CBD5E1" style={{ marginBottom: '12px' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#64748B', fontWeight: 700 }}>
                No notifications found
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>
                You're all caught up with your logistics department alerts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

