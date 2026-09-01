import React, { useState } from 'react';
import {
  User,
  Users,
  Bell,
  Zap,
  Shield,
  CreditCard,
  ChevronRight,
  Save,
  Plus,
  Cloud,
  MessageSquare,
  Calendar,
  FileText
} from 'lucide-react';
import './SalesSettingsView.css';

const settingsNavItems = [
  { key: 'team', label: 'Team', icon: Users },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'integrations', label: 'Integrations', icon: Zap },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'billing', label: 'Billing', icon: CreditCard },
];

const initialTeamMembers = [
  { id: 1, name: 'Angela Torres', email: 'a.torres@flowbridge.io', initials: 'AT', avatarBg: '#2563EB', role: 'Sales Manager', status: 'Active' },
  { id: 2, name: 'James Carter', email: 'j.carter@flowbridge.io', initials: 'JC', avatarBg: '#8B5CF6', role: 'Sales Rep', status: 'Active' },
  { id: 3, name: 'Priya Sharma', email: 'p.sharma@flowbridge.io', initials: 'PS', avatarBg: '#10B981', role: 'Sales Rep', status: 'Active' },
  { id: 4, name: 'Michael Reynolds', email: 'm.reynolds@flowbridge.io', initials: 'MR', avatarBg: '#F59E0B', role: 'Sales Rep', status: 'Invited' },
];

const initialNotifications = [
  { key: 'newLead', title: 'New Lead Assigned', desc: 'When a new lead is assigned to you', enabled: true },
  { key: 'dealWon', title: 'Deal Won', desc: 'When a deal is marked as won', enabled: true },
  { key: 'meetingReminders', title: 'Meeting Reminders', desc: '30 minutes before a scheduled meeting', enabled: true },
  { key: 'proposalViewed', title: 'Proposal Viewed', desc: 'When a client views your proposal', enabled: true },
  { key: 'weeklyReport', title: 'Weekly Report', desc: 'Summary of team performance every Monday', enabled: false },
  { key: 'teamActivity', title: 'Team Activity', desc: 'Updates from your sales team', enabled: true },
  { key: 'clientAtRisk', title: 'Client At Risk Alert', desc: 'When a client health drops below threshold', enabled: true },
];

const initialIntegrations = [
  { key: 'salesforce', name: 'Salesforce', desc: 'Sync leads and contacts bidirectionally', icon: Cloud, iconBg: '#EDE9FE', iconColor: '#7C3AED', connected: true },
  { key: 'hubspot', name: 'HubSpot', desc: 'Import marketing qualified leads', icon: Zap, iconBg: '#FFEDD5', iconColor: '#F97316', connected: false },
  { key: 'slack', name: 'Slack', desc: 'Get deal notifications in Slack channels', icon: MessageSquare, iconBg: '#F3E8FF', iconColor: '#A855F7', connected: true },
  { key: 'googleCalendar', name: 'Google Calendar', desc: 'Sync meetings and reminders', icon: Calendar, iconBg: '#DBEAFE', iconColor: '#2563EB', connected: true },
  { key: 'linkedinSalesNav', name: 'LinkedIn Sales Nav', desc: 'Import prospect data from LinkedIn', icon: Users, iconBg: '#DBEAFE', iconColor: '#2563EB', connected: false },
  { key: 'docusign', name: 'DocuSign', desc: 'Send and track contract signatures', icon: FileText, iconBg: '#F1F5F9', iconColor: '#475569', connected: false },
  { key: 'stripe', name: 'Stripe', desc: 'Track payment and subscription status', icon: CreditCard, iconBg: '#F1F5F9', iconColor: '#475569', connected: false },
  { key: 'zapier', name: 'Zapier', desc: 'Connect 5000+ apps via automation', icon: Zap, iconBg: '#FFEDD5', iconColor: '#F97316', connected: false },
];

export default function SalesSettingsView() {
  const [activeSection, setActiveSection] = useState('team');

  // Team state
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);

  const renderTeam = () => (
    <>
      <div className="settings-main-header settings-main-header-row">
        <div>
          <h1>Team Management</h1>
          <p>{teamMembers.length} members</p>
        </div>
        <button className="invite-member-btn">
          <Plus size={16} />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="team-list-card">
        {teamMembers.map((member) => (
          <div className="team-member-row" key={member.id}>
            <div className="team-member-left">
              <span className="team-member-avatar" style={{ backgroundColor: member.avatarBg }}>
                {member.initials}
              </span>
              <div>
                <div className="team-member-name">{member.name}</div>
                <div className="team-member-email">{member.email}</div>
              </div>
            </div>

            <div className="team-member-right">
              <select
                className="team-role-select"
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, e.target.value)}
              >
                <option value="Sales Manager">Sales Manager</option>
                <option value="Sales Rep">Sales Rep</option>
                <option value="Account Executive">Account Executive</option>
              </select>
              <span className={`team-status-badge ${member.status === 'Active' ? 'status-active' : 'status-invited'}`}>
                {member.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderNotifications = () => (
    <>
      <div className="settings-main-header">
        <h1>Notification Preferences</h1>
        <p>Control when and how you receive notifications</p>
      </div>
      <div className="notifications-list-card">
        {notifications.map((n) => (
          <div className="notification-row" key={n.key}>
            <div>
              <div className="notification-title">{n.title}</div>
              <div className="notification-desc">{n.desc}</div>
            </div>
            <button
              className={`toggle-switch ${n.enabled ? 'toggle-switch-on' : ''}`}
              onClick={() => toggleNotification(n.key)}
              aria-pressed={n.enabled}
            >
              <span className="toggle-knob"></span>
            </button>
          </div>
        ))}
      </div>
    </>
  );

  const renderIntegrations = () => (
    <>
      <div className="settings-main-header">
        <h1>Integrations</h1>
        <p>Connect FlowBridge with your favorite tools</p>
      </div>
      <div className="integrations-grid">
        {integrations.map((integ) => {
          const Icon = integ.icon;
          return (
            <div className="integration-card" key={integ.key}>
              <div className="integration-icon" style={{ backgroundColor: integ.iconBg, color: integ.iconColor }}>
                <Icon size={20} />
              </div>
              <div className="integration-info">
                <div className="integration-name-row">
                  <span className="integration-name">{integ.name}</span>
                  {integ.connected && <span className="integration-connected-tag">✓ Connected</span>}
                </div>
                <p className="integration-desc">{integ.desc}</p>
              </div>
              <button
                className={integ.connected ? 'disconnect-btn' : 'connect-btn'}
                onClick={() => toggleIntegration(integ.key)}
              >
                {integ.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );

  const renderSecurity = () => (
    <>
      <div className="settings-main-header">
        <h1>Security</h1>
        <p>Manage your account security settings</p>
      </div>

      <div className="security-card">
        <h3 className="security-card-title">Change Password</h3>

        <div className="profile-form-group">
          <label>Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="profile-form-group">
          <label>New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="profile-form-group">
          <label>Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>

        <button className="update-password-btn">Update Password</button>
      </div>

      <div className="security-card">
        <h3 className="security-card-title">Two-Factor Authentication</h3>
        <p className="security-card-sub">Add an extra layer of security to your account</p>

        <div className="two-factor-row">
          <div>
            <div className="two-factor-title">Authenticator App</div>
            <div className="two-factor-desc">Google Authenticator, Authy</div>
          </div>
          <button
            className={`toggle-switch ${twoFactorEnabled ? 'toggle-switch-on' : ''}`}
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            aria-pressed={twoFactorEnabled}
          >
            <span className="toggle-knob"></span>
          </button>
        </div>
      </div>
    </>
  );

  const renderBilling = () => (
    <>
      <div className="settings-main-header">
        <h1>Billing & Plan</h1>
        <p>Manage your subscription and billing details</p>
      </div>

      <div className="billing-plan-card">
        <div className="billing-plan-info">
          <span className="billing-plan-badge">Enterprise</span>
          <div className="billing-plan-price">$499 / month</div>
          <p className="billing-plan-features">Up to 25 users · Unlimited leads · Priority support</p>
          <p className="billing-plan-next">Next billing: January 15, 2025 · Auto-renews annually</p>
        </div>
        <button className="manage-plan-btn">Manage Plan</button>
      </div>

      <div className="payment-method-card">
        <h3 className="security-card-title">Payment Method</h3>
        <div className="payment-method-row">
          <div className="payment-method-left">
            <span className="visa-badge">VISA</span>
            <div>
              <div className="payment-method-name">Visa ending in 4242</div>
              <div className="payment-method-expiry">Expires 08/2027</div>
            </div>
          </div>
          <button className="payment-update-link">Update</button>
        </div>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'notifications':
        return renderNotifications();
      case 'integrations':
        return renderIntegrations();
      case 'security':
        return renderSecurity();
      case 'billing':
        return renderBilling();
      case 'team':
      default:
        return renderTeam();
    }
  };

  return (
    <div className="sales-settings-layout">
      {/* Settings inner sidebar */}
      <div className="settings-nav-panel">
        <div className="settings-nav-header">
          <h2>Settings</h2>
          <p>Manage your account</p>
        </div>

        <div className="settings-nav-list">
          {settingsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                className={`settings-nav-item ${isActive ? 'settings-nav-item-active' : ''}`}
                onClick={() => setActiveSection(item.key)}
              >
                <span className="settings-nav-item-left">
                  <Icon size={17} />
                  <span>{item.label}</span>
                </span>
                {isActive && <ChevronRight size={16} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main settings content */}
      <div className="settings-main-panel">
        {renderContent()}
      </div>
    </div>
  );
}
