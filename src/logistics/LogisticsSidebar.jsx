import React, { useState } from 'react';
import {
  LayoutGrid,
  Plane,
  Truck,
  Compass,
  PackageCheck,
  FileSpreadsheet,
  Bell,
  UserCheck,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Crown,
  Briefcase,
  Calculator,
  Headphones,
  TrendingUp,
  FolderKanban,
  Heart,
  Megaphone,
  Boxes
} from 'lucide-react';
import '../employee/EmployeeSidebar.css';

export default function LogisticsSidebar({
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

  const logisticsNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'incoming_shipments', label: 'Incoming Orders', icon: Plane },
    { id: 'shipments', label: 'Shipments', icon: Truck },
    { id: 'shipment_tracking', label: 'Shipment Tracking', icon: Compass },
    { id: 'shipment_received', label: 'Shipment Received', icon: PackageCheck },
    { id: 'grn_creation', label: 'Goods Received (GRN)', icon: PackageCheck },
    { id: 'import_inventory', label: 'Import Inventory', icon: Boxes },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'leave', label: 'Attendance & Leave', icon: UserCheck },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const isItemActive = (itemId) => {
    if (activeTab === itemId) return true;
    if (itemId === 'incoming_shipments' && (activeTab === 'incoming' || activeTab === 'incoming_shipments')) return true;
    if (itemId === 'shipment_tracking' && (activeTab === 'tracking' || activeTab === 'shipment_tracking')) return true;
    if (itemId === 'shipment_received' && (activeTab === 'received' || activeTab === 'shipment_received')) return true;
    if (itemId === 'grn_creation' && ['grn', 'grn_creation', 'grns', 'logistics_grn', 'goods_received', 'goods_receipt_notes'].includes(activeTab)) return true;
    if (itemId === 'import_inventory' && ['import_inventory', 'imported_inventory', 'logistics_inventory'].includes(activeTab)) return true;
    if (itemId === 'leave' && (activeTab === 'leave' || activeTab === 'attendance_leave')) return true;
    return false;
  };

  const userInitials = (currentUser?.fullName || currentUser?.name || 'Logistics User')
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
            <div className="employee-brand-logo" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}>
              <Plane size={20} color="#FFFFFF" />
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="employee-brand-info">
                <span className="employee-brand-name">Fortline CRM</span>
                <span className="employee-brand-subtitle" style={{ color: '#60A5FA', fontWeight: 600 }}>
                  LOGISTICS DEPT
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
          {(!collapsed || isMobileOpen) && <div className="employee-menu-title white-title">LOGISTICS WORKFLOW</div>}

          <div className="employee-menu-section">
            {logisticsNav.map((item) => {
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
            <div className="employee-user-avatar" style={{ backgroundColor: '#2563EB', color: '#FFF', fontWeight: 'bold' }}>
              {currentUser?.profileImage ? (
                <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                userInitials
              )}
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="employee-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="employee-user-name" style={{ color: '#FFFFFF', fontSize: '0.825rem', fontWeight: 600 }}>
                  {currentUser?.fullName || 'Logistics Officer'}
                </span>
                <span className="employee-user-role" style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                  Logistics Department
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
                justifyContent: 'center',
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
              <div className={`employee-role-item ${currentRole === 'logistics' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('logistics'); setShowRoleMenu(false); }}>
                <span>Logistics</span><Plane size={16} color="#2563EB" />
              </div>
              <div className={`employee-role-item ${currentRole === 'support' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('support'); setShowRoleMenu(false); }}>
                <span>Support Department</span><Headphones size={16} color="#38BDF8" />
              </div>
              <div className={`employee-role-item ${currentRole === 'accountant' || currentRole === 'accounts' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('accountant'); setShowRoleMenu(false); }}>
                <span>Accounts Department</span><Calculator size={16} color="#2563EB" />
              </div>
              <div className={`employee-role-item ${currentRole === 'finance' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('finance'); setShowRoleMenu(false); }}>
                <span>Finance Department</span><Calculator size={16} color="#10B981" />
              </div>
              <div className={`employee-role-item ${(currentRole === 'sales_member' || currentRole === 'sales_rep') ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('sales_member'); setShowRoleMenu(false); }}>
                <span>Sales Person</span><TrendingUp size={16} color="#10B981" />
              </div>
              <div className={`employee-role-item ${currentRole === 'sales_manager' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('sales_manager'); setShowRoleMenu(false); }}>
                <span>Sales Manager</span><UserCheck size={16} color="#F472B6" />
              </div>
              <div className={`employee-role-item ${currentRole === 'project_manager' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('project_manager'); setShowRoleMenu(false); }}>
                <span>Project Manager</span><FolderKanban size={16} color="#34D399" />
              </div>
              <div className={`employee-role-item ${currentRole === 'hr' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('hr'); setShowRoleMenu(false); }}>
                <span>HR Manager</span><Heart size={16} color="#A78BFA" />
              </div>
              <div className={`employee-role-item ${currentRole === 'marketing' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('marketing'); setShowRoleMenu(false); }}>
                <span>Marketing</span><Megaphone size={16} color="#EC4899" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
