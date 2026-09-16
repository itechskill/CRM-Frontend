import React, { useState } from 'react';
import {
  LayoutGrid,
  FileText,
  CreditCard,
  DollarSign,
  BarChart3,
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
import '../employee/EmployeeSidebar.css';

export default function FinanceSidebar({
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

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const navItems = [
    { id: 'dashboard', label: 'Finance Dashboard', icon: LayoutGrid },
    { id: 'leave', label: 'Leave & Attendance', icon: UserCheck },
    { id: 'finance_invoices', label: 'Submitted Invoices', icon: FileText },
    { id: 'finance_payments', label: 'Customer Payments', icon: CreditCard },
    { id: 'finance_receivables', label: 'Accounts Receivable', icon: DollarSign },
    { id: 'finance_reports', label: 'Financial Reports', icon: BarChart3 },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  const userInitials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'FIN';

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`employee-sidebar${collapsed ? ' collapsed' : ''}${isMobileOpen ? ' mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="employee-sidebar-header">
          <div className="employee-brand-left">
            <div className="employee-brand-logo" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
              <DollarSign size={20} color="#FFFFFF" />
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="employee-brand-info">
                <span className="employee-brand-name">Fortline CRM</span>
                <span className="employee-brand-subtitle" style={{ color: '#34D399', fontWeight: 600 }}>
                  FINANCE DEPT
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
          {(!collapsed || isMobileOpen) && <div className="employee-menu-title white-title">FINANCE &amp; TREASURY</div>}

          <div className="employee-menu-section">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id ||
                (item.id === 'finance_payments' && activeTab === 'customer_payments') ||
                (item.id === 'finance_receivables' && activeTab === 'receivables') ||
                (item.id === 'finance_reports' && activeTab === 'reports');
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
            <div className="employee-user-avatar" style={{ backgroundColor: '#059669', color: '#FFF', fontWeight: 'bold' }}>
              {currentUser?.profileImage ? (
                <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                userInitials
              )}
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="employee-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="employee-user-name" style={{ color: '#FFFFFF', fontSize: '0.825rem', fontWeight: 600 }}>
                  {currentUser?.fullName || 'Finance User'}
                </span>
                <span className="employee-user-role" style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                  Finance Department
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
              <div className={`employee-role-item ${currentRole === 'finance' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('finance'); setShowRoleMenu(false); }}>
                <span>Finance Department</span><DollarSign size={16} color="#10B981" />
              </div>
              <div className={`employee-role-item ${currentRole === 'accountant' || currentRole === 'accounts' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchRole('accountant'); setShowRoleMenu(false); }}>
                <span>Accounts Department</span><Calculator size={16} color="#2563EB" />
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
