import React, { useState } from 'react';
import { Search, Bell, Plus, CheckCircle, AlertCircle, Info, Menu } from 'lucide-react';
import './Header.css';

export default function Header({ activeTab, currentUser, onOpenPrimaryAction, onMenuToggle, searchQuery = '', onSearchChange }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'Admin';

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'users':
        return {
          title: 'Users',
          subtitle: 'Manage your team members and access levels.'
        };
      case 'clients':
        return {
          title: 'Clients',
          subtitle: 'Track and manage your client relationships.'
        };
      case 'projects':
        return {
          title: 'Projects',
          subtitle: 'Monitor project progress and deliverables.'
        };
      case 'finance':
        return {
          title: 'Finance',
          subtitle: 'Revenue, expenses, and financial performance.'
        };
      case 'reports':
        return {
          title: 'Reports',
          subtitle: 'Analytics, insights, and business intelligence.'
        };
      case 'settings':
        return {
          title: 'Settings',
          subtitle: 'Manage your organization profile and security.'
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: `Good morning, ${firstName}. Here's your business overview.`
        };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  const notifications = [
    { id: 1, title: 'New client added', desc: 'Proxima Labs onboarded to Enterprise Plan', time: '5m ago', icon: CheckCircle, color: '#10B981' },
    { id: 2, title: 'Risk Alert', desc: 'Nexus Dynamics flagged as At Risk', time: '1h ago', icon: AlertCircle, color: '#F59E0B' },
    { id: 3, title: 'Quota Reached', desc: 'ARR target reached 118% for Q3', time: '2h ago', icon: Info, color: '#3B82F6' },
  ];

  return (
    <header className="header">
      {/* Hamburger button — visible only on mobile via CSS */}
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
        <Menu size={20} />
      </button>

      {/* Left side: Heading and Subtitle matching exact screenshot layout */}
      <div className="header-title-group">
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
          {title}
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '2px 0 0 0', fontWeight: 400 }}>
          {subtitle}
        </p>
      </div>

      {/* Right side: Global Search, Notification bell, + New Action Button */}
      <div className="header-actions">
        <div className="global-search">
          <Search size={16} className="global-search-icon" />
          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <Bell size={18} />
            <span className="notification-badge"></span>
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '48px',
              width: '320px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              border: '1px solid #E2E8F0',
              padding: '16px',
              zIndex: 50
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                <span style={{ fontSize: '0.75rem', color: '#2563EB', cursor: 'pointer', fontWeight: 600 }}>Mark all as read</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notifications.map(n => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <Icon size={16} color={n.color} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{n.desc}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>{n.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={onOpenPrimaryAction}>
          <Plus size={18} />
          <span>New</span>
        </button>
      </div>
    </header>
  );
}
