import React, { useState } from 'react';
import { 
  Zap, 
  LayoutGrid, 
  Folder, 
  Users, 
  CheckSquare, 
  Calendar, 
  Truck, 
  BarChart3, 
  Settings,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  FolderKanban,
  Heart,
  User,
  Calculator,
  Megaphone,
  Crown,
  Briefcase,
  LogOut
} from 'lucide-react';
import './ProjectSidebar.css';

export default function ProjectSidebar({ activeTab, setActiveTab, currentRole, userRole, currentUser, onSwitchRole, isMobileOpen, onClose, onLogout }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'projects', label: 'Projects', icon: Folder, badge: '5' },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: '11' },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'deliveries', label: 'Deliveries', icon: Truck },
  ];

  const systemNav = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userInitials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'PM';

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`project-sidebar${isMobileOpen ? ' mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="project-sidebar-header">
        <div className="project-brand-logo">
          <Zap size={22} fill="white" />
        </div>
        <div className="project-brand-info">
          <span className="project-brand-name">FlowBridge</span>
          <span className="project-brand-subtitle">Project Manager CRM</span>
        </div>
      </div>

      {/* Workspace / Role Selector (Visible ONLY for Admin / CEO) */}
      {(userRole === 'admin' || userRole === 'ceo') && (
        <div style={{ padding: '14px 16px 4px', position: 'relative' }}>
          <div 
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              cursor: 'pointer',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderKanban size={16} color="#34D399" />
              <span>Project Manager</span>
            </div>
            <ChevronDown size={16} color="#94A3B8" />
          </div>

          {showRoleMenu && (
            <div style={{
              position: 'absolute',
              top: '46px',
              left: '16px',
              right: '16px',
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '6px',
              zIndex: 30,
              boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <div 
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: currentRole === 'ceo' ? '#818CF8' : '#94A3B8',
                  backgroundColor: currentRole === 'ceo' ? '#1E293B' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between'
                }}
                onClick={() => {
                  onSwitchRole('ceo');
                  setShowRoleMenu(false);
                }}
              >
                <span>CEO</span>
                <Crown size={16} color="#818CF8" />
              </div>

              <div 
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: currentRole === 'administration' ? '#38BDF8' : '#94A3B8',
                  backgroundColor: currentRole === 'administration' ? '#1E293B' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between'
                }}
                onClick={() => {
                  onSwitchRole('administration');
                  setShowRoleMenu(false);
                }}
              >
                <span>Administration</span>
                <Briefcase size={16} color="#38BDF8" />
              </div>

              <div 
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: currentRole === 'admin' ? '#3B82F6' : '#94A3B8',
                  backgroundColor: currentRole === 'admin' ? '#1E293B' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between'
                }}
                onClick={() => {
                  onSwitchRole('admin');
                  setShowRoleMenu(false);
                }}
              >
                <span>Admin</span>
                <ShieldCheck size={16} color="#60A5FA" />
              </div>

              <div 
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: currentRole === 'project_manager' ? '#3B82F6' : '#94A3B8',
                  backgroundColor: currentRole === 'project_manager' ? '#1E293B' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between'
                }}
                onClick={() => {
                  onSwitchRole('project_manager');
                  setShowRoleMenu(false);
                }}
              >
                <span>Project Manager</span>
                <FolderKanban size={16} color="#34D399" />
              </div>

              <div 
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: currentRole === 'sales_manager' ? '#3B82F6' : '#94A3B8',
                  backgroundColor: currentRole === 'sales_manager' ? '#1E293B' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between'
                }}
                onClick={() => {
                  onSwitchRole('sales_manager');
                  setShowRoleMenu(false);
                }}
              >
                <span>Sales Manager</span>
                <UserCheck size={16} color="#F472B6" />
              </div>

              <div 
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: currentRole === 'employee' ? '#3B82F6' : '#94A3B8',
                  backgroundColor: currentRole === 'employee' ? '#1E293B' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between'
                }}
                onClick={() => {
                  onSwitchRole('employee');
                  setShowRoleMenu(false);
                }}
              >
                <span>Employee</span>
                <User size={16} color="#38BDF8" />
              </div>

              <div 
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: currentRole === 'hr' ? '#A78BFA' : '#94A3B8',
                  backgroundColor: currentRole === 'hr' ? '#1E293B' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between'
                }}
                onClick={() => {
                  onSwitchRole('hr');
                  setShowRoleMenu(false);
                }}
              >
                <span>HR</span>
                <Heart size={16} color="#A78BFA" />
              </div>

              <div 
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: currentRole === 'accountant' || currentRole === 'finance' ? '#2563EB' : '#94A3B8',
                  backgroundColor: currentRole === 'accountant' || currentRole === 'finance' ? '#1E293B' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between'
                }}
                onClick={() => {
                  onSwitchRole('accountant');
                  setShowRoleMenu(false);
                }}
              >
                <span>Finance</span>
                <Calculator size={16} color="#2563EB" />
              </div>

              <div 
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  color: currentRole === 'marketing' ? '#EC4899' : '#94A3B8',
                  backgroundColor: currentRole === 'marketing' ? '#1E293B' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between'
                }}
                onClick={() => {
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
      )}

      {/* Navigation Sections */}
      <div className="project-sidebar-menu">
        <div className="project-menu-section">
          <div className="project-menu-title">MAIN MENU</div>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`project-menu-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSetActiveTab(item.id)}
              >
                <div className="project-menu-left">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && <span className="project-menu-badge">{item.badge}</span>}
              </div>
            );
          })}
        </div>

        <div className="project-menu-section">
          <div className="project-menu-title">SYSTEM</div>
          {systemNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`project-menu-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSetActiveTab(item.id)}
              >
                <div className="project-menu-left">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Footer Profile & Logout Button */}
      <div className="project-sidebar-user" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="project-user-left">
          <div className="project-user-avatar" style={{ backgroundColor: '#10B981', color: '#FFF', fontWeight: 'bold', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentUser?.profileImage ? (
              <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              userInitials
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="project-user-name">{currentUser?.fullName || 'Project Manager'}</span>
            <span className="project-user-role">{currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : 'PROJECT MANAGER'}</span>
          </div>
        </div>
        <div
          onClick={() => onLogout && onLogout()}
          style={{ cursor: 'pointer', padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Sign Out"
        >
          <LogOut size={16} color="#EF4444" />
        </div>
      </div>
    </aside>
    </>
  );
}
