import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
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
  CalendarX,
  Briefcase,
  TrendingUp,
  Users,
  FileCheck,
  Truck,
  Phone,
  Target,
  ClipboardList,
  DollarSign
} from 'lucide-react';
import './EmployeeSidebar.css';

export default function EmployeeSidebar({ activeTab, setActiveTab, currentRole, userRole, currentUser, onSwitchRole, isMobileOpen, onClose, onLogout }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [counts, setCounts] = useState({ projects: 0, tasks: 0, notifications: 0, leads: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { response, data } = await apiRequest('/api/users/sidebar-counts');
        if (response.ok && data.success) {
          setCounts(data.data);
        }
      } catch (e) {
        console.error('Fetch Employee sidebar counts error:', e);
      }
    };
    fetchCounts();
  }, []);

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const isSalesDept = (currentUser?.department || '').trim().toLowerCase() === 'sales';

  const generalNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'projects', label: 'My Projects', icon: FolderKanban, badge: counts.projects > 0 ? String(counts.projects) : undefined },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badge: counts.tasks > 0 ? String(counts.tasks) : undefined },
    { id: 'work_updates', label: 'Work Updates', icon: FileText },
    { id: 'completed_tasks', label: 'Completed', icon: CheckCircle2 },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'leave', label: 'Leave & Attendance', icon: CalendarX },
  ];

  const salesMainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'leave', label: 'Leave & Attendance', icon: CalendarX },
  ];

  const salesNav = [
    { id: 'my_leads', label: 'My Leads', icon: Users },
    { id: 'my_deals', label: 'Deals Pipeline', icon: TrendingUp },
    { id: 'my_quotations', label: 'Quotations', icon: FileText },
    { id: 'customer_pos', label: 'Customer POs', icon: FileCheck },
    { id: 'product_files', label: 'Product Files', icon: FolderKanban },
    { id: 'my_orders', label: 'Sales Orders', icon: Briefcase },
    { id: 'delivery_notes', label: 'Delivery Notes', icon: Truck },
    { id: 'my_invoices', label: 'Invoices', icon: Calculator },
    { id: 'my_payments', label: 'Customer Payments', icon: DollarSign },
    { id: 'followups', label: 'Follow-ups', icon: Phone },
    { id: 'sales_targets', label: 'Sales Targets', icon: Target },
    { id: 'sales_activities', label: 'Activity Log', icon: ClipboardList },
  ];

  const bottomNav = [
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: counts.notifications > 0 ? counts.notifications : undefined, badgeColor: '#38BDF8' },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const currentMainNav = isSalesDept ? salesMainNav : generalNav;

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
            {(!collapsed || isMobileOpen) && (
              <div className="employee-brand-info">
                <span className="employee-brand-name">Fortline CRM</span>
                <span className="employee-brand-subtitle">
                  {isSalesDept ? 'SALES MEMBER PORTAL' : 'EMPLOYEE PORTAL'}
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
          {(!collapsed || isMobileOpen) && <div className="employee-menu-title white-title">WORK PORTAL</div>}

          <div className="employee-menu-section">
            {currentMainNav.map((item) => {
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

          {/* Sales Section — Sub-section name is clean white */}
          {isSalesDept && (
            <>
              {!collapsed && <div className="employee-menu-title white-title">SALES & TRANSACTIONS</div>}
              <div className="employee-menu-section">
                {salesNav.map((item) => {
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
                    </div>
                  );
                })}
              </div>
              <div className="employee-menu-divider" />
            </>
          )}

          {!collapsed && <div className="employee-menu-title white-title">ACCOUNT & SETTINGS</div>}
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
            <div className="employee-user-avatar" style={{ backgroundColor: '#2563EB', color: '#FFF', fontWeight: 'bold', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentUser?.profileImage ? (
                <img src={currentUser.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                userInitials
              )}
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="employee-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="employee-user-name" style={{ color: '#FFFFFF', fontSize: '0.825rem', fontWeight: 600 }}>
                  {currentUser?.fullName || (isSalesDept ? 'Sales Member' : 'Employee')}
                </span>
                <span className="employee-user-role" style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                  {currentUser?.position || (isSalesDept ? 'Sales Representative' : (currentUser?.department ? `${currentUser.department} Dept` : 'Employee'))}
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
        </div>
      </aside>
    </>
  );
}
