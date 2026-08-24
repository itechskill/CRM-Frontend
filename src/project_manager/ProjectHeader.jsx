import React from 'react';
import { Search, Bell, Plus, ChevronRight, Menu } from 'lucide-react';
import './ProjectHeader.css';

export default function ProjectHeader({ activeTab, onOpenNewProjectModal, onMenuToggle }) {
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
        <span>FlowBridge</span>
        <ChevronRight size={14} />
        <span className="active-crumb">{getTabTitle()}</span>
      </div>

      {/* Header Right Actions */}
      <div className="project-header-actions">
        <div className="project-search-box">
          <Search size={16} className="project-search-icon" />
          <input type="text" placeholder="Search projects, tasks..." />
        </div>

        <button className="project-notification-btn" title="Notifications">
          <Bell size={18} />
          <span className="project-notification-badge">3</span>
        </button>

        <button className="btn-new-project" onClick={onOpenNewProjectModal}>
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>
    </header>
  );
}


