import React from 'react';
import { Menu, Search, Bell, Briefcase } from 'lucide-react';
import './AdministrationHeader.css';

export default function AdministrationHeader({ activeTab, onMenuToggle }) {
  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Administration Dashboard';
      case 'employees': return 'Employee Directory & Roles';
      case 'departments': return 'Department Management';
      case 'attendance_leave': return 'Attendance & Leave Tracking';
      case 'company_resources': return 'Company Asset & Resources';
      case 'reports': return 'Administrative Reports';
      default: return 'Administration Portal';
    }
  };

  return (
    <header className="admin-side-header">
      <div className="admin-side-header-left">
        <button className="admin-side-menu-toggle" onClick={onMenuToggle}>
          <Menu size={22} />
        </button>
        <div className="admin-side-header-title">
          <h1>{getTitle()}</h1>
          <p>Company operational management & organizational control</p>
        </div>
      </div>

      <div className="admin-side-header-right">
        <div className="admin-side-search-box">
          <Search size={16} />
          <input type="text" placeholder="Search employees, assets, logs..." />
        </div>

        <button className="admin-side-icon-btn" title="Admin Notifications">
          <Bell size={18} />
          <span className="admin-side-badge-dot" />
        </button>

        <div className="admin-side-profile-pill">
          <div className="admin-side-profile-avatar">MB</div>
          <span className="admin-side-profile-name">Marcus Brody (Admin)</span>
        </div>
      </div>
    </header>
  );
}
