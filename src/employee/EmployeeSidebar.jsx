import React, { useState } from 'react';
import { 
  Zap, 
  LayoutGrid, 
  FolderKanban, 
  CheckSquare, 
  FileText, 
  CheckCircle2, 
  Activity, 
  Bell, 
  User, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Heart,
  LogOut,
  Calculator,
  Megaphone,
  Crown,
  Briefcase
} from 'lucide-react';
import './EmployeeSidebar.css';

export default function EmployeeSidebar({ activeTab, setActiveTab, currentRole, userRole, currentUser, onSwitchRole, isMobileOpen, onClose, onLogout }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'projects', label: 'My Projects', icon: FolderKanban, badge: '3' },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badge: '7' },
    { id: 'work_updates', label: 'Work Updates', icon: FileText },
    { id: 'completed_tasks', label: 'Completed', icon: CheckCircle2 },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ];

  const bottomNav = [
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: 2, badgeColor: '#38BDF8' },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userInitials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'EMP';

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`employee-sidebar${collapsed ? ' collapsed' : ''}${isMobileOpen ? ' mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="employee-sidebar-header">
          <div className="employee-brand-left">
            <div className="employee-brand-logo">
              <Zap size={20} color="#FFFFFF" />
            </div>
            {!collapsed && (
              <div className="employee-brand-info">
                <span className="employee-brand-name">NexusCRM</span>
                <span className="employee-brand-subtitle">EMPLOYEE PORTAL</span>
              </div>
            )}
          </div>
          <button 
            className="employee-collapse-btn" 
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="employee-sidebar-menu">
          {!collapsed && <div className="employee-menu-title">WORK PORTAL</div>}
          
          <div className="employee-menu-section">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  className={`employee-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSetActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="employee-menu-left">
                    <Icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="employee-menu-badge">{item.badge}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="employee-menu-divider" />

          <div className="employee-menu-section">
            {bottomNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  className={`employee-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSetActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="employee-menu-left">
                    <Icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span 
                      className="employee-menu-badge"
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

        {/* Footer: User Profile + Logout */}
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
              {userInitials}
            </div>
            {!collapsed && (
              <div className="employee-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="employee-user-name" style={{ color: '#FFFFFF', fontSize: '0.825rem', fontWeight: 600 }}>
                  {currentUser?.fullName || 'Employee'}
                </span>
                <span className="employee-user-role" style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                  {currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : 'EMPLOYEE'}
                </span>
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
            <div className="employee-role-dropdown">
              <div className="employee-role-dropdown-header">Switch Portal</div>
              <div 
                className={`employee-role-item ${currentRole === 'ceo' ? 'active' : ''}`}
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
                className={`employee-role-item ${currentRole === 'administration' ? 'active' : ''}`}
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
                className={`employee-role-item ${currentRole === 'admin' ? 'active' : ''}`}
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
                className={`employee-role-item ${currentRole === 'project_manager' ? 'active' : ''}`}
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
                className={`employee-role-item ${currentRole === 'sales_manager' ? 'active' : ''}`}
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
                className={`employee-role-item ${currentRole === 'employee' ? 'active' : ''}`}
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
                className={`employee-role-item ${currentRole === 'hr' ? 'active' : ''}`}
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
                className={`employee-role-item ${currentRole === 'accountant' || currentRole === 'finance' ? 'active' : ''}`}
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
                className={`employee-role-item ${currentRole === 'marketing' ? 'active' : ''}`}
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
      </aside>
    </>
  );
}
