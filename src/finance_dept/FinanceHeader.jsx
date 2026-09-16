import React from 'react';
import { Menu, Search, DollarSign, CreditCard, FileSpreadsheet, User } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import { getUser } from '../utils/authStorage';
import '../employee/EmployeeHeader.css';

export default function FinanceHeader({
  activeTab,
  onMenuToggle,
  searchQuery,
  onSearchChange,
  currentUser,
  onNavigateTab
}) {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Finance Overview';
      case 'finance_invoices': return 'Submitted Invoices & Financial Review';
      case 'customer_payments':
      case 'finance_payments': return 'Customer Payments & Collections';
      case 'receivables':
      case 'finance_receivables': return 'Accounts Receivable & Overdue Balances';
      case 'finance_reports':
      case 'reports': return 'Financial Reports & Analytics';
      case 'profile': return 'My Profile';
      default: return 'Finance Portal';
    }
  };

  const user = currentUser || getUser();
  const displayName = user?.fullName || user?.name || 'Finance Executive';
  const avatarImage = user?.profileImage || user?.avatar;
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="employee-header finance-portal-header">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="finance-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '0', flexShrink: 1 }}>
        <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="employee-header-left" style={{ minWidth: '0' }}>
          <h1 className="employee-page-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '1.2rem' }}>
            {getTabLabel()}
          </h1>
          <p className="employee-page-subtitle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Finance &amp; Accounts Receivable Department &bull; Fortline CRM
          </p>
        </div>
      </div>

      {/* Right: Search, Quick Actions, Notifications & Profile */}
      <div className="finance-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {/* Search Bar */}
        <div className="header-search finance-header-search" style={{ position: 'relative', width: '200px' }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search receivables..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.82rem',
              backgroundColor: '#F8FAFC',
              outline: 'none'
            }}
          />
        </div>

        {/* Quick Action Header Buttons */}
        <div className="finance-header-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onNavigateTab && onNavigateTab('customer_payments')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#059669',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
            title="Record Customer Payment"
          >
            <CreditCard size={14} />
            <span>+ Record Payment</span>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('receivables')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
            title="Accounts Receivable"
          >
            <FileSpreadsheet size={14} color="#059669" />
            <span>Receivables</span>
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
            gap: '8px',
            padding: '3px 8px 3px 3px',
            borderRadius: '24px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}
          title="View & Edit Profile"
        >
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#059669', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', overflow: 'hidden' }}>
            {avatarImage ? (
              <img src={avatarImage} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{displayName}</span>
            <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>Finance Dept</span>
          </div>
        </div>
      </div>
    </header>
  );
}
