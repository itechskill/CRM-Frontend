import React from 'react';
import { Menu, ShoppingBag, Search, Package } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import { getUser } from '../utils/authStorage';
import '../employee/EmployeeHeader.css';

export default function PurchaserHeader({
  activeTab,
  onMenuToggle,
  searchQuery,
  onSearchChange,
  currentUser,
  onNavigateTab,
  subDept = 'Local'
}) {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return `${subDept} Purchaser Dashboard`;
      case 'inventory': return 'Inventory & Stock Level';
      case 'supplier_pos': return 'Supplier Purchase Orders';
      case 'grn': return 'Goods Received Notes (GRN)';
      case 'local_payables': return 'Local Payables (Cash / Cheque / PDC)';
      case 'leave': return 'Attendance & Leave';
      case 'profile': return 'My Profile';
      default: return `${subDept} Purchaser Portal`;
    }
  };

  const user = currentUser || getUser();
  const displayName = user?.fullName || user?.name || `${subDept} Purchaser`;
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
          <h1 className="employee-page-title" style={{ whiteSpace: 'nowrap', fontSize: '1.25rem' }}>{getTabLabel()}</h1>
          <p className="employee-page-subtitle" style={{ whiteSpace: 'nowrap' }}>
            Purchaser Department ({subDept} Procurement) &bull; Fortline CRM
          </p>
        </div>
      </div>

      {/* Right: Search & Profile */}
      <div className="employee-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="header-search" style={{ position: 'relative', minWidth: '200px' }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search POs, suppliers..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 34px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.84rem',
              backgroundColor: '#F8FAFC',
              outline: 'none'
            }}
          />
        </div>

        <NotificationDropdown />

        {/* User Profile Badge */}
        <div
          className="header-user-profile-badge"
          onClick={() => onNavigateTab && onNavigateTab('profile')}
          title="View & Edit Profile"
          style={{ cursor: 'pointer' }}
        >
          <div className="header-user-avatar">
            {avatarImage ? (
              <img src={avatarImage} alt={displayName} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{displayName}</span>
            <span className="header-user-role">{subDept} Purchaser</span>
          </div>
        </div>
      </div>
    </header>
  );
}
