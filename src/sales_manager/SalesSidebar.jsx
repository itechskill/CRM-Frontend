import React, { useState } from 'react';
import { 
  Zap, 
  LayoutGrid, 
  Target, 
  Users,
  Calendar,
  FileText,
  Briefcase,
  BarChart3, 
  Settings,
  ChevronDown,
  ShieldCheck,
  FolderKanban,
  UserCheck,
  User,
  Heart,
  Bell,
  HelpCircle,
  LogOut,
  Calculator,
  Megaphone,
  Crown
} from 'lucide-react';
import './SalesSidebar.css';

export default function SalesSidebar({ activeTab, setActiveTab, currentRole, userRole, currentUser, onSwitchRole, onSignOut, onLogout, isMobileOpen, onClose }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const notificationCount = 5;
  const handleLogout = onLogout || onSignOut;

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'leads', label: 'Leads', icon: Target, badge: '12' },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'meetings', label: 'Meetings', icon: Calendar, badge: '3' },
    { id: 'proposals', label: 'Proposals', icon: FileText, badge: '4' },
    { id: 'clients', label: 'Clients', icon: Briefcase },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const systemNav = [
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userInitials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'SM';

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sales-sidebar${isMobileOpen ? ' mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sales-sidebar-header">
        <div className="sales-brand-logo">
          <Zap size={22} fill="white" color="white" />
        </div>
        <div className="sales-brand-info">
          <span className="sales-brand-name">FlowBridge</span>
          <span className="sales-brand-subtitle">Sales Manager CRM</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="sales-sidebar-menu">
        <div className="sales-menu-section">
          <div className="sales-menu-title">MAIN MENU</div>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`sales-menu-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSetActiveTab(item.id)}
              >
                
                <div className="sales-menu-left">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && <span className="sales-menu-badge">{item.badge}</span>}
              </div>
            );
          })}
        </div>

        <div className="sales-menu-section">
          <div className="sales-menu-title">SYSTEM</div>
          {systemNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`sales-menu-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSetActiveTab(item.id)}
              >
                <div className="sales-menu-left">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Footer Profile & Role Switcher */}
      <div 
        className="sales-sidebar-user" 
        onClick={() => {
          if (userRole === 'admin' || userRole === 'ceo') {
            setShowRoleMenu(!showRoleMenu);
          }
        }}
        style={{ cursor: (userRole === 'admin' || userRole === 'ceo') ? 'pointer' : 'default' }}
      >
        <div className="sales-user-left">
          <div className="sales-user-avatar" style={{ backgroundColor: '#2563EB', color: '#FFF', fontWeight: 'bold' }}>{userInitials}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="sales-user-name">{currentUser?.fullName || 'Sales Manager'}</span>
            <span className="sales-user-role">{currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : 'SALES MANAGER'}</span>
          </div>
        </div>
        {(userRole === 'admin' || userRole === 'ceo') && <ChevronDown size={16} color="#94A3B8" />}

        {(userRole === 'admin' || userRole === 'ceo') && showRoleMenu && (
          <div className="role-switcher-menu">
            <div 
              className={`role-option ${currentRole === 'ceo' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSwitchRole('ceo');
                setShowRoleMenu(false);
              }}
            >
              <span>CEO</span>
              <Crown size={16} color="#818CF8" />
            </div>

            <div 
              className={`role-option ${currentRole === 'administration' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSwitchRole('administration');
                setShowRoleMenu(false);
              }}
            >
              <span>Administration</span>
              <Briefcase size={16} color="#38BDF8" />
            </div>

            <div 
              className={`role-option ${currentRole === 'admin' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSwitchRole('admin');
                setShowRoleMenu(false);
              }}
            >
              <span>Admin</span>
              <ShieldCheck size={16} color="#60A5FA" />
            </div>

            <div 
              className={`role-option ${currentRole === 'project_manager' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSwitchRole('project_manager');
                setShowRoleMenu(false);
              }}
            >
              <span>Project Manager</span>
              <FolderKanban size={16} color="#34D399" />
            </div>

            <div 
              className={`role-option ${currentRole === 'sales_manager' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSwitchRole('sales_manager');
                setShowRoleMenu(false);
              }}
            >
              <span>Sales Manager</span>
              <UserCheck size={16} color="#F472B6" />
            </div>

            <div 
              className={`role-option ${currentRole === 'employee' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSwitchRole('employee');
                setShowRoleMenu(false);
              }}
            >
              <span>Employee</span>
              <User size={16} color="#38BDF8" />
            </div>

            <div 
              className={`role-option ${currentRole === 'hr' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSwitchRole('hr');
                setShowRoleMenu(false);
              }}
            >
              <span>HR</span>
              <Heart size={16} color="#A78BFA" />
            </div>

            <div 
              className={`role-option ${currentRole === 'accountant' || currentRole === 'finance' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSwitchRole('accountant');
                setShowRoleMenu(false);
              }}
            >
              <span>Finance</span>
              <Calculator size={16} color="#2563EB" />
            </div>

            <div 
              className={`role-option ${currentRole === 'marketing' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSwitchRole('marketing');
                setShowRoleMenu(false);
              }}
            >
              <span>Marketing</span>
              <Megaphone size={16} color="#EC4899" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Utility Nav: Notifications, Help & Support, Sign Out */}
      <div className="sales-sidebar-footer-nav">
        <div
          className={`sales-footer-item ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => handleSetActiveTab('notifications')}
        >
          <div className="sales-menu-left">
            <Bell size={18} />
            <span>Notifications</span>
          </div>
          {notificationCount > 0 && (
            <span className="sales-footer-notification-badge">{notificationCount}</span>
          )}
        </div>

        <div className="sales-footer-item">
          <div className="sales-menu-left">
            <HelpCircle size={18} />
            <span>Help &amp; Support</span>
          </div>
        </div>

        <div
          className="sales-footer-item"
          style={{ cursor: 'pointer' }}
          onClick={() => handleLogout && handleLogout()}
        >
          <div className="sales-menu-left">
            <LogOut size={18} color="#EF4444" />
            <span style={{ color: '#EF4444', fontWeight: 600 }}>Sign Out</span>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
