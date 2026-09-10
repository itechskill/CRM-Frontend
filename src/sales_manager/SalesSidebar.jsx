import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
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
  Crown,
  ShoppingCart,
  CreditCard,
  Activity
} from 'lucide-react';
import './SalesSidebar.css';

export default function SalesSidebar({ activeTab, setActiveTab, currentRole, userRole, currentUser, onSwitchRole, onSignOut, onLogout, isMobileOpen, onClose }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [counts, setCounts] = useState({ leads: 0, meetings: 0, proposals: 0, notifications: 0 });
  const handleLogout = onLogout || onSignOut;

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { response, data } = await apiRequest('/api/users/sidebar-counts');
        if (response.ok && data.success) {
          setCounts(data.data);
        }
      } catch (e) {
        console.error('Fetch sales sidebar counts error:', e);
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
    { id: 'leads', label: 'Leads', icon: Target, badge: counts.leads > 0 ? String(counts.leads) : undefined },
    { id: 'orders', label: 'Sales Orders', icon: ShoppingCart },
    { id: 'payments', label: 'Payments & Collections', icon: CreditCard },
    { id: 'activities', label: 'Team Activities', icon: Activity },
    { id: 'invoices', label: 'Invoices & Billing', icon: Calculator },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'meetings', label: 'Meetings', icon: Calendar, badge: counts.meetings > 0 ? String(counts.meetings) : undefined },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'team', label: 'Sales Team', icon: UserCheck }
  ];

  const systemNav = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: counts.notifications > 0 ? String(counts.notifications) : undefined }
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
          <span className="sales-brand-name">Fortline CRM</span>
          <span className="sales-brand-subtitle">Sales Manager Portal</span>
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
                {item.badge && <span className="sales-menu-badge">{item.badge}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* User Footer Profile & Role Switcher with Sign Out Icon */}
      <div 
        className="sales-sidebar-user" 
        onClick={() => {
          if (userRole === 'admin' || userRole === 'ceo') {
            setShowRoleMenu(!showRoleMenu);
          }
        }}
        style={{ cursor: (userRole === 'admin' || userRole === 'ceo') ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div className="sales-user-left">
          <div className="sales-user-avatar" style={{ backgroundColor: '#2563EB', color: '#FFF', fontWeight: 'bold', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentUser?.profileImage ? (
              <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              userInitials
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="sales-user-name">{currentUser?.fullName || 'Sales Manager'}</span>
            <span className="sales-user-role">{currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : 'SALES MANAGER'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(userRole === 'admin' || userRole === 'ceo') && <ChevronDown size={16} color="#94A3B8" />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (handleLogout) handleLogout();
            }}
            title="Sign Out"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              padding: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>

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
    </aside>
    </>
  );
}
