import React from 'react';
import { Search, Plus, Bell, Menu } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import './HRHeader.css';

export default function HRHeader({ activeTab, onMenuToggle, searchQuery = '', onSearchChange, onPrimaryAction }) {
  const getHeaderInfo = (tab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'HR Dashboard', subtitle: 'Overview of workforce, attendance, and HR metrics' };
      case 'employees':
        return { title: 'Employees', subtitle: 'Manage employee profiles, departments, and org structure' };
      case 'attendance':
        return { title: 'Attendance & Leave', subtitle: 'Track daily attendance, leave requests, and approvals' };
      case 'recruitment':
        return { title: 'Recruitment', subtitle: 'Manage job postings, applicants, and hiring pipeline' };
      case 'performance':
        return { title: 'Performance', subtitle: 'Review cycles, ratings, goals, and appraisal management' };
      case 'hr_reports':
        return { title: 'HR Reports', subtitle: 'Analytics, workforce insights, and exportable HR reports' };
      case 'hr_notifications':
        return { title: 'Notifications', subtitle: 'Leave requests, alerts, and HR system notifications' };
      case 'hr_settings':
        return { title: 'HR Settings', subtitle: 'Configure HR policies, payroll, and portal preferences' };
      default:
        return { title: 'HR Portal', subtitle: 'Welcome to FlowBridge HR' };
    }
  };

  const getPrimaryActionLabel = (tab) => {
    switch (tab) {
      case 'employees': return 'Add Employee';
      case 'recruitment': return 'Post Job';
      case 'attendance': return 'Mark Attendance';
      case 'performance': return 'New Review';
      default: return 'New Entry';
    }
  };

  const showPrimaryAction = ['employees', 'recruitment', 'attendance', 'performance'].includes(activeTab);

  const { title, subtitle } = getHeaderInfo(activeTab);

  return (
    <header className="hr-header">
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="hr-header-left">
        <h1 className="hr-page-title">{title}</h1>
        <p className="hr-page-subtitle">{subtitle}</p>
      </div>

      <div className="hr-header-right">
        <div className="hr-search-box">
          <Search size={16} className="hr-search-icon" />
          <input
            type="text"
            placeholder="Search employees, jobs..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>

        <NotificationDropdown />

        {showPrimaryAction && (
          <button className="hr-primary-btn" onClick={() => onPrimaryAction && onPrimaryAction(activeTab)}>
            <Plus size={16} />
            <span>{getPrimaryActionLabel(activeTab)}</span>
          </button>
        )}
      </div>
    </header>
  );
}
