import React, { useState } from 'react';
import { Search, Plus, Bell, Menu } from 'lucide-react';
import './MarketingHeader.css';

export default function MarketingHeader({ activeTab, onMenuToggle, onOpenPrimaryAction }) {
  const [searchQuery, setSearchQuery] = useState('');

  const getHeaderInfo = (tab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Marketing Dashboard', subtitle: 'Overview of campaign performance, lead acquisition, and channel metrics' };
      case 'campaigns':
        return { title: 'Campaign Management', subtitle: 'Manage email, ad campaigns, budget allocations, and conversion tracking' };
      case 'mkt_leads':
        return { title: 'Lead Acquisition (MQLs)', subtitle: 'Marketing Qualified Leads, acquisition channels, and lead scoring' };
      case 'content':
        return { title: 'Content & Social Media', subtitle: 'Publishing schedule, social engagement, blog posts, and media assets' };
      case 'analytics':
        return { title: 'Marketing Analytics', subtitle: 'Traffic sources, conversion funnels, CAC, and Return on Marketing Investment (ROMI)' };
      case 'mkt_reports':
        return { title: 'Marketing Reports', subtitle: 'Campaign ROI reports, attribution breakdown, and executive growth summaries' };
      case 'mkt_notifications':
        return { title: 'Marketing Alerts', subtitle: 'Campaign milestones, lead spikes, and budget notifications' };
      case 'mkt_settings':
        return { title: 'Marketing Settings', subtitle: 'Tracking pixels, social media API keys, and campaign parameters' };
      default:
        return { title: 'Marketing Dept Portal', subtitle: 'Welcome to FlowBridge Growth & Marketing' };
    }
  };

  const getPrimaryActionLabel = (tab) => {
    switch (tab) {
      case 'campaigns': return 'Create Campaign';
      case 'mkt_leads': return 'Add New Lead';
      case 'content': return 'Schedule Post';
      case 'analytics': return 'Run Analysis';
      case 'mkt_reports': return 'Export Report';
      default: return 'New Campaign';
    }
  };

  const showPrimaryAction = ['dashboard', 'campaigns', 'mkt_leads', 'content', 'analytics', 'mkt_reports'].includes(activeTab);

  const { title, subtitle } = getHeaderInfo(activeTab);

  return (
    <header className="mkt-header">
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="mkt-header-left">
        <h1 className="mkt-page-title">{title}</h1>
        <p className="mkt-page-subtitle">{subtitle}</p>
      </div>

      <div className="mkt-header-right">
        <div className="mkt-search-box">
          <Search size={16} className="mkt-search-icon" />
          <input
            type="text"
            placeholder="Search campaigns, leads, content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="mkt-icon-btn" title="Marketing Alerts">
          <Bell size={18} />
          <span className="mkt-notif-dot" />
        </button>

        {showPrimaryAction && (
          <button className="mkt-primary-btn" onClick={onOpenPrimaryAction}>
            <Plus size={16} />
            <span>{getPrimaryActionLabel(activeTab)}</span>
          </button>
        )}
      </div>
    </header>
  );
}
