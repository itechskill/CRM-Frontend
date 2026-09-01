import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import './Settings.css';

const settingsTabs = ['Notifications', 'Team', 'Integrations'];

export default function Settings() {
  const [activeSettingsTab, setActiveSettingsTab] = useState('Notifications');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  return (
    <div className="settings-container">
      {/* Page Header */}
      <div className="settings-page-header">
        <h1 className="settings-page-title">Settings</h1>
        <p className="settings-page-subtitle">Manage your account and platform preferences</p>
      </div>

      {/* Tab Bar */}
      <div className="settings-tab-bar">
        {settingsTabs.map((tab) => (
          <button
            key={tab}
            className={`settings-tab ${activeSettingsTab === tab ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}

      {activeSettingsTab === 'Notifications' && (
        <div className="settings-card">
          <h3 className="settings-card-title">Notification Preferences</h3>
          <p className="settings-placeholder-text">Notification settings go here.</p>
        </div>
      )}

      {activeSettingsTab === 'Team' && (
        <div className="settings-card">
          <h3 className="settings-card-title">Team Management</h3>
          <p className="settings-placeholder-text">Team settings go here.</p>
        </div>
      )}

      {activeSettingsTab === 'Integrations' && (
        <div className="settings-card">
          <h3 className="settings-card-title">Integrations</h3>
          <p className="settings-placeholder-text">Connected apps and integrations go here.</p>
        </div>
      )}

      {/* Save Confirmation Toast */}
      {showSavedToast && (
        <div className="settings-toast success">
          <CheckCircle size={18} />
          <span>Changes saved successfully</span>
        </div>
      )}

      {/* Validation Error Toast */}
      {showErrorToast && (
        <div className="settings-toast error">
          <AlertCircle size={18} />
          <span>Please fix the highlighted fields</span>
        </div>
      )}
    </div>
  );
}
