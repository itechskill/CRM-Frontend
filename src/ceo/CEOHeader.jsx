import React from 'react';
import { Menu, Search, Bell, Crown, Filter } from 'lucide-react';
import './CEOHeader.css';

export default function CEOHeader({ activeTab, onMenuToggle }) {
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
          <input type="text" placeholder="Search strategy, metrics..." />
        </div>

        <button className="ceo-icon-btn" title="Executive Notifications">
          <Bell size={18} />
          <span className="ceo-badge-dot" />
        </button>

        <div className="ceo-profile-pill">
          <div className="ceo-profile-avatar">EV</div>
          <span className="ceo-profile-name">Eleanor Vance (CEO)</span>
        </div>
      </div>
    </header>
  );
}
