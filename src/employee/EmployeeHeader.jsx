import React, { useState } from 'react';
import { Search, Plus, Menu } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import { getUser } from '../utils/authStorage';
import './EmployeeHeader.css';

export default function EmployeeHeader({ activeTab, onOpenNewTaskModal, onMenuToggle, currentUser, onNavigateTab }) {
  const [searchQuery, setSearchQuery] = useState('');

  const user = currentUser || getUser();
  const isAhmedAnjum = (user?.fullName || '').toLowerCase().includes('ahmed') ||
    (user?.email || '').toLowerCase().includes('quote@fortline.net') ||
    (user?.email || '').toLowerCase().includes('ahmed');
  const isSalesRep = isAhmedAnjum ||
    (user?.position || '').toLowerCase() === 'sales representative' ||
    (user?.position || '').toLowerCase() === 'sales rep' ||
    user?.role === 'sales_rep';
  const isSalesDept = (user?.department || '').trim().toLowerCase() === 'sales' ||
    user?.role === 'sales_member' ||
    user?.role === 'sales_person' ||
    user?.role === 'sales_rep' ||
    isSalesRep;

  const getHeaderInfo = (tab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Overview of your work and progress' };
      case 'quotations':
      case 'my_quotations':
        return { title: 'Quotations', subtitle: 'Manage and generate client sales quotations' };
      case 'orders':
      case 'my_orders':
        return { title: 'Sales Orders', subtitle: 'Track and process client purchase orders' };
      case 'proforma_invoices':
        return { title: 'Proforma Invoices', subtitle: 'Issue optional commercial proforma invoices from Sales Orders' };
      case 'deliveries':
      case 'delivery_notes':
        return { title: 'Delivery Notes', subtitle: 'Monitor shipments, dispatch notes, and delivery statuses' };
      case 'invoices':
      case 'my_invoices':
        return { title: 'Invoices & Billing', subtitle: 'Manage invoices, receivables, and tax invoices' };
      case 'payments':
      case 'my_payments':
        return { title: 'Customer Payments', subtitle: 'Record and track payment receipts and settlement statuses' };
      case 'followups':
        return { title: 'Client Follow-ups', subtitle: 'Track client interactions, calls, and follow-up schedules' };
      case 'sales_targets':
        return { title: 'Sales Targets', subtitle: 'Review sales targets allotted by CEO and your achievements' };
      case 'sales_activities':
        return { title: 'Sales Activities', subtitle: 'Log calls, meetings, pitches, and customer communication' };
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
        return {
          title: isSalesRep ? 'Sales Rep Portal' : (isSalesDept ? 'Sales Person Portal' : 'Employee Portal'),
          subtitle: 'Welcome to Fortline CRM'
        };
    }
  };

  const { title, subtitle } = getHeaderInfo(activeTab);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const formatRole = (role, position) => {
    if (isSalesRep) {
      return 'Sales Rep';
    }
    if (position && typeof position === 'string' && position.trim()) {
      if (position.trim().toLowerCase().includes('rep')) return 'Sales Rep';
      if (position.trim().toLowerCase().includes('person')) return 'Sales Person';
      return position.trim();
    }
    if (!role) return isSalesDept ? 'Sales Person' : 'Employee';
    const mapping = {
      sales_manager: 'Sales Manager',
      sales_rep: 'Sales Rep',
      sales_member: 'Sales Person',
      employee: isSalesDept ? 'Sales Person' : 'Employee',
      admin: 'Administrator',
      project_manager: 'Project Manager',
      accountant: 'Accountant',
      marketing: 'Marketing Specialist',
      hr: 'HR Manager',
      hr_manager: 'HR Manager',
      ceo: 'Chief Executive Officer'
    };
    const key = String(role).toLowerCase();
    if (mapping[key]) return mapping[key];
    return String(role).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const displayName = user?.fullName || user?.name || user?.username || (isSalesRep ? 'Sales Rep' : 'Sales Person');
  const displayRole = formatRole(user?.role, user?.position);
  const avatarImage = user?.profileImage || user?.profilePicture || user?.avatar;

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
        <div
          className="header-user-profile-badge"
          onClick={() => onNavigateTab?.('profile')}
          title="View & Edit Profile"
          style={{ cursor: onNavigateTab ? 'pointer' : 'default' }}
        >
          <div className="header-user-avatar">
            {avatarImage ? (
              <img src={avatarImage} alt={displayName} />
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
