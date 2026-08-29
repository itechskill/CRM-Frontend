import React, { useState } from 'react';
import { Bell, Check, Trash2, MessageSquare, AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import './EmployeeNotificationsView.css';

export default function EmployeeNotificationsView() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Daniel Torres mentioned you in a comment',
      message: '"@Marcus Chen could you review the OAuth token refresh response payload?"',
      time: '20m ago',
      category: 'Mentions',
      unread: true,
      icon: MessageSquare,
      color: '#2563EB'
    },
    {
      id: 2,
      title: 'Task Due Reminder: Dark Mode Theme Toggle',
      message: 'This task is due today at 5:00 PM (Proxima Platform Migration).',
      time: '2 hours ago',
      category: 'Tasks',
      unread: true,
      icon: Calendar,
      color: '#F59E0B'
    },
    {
      id: 3,
      title: 'Sprint 14 Review Scheduled',
      message: 'Sarah Mitchell scheduled Sprint 14 demo for Thursday at 3:00 PM.',
      time: '5 hours ago',
      category: 'System',
      unread: true,
      icon: AlertCircle,
      color: '#8B5CF6'
    },
    {
      id: 4,
      title: 'Task Approved: Setup React Router Navigation',
      message: 'Daniel Torres marked your task as completed and left a 5-star rating.',
      time: 'Yesterday',
      category: 'Tasks',
      unread: false,
      icon: Check,
      color: '#10B981'
    }
  ]);

  const [activeCategory, setActiveCategory] = useState('All');

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleToggleRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: !n.unread } : n));
  };

  const filtered = notifications.filter(n => {
    if (activeCategory === 'Unread') return n.unread;
    if (activeCategory === 'All') return true;
    return n.category === activeCategory;
  });

  const unreadCount = notifications.filter(n => n.unread).length;

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
        {['All', 'Unread', 'Mentions', 'Tasks', 'System'].map(cat => (
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
        {filtered.length === 0 ? (
          <div className="empty-notif-state">
            <Bell size={36} color="#CBD5E1" />
            <p>No notifications in this category</p>
          </div>
        ) : (
          filtered.map(notif => {
            const Icon = notif.icon;
            return (
              <div key={notif.id} className={`notif-item ${notif.unread ? 'unread' : ''}`}>
                <div className="notif-icon-box" style={{ backgroundColor: `${notif.color}15`, color: notif.color }}>
                  <Icon size={18} />
                </div>

                <div className="notif-body">
                  <div className="notif-row-top">
                    <h4 className="notif-item-title">{notif.title}</h4>
                    <span className="notif-item-time">{notif.time}</span>
                  </div>
                  <p className="notif-item-msg">{notif.message}</p>
                </div>

                <div className="notif-item-right">
                  <button 
                    className="read-toggle-btn"
                    onClick={() => handleToggleRead(notif.id)}
                    title={notif.unread ? "Mark as Read" : "Mark as Unread"}
                  >
                    {notif.unread ? <Check size={14} /> : <Bell size={14} />}
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
