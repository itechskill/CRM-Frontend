import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  FileCheck,
  FileText,
  Receipt,
  DollarSign,
  Landmark,
  PieChart,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Crown,
  Briefcase,
  ShieldCheck,
  UserCheck,
  FolderKanban,
  Megaphone,
  Calculator,
  Heart,
  TrendingUp,
  Headphones
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import '../employee/EmployeeSidebar.css';

export default function AccountsSidebar({
  activeTab,
  setActiveTab,
  currentRole,
  userRole,
  currentUser,
  onSwitchRole,
  isMobileOpen,
  onClose,
  onLogout
}) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [ordersReadyCount, setOrdersReadyCount] = useState(0);

  // Fetch real count of orders waiting for invoice from MongoDB
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { response, data } = await apiRequest('/api/sales-employee/orders');
        if (response.ok && data.success && Array.isArray(data.data)) {
          const readyCount = data.data.filter(o =>
            o.workflowStatus === 'Sent to Accounts' ||
            o.workflowStatus === 'Delivery Note Confirmed' ||
            o.deliveryStatus === 'Fully Delivered' ||
            o.deliveryStatus === 'Delivered'
          ).length;
          setOrdersReadyCount(readyCount);
        }
      } catch (e) {
        console.error('Fetch Accounts sidebar counts error:', e);
      }
    };
    fetchCounts();
  }, [activeTab]);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const workflowNav = [
    { id: 'dashboard', label: 'Accounts Dashboard', icon: LayoutGrid },
    {
      id: 'orders_ready',
      label: 'Orders Ready for Invoice',
      icon: FileCheck,
      badge: ordersReadyCount > 0 ? String(ordersReadyCount) : undefined,
      badgeColor: '#2563EB'
    },
    { id: 'invoices', label: 'Invoices Management', icon: FileText },
  ];

  const accountingNav = [
    { id: 'expenses', label: 'Expenses & Bills', icon: Receipt },
    { id: 'payroll', label: 'Payroll & Salaries', icon: DollarSign },
    { id: 'acc_reports', label: 'Financial Reports', icon: PieChart },
  ];

  const bottomNav = [
    { id: 'leave', label: 'Leave & Attendance', icon: UserCheck },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const userInitials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'ACC';

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`employee-sidebar${collapsed ? ' collapsed' : ''}${isMobileOpen ? ' mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="employee-sidebar-header">
          <div className="employee-brand-left">
            <div className="employee-brand-logo" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}>
              <Calculator size={20} color="#FFFFFF" />
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="employee-brand-info">
                <span className="employee-brand-name">Fortline CRM</span>
                <span className="employee-brand-subtitle" style={{ color: '#60A5FA', fontWeight: 600 }}>
                  ACCOUNTS DEPT
                </span>
              </div>
            )}
          </div>
          <button
            className="employee-collapse-btn desktop-only"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="employee-sidebar-menu">
          {(!collapsed || isMobileOpen) && <div className="employee-menu-title white-title">INVOICING WORKFLOW</div>}

          <div className="employee-menu-section">
            {workflowNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  className={`employee-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="employee-menu-left">
                    <Icon size={18} />
                    {(!collapsed || isMobileOpen) && <span>{item.label}</span>}
                  </div>
                  {(!collapsed || isMobileOpen) && item.badge && (
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

          <div className="employee-menu-divider" />

          {(!collapsed || isMobileOpen) && <div className="employee-menu-title white-title">ACCOUNTING &amp; LEDGER</div>}

          <div className="employee-menu-section">
            {accountingNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  className={`employee-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="employee-menu-left">
                    <Icon size={18} />
                    {(!collapsed || isMobileOpen) && <span>{item.label}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="employee-menu-divider" />

          {(!collapsed || isMobileOpen) && <div className="employee-menu-title white-title">ACCOUNT</div>}

          <div className="employee-menu-section">
            {bottomNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  className={`employee-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="employee-menu-left">
                    <Icon size={18} />
                    {(!collapsed || isMobileOpen) && <span>{item.label}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Profile & Role Switcher Footer */}
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
              {currentUser?.profileImage ? (
                <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                userInitials
              )}
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="employee-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="employee-user-name" style={{ color: '#FFFFFF', fontSize: '0.825rem', fontWeight: 600 }}>
                  {currentUser?.fullName || 'Accounts Member'}
                </span>
                <span className="employee-user-role" style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                  Accounts Department
                </span>
              </div>
            )}
            <div
              style={{ cursor: 'pointer', padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}
              onClick={(e) => {
                e.stopPropagation();
                if (onLogout) onLogout();
              }}
              title="Logout"
            >
              <LogOut size={16} color="#EF4444" />
            </div>
          </div>

          {(userRole === 'admin' || userRole === 'ceo') && showRoleMenu && (
            <div className="employee-role-dropdown" style={{ bottom: '70px' }}>
              <div className="employee-role-dropdown-header">Switch Portal</div>

              <div className={`employee-role-item ${currentRole === 'ceo' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('ceo'); setShowRoleMenu(false); }}>
                <span>CEO</span><Crown size={16} color="#818CF8" />
              </div>
              <div className={`employee-role-item ${currentRole === 'administration' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('administration'); setShowRoleMenu(false); }}>
                <span>Administration</span><Briefcase size={16} color="#38BDF8" />
              </div>
              <div className={`employee-role-item ${currentRole === 'admin' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('admin'); setShowRoleMenu(false); }}>
                <span>Admin</span><ShieldCheck size={16} color="#60A5FA" />
              </div>
              <div className={`employee-role-item ${currentRole === 'accountant' || currentRole === 'accounts' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('accountant'); setShowRoleMenu(false); }}>
                <span>Accounts Department</span><Calculator size={16} color="#2563EB" />
              </div>
              <div className={`employee-role-item ${currentRole === 'finance' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('finance'); setShowRoleMenu(false); }}>
                <span>Finance Department</span><Calculator size={16} color="#10B981" />
              </div>
              <div className={`employee-role-item ${currentRole === 'support' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('support'); setShowRoleMenu(false); }}>
                <span>Support Department</span><Headphones size={16} color="#38BDF8" />
              </div>
              <div className={`employee-role-item ${(currentRole === 'sales_member' || currentRole === 'sales_rep') ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('sales_member'); setShowRoleMenu(false); }}>
                <span>Sales Person</span><TrendingUp size={16} color="#10B981" />
              </div>
              <div className={`employee-role-item ${currentRole === 'sales_manager' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('sales_manager'); setShowRoleMenu(false); }}>
                <span>Sales Manager</span><UserCheck size={16} color="#F472B6" />
              </div>
              <div className={`employee-role-item ${currentRole === 'project_manager' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('project_manager'); setShowRoleMenu(false); }}>
                <span>Project Manager</span><FolderKanban size={16} color="#34D399" />
              </div>
              <div className={`employee-role-item ${currentRole === 'hr' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('hr'); setShowRoleMenu(false); }}>
                <span>HR Manager</span><Heart size={16} color="#A78BFA" />
              </div>
              <div className={`employee-role-item ${currentRole === 'marketing' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('marketing'); setShowRoleMenu(false); }}>
                <span>Marketing</span><Megaphone size={16} color="#EC4899" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
