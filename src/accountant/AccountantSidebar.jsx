import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  Calculator,
  LayoutGrid,
  FileText,
  Receipt,
  DollarSign,
  Landmark,
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
  LogOut,
  Megaphone,
  Crown,
  Briefcase,
  Wrench,
  TrendingUp,
} from 'lucide-react';
import './AccountantSidebar.css';

export default function AccountantSidebar({ activeTab, setActiveTab, currentRole, userRole, currentUser, onSwitchRole, isMobileOpen, onClose, onLogout }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [counts, setCounts] = useState({ invoices: 0, expenses: 0, notifications: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { response, data } = await apiRequest('/api/users/sidebar-counts');
        if (response.ok && data.success) {
          setCounts(data.data);
        }
      } catch (e) {
        console.error('Fetch Accountant sidebar counts error:', e);
      }
    };
    fetchCounts();
  }, []);

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'invoices', label: 'Invoices & Payments', icon: FileText, badge: counts.invoices > 0 ? String(counts.invoices) : undefined },
    { id: 'expenses', label: 'Expenses', icon: Receipt, badge: counts.expenses > 0 ? String(counts.expenses) : undefined },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'accounts', label: 'Accounts', icon: Landmark },
    { id: 'maintenance', label: 'Maintenance Charges', icon: Wrench },
    { id: 'acc_reports', label: 'Financial Reports', icon: PieChart },
  ];

  const bottomNav = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'acc_notifications', label: 'Notifications', icon: Bell, badge: counts.notifications > 0 ? counts.notifications : undefined, badgeColor: '#EF4444' },
    { id: 'acc_settings', label: 'Settings', icon: Settings },
  ];

  const userInitials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'ACC';

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`acc-sidebar${collapsed ? ' collapsed' : ''}${isMobileOpen ? ' mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="acc-sidebar-header">
          <div className="acc-brand-left">
            <div className="acc-brand-logo">
              <Calculator size={20} color="#FFFFFF" />
            </div>
            {!collapsed && (
              <div className="acc-brand-info">
                <span className="acc-brand-name">Fortline CRM</span>
                <span className="acc-brand-subtitle">FINANCE PORTAL</span>
              </div>
            )}
          </div>
          <button
            className="acc-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="acc-sidebar-menu">
          {!collapsed && <div className="acc-menu-title">FINANCIAL PORTAL</div>}

          <div className="acc-menu-section">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  className={`acc-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSetActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="acc-menu-left">
                    <Icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="acc-menu-badge">{item.badge}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="acc-menu-divider" />

          <div className="acc-menu-section">
            {bottomNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  className={`acc-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSetActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="acc-menu-left">
                    <Icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span
                      className="acc-menu-badge"
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
        <div className="acc-sidebar-footer">
          <div
            className="acc-user-card"
            onClick={() => {
              if (userRole === 'admin' || userRole === 'ceo') {
                setShowRoleMenu(!showRoleMenu);
              }
            }}
            title={(userRole === 'admin' || userRole === 'ceo') ? 'Click to Switch Portal' : undefined}
          >
            <div className="acc-user-avatar" style={{ backgroundColor: '#2563EB', color: '#FFF', fontWeight: 'bold', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentUser?.profileImage ? (
                <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                userInitials
              )}
            </div>
            {!collapsed && (
              <div className="acc-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="acc-user-name" style={{ color: '#FFFFFF', fontSize: '0.825rem', fontWeight: 600 }}>{currentUser?.fullName || 'Accountant / Finance'}</span>
                <span className="acc-user-role" style={{ color: '#94A3B8', fontSize: '0.72rem' }}>{currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : 'ACCOUNTANT'}</span>
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
            <div className="acc-role-dropdown">
              <div className="acc-role-dropdown-header">Switch Portal</div>

              <div
                className={`acc-role-item ${currentRole === 'ceo' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('ceo'); setShowRoleMenu(false); }}
              >
                <span>CEO</span>
                <Crown size={16} color="#818CF8" />
              </div>

              <div
                className={`acc-role-item ${currentRole === 'administration' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('administration'); setShowRoleMenu(false); }}
              >
                <span>Administration</span>
                <Briefcase size={16} color="#38BDF8" />
              </div>

              <div
                className={`acc-role-item ${currentRole === 'admin' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('admin'); setShowRoleMenu(false); }}
              >
                <span>Admin</span>
                <ShieldCheck size={16} color="#60A5FA" />
              </div>

              <div
                className={`acc-role-item ${currentRole === 'project_manager' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('project_manager'); setShowRoleMenu(false); }}
              >
                <span>Project Manager</span>
                <FolderKanban size={16} color="#34D399" />
              </div>

              <div
                className={`acc-role-item ${currentRole === 'sales_manager' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('sales_manager'); setShowRoleMenu(false); }}
              >
                <span>Sales Manager</span>
                <UserCheck size={16} color="#F472B6" />
              </div>

              <div
                className={`acc-role-item ${(currentRole === 'sales_member' || currentRole === 'sales_rep') ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('sales_member'); setShowRoleMenu(false); }}
              >
                <span>Sales Person</span>
                <TrendingUp size={16} color="#10B981" />
              </div>

              <div
                className={`acc-role-item ${currentRole === 'employee' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('employee'); setShowRoleMenu(false); }}
              >
                <span>Employee</span>
                <User size={16} color="#38BDF8" />
              </div>

              <div
                className={`acc-role-item ${currentRole === 'hr' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('hr'); setShowRoleMenu(false); }}
              >
                <span>HR</span>
                <Heart size={16} color="#A78BFA" />
              </div>

              <div
                className={`acc-role-item ${currentRole === 'accountant' || currentRole === 'finance' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('accountant'); setShowRoleMenu(false); }}
              >
                <span>Finance</span>
                <Calculator size={16} color="#2563EB" />
              </div>

              <div
                className={`acc-role-item ${currentRole === 'marketing' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSwitchRole('marketing'); setShowRoleMenu(false); }}
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
