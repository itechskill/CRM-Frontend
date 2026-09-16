import React from 'react';
import { Menu, Search, Calculator, FileText, CheckSquare, User } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import { getUser } from '../utils/authStorage';
import '../employee/EmployeeHeader.css';

export default function AccountsHeader({
  activeTab,
  onMenuToggle,
  searchQuery,
  onSearchChange,
  currentUser,
  onNavigateTab
}) {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Accounts Overview';
      case 'orders_ready': return 'Orders Ready';
      case 'invoices': return 'Invoices & Billing ';
      case 'profile': return 'My Profile';
      default: return 'Accounts Portal';
    }
  };

  const user = currentUser || getUser();
  const displayName = user?.fullName || user?.name || 'Accounts Member';
  const avatarImage = user?.profileImage || user?.avatar;
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="employee-header">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="employee-header-left">
          <h1 className="employee-page-title">{getTabLabel()}</h1>
          <p className="employee-page-subtitle">Accounts &amp; Billing Department &bull; Fortline CRM</p>
        </div>
      </div>

      {/* Center/Right Actions & Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Search Bar */}
        <div className="header-search" style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search invoices, orders, clients..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.85rem',
              backgroundColor: '#F8FAFC',
              outline: 'none'
            }}
          />
        </div>

        {/* Quick Action Header Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onNavigateTab && onNavigateTab('invoices')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.2s ease'
            }}
            title="Manage Invoices"
          >
            <FileText size={15} />
            <span>+ Final Invoice</span>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('orders_ready')}
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
            title="View Orders Ready for Invoice"
          >
            <CheckSquare size={15} color="#2563EB" />
            <span>Orders Ready</span>
          </button>
        </div>

        {/* Notification Bell Dropdown */}
        <NotificationDropdown />

        {/* User Profile Badge */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 10px 4px 4px',
            borderRadius: '24px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="View & Edit Profile"
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem', overflow: 'hidden' }}>
            {avatarImage ? (
              <img src={avatarImage} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>{displayName}</span>
            <span style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 600 }}>Accounts Dept</span>
          </div>
        </div>
      </div>
    </header>
  );
}
