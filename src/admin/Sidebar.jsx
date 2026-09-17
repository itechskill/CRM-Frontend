import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Zap,
  LogOut,
  ShieldCheck,
  UserCheck,
  Heart,
  User,
  Calculator,
  Crown,
  Briefcase,
  TrendingUp,
  FileText,
  Plane,
  Wallet
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ activeTab, setActiveTab, currentRole, onSwitchRole, isMobileOpen, onClose, onLogout, currentUser }) {
  const [counts, setCounts] = useState({ pendingRegistrations: 0, users: 0 });

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
    if (onClose) onClose();
  };

  const mainMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'registration_requests', label: 'Registration Requests', icon: UserCheck, badge: counts.pendingRegistrations > 0 ? String(counts.pendingRegistrations) : undefined },
    { id: 'create_ceo', label: 'Create CEO Account', icon: Crown },
    { id: 'users', label: 'Users', icon: Users, badge: counts.users > 0 ? String(counts.users) : undefined },
    { id: 'audit_logs', label: 'Audit Logs', icon: ShieldCheck }
  ];

  const orgMenuItems = [
    { id: 'org_users', label: 'All Users Directory', icon: Users },
    { id: 'org_dept_sales', label: 'Sales Department', icon: TrendingUp },
    { id: 'org_dept_logistics', label: 'Logistics Dept', icon: Plane },
    { id: 'org_dept_support', label: 'Support & Ops', icon: Briefcase },
    { id: 'org_dept_accounts', label: 'Accounts Dept', icon: Calculator },
    { id: 'org_dept_finance', label: 'Finance Dept', icon: Wallet },
    { id: 'org_dept_hr', label: 'HR Department', icon: Heart },
    { id: 'org_ranking', label: 'Performance Ranking', icon: Crown, badge: 'Live' },
    { id: 'org_monthly', label: 'Monthly Reports', icon: FileText }
  ];

  const accountMenuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings }
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
              System Admin Portal
            </span>
          </div>
        </div>

        {/* System Admin Environment Badge */}
        <div style={{ padding: '0 16px 14px' }}>
          <div 
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '9px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            <ShieldCheck size={16} color="#60A5FA" />
            <span>Administrator Environment</span>
          </div>
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
            <span className="menu-section-title">Organization</span>
            {orgMenuItems.map((item) => {
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
            <span className="menu-section-title">Account</span>
            {accountMenuItems.map((item) => {
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
                </div>
              );
            })}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="sidebar-user">
          <div 
            className="user-left" 
            onClick={() => handleSetActiveTab('profile')} 
            style={{ cursor: 'pointer' }} 
            title="Manage Admin Profile"
          >
            <div className="user-avatar" style={{ backgroundColor: '#2563EB', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentUser?.profileImage ? (
                <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                currentUser?.fullName ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD'
              )}
            </div>
            <div className="user-details">
              <span className="user-name">{currentUser?.fullName || 'System Admin'}</span>
              <span className="user-role" style={{ fontSize: '0.72rem', color: '#60A5FA', fontWeight: 600 }}>Administrator</span>
            </div>
          </div>
          <LogOut size={18} color="#EF4444" style={{ cursor: 'pointer' }} title="Log out" onClick={onLogout} />
        </div>
      </aside>
    </>
  );
}
