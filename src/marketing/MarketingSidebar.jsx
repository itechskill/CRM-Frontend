import React, { useState } from 'react';
import {
  Megaphone,
  LayoutGrid,
  Target,
  Users,
  FileText,
  BarChart2,
  PieChart,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  FolderKanban,
  User,
  Heart,
  Calculator,
  LogOut,
  Crown,
  Briefcase
} from 'lucide-react';
import './MarketingSidebar.css';

export default function MarketingSidebar({ activeTab, setActiveTab, currentRole, userRole, currentUser, onSwitchRole, isMobileOpen, onClose, onLogout }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'campaigns', label: 'Campaigns', icon: Target, badge: '5 Active' },
    { id: 'mkt_leads', label: 'Leads & Growth', icon: Users, badge: '128' },
    { id: 'content', label: 'Content Hub', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'mkt_reports', label: 'Marketing Reports', icon: PieChart },
  ];

  const bottomNav = [
    { id: 'mkt_notifications', label: 'Notifications', icon: Bell, badge: 4, badgeColor: '#EF4444' },
    { id: 'mkt_settings', label: 'Settings', icon: Settings },
  ];

  const userInitials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'MKT';

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`mkt-sidebar${collapsed ? ' collapsed' : ''}${isMobileOpen ? ' mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="mkt-sidebar-header">
          <div className="mkt-brand-left">
            <div className="mkt-brand-logo">
              <Megaphone size={20} color="#FFFFFF" />
            </div>
            {!collapsed && (
              <div className="mkt-brand-info">
                <span className="mkt-brand-name">NexusCRM</span>
                <span className="mkt-brand-subtitle">MARKETING PORTAL</span>
              </div>
            )}
          </div>
          <button
            className="mkt-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="mkt-sidebar-menu">
          {!collapsed && <div className="mkt-menu-title">GROWTH PORTAL</div>}

          <div className="mkt-menu-section">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  className={`mkt-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSetActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="mkt-menu-left">
                    <Icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="mkt-menu-badge">{item.badge}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mkt-menu-divider" />

          <div className="mkt-menu-section">
            {bottomNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  className={`mkt-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSetActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="mkt-menu-left">
                    <Icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span
                      className="mkt-menu-badge"
                      style={item.badgeColor ? { backgroundColor: item.badgeColor, color: '#FFFFFF' } : undefined}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: User + Logout */}
        <div className="mkt-sidebar-footer">
          <div
            className="mkt-user-card"
            onClick={() => {
              if (userRole === 'admin' || userRole === 'ceo') {
                setShowRoleMenu(!showRoleMenu);
              }
            }}
            title={(userRole === 'admin' || userRole === 'ceo') ? 'Click to Switch Portal' : undefined}
          >
            <div className="mkt-user-avatar" style={{ backgroundColor: '#2563EB', color: '#FFF', fontWeight: 'bold', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentUser?.profileImage ? (
                <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                userInitials
              )}
            </div>
            {!collapsed && (
              <div className="mkt-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="mkt-user-name" style={{ color: '#FFFFFF', fontSize: '0.825rem', fontWeight: 600 }}>{currentUser?.fullName || 'Marketing User'}</span>
                <span className="mkt-user-role" style={{ color: '#94A3B8', fontSize: '0.72rem' }}>{currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : 'MARKETING'}</span>
              </div>
            )}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onLogout) onLogout();
              }}
              style={{ cursor: 'pointer', padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}
              title="Logout"
            >
              <LogOut size={16} color="#EF4444" />
            </div>
          </div>

          {(userRole === 'admin' || userRole === 'ceo') && showRoleMenu && (
            <div className="mkt-role-dropdown">
              <div className="mkt-role-dropdown-header">Switch Portal</div>

              <div
                className={`mkt-role-item ${currentRole === 'ceo' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('ceo'); setShowRoleMenu(false); }}
              >
                <span>CEO</span>
                <Crown size={16} color="#818CF8" />
              </div>

              <div
                className={`mkt-role-item ${currentRole === 'administration' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('administration'); setShowRoleMenu(false); }}
              >
                <span>Administration</span>
                <Briefcase size={16} color="#38BDF8" />
              </div>

              <div
                className={`mkt-role-item ${currentRole === 'admin' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('admin'); setShowRoleMenu(false); }}
              >
                <span>Admin</span>
                <ShieldCheck size={16} color="#60A5FA" />
              </div>

              <div
                className={`mkt-role-item ${currentRole === 'project_manager' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('project_manager'); setShowRoleMenu(false); }}
              >
                <span>Project Manager</span>
                <FolderKanban size={16} color="#34D399" />
              </div>

              <div
                className={`mkt-role-item ${currentRole === 'sales_manager' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('sales_manager'); setShowRoleMenu(false); }}
              >
                <span>Sales Manager</span>
                <UserCheck size={16} color="#F472B6" />
              </div>

              <div
                className={`mkt-role-item ${currentRole === 'employee' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('employee'); setShowRoleMenu(false); }}
              >
                <span>Employee</span>
                <User size={16} color="#38BDF8" />
              </div>

              <div
                className={`mkt-role-item ${currentRole === 'hr' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('hr'); setShowRoleMenu(false); }}
              >
                <span>HR</span>
                <Heart size={16} color="#A78BFA" />
              </div>

              <div
                className={`mkt-role-item ${currentRole === 'accountant' || currentRole === 'finance' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('accountant'); setShowRoleMenu(false); }}
              >
                <span>Finance</span>
                <Calculator size={16} color="#2563EB" />
              </div>

              <div
                className={`mkt-role-item ${currentRole === 'marketing' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('marketing'); setShowRoleMenu(false); }}
              >
                <span>Marketing</span>
                <Megaphone size={16} color="#2563EB" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
