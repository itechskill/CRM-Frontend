import React from 'react';
import { Menu, Search, Headphones, Plus, Truck, Boxes, User } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import { getUser } from '../utils/authStorage';
import '../employee/EmployeeHeader.css';

export default function SupportHeader({
  activeTab,
  onMenuToggle,
  searchQuery,
  onSearchChange,
  currentUser,
  onNavigateTab
}) {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Support Overview';
      case 'support_orders': return 'Fulfillment & Sales Orders';
      case 'inventory': return 'Inventory & Warehouse Stock';
      case 'delivery_notes': return 'Delivery Notes & Dispatch';
      case 'profile': return 'My Profile';
      default: return 'Support Portal';
    }
  };

  const user = currentUser || getUser();
  const displayName = user?.fullName || user?.name || 'Support Member';
  const avatarImage = user?.profileImage || user?.avatar;
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="employee-header">
      {/* Left: Mobile Toggle & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="employee-header-left">
          <h1 className="employee-page-title">{getTabLabel()}</h1>
          <p className="employee-page-subtitle">Support &amp; Logistics Department &bull; Fortline CRM</p>
        </div>
      </div>

      {/* Right: Quick Action Buttons & Profile */}
      <div className="employee-header-right">
        {/* Quick Action Buttons */}
        <button
          onClick={() => onNavigateTab && onNavigateTab('delivery_notes')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#0284C7',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
            transition: 'all 0.2s ease'
          }}
          title="Create Delivery Note"
        >
          <Truck size={15} />
          <span>+ Delivery Note</span>
        </button>

        <button
          onClick={() => onNavigateTab && onNavigateTab('inventory')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#F1F5F9',
            color: '#334155',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Manage Inventory"
        >
          <Boxes size={15} color="#0284C7" />
          <span>Inventory</span>
        </button>

        {/* Notification Bell Dropdown */}
        <NotificationDropdown />

        {/* User Profile Badge */}
        <div
          className="header-user-profile-badge"
          onClick={() => onNavigateTab && onNavigateTab('profile')}
          title="View & Edit Profile"
          style={{ cursor: 'pointer' }}
        >
          <div className="header-user-avatar" style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)' }}>
            {avatarImage ? (
              <img src={avatarImage} alt={displayName} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{displayName}</span>
            <span className="header-user-role" style={{ color: '#0284C7', fontWeight: 600 }}>Support Dept</span>
          </div>
        </div>
      </div>
    </header>
  );
}
