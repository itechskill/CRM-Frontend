import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, DollarSign, FileText, Check, Trash2 } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './AccountantViews.css';

export default function AccountantNotificationsView() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/notifications');
      if (response.ok && data.success) {
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error('Fetch accountant notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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

  const getIconAndColor = (type) => {
    switch (type) {
      case 'deal': return { icon: DollarSign, color: '#3B82F6' };
      case 'attendance': return { icon: CheckCircle, color: '#10B981' };
      case 'leave': return { icon: Clock, color: '#F59E0B' };
      default: return { icon: AlertTriangle, color: '#7C3AED' };
    }
  };

  return (
    <div className="acc-view-container">
      <div className="acc-page-header">
        <div className="acc-page-header-title">
          <h2>Financial Alerts & Notifications</h2>
          <p>Real-time system events, invoice alerts, and role notifications.</p>
        </div>
      </div>

      <div className="acc-card" style={{ padding: '8px' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>No financial alerts or notifications</div>
        ) : (
          notifications.map((n) => {
            const { icon: Icon, color } = getIconAndColor(n.type);
            return (
              <div key={n._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 20px', borderBottom: '1px solid #F1F5F9', backgroundColor: n.isRead ? '#FFFFFF' : '#F8FAFC' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>{n.title}</h4>
                    <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#475569' }}>{n.message}</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {!n.isRead && (
                    <button onClick={() => markAsRead(n._id)} style={{ border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#2563EB' }} title="Mark as Read">
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(n._id)} style={{ border: 'none', background: '#FEF2F2', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
