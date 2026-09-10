import React from 'react';
import { Search, Plus, ChevronRight, Menu } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import './ProjectHeader.css';

export default function ProjectHeader({ activeTab, onOpenNewProjectModal, onMenuToggle, searchQuery = '', onSearchChange }) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'projects': return 'Projects';
      case 'teams': return 'Teams';
      case 'tasks': return 'Tasks';
      case 'timeline': return 'Timeline';
      case 'deliveries': return 'Deliveries';
      case 'reports': return 'Reports';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="project-header">
      {/* Hamburger button — visible only on mobile via CSS */}
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="project-breadcrumb">
        <span>Fortline CRM</span>
        <ChevronRight size={14} />
        <span className="active-crumb">{getTabTitle()}</span>
      </div>

      {/* Header Right Actions */}
      <div className="project-header-actions">
        <NotificationDropdown />

        <button className="btn-new-project" onClick={onOpenNewProjectModal}>
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>
    </header>
  );
}
