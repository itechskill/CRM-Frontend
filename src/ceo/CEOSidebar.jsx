import React, { useState } from 'react';
import {
  Crown,
  LayoutGrid,
  TrendingUp,
  FolderKanban,
  DollarSign,
  Users,
  PieChart,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  User,
  Heart,
  Calculator,
  Megaphone,
  Briefcase,
  LogOut
} from 'lucide-react';
import './CEOSidebar.css';

export default function CEOSidebar({ activeTab, setActiveTab, currentRole, onSwitchRole, isMobileOpen, onClose, onLogout, currentUser, userRole }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'business_overview', label: 'Business Overview', icon: TrendingUp },
    { id: 'projects_performance', label: 'Performance', icon: FolderKanban, badge: 'Live' },
    { id: 'sales_finance', label: 'Sales & Finance', icon: DollarSign },
    { id: 'team_performance', label: 'Team Performance', icon: Users },
    { id: 'reports_analytics', label: 'Reports & Analytics', icon: PieChart },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`ceo-sidebar${collapsed ? ' collapsed' : ''}${isMobileOpen ? ' mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="ceo-sidebar-header">
          <div className="ceo-brand-left">
            <div className="ceo-brand-logo">
              <Crown size={20} color="#FFFFFF" />
            </div>
            {!collapsed && (
              <div className="ceo-brand-info">
                <span className="ceo-brand-name">Fortline CRM</span>
                <span className="ceo-brand-subtitle">EXECUTIVE PORTAL</span>
              </div>
            )}
          </div>
          <button
            className="ceo-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="ceo-sidebar-menu">
          {!collapsed && <div className="ceo-menu-title">EXECUTIVE SUITE</div>}

          <div className="ceo-menu-section">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  className={`ceo-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSetActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="ceo-menu-left">
                    <Icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="ceo-menu-badge">{item.badge}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* User Footer & Optional Portal Switcher for Admin/CEO */}
        <div className="ceo-sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid #334155', padding: '12px 16px' }}>
          <div className="ceo-user-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: (userRole === 'admin' || userRole === 'ceo') ? 'pointer' : 'default', flex: 1 }}
              onClick={() => {
                if (userRole === 'admin' || userRole === 'ceo') {
                  setShowRoleMenu(!showRoleMenu);
                }
              }}
              title={(userRole === 'admin' || userRole === 'ceo') ? 'Click to Switch Portal' : undefined}
            >
              <div className="ceo-user-avatar" style={{ backgroundColor: '#6366F1', color: '#FFF', fontWeight: 'bold', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentUser?.profileImage ? (
                  <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser?.fullName ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CEO'
                )}
              </div>
              {!collapsed && (
                <div className="ceo-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="ceo-user-name" style={{ color: '#FFFFFF', fontSize: '0.825rem', fontWeight: 600 }}>
                    {currentUser?.fullName || 'Executive CEO'}
                  </span>
                  <span className="ceo-user-role" style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                    {currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : 'EXECUTIVE CEO'}
                  </span>
                </div>
              )}
            </div>

            <div
              onClick={(e) => { e.stopPropagation(); onLogout(); }}
              style={{ cursor: 'pointer', padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Sign Out"
            >
              <LogOut size={16} color="#EF4444" />
            </div>
          </div>

          {(userRole === 'admin' || userRole === 'ceo') && showRoleMenu && (
            <div className="ceo-role-dropdown" style={{ bottom: '70px' }}>
              <div className="ceo-role-dropdown-header">Switch Portal</div>

              <div
                className={`ceo-role-item ${currentRole === 'ceo' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('ceo'); setShowRoleMenu(false); }}
              >
                <span>CEO</span>
                <Crown size={16} color="#818CF8" />
              </div>

              <div
                className={`ceo-role-item ${currentRole === 'administration' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('administration'); setShowRoleMenu(false); }}
              >
                <span>Administration</span>
                <Briefcase size={16} color="#38BDF8" />
              </div>

              <div
                className={`ceo-role-item ${currentRole === 'admin' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('admin'); setShowRoleMenu(false); }}
              >
                <span>Admin</span>
                <ShieldCheck size={16} color="#60A5FA" />
              </div>

              <div
                className={`ceo-role-item ${currentRole === 'hr' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('hr'); setShowRoleMenu(false); }}
              >
                <span>HR</span>
                <Heart size={16} color="#A78BFA" />
              </div>

              <div
                className={`ceo-role-item ${currentRole === 'sales_manager' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('sales_manager'); setShowRoleMenu(false); }}
              >
                <span>Sales Manager</span>
                <UserCheck size={16} color="#F472B6" />
              </div>

              <div
                className={`ceo-role-item ${currentRole === 'project_manager' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('project_manager'); setShowRoleMenu(false); }}
              >
                <span>Project Manager</span>
                <FolderKanban size={16} color="#34D399" />
              </div>

              <div
                className={`ceo-role-item ${currentRole === 'marketing' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('marketing'); setShowRoleMenu(false); }}
              >
                <span>Marketing</span>
                <Megaphone size={16} color="#EC4899" />
              </div>

              <div
                className={`ceo-role-item ${currentRole === 'accountant' || currentRole === 'finance' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('accountant'); setShowRoleMenu(false); }}
              >
                <span>Finance</span>
                <Calculator size={16} color="#2563EB" />
              </div>

              <div
                className={`ceo-role-item ${currentRole === 'employee' ? 'active' : ''}`}
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
