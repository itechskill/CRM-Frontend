import React from 'react';
import { Menu, Search } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import './AdministrationHeader.css';

export default function AdministrationHeader({ activeTab, currentUser, onMenuToggle, searchQuery = '', onSearchChange }) {
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

  const name = currentUser?.fullName || 'Administration Manager';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

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
        <NotificationDropdown />

        <div className="admin-side-profile-pill">
          <div className="admin-side-profile-avatar">{initials}</div>
          <span className="admin-side-profile-name">{name}</span>
        </div>
      </div>
    </header>
  );
}
