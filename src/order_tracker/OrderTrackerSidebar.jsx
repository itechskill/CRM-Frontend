import React from 'react';
import { Search, Bell, User, LogOut, Eye } from 'lucide-react';
import '../employee/EmployeeSidebar.css';

export const orderTrackerNav = [
  { id: 'order_tracker', label: 'Order Tracker', icon: Search },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'My Profile', icon: User }
];

export default function OrderTrackerSidebar({ activeTab, setActiveTab, currentUser, isMobileOpen, onClose, onLogout }) {
  const navigate = id => { setActiveTab(id); if (onClose) onClose(); };
  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`employee-sidebar${isMobileOpen ? ' mobile-open' : ''}`}>
        <div className="employee-sidebar-header">
          <div className="employee-brand-left">
            <div className="employee-brand-logo" style={{ background: '#0F766E' }}><Eye size={19} /></div>
            <div className="employee-brand-info">
              <span className="employee-brand-name">Fortline CRM</span>
              <span className="employee-brand-subtitle" style={{ color: '#5EEAD4' }}>ORDER TRACKER</span>
            </div>
          </div>
        </div>
        <div className="employee-sidebar-menu">
          <div className="employee-menu-title white-title">VIEW-ONLY WORKFLOW</div>
          <div className="employee-menu-section">
            {orderTrackerNav.map(item => {
              const Icon = item.icon;
              return <div key={item.id} className={`employee-menu-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}>
                <div className="employee-menu-left"><Icon size={18} /><span>{item.label}</span></div>
              </div>;
            })}
          </div>
        </div>
        <div className="employee-sidebar-footer">
          <div style={{ color: '#E2E8F0', fontWeight: 700, padding: '0 12px 10px' }}>{currentUser?.fullName || 'Order Tracker'}</div>
          <button type="button" onClick={onLogout} className="employee-menu-item" style={{ width: '100%', border: 0, background: 'transparent', color: '#FCA5A5' }}>
            <div className="employee-menu-left"><LogOut size={18} /><span>Sign Out</span></div>
          </button>
        </div>
      </aside>
    </>
  );
}
