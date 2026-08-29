import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import './Settings.css';

const settingsTabs = ['Profile', 'Notifications', 'Team', 'Integrations'];

const profileFieldLabels = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  role: 'Role',
  department: 'Department',
  phone: 'Phone',
};

const NAME_REGEX = /^[A-Za-z\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[0-9+\-/]+$/;

function validateField(field, rawValue) {
  const value = (rawValue || '').trim();

  if (!value) {
    return 'This field is required';
  }

  if ((field === 'firstName' || field === 'lastName') && !NAME_REGEX.test(value)) {
    return 'Only alphabets are allowed';
  }

  if (field === 'email' && !EMAIL_REGEX.test(value)) {
    return 'Enter a valid email address';
  }

  if (field === 'phone' && !PHONE_REGEX.test(value)) {
    return 'Only numbers, -, / and + are allowed';
  }

  return null;
}

export default function Settings() {
  const [activeSettingsTab, setActiveSettingsTab] = useState('Profile');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [profile, setProfile] = useState({
    firstName: 'Ryan',
    lastName: 'Mitchell',
    email: 'ryan.mitchell@flowbridge.io',
    role: 'Project Manager',
    department: 'Operations',
    phone: '+1-555-248-3901',
  });

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setProfile((prev) => ({ ...prev, [field]: value }));
    // Live-clear the error as soon as the value becomes valid again
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleSaveChanges = () => {
    const newErrors = {};
    let hasError = false;

    Object.keys(profileFieldLabels).forEach((field) => {
      const error = validateField(field, profile[field]);
      newErrors[field] = error;
      if (error) hasError = true;
    });

    setFieldErrors(newErrors);

    if (hasError) {
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      return;
    }

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

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
      {activeSettingsTab === 'Profile' && (
        <div className="settings-card">
          <h3 className="settings-card-title">Profile Information</h3>

          <div className="settings-avatar-row">
            <div className="settings-avatar">RM</div>
            <div className="settings-avatar-actions">
              <a href="#" className="settings-change-photo-link">Change photo</a>
              <span className="settings-avatar-hint">JPG, PNG up to 5MB</span>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-form-group">
              <label className="settings-label">First Name</label>
              <input
                type="text"
                className={`settings-input ${fieldErrors.firstName ? 'error' : ''}`}
                value={profile.firstName}
                onChange={handleChange('firstName')}
              />
              {fieldErrors.firstName && <span className="settings-field-error">{fieldErrors.firstName}</span>}
            </div>
            <div className="settings-form-group">
              <label className="settings-label">Last Name</label>
              <input
                type="text"
                className={`settings-input ${fieldErrors.lastName ? 'error' : ''}`}
                value={profile.lastName}
                onChange={handleChange('lastName')}
              />
              {fieldErrors.lastName && <span className="settings-field-error">{fieldErrors.lastName}</span>}
            </div>

            <div className="settings-form-group">
              <label className="settings-label">Email</label>
              <input
                type="email"
                className={`settings-input ${fieldErrors.email ? 'error' : ''}`}
                value={profile.email}
                onChange={handleChange('email')}
              />
              {fieldErrors.email && <span className="settings-field-error">{fieldErrors.email}</span>}
            </div>
            <div className="settings-form-group">
              <label className="settings-label">Role</label>
              <input
                type="text"
                className={`settings-input ${fieldErrors.role ? 'error' : ''}`}
                value={profile.role}
                onChange={handleChange('role')}
              />
              {fieldErrors.role && <span className="settings-field-error">{fieldErrors.role}</span>}
            </div>

            <div className="settings-form-group">
              <label className="settings-label">Department</label>
              <input
                type="text"
                className={`settings-input ${fieldErrors.department ? 'error' : ''}`}
                value={profile.department}
                onChange={handleChange('department')}
              />
              {fieldErrors.department && <span className="settings-field-error">{fieldErrors.department}</span>}
            </div>
            <div className="settings-form-group">
              <label className="settings-label">Phone</label>
              <input
                type="text"
                className={`settings-input ${fieldErrors.phone ? 'error' : ''}`}
                value={profile.phone}
                onChange={handleChange('phone')}
              />
              {fieldErrors.phone && <span className="settings-field-error">{fieldErrors.phone}</span>}
            </div>
          </div>

          <div className="settings-form-footer">
            <button className="settings-btn-secondary">Cancel</button>
            <button className="settings-btn-primary" onClick={handleSaveChanges}>Save Changes</button>
          </div>
        </div>
      )}

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
