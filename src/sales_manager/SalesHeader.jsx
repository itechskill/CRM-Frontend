import React from 'react';
import { Search, Plus, Menu } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import './SalesHeader.css';

export default function SalesHeader({ activeTab, onOpenNewDealModal, onMenuToggle, searchQuery = '', onSearchChange, currentUser }) {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'leads': return 'Leads & Prospects';
      case 'contacts': return 'Contacts';
      case 'meetings': return 'Meetings';
      case 'quotations': return 'Quotations Management';
      case 'orders': return 'Sales Team Orders';
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
      default: return 'Sales Manager';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'SM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const displayName = currentUser?.name || 'Fahad';

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

        {/* User Profile Badge */}
        <div className="header-user-profile-badge manager-badge">
          <div className="header-user-avatar manager-avatar">
            {currentUser?.profilePicture ? (
              <img src={currentUser.profilePicture} alt={displayName} />
            ) : (
              <span>{getInitials(displayName)}</span>
            )}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{displayName}</span>
            <span className="header-user-role">Sales Manager</span>
          </div>
        </div>
      </div>
    </header>
  );
}
