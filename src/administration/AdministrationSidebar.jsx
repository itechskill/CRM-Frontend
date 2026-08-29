import React, { useState } from 'react';
import {
  Briefcase,
  LayoutGrid,
  Users,
  Building2,
  CalendarCheck,
  Package,
  FileText,
  ChevronLeft,
  ChevronRight,
  Crown,
  ShieldCheck,
  UserCheck,
  User,
  Heart,
  Calculator,
  Megaphone,
  LogOut,
  FolderKanban
} from 'lucide-react';
import './AdministrationSidebar.css';

export default function AdministrationSidebar({ activeTab, setActiveTab, currentRole, userRole, currentUser, onSwitchRole, isMobileOpen, onClose, onLogout }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'attendance_leave', label: 'Attendance', icon: CalendarCheck, badge: '5 Pending' },
    { id: 'company_resources', label: 'Company Resources', icon: Package },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`admin-side-sidebar${collapsed ? ' collapsed' : ''}${isMobileOpen ? ' mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="admin-side-sidebar-header">
          <div className="admin-side-brand-left">
            <div className="admin-side-brand-logo">
              <Briefcase size={20} color="#FFFFFF" />
            </div>
            {!collapsed && (
              <div className="admin-side-brand-info">
                <span className="admin-side-brand-name">NexusCRM</span>
                <span className="admin-side-brand-subtitle">ADMINISTRATION</span>
              </div>
            )}
          </div>
          <button
            className="admin-side-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="admin-side-sidebar-menu">
          {!collapsed && <div className="admin-side-menu-title">ADMINISTRATION PORTAL</div>}

          <div className="admin-side-menu-section">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  className={`admin-side-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSetActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="admin-side-menu-left">
                    <Icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="admin-side-menu-badge">{item.badge}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* User Footer & Optional Portal Switcher for Admin/CEO */}
        <div className="admin-side-sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid #334155', padding: '12px 16px' }}>
          <div className="admin-side-user-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: (userRole === 'admin' || userRole === 'ceo') ? 'pointer' : 'default', flex: 1 }}
              onClick={() => {
                if (userRole === 'admin' || userRole === 'ceo') {
                  setShowRoleMenu(!showRoleMenu);
                }
              }}
              title={(userRole === 'admin' || userRole === 'ceo') ? 'Click to Switch Portal' : undefined}
            >
              <div className="admin-side-user-avatar" style={{ backgroundColor: '#0EA5E9', color: '#FFF', fontWeight: 'bold', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentUser?.profileImage ? (
                  <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser?.fullName ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD'
                )}
              </div>
              {!collapsed && (
                <div className="admin-side-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="admin-side-user-name" style={{ color: '#FFFFFF', fontSize: '0.825rem', fontWeight: 600 }}>
                    {currentUser?.fullName || 'Administration User'}
                  </span>
                  <span className="admin-side-user-role" style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                    {currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : 'ADMINISTRATION'}
                  </span>
                </div>
              )}
            </div>

            <div
              onClick={onLogout}
              style={{ cursor: 'pointer', padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Sign Out"
            >
              <LogOut size={16} color="#EF4444" />
            </div>
          </div>

          {(userRole === 'admin' || userRole === 'ceo') && showRoleMenu && (
            <div className="admin-side-role-dropdown" style={{ bottom: '70px' }}>
              <div className="admin-side-role-dropdown-header">Switch Portal</div>

              <div
                className={`admin-side-role-item ${currentRole === 'admin' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('admin'); setShowRoleMenu(false); }}
              >
                <span>Admin</span>
                <ShieldCheck size={16} color="#60A5FA" />
              </div>

              <div
                className={`admin-side-role-item ${currentRole === 'ceo' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('ceo'); setShowRoleMenu(false); }}
              >
                <span>CEO</span>
                <Crown size={16} color="#818CF8" />
              </div>

              <div
                className={`admin-side-role-item ${currentRole === 'administration' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('administration'); setShowRoleMenu(false); }}
              >
                <span>Administration</span>
                <Briefcase size={16} color="#38BDF8" />
              </div>

              <div
                className={`admin-side-role-item ${currentRole === 'hr' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('hr'); setShowRoleMenu(false); }}
              >
                <span>HR</span>
                <Heart size={16} color="#A78BFA" />
              </div>

              <div
                className={`admin-side-role-item ${currentRole === 'sales_manager' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('sales_manager'); setShowRoleMenu(false); }}
              >
                <span>Sales Manager</span>
                <UserCheck size={16} color="#F472B6" />
              </div>

              <div
                className={`admin-side-role-item ${currentRole === 'project_manager' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('project_manager'); setShowRoleMenu(false); }}
              >
                <span>Project Manager</span>
                <FolderKanban size={16} color="#34D399" />
              </div>

              <div
                className={`admin-side-role-item ${currentRole === 'marketing' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('marketing'); setShowRoleMenu(false); }}
              >
                <span>Marketing</span>
                <Megaphone size={16} color="#EC4899" />
              </div>

              <div
                className={`admin-side-role-item ${currentRole === 'accountant' || currentRole === 'finance' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('accountant'); setShowRoleMenu(false); }}
              >
                <span>Finance</span>
                <Calculator size={16} color="#2563EB" />
              </div>

              <div
                className={`admin-side-role-item ${currentRole === 'employee' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('employee'); setShowRoleMenu(false); }}
              >
                <span>Employee</span>
                <User size={16} color="#38BDF8" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
