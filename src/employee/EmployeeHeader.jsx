import React, { useState } from 'react';
import { Search, Plus, Menu } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import './EmployeeHeader.css';

export default function EmployeeHeader({ activeTab, onOpenNewTaskModal, onMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState('');

  const getHeaderInfo = (tab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Overview of your work and progress' };
      case 'leave':
        return { title: 'Leave & Attendance', subtitle: 'Submit leave applications and review your attendance history' };
      case 'projects':
        return { title: 'My Projects', subtitle: 'Track your active project commitments and deliverables' };
      case 'tasks':
        return { title: 'My Tasks', subtitle: 'Manage, organize, and update your assigned task items' };
      case 'work_updates':
        return { title: 'Work Updates', subtitle: 'Log daily standups, hours worked, and progress notes' };
      case 'completed_tasks':
        return { title: 'Completed Tasks', subtitle: 'Archive of finished work items and milestone records' };
      case 'activity':
        return { title: 'Activity Stream', subtitle: 'Real-time log of commits, reviews, mentions, and updates' };
      case 'notifications':
        return { title: 'Notifications', subtitle: 'Recent task alerts, mentions, and deadline reminders' };
      case 'profile':
        return { title: 'Employee Profile', subtitle: 'Personal information, role details, and performance stats' };
      case 'settings':
        return { title: 'Portal Settings', subtitle: 'Personalize your workspace preferences and notifications' };
      default:
        return { title: 'Employee Portal', subtitle: 'Welcome to FlowBridge' };
    }
  };

  const { title, subtitle } = getHeaderInfo(activeTab);

  return (
    <header className="employee-header">
      {/* Hamburger button — visible only on mobile via CSS */}
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="employee-header-left">
        <h1 className="employee-page-title">{title}</h1>
        <p className="employee-page-subtitle">{subtitle}</p>
      </div>

      <div className="employee-header-right">
        {/* Global Search Bar */}
        <div className="employee-search-box">
          <Search size={16} className="employee-search-icon" />
          <input 
            type="text"
            placeholder="Search tasks, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <NotificationDropdown />

        {/* Primary Action Button */}
        <button 
          className="employee-primary-btn"
          onClick={onOpenNewTaskModal}
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}
