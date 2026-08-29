import React from 'react';
import { Menu, Search } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import './CEOHeader.css';

export default function CEOHeader({ activeTab, currentUser, onMenuToggle, searchQuery = '', onSearchChange }) {
  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Executive Dashboard';
      case 'business_overview': return 'Business Overview & Strategy';
      case 'projects_performance': return 'Projects & Enterprise Performance';
      case 'sales_finance': return 'Sales & Financial Insights';
      case 'team_performance': return 'Organization & Team Performance';
      case 'reports_analytics': return 'Executive Reports & Analytics';
      default: return 'CEO Portal';
    }
  };

  const name = currentUser?.fullName || 'CEO Executive';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="ceo-header">
      <div className="ceo-header-left">
        <button className="ceo-menu-toggle" onClick={onMenuToggle}>
          <Menu size={22} />
        </button>
        <div className="ceo-header-title">
          <h1>{getTitle()}</h1>
          <p>Real-time enterprise overview & strategic management</p>
        </div>
      </div>

      <div className="ceo-header-right">
        <div className="ceo-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search strategy, metrics..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>

        <NotificationDropdown />

        <div className="ceo-profile-pill">
          <div className="ceo-profile-avatar">{initials}</div>
          <span className="ceo-profile-name">{name}</span>
        </div>
      </div>
    </header>
  );
}
