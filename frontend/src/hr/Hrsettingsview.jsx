import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import './HRSettingsView.css';

const settingsTabs = ['Profile', 'Notifications', 'Security'];

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

export default function HRSettingsView() {
  const [activeSettingsTab, setActiveSettingsTab] = useState('Profile');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [profile, setProfile] = useState({
    firstName: 'Angela',
    lastName: 'Torres',
    email: 'angela.torres@flowbridge.io',
    role: 'HR Manager',
    department: 'Human Resources',
    phone: '+1-555-390-1147',
  });

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setProfile((prev) => ({ ...prev, [field]: value }));
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
    <div className="hr-settings-container">
      {/* Page Header */}
      <div className="hr-settings-page-header">
        <h1 className="hr-settings-page-title">Settings</h1>
        <p className="hr-settings-page-subtitle">Manage your HR profile and preferences</p>
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

      {/* Profile Tab */}
      {activeSettingsTab === 'Profile' && (
        <div className="hr-settings-card">
          <h3 className="hr-settings-card-title">Profile Information</h3>

          <div className="hr-settings-avatar-row">
            <div className="hr-settings-avatar">AT</div>
            <div className="hr-settings-avatar-actions">
              <a href="#" className="hr-settings-change-photo-link">Change photo</a>
              <span className="hr-settings-avatar-hint">JPG, PNG up to 5MB</span>
            </div>
          </div>

          <div className="hr-settings-form-grid">
            <div className="hr-settings-form-group">
              <label className="hr-settings-label">First Name</label>
              <input
                type="text"
                className={`hr-settings-input ${fieldErrors.firstName ? 'error' : ''}`}
                value={profile.firstName}
                onChange={handleChange('firstName')}
              />
              {fieldErrors.firstName && <span className="hr-settings-field-error">{fieldErrors.firstName}</span>}
            </div>
            <div className="hr-settings-form-group">
              <label className="hr-settings-label">Last Name</label>
              <input
                type="text"
                className={`hr-settings-input ${fieldErrors.lastName ? 'error' : ''}`}
                value={profile.lastName}
                onChange={handleChange('lastName')}
              />
              {fieldErrors.lastName && <span className="hr-settings-field-error">{fieldErrors.lastName}</span>}
            </div>

            <div className="hr-settings-form-group">
              <label className="hr-settings-label">Email</label>
              <input
                type="email"
                className={`hr-settings-input ${fieldErrors.email ? 'error' : ''}`}
                value={profile.email}
                onChange={handleChange('email')}
              />
              {fieldErrors.email && <span className="hr-settings-field-error">{fieldErrors.email}</span>}
            </div>
            <div className="hr-settings-form-group">
              <label className="hr-settings-label">Role</label>
              <input
                type="text"
                className={`hr-settings-input ${fieldErrors.role ? 'error' : ''}`}
                value={profile.role}
                onChange={handleChange('role')}
              />
              {fieldErrors.role && <span className="hr-settings-field-error">{fieldErrors.role}</span>}
            </div>

            <div className="hr-settings-form-group">
              <label className="hr-settings-label">Department</label>
              <input
                type="text"
                className={`hr-settings-input ${fieldErrors.department ? 'error' : ''}`}
                value={profile.department}
                onChange={handleChange('department')}
              />
              {fieldErrors.department && <span className="hr-settings-field-error">{fieldErrors.department}</span>}
            </div>
            <div className="hr-settings-form-group">
              <label className="hr-settings-label">Phone</label>
              <input
                type="text"
                className={`hr-settings-input ${fieldErrors.phone ? 'error' : ''}`}
                value={profile.phone}
                onChange={handleChange('phone')}
              />
              {fieldErrors.phone && <span className="hr-settings-field-error">{fieldErrors.phone}</span>}
            </div>
          </div>

          <div className="hr-settings-form-footer">
            <button className="hr-settings-btn-secondary">Cancel</button>
            <button className="hr-settings-btn-primary" onClick={handleSaveChanges}>Save Changes</button>
          </div>
        </div>
      )}

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
