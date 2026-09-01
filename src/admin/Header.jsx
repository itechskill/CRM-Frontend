import React, { useState } from 'react';
import { Search, Bell, Plus, CheckCircle, AlertCircle, Info, Menu } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
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
        <NotificationDropdown />

        <button className="btn-primary" onClick={onOpenPrimaryAction}>
          <Plus size={18} />
          <span>New</span>
        </button>
      </div>
    </header>
  );
}
