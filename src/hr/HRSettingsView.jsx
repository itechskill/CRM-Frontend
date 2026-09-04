import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import './HRSettingsView.css';

const settingsTabs = ['Notifications', 'Security'];

export default function HRSettingsView() {
  const [activeSettingsTab, setActiveSettingsTab] = useState('Notifications');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  return (
    <div className="hr-settings-container">
      {/* Page Header */}
      <div className="hr-settings-page-header">
        <h1 className="hr-settings-page-title">Settings</h1>
        <p className="hr-settings-page-subtitle">Manage your HR settings and preferences</p>
      </div>

      {/* Tab Bar */}
      <div className="hr-settings-tab-bar">
        {settingsTabs.map((tab) => (
          <button
            key={tab}
            className={`hr-settings-tab ${activeSettingsTab === tab ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeSettingsTab === 'Notifications' && (
        <div className="hr-settings-card">
          <h3 className="hr-settings-card-title">Notification Preferences</h3>
          <p className="hr-settings-placeholder-text">Notification settings go here.</p>
        </div>
      )}

      {activeSettingsTab === 'Security' && (
        <div className="hr-settings-card">
          <h3 className="hr-settings-card-title">Security</h3>
          <p className="hr-settings-placeholder-text">Password and security settings go here.</p>
        </div>
      )}

      {/* Save Confirmation Toast */}
      {showSavedToast && (
        <div className="hr-settings-toast success">
          <CheckCircle size={18} />
          <span>Changes saved successfully</span>
        </div>
      )}

      {/* Validation Error Toast */}
      {showErrorToast && (
        <div className="hr-settings-toast error">
          <AlertCircle size={18} />
          <span>Please fix the highlighted fields</span>
        </div>
      )}
    </div>
  );
}
