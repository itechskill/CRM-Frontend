import React from 'react';
import { Search, Bell, Plus, Menu } from 'lucide-react';
import './SalesHeader.css';

export default function SalesHeader({ activeTab, onOpenNewDealModal, onMenuToggle }) {
 const getTabLabel = () => {
  switch (activeTab) {
    case 'dashboard': return 'Dashboard';
    case 'leads': return 'Leads & Prospects';
    case 'contacts': return 'Contacts';
    case 'meetings': return 'Meetings';
    case 'proposals': return 'Proposals';
    case 'clients': return 'Clients';
    case 'deals': return 'Deals & Pipeline';
    case 'pipeline': return 'Sales Funnel';
    case 'team': return 'Sales Team';
    case 'reports': return 'Reports';
    case 'settings': return 'Settings';
    case 'notifications': return 'Notifications';
    default: return 'Sales Manager';
  }
};
  return (
    <header className="sales-header">
      {/* Hamburger button — visible only on mobile via CSS */}
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="sales-breadcrumb">
        <span>FlowBridge</span>
        <span>/</span>
        <span className="active-crumb">{getTabLabel()}</span>
      </div>

      <div className="sales-header-actions">
        <div className="sales-search-box">
          <Search size={16} className="sales-search-icon" />
          <input type="text" placeholder="Search deals, prospects..." />
        </div>

        <button className="sales-notification-btn" title="Notifications">
          <Bell size={18} />
          <span className="sales-notification-badge">3</span>
        </button>

        <button className="btn-new-deal" onClick={onOpenNewDealModal}>
          <Plus size={18} />
          <span>New Deal</span>
        </button>
      </div>
    </header>
  );
}
