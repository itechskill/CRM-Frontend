import React from 'react';
import { Menu, Plane, Compass, PackageCheck, Truck, Search } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import { getUser } from '../utils/authStorage';
import '../employee/EmployeeHeader.css';

export default function LogisticsHeader({
  activeTab,
  onMenuToggle,
  searchQuery,
  onSearchChange,
  currentUser,
  onNavigateTab
}) {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Logistics Dashboard';
      case 'incoming':
      case 'incoming_shipments': return 'Incoming International Shipments';
      case 'shipments': return 'All Shipments';
      case 'tracking':
      case 'shipment_tracking': return 'Shipment Tracking & Status';
      case 'received':
      case 'shipment_received': return 'Shipments Received in Office';
      case 'delivery_notes': return 'Blue File Delivery Notes';
      case 'notifications': return 'Logistics Notifications';
      case 'leave':
      case 'attendance_leave': return 'Attendance & Leave';
      case 'profile': return 'My Profile';
      default: return 'Logistics Department';
    }
  };

  const user = currentUser || getUser();
  const displayName = user?.fullName || user?.name || 'Logistics Officer';
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
          <p className="employee-page-subtitle" style={{ whiteSpace: 'nowrap' }}>Logistics Department &bull; Fortline CRM</p>
        </div>
      </div>

      {/* Right: Search, Quick Action Button & Profile */}
      <div className="employee-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Header Search Bar */}
        <div className="header-search" style={{ position: 'relative', minWidth: '200px' }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search shipments, orders, AWB..."
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

        {/* Quick Action Button */}
        <button
          onClick={() => onNavigateTab && onNavigateTab('shipments')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 14px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            transition: 'all 0.2s ease'
          }}
          title="View All Shipments"
        >
          <Truck size={14} />
          <span>Shipments</span>
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
          <div className="header-user-avatar">
            {avatarImage ? (
              <img src={avatarImage} alt={displayName} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{displayName}</span>
            <span className="header-user-role">{user?.role === 'logistics' ? 'Logistics' : (user?.position || 'Logistics Officer')}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
