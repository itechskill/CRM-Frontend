import React, { useState, useEffect } from 'react';
import {
  Crown,
  LayoutGrid,
  TrendingUp,
  FolderKanban,
  Wallet,
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
  Plane,
  History,
  LogOut,
  ShoppingBag,
  Globe
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import './CEOSidebar.css';

export default function CEOSidebar({ activeTab, setActiveTab, currentRole, onSwitchRole, isMobileOpen, onClose, onLogout, currentUser, userRole }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = async () => {
    try {
      const { response, data } = await apiRequest('/api/edit-permissions/requests?status=Pending');
      if (response.ok && data.success) {
        setPendingCount(data.count || 0);
      }
    } catch (err) {
      console.error('[CEOSidebar] Error fetching pending edit requests count:', err);
    }
  };

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'business_overview', label: 'Business Overview', icon: TrendingUp },
    { id: 'sales_finance', label: 'Sales & Finance', icon: Calculator },
    { id: 'edit_requests', label: 'Edit Requests', icon: ShieldCheck, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'edit_history', label: 'Edit History', icon: History }
  ];

  const orgNav = [
    { id: 'org_users', label: 'All Users Directory', icon: Users },
    { id: 'org_dept_sales', label: 'Sales Department', icon: TrendingUp },
    { id: 'org_dept_logistics', label: 'Logistics Dept', icon: Plane },
    { id: 'org_dept_local_purchaser', label: 'Local Purchaser Dept', icon: ShoppingBag },
    { id: 'org_dept_global_purchaser', label: 'Global Purchaser Dept', icon: Globe },
    { id: 'org_dept_support', label: 'Support & Ops', icon: Briefcase },
    { id: 'org_dept_accounts', label: 'Accounts Dept', icon: Calculator },
    { id: 'org_dept_finance', label: 'Finance Dept', icon: Wallet },
    { id: 'org_dept_hr', label: 'HR Department', icon: Heart },
    { id: 'org_ranking', label: 'Performance Ranking', icon: Crown },
    { id: 'org_monthly', label: 'Monthly Reports', icon: PieChart }
  ];

  const accountNav = [
    { id: 'profile', label: 'My Profile', icon: User }
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
            {(!collapsed || isMobileOpen) && (
              <div className="ceo-brand-info">
                <span className="ceo-brand-name">Fortline CRM</span>
                <span className="ceo-brand-subtitle">EXECUTIVE PORTAL</span>
              </div>
            )}
          </div>
          <button
            className="ceo-collapse-btn desktop-only"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="ceo-sidebar-menu">
          {(!collapsed || isMobileOpen) && <div className="ceo-menu-title">EXECUTIVE SUITE</div>}

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
                    {(!collapsed || isMobileOpen) && <span>{item.label}</span>}
                  </div>
                  {(!collapsed || isMobileOpen) && item.badge && (
                    <span className="ceo-menu-badge">{item.badge}</span>
                  )}
                </div>
              );
            })}
          </div>

          {(!collapsed || isMobileOpen) && <div className="ceo-menu-title">ORGANIZATION DIRECTORY</div>}

          <div className="ceo-menu-section">
            {orgNav.map((item) => {
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
                    {(!collapsed || isMobileOpen) && <span>{item.label}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {(!collapsed || isMobileOpen) && <div className="ceo-menu-title">ACCOUNT</div>}

          <div className="ceo-menu-section">
            {accountNav.map((item) => {
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
                    {(!collapsed || isMobileOpen) && <span>{item.label}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with User Profile Card & Logout */}
        <div className="ceo-sidebar-footer">
          <div className="ceo-user-card">
            <div
              className="ceo-user-left"
              onClick={() => {
                if (onSwitchRole && (userRole === 'ceo' || userRole === 'admin')) {
                  setShowRoleMenu(!showRoleMenu);
                }
              }}
              title={(userRole === 'ceo' || userRole === 'admin') ? 'Click to Switch Portal' : undefined}
            >
              <div className="ceo-user-avatar">
                {currentUser?.profileImage ? (
                  <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser?.fullName
                    ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'KR'
                )}
              </div>
              {(!collapsed || isMobileOpen) && (
                <div className="ceo-user-info">
                  <span className="ceo-user-name">
                    {currentUser?.fullName || 'Karim Rafiq'}
                  </span>
                  <span className="ceo-user-role">
                    {currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : 'CHIEF EXECUTIVE OFFICER'}
                  </span>
                </div>
              )}
            </div>

            <button
              className="ceo-logout-action"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>

          {showRoleMenu && onSwitchRole && (
            <div className="ceo-role-dropdown">
              <div className="ceo-role-dropdown-header">Switch Portal</div>
              {[
                { role: 'ceo', label: 'CEO Executive', icon: Crown, color: '#818CF8' },
                { role: 'admin', label: 'System Admin', icon: ShieldCheck, color: '#60A5FA' },
                { role: 'sales_manager', label: 'Sales Portal', icon: TrendingUp, color: '#34D399' },
                { role: 'finance', label: 'Finance Dept', icon: Wallet, color: '#FBBF24' },
                { role: 'purchaser', subDept: 'Local', label: 'Local Purchaser', icon: ShoppingBag, color: '#10B981' },
                { role: 'purchaser', subDept: 'Global', label: 'Global Purchaser', icon: Globe, color: '#3B82F6' },
                { role: 'accounts', label: 'Accounts Dept', icon: Calculator, color: '#38BDF8' }
              ].map(item => {
                const RoleIcon = item.icon;
                const isActive = currentRole === item.role && (!item.subDept || (currentUser?.purchaserSubDept || 'Local') === item.subDept);
                return (
                  <div
                    key={`${item.role}-${item.subDept || ''}`}
                    className={`ceo-role-item ${isActive ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSwitchRole(item.role, item.subDept);
                      setShowRoleMenu(false);
                    }}
                  >
                    <span>{item.label}</span>
                    <RoleIcon size={16} color={item.color} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
