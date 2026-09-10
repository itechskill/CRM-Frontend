import React, { useState } from 'react';
import { Search, Plus, Menu } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import './EmployeeHeader.css';

export default function EmployeeHeader({ activeTab, onOpenNewTaskModal, onMenuToggle, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');

  const getHeaderInfo = (tab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Overview of your work and progress' };
      case 'quotations':
        return { title: 'Quotations', subtitle: 'Manage and generate client sales quotations' };
      case 'orders':
        return { title: 'Sales Orders', subtitle: 'Track and process client purchase orders' };
      case 'deliveries':
        return { title: 'Delivery Notes', subtitle: 'Monitor shipments, dispatch notes, and delivery statuses' };
      case 'invoices':
        return { title: 'Invoices & Billing', subtitle: 'Manage invoices, receivables, and tax invoices' };
      case 'payments':
        return { title: 'Customer Payments', subtitle: 'Record and track payment receipts and settlement statuses' };
      case 'leave':
        return { title: 'Leave & Attendance', subtitle: 'Submit leave applications and review your attendance history' };
      case 'projects':
        return { title: 'My Projects', subtitle: 'Track your active project commitments and deliverables' };
      case 'tasks':
        return { title: 'My Tasks', subtitle: 'Manage, organize, and update your assigned task items' };
      case 'work_updates':
        return { title: 'Work Updates', subtitle: 'Log daily standups, hours worked, and progress notes' };
      case 'completed_tasks':
        return { title: 'Completed Tasks', subtitle: 'Archive of finished work items and milestone records' };
      case 'activity':
        return { title: 'Activity Stream', subtitle: 'Real-time log of commits, reviews, mentions, and updates' };
      case 'notifications':
        return { title: 'Notifications', subtitle: 'Recent task alerts, mentions, and deadline reminders' };
      case 'profile':
        return { title: 'Employee Profile', subtitle: 'Personal information, role details, and performance stats' };
      case 'settings':
        return { title: 'Portal Settings', subtitle: 'Personalize your workspace preferences and notifications' };
      default:
        return { title: 'Sales Representative Portal', subtitle: 'Welcome to Fortline CRM' };
    }
  };

  const { title, subtitle } = getHeaderInfo(activeTab);

  const getInitials = (name) => {
    if (!name) return 'SR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const displayName = currentUser?.name || 'Farhan Saleem';
  const displayRole = currentUser?.position || (currentUser?.role === 'employee' ? 'Sales Representative' : 'Sales Representative');

  return (
    <header className="employee-header">
      {/* Hamburger button — visible only on mobile via CSS */}
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="employee-header-left">
        <h1 className="employee-page-title">{title}</h1>
        <p className="employee-page-subtitle">{subtitle}</p>
      </div>

      <div className="employee-header-right">
        <NotificationDropdown />

        {/* User Profile Badge */}
        <div className="header-user-profile-badge">
          <div className="header-user-avatar">
            {currentUser?.profilePicture ? (
              <img src={currentUser.profilePicture} alt={displayName} />
            ) : (
              <span>{getInitials(displayName)}</span>
            )}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{displayName}</span>
            <span className="header-user-role">{displayRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
