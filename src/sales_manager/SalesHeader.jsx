import React from 'react';
import { Search, Plus, Menu, User } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import { getUser } from '../utils/authStorage';
import './SalesHeader.css';

export default function SalesHeader({
  activeTab,
  onOpenNewDealModal,
  onMenuToggle,
  searchQuery = '',
  onSearchChange,
  currentUser,
  onNavigateTab
}) {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'leads': return 'Leads & Prospects';
      case 'contacts': return 'Contacts';
      case 'meetings': return 'Meetings';
      case 'quotations': return 'Quotations Management';
      case 'orders': return 'Sales Team Orders';
      case 'proforma_invoices': return 'Proforma Invoices';
      case 'deliveries': return 'Delivery Notes';
      case 'invoices': return 'Invoices & Receivables';
      case 'payments': return 'Customer Payments';
      case 'proposals': return 'Proposals';
      case 'clients': return 'Clients';
      case 'deals': return 'Deals & Pipeline';
      case 'pipeline': return 'Sales Funnel';
      case 'team': return 'Sales Team Management';
      case 'reports': return 'Sales Performance Reports';
      case 'settings': return 'Settings';
      case 'notifications': return 'Notifications';
      case 'profile': return 'My Profile';
      default: return 'Sales Manager';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const formatRole = (role, position) => {
    if (position && typeof position === 'string' && position.trim()) {
      return position.trim();
    }
    if (!role) return 'Sales Manager';
    const mapping = {
      sales_manager: 'Sales Manager',
      sales_rep: 'Sales Representative',
      employee: 'Sales Representative',
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

  const user = currentUser || getUser();
  const displayName = user?.fullName || user?.name || user?.username || 'User';
  const displayRole = formatRole(user?.role, user?.position);
  const avatarImage = user?.profileImage || user?.profilePicture || user?.avatar;

  return (
    <header className="sales-header">
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="sales-breadcrumb">
        <span>Fortline CRM</span>
        <span>/</span>
        <span className="active-crumb">{getTabLabel()}</span>
      </div>

      <div className="sales-header-actions">
        <NotificationDropdown />

        {/* User Profile Badge in Top Right Corner */}
        <div
          className="header-user-profile-badge manager-badge"
          onClick={() => onNavigateTab?.('profile')}
          title="View & Edit Profile"
          style={{ cursor: onNavigateTab ? 'pointer' : 'default' }}
        >
          <div className="header-user-avatar manager-avatar">
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

