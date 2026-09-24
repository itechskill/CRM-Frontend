import React, { useState } from 'react';
import {
  LayoutGrid,
  Package,
  FileText,
  ClipboardCheck,
  CreditCard,
  UserCheck,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Crown,
  Briefcase,
  ShieldCheck,
  Globe
} from 'lucide-react';
import '../../employee/EmployeeSidebar.css';

export default function LocalPurchaserSidebar({
  activeTab,
  setActiveTab,
  currentRole,
  userRole,
  currentUser,
  onSwitchRole,
  isMobileOpen,
  onClose,
  onLogout
}) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'pending_orders', label: 'Pending Sales Orders', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory Stock', icon: Package },
    { id: 'supplier_pos', label: 'PO Issued to Supplier', icon: FileText },
    { id: 'grn', label: 'GRN (Goods Received)', icon: ClipboardCheck },
    { id: 'local_payables', label: 'Local Payable', icon: CreditCard }
  ];

  const accountNav = [
    { id: 'leave', label: 'Attendance & Leave', icon: UserCheck },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const isItemActive = (itemId) => {
    if (activeTab === itemId) return true;
    if (itemId === 'leave' && (activeTab === 'leave' || activeTab === 'attendance_leave')) return true;
    return false;
  };

  const userInitials = (currentUser?.fullName || currentUser?.name || 'Local Purchaser')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`employee-sidebar${collapsed ? ' collapsed' : ''}${isMobileOpen ? ' mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="employee-sidebar-header">
          <div className="employee-brand-left">
            <div className="employee-brand-logo" style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}>
              <ShoppingBag size={20} color="#FFFFFF" />
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="employee-brand-info">
                <span className="employee-brand-name">Fortline CRM</span>
                <span className="employee-brand-subtitle" style={{ color: '#34D399', fontWeight: 600 }}>
                  LOCAL PURCHASER
                </span>
              </div>
            )}
          </div>
          <button
            className="employee-collapse-btn desktop-only"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="employee-sidebar-menu">
          {(!collapsed || isMobileOpen) && <div className="employee-menu-title white-title">LOCAL PROCUREMENT</div>}

          <div className="employee-menu-section">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.id);
              return (
                <div
                  key={item.id}
                  className={`employee-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="employee-menu-left">
                    <Icon size={18} />
                    {(!collapsed || isMobileOpen) && <span>{item.label}</span>}
                  </div>
                  {isActive && <div className="active-indicator" />}
                </div>
              );
            })}
          </div>

          <div className="employee-menu-divider" />

          {(!collapsed || isMobileOpen) && <div className="employee-menu-title white-title">ACCOUNT</div>}

          <div className="employee-menu-section">
            {accountNav.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.id);
              return (
                <div
                  key={item.id}
                  className={`employee-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="employee-menu-left">
                    <Icon size={18} />
                    {(!collapsed || isMobileOpen) && <span>{item.label}</span>}
                  </div>
                  {isActive && <div className="active-indicator" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* User Profile & Role Switcher Footer */}
        <div className="employee-sidebar-footer">
          <div
            className="employee-user-card"
            onClick={() => {
              if (userRole === 'admin' || userRole === 'ceo') {
                setShowRoleMenu(!showRoleMenu);
              }
            }}
            title={(userRole === 'admin' || userRole === 'ceo') ? 'Click to Switch Portal' : undefined}
          >
            <div className="employee-user-avatar" style={{ backgroundColor: '#059669', color: '#FFF', fontWeight: 'bold' }}>
              {currentUser?.profileImage ? (
                <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                userInitials
              )}
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="employee-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="employee-user-name" style={{ color: '#FFFFFF', fontSize: '0.825rem', fontWeight: 600 }}>
                  {currentUser?.fullName || 'Local Purchaser'}
                </span>
                <span className="employee-user-role" style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                  Local Purchaser
                </span>
              </div>
            )}
            <div
              style={{
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                marginLeft: 'auto'
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onLogout) onLogout();
              }}
              title="Sign Out"
            >
              <LogOut size={16} color="#EF4444" />
            </div>
          </div>

          {(userRole === 'admin' || userRole === 'ceo') && showRoleMenu && (
            <div className="employee-role-dropdown" style={{ bottom: '70px' }}>
              <div className="employee-role-dropdown-header">Switch Portal</div>
              <div className={`employee-role-item ${currentRole === 'ceo' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('ceo'); setShowRoleMenu(false); }}>
                <span>CEO</span><Crown size={16} color="#818CF8" />
              </div>
              <div className={`employee-role-item ${currentRole === 'administration' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('administration'); setShowRoleMenu(false); }}>
                <span>Administration</span><Briefcase size={16} color="#38BDF8" />
              </div>
              <div className={`employee-role-item ${currentRole === 'admin' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('admin'); setShowRoleMenu(false); }}>
                <span>Admin</span><ShieldCheck size={16} color="#60A5FA" />
              </div>
              <div className={`employee-role-item ${currentRole === 'purchaser' && (currentUser?.purchaserSubDept || 'Local') === 'Local' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('purchaser', 'Local'); setShowRoleMenu(false); }}>
                <span>Local Purchaser</span><ShoppingBag size={16} color="#10B981" />
              </div>
              <div className={`employee-role-item ${currentRole === 'purchaser' && currentUser?.purchaserSubDept === 'Global' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('purchaser', 'Global'); setShowRoleMenu(false); }}>
                <span>Global Purchaser</span><Globe size={16} color="#3B82F6" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
