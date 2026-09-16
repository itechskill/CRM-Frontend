import React, { useState } from 'react';
import {
  Bell,
  Palette,
  Lock,
  Shield,
  Globe,
  Save
} from 'lucide-react';
import './EmployeeSettingsView.css';

const settingsNavItems = [
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'privacy', label: 'Privacy', icon: Shield },
  { key: 'language', label: 'Language & Region', icon: Globe },
];

const initialNotifications = [];

export default function EmployeeSettingsView() {
  const [activeSection, setActiveSection] = useState('notifications');

  // Notifications state
  const [notifications, setNotifications] = useState(initialNotifications);
  const toggleNotification = (key) => {
    setNotifications((prev) => prev.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n)));
  };

  // Appearance state
  const [theme, setTheme] = useState('light');
  const [compactMode, setCompactMode] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Privacy state
  const [profileVisible, setProfileVisible] = useState(true);
  const [activityVisible, setActivityVisible] = useState(true);
  const [shareAnalytics, setShareAnalytics] = useState(false);

  // Language & Region state
  const [language, setLanguage] = useState('English (US)');
  const [timezone, setTimezone] = useState('Pacific Time (PST)');

  const renderNotifications = () => (
    <>
      <div className="emp-settings-main-header">
        <h1>Notification Preferences</h1>
        <p>Control when and how you receive notifications</p>
      </div>
      <div className="emp-settings-list-card">
        {notifications.map((n) => (
          <div className="emp-settings-toggle-row" key={n.key}>
            <div>
              <div className="emp-settings-row-title">{n.title}</div>
              <div className="emp-settings-row-desc">{n.desc}</div>
            </div>
            <button
              className={`emp-toggle-switch ${n.enabled ? 'emp-toggle-switch-on' : ''}`}
              onClick={() => toggleNotification(n.key)}
              aria-pressed={n.enabled}
            >
              <span className="emp-toggle-knob"></span>
            </button>
          </div>
        ))}
      </div>
    </>
  );

  const renderAppearance = () => (
    <>
      <div className="emp-settings-main-header">
        <h1>Appearance</h1>
        <p>Customize how Fortline CRM looks for you</p>
      </div>

      <div className="emp-settings-card">
        <h3 className="emp-settings-card-title">Theme</h3>
        <div className="emp-theme-options">
          <button
            className={`emp-theme-option ${theme === 'light' ? 'emp-theme-option-active' : ''}`}
            onClick={() => setTheme('light')}
          >
            Light
          </button>
          <button
            className={`emp-theme-option ${theme === 'dark' ? 'emp-theme-option-active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            Dark
          </button>
          <button
            className={`emp-theme-option ${theme === 'system' ? 'emp-theme-option-active' : ''}`}
            onClick={() => setTheme('system')}
          >
            System
          </button>
        </div>
      </div>

      <div className="emp-settings-list-card">
        <div className="emp-settings-toggle-row">
          <div>
            <div className="emp-settings-row-title">Compact Mode</div>
            <div className="emp-settings-row-desc">Show more content with reduced spacing</div>
          </div>
          <button
            className={`emp-toggle-switch ${compactMode ? 'emp-toggle-switch-on' : ''}`}
            onClick={() => setCompactMode(!compactMode)}
            aria-pressed={compactMode}
          >
            <span className="emp-toggle-knob"></span>
          </button>
        </div>
      </div>
    </>
  );

  const renderSecurity = () => (
    <>
      <div className="emp-settings-main-header">
        <h1>Security</h1>
        <p>Manage your account security settings</p>
      </div>

      <div className="emp-settings-card">
        <h3 className="emp-settings-card-title">Change Password</h3>

        <div className="emp-form-group">
          <label>Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="emp-form-group">
          <label>New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="emp-form-group">
          <label>Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>

        <button className="emp-primary-btn">
          <Save size={16} />
          <span>Update Password</span>
        </button>
      </div>

      <div className="emp-settings-list-card">
        <div className="emp-settings-toggle-row">
          <div>
            <div className="emp-settings-row-title">Two-Factor Authentication</div>
            <div className="emp-settings-row-desc">Add an extra layer of security to your account</div>
          </div>
          <button
            className={`emp-toggle-switch ${twoFactorEnabled ? 'emp-toggle-switch-on' : ''}`}
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            aria-pressed={twoFactorEnabled}
          >
            <span className="emp-toggle-knob"></span>
          </button>
        </div>
      </div>
    </>
  );

  const renderPrivacy = () => (
    <>
      <div className="emp-settings-main-header">
        <h1>Privacy</h1>
        <p>Control what others can see about you</p>
      </div>
      <div className="emp-settings-list-card">
        <div className="emp-settings-toggle-row">
          <div>
            <div className="emp-settings-row-title">Public Profile</div>
            <div className="emp-settings-row-desc">Let teammates view your profile details</div>
          </div>
          <button
            className={`emp-toggle-switch ${profileVisible ? 'emp-toggle-switch-on' : ''}`}
            onClick={() => setProfileVisible(!profileVisible)}
            aria-pressed={profileVisible}
          >
            <span className="emp-toggle-knob"></span>
          </button>
        </div>

        <div className="emp-settings-toggle-row">
          <div>
            <div className="emp-settings-row-title">Activity Visibility</div>
            <div className="emp-settings-row-desc">Show your recent activity to your team</div>
          </div>
          <button
            className={`emp-toggle-switch ${activityVisible ? 'emp-toggle-switch-on' : ''}`}
            onClick={() => setActivityVisible(!activityVisible)}
            aria-pressed={activityVisible}
          >
            <span className="emp-toggle-knob"></span>
          </button>
        </div>

        <div className="emp-settings-toggle-row">
          <div>
            <div className="emp-settings-row-title">Share Usage Analytics</div>
            <div className="emp-settings-row-desc">Help improve Fortline CRM by sharing anonymous usage data</div>
          </div>
          <button
            className={`emp-toggle-switch ${shareAnalytics ? 'emp-toggle-switch-on' : ''}`}
            onClick={() => setShareAnalytics(!shareAnalytics)}
            aria-pressed={shareAnalytics}
          >
            <span className="emp-toggle-knob"></span>
          </button>
        </div>
      </div>
    </>
  );

  const renderLanguage = () => (
    <>
      <div className="emp-settings-main-header">
        <h1>Language & Region</h1>
        <p>Set your preferred language and timezone</p>
      </div>

      <div className="emp-settings-card">
        <div className="emp-form-group">
          <label>Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option>English (US)</option>
            <option>English (UK)</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>

        <div className="emp-form-group">
          <label>Timezone</label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            <option>Pacific Time (PST)</option>
            <option>Mountain Time (MST)</option>
            <option>Central Time (CST)</option>
            <option>Eastern Time (EST)</option>
            <option>UTC</option>
          </select>
        </div>

        <button className="emp-primary-btn">
          <Save size={16} />
          <span>Save Preferences</span>
        </button>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'appearance':
        return renderAppearance();
      case 'security':
        return renderSecurity();
      case 'privacy':
        return renderPrivacy();
      case 'language':
        return renderLanguage();
      case 'notifications':
      default:
        return renderNotifications();
    }
  };

  return (
    <div className="emp-settings-layout">
      {/* Inner settings nav */}
      <div className="emp-settings-nav-panel">
        <div className="emp-settings-nav-title">SETTINGS</div>
        <div className="emp-settings-nav-list">
          {settingsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                className={`emp-settings-nav-item ${isActive ? 'emp-settings-nav-item-active' : ''}`}
                onClick={() => setActiveSection(item.key)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="emp-settings-main-panel">
        {renderContent()}
      </div>
    </div>
  );
}
