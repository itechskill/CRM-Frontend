import React, { useState } from 'react';
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
    { id: 'sales_finance', label: 'Sales & Finance', icon: Calculator },
  ];

  const orgNav = [
    { id: 'org_users', label: 'All Users Directory', icon: Users },
    { id: 'org_dept_sales', label: 'Sales Department', icon: TrendingUp },
    { id: 'org_dept_logistics', label: 'Logistics Dept', icon: Plane },
    { id: 'org_dept_support', label: 'Support & Ops', icon: Briefcase },
    { id: 'org_dept_accounts', label: 'Accounts Dept', icon: Calculator },
    { id: 'org_dept_finance', label: 'Finance Dept', icon: Wallet },
    { id: 'org_dept_hr', label: 'HR Department', icon: Heart },
    { id: 'org_ranking', label: 'Performance Ranking', icon: Crown },
    { id: 'org_monthly', label: 'Monthly Reports', icon: PieChart },
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

          {(!collapsed || isMobileOpen) && <div className="ceo-menu-title" style={{ marginTop: '16px' }}>ORGANIZATION MONITORING</div>}
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
                  {(!collapsed || isMobileOpen) && item.badge && (
                    <span className="ceo-menu-badge" style={{ backgroundColor: '#2563EB', color: '#FFF' }}>{item.badge}</span>
                  )}
                </div>
              );
            })}
          </div>

          {(!collapsed || isMobileOpen) && <div className="ceo-menu-title" style={{ marginTop: '16px' }}>ACCOUNT</div>}
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

        {/* User Footer */}
        <div className="ceo-sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid #334155', padding: '12px 16px' }}>
          <div className="ceo-user-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
              onClick={() => handleSetActiveTab('profile')}
              title="Manage Profile"
            >
              <div className="ceo-user-avatar" style={{ backgroundColor: '#6366F1', color: '#FFF', fontWeight: 'bold', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentUser?.profileImage ? (
                  <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser?.fullName ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CEO'
                )}
              </div>
              {(!collapsed || isMobileOpen) && (
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
        </div>
      </aside>
    </>
  );
}
