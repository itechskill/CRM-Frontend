import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FolderKanban, 
  DollarSign, 
  FileText, 
  Settings, 
  Zap,
  ChevronDown,
  LogOut,
  ShieldCheck,
  UserCheck,
  Heart,
  User,
  Calculator,
  Megaphone,
  Crown,
  Briefcase
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ activeTab, setActiveTab, currentRole, onSwitchRole, isMobileOpen, onClose, onLogout, currentUser }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [counts, setCounts] = useState({ pendingRegistrations: 0, users: 0, clients: 0, projects: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { response, data } = await apiRequest('/api/users/sidebar-counts');
        if (response.ok && data.success) {
          setCounts(data.data);
        }
      } catch (e) {
        console.error('Fetch admin sidebar counts error:', e);
      }
    };
    fetchCounts();
  }, []);

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose(); // close sidebar on mobile after nav
  };

  const mainMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'registration_requests', label: 'Registration Requests', icon: UserCheck, badge: counts.pendingRegistrations > 0 ? String(counts.pendingRegistrations) : undefined },
    { id: 'create_ceo', label: 'Create CEO Account', icon: Crown },
    { id: 'users', label: 'Users', icon: Users, badge: counts.users > 0 ? String(counts.users) : undefined },
    { id: 'audit_logs', label: 'Audit Logs', icon: ShieldCheck },
    { id: 'clients', label: 'Clients', icon: Building2, badge: counts.clients > 0 ? String(counts.clients) : undefined },
    { id: 'projects', label: 'Projects', icon: FolderKanban, badge: counts.projects > 0 ? String(counts.projects) : undefined },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar${isMobileOpen ? ' mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-logo">
          <Zap size={22} color="#FFFFFF" fill="#FFFFFF" />
        </div>
        <div className="brand-info">
          <span className="brand-name">Fortline CRM</span>
          <span className="brand-subtitle" style={{ textTransform: 'none', color: '#94A3B8', fontSize: '0.75rem' }}>
            Admin Dashboard
          </span>
        </div>
      </div>

      {/* Workspace / Role Selector */}
      <div style={{ padding: '0 16px 16px', position: 'relative' }}>
        <div 
          onClick={() => setShowRoleMenu(!showRoleMenu)}
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            cursor: 'pointer',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#60A5FA" />
            <span>Admin</span>
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
                fontWeight: 600,
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
                fontWeight: 600,
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
                fontWeight: 600,
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
                fontWeight: 600,
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
                fontWeight: 600,
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
                fontWeight: 600,
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
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
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
                color: currentRole === 'accountant' ? '#2563EB' : '#94A3B8',
                backgroundColor: currentRole === 'accountant' ? '#1E293B' : 'transparent',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
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
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onClick={() => {
                onSwitchRole('marketing');
                setShowRoleMenu(false);
              }}
            >
              <span>Marketing Dept</span>
              <Megaphone size={16} color="#EC4899" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="sidebar-menu">
        <div className="menu-section">
          <span className="menu-section-title">Main Menu</span>
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`menu-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSetActiveTab(item.id)}
              >
                <div className="menu-item-left">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="menu-badge" style={{ backgroundColor: '#2563EB', fontSize: '0.65rem' }}>
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="menu-section">
          <span className="menu-section-title">Settings</span>
          <div
            className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleSetActiveTab('settings')}
          >
            <div className="menu-item-left">
              <Settings size={18} />
              <span>Settings</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="sidebar-user">
        <div className="user-left" onClick={onLogout} style={{ cursor: 'pointer' }} title="Log out">
          <div className="user-avatar" style={{ backgroundColor: '#2563EB', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentUser?.profileImage ? (
              <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              currentUser?.fullName ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD'
            )}
          </div>
          <div className="user-details">
            <span className="user-name">{currentUser?.fullName || 'System Admin'}</span>
            <span className="user-role" style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 600 }}>Sign Out</span>
          </div>
        </div>
        <LogOut size={18} color="#EF4444" style={{ cursor: 'pointer' }} title="Log out" onClick={onLogout} />
      </div>
    </aside>
    </>
  );
}
