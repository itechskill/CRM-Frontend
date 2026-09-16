import React, { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, Briefcase, Building2, Calendar, Shield,
  Edit3, Save, X, Camera, CheckCircle, AlertCircle, Lock, Eye, EyeOff
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import './ProfileView.css';

const ROLE_LABELS = {
  ceo: 'Chief Executive Officer',
  hr_manager: 'HR Manager',
  sales_manager: 'Sales Manager',
  project_manager: 'Project Manager',
  accountant: 'Accountant',
  marketing: 'Marketing',
  administration: 'Administration',
  employee: 'Employee',
  admin: 'System Admin'
};

export default function ProfileView({ currentUser, onUpdateCurrentUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwSection, setShowPwSection] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const fileInputRef = useRef(null);
  const [uploadingPic, setUploadingPic] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/users/me');
      if (response.ok && data.success) {
        setProfile(data.data);
        setEditForm({
          fullName: data.data.fullName || '',
          email: data.data.email || '',
          phone: data.data.phone || ''
        });
      }
    } catch (e) {
      console.error('Fetch profile error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleSaveProfile = async () => {
    if (!editForm.fullName.trim()) {
      showAlert('error', 'Full name is required.');
      return;
    }

    const trimmedEmail = editForm.email.trim().toLowerCase();
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showAlert('error', 'Please enter a valid email address.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: editForm.fullName.trim(),
        email: trimmedEmail,
        phone: editForm.phone.trim()
      };

      if (showPwSection && pwForm.newPassword) {
        if (!pwForm.currentPassword) {
          showAlert('error', 'Current password is required to set a new password.');
          setSaving(false);
          return;
        }
        if (pwForm.newPassword !== pwForm.confirmPassword) {
          showAlert('error', 'New passwords do not match.');
          setSaving(false);
          return;
        }
        if (pwForm.newPassword.length < 8) {
          showAlert('error', 'New password must be at least 8 characters long.');
          setSaving(false);
          return;
        }
        if (!/[A-Z]/.test(pwForm.newPassword)) {
          showAlert('error', 'New password must contain at least one uppercase letter.');
          setSaving(false);
          return;
        }
        if (!/[a-z]/.test(pwForm.newPassword)) {
          showAlert('error', 'New password must contain at least one lowercase letter.');
          setSaving(false);
          return;
        }
        if (!/[0-9]/.test(pwForm.newPassword)) {
          showAlert('error', 'New password must contain at least one number.');
          setSaving(false);
          return;
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwForm.newPassword)) {
          showAlert('error', 'New password must contain at least one special character.');
          setSaving(false);
          return;
        }
        payload.currentPassword = pwForm.currentPassword;
        payload.newPassword = pwForm.newPassword;
      }

      const { response, data } = await apiRequest('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (response.ok && data.success) {
        setProfile(data.data);
        setEditing(false);
        setShowPwSection(false);
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showAlert('success', 'Profile updated successfully!');
        if (onUpdateCurrentUser) onUpdateCurrentUser(data.data);
      } else {
        showAlert('error', data.message || 'Failed to update profile.');
      }
    } catch (e) {
      showAlert('error', 'Server error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert('error', 'Please select an image file (JPG, PNG, GIF, WebP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      showAlert('error', 'Image must be smaller than 4MB.');
      return;
    }

    setUploadingPic(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { response, data } = await apiRequest('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ profileImage: base64 })
      });

      if (response.ok && data.success) {
        setProfile(data.data);
        showAlert('success', 'Profile picture updated!');
        if (onUpdateCurrentUser) onUpdateCurrentUser(data.data);
      } else {
        showAlert('error', data.message || 'Failed to upload picture.');
      }
    } catch (e) {
      showAlert('error', 'Error uploading picture.');
    } finally {
      setUploadingPic(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePicture = async () => {
    setUploadingPic(true);
    try {
      const { response, data } = await apiRequest('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ profileImage: '' })
      });

      if (response.ok && data.success) {
        setProfile(data.data);
        showAlert('success', 'Profile picture removed!');
        if (onUpdateCurrentUser) onUpdateCurrentUser(data.data);
      } else {
        showAlert('error', data.message || 'Failed to remove picture.');
      }
    } catch (e) {
      showAlert('error', 'Error removing picture.');
    } finally {
      setUploadingPic(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <AlertCircle size={40} color="#EF4444" />
        <p>Failed to load profile. Please refresh.</p>
      </div>
    );
  }

  const initials = profile.fullName ? profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
  const roleLabel = ROLE_LABELS[profile.role] || profile.role || 'User';

  return (
    <div className="profile-view-container">
      {/* Alert */}
      {alert && (
        <div className={`profile-alert ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {alert.text}
        </div>
      )}

      <div className="profile-grid">
        {/* Left Card — Avatar & Identity */}
        <div className="profile-left-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrap">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="Profile" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">{initials}</div>
              )}
              <button
                className="profile-avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPic}
                title="Change profile picture"
              >
                {uploadingPic ? <div className="mini-spinner" /> : <Camera size={15} />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePictureChange} />
            </div>
            {profile.profileImage && (
              <button
                type="button"
                onClick={handleRemovePicture}
                disabled={uploadingPic}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                ✕ Remove Profile Photo
              </button>
            )}
            <h2 className="profile-name">{profile.fullName}</h2>
            <div className="profile-role-badge">{roleLabel}</div>
            {profile.department && <div className="profile-dept">{profile.department}</div>}
          </div>

          <div className="profile-meta-list">
            {[
              { icon: Mail, label: 'Email', value: profile.email },
              { icon: Phone, label: 'Phone', value: profile.phone || 'Not set' },
              { icon: Shield, label: 'Employee ID', value: profile.employeeId || 'N/A' },
              { icon: Calendar, label: 'Member Since', value: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' }
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="profile-meta-item">
                <Icon size={15} className="profile-meta-icon" />
                <div>
                  <div className="profile-meta-label">{label}</div>
                  <div className="profile-meta-value">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card — Edit Form */}
        <div className="profile-right-card">
          <div className="profile-card-header">
            <h3>Profile Information</h3>
            {!editing ? (
              <button className="profile-edit-btn" onClick={() => setEditing(true)}>
                <Edit3 size={14} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="profile-cancel-btn"
                  onClick={() => {
                    setEditing(false);
                    setShowPwSection(false);
                    setEditForm({
                      fullName: profile.fullName || '',
                      email: profile.email || '',
                      phone: profile.phone || ''
                    });
                  }}
                >
                  <X size={14} /> Cancel
                </button>
                <button className="profile-save-btn" onClick={handleSaveProfile} disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            /* View mode */
            <div className="profile-info-grid">
              {[
                { icon: User, label: 'Full Name', value: profile.fullName },
                { icon: Mail, label: 'Email Address', value: profile.email },
                { icon: Phone, label: 'Phone Number', value: profile.phone || '—' },
                { icon: Briefcase, label: 'Role', value: roleLabel },
                { icon: Building2, label: 'Department', value: profile.department || '—' },
                { icon: Shield, label: 'Account Status', value: profile.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1) : 'Active' }
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="profile-info-field">
                  <div className="profile-field-label">
                    <Icon size={14} /> {label}
                  </div>
                  <div className="profile-field-value">{value}</div>
                </div>
              ))}
            </div>
          ) : (
            /* Edit mode */
            <div className="profile-edit-form">
              <div className="profile-form-group">
                <label><User size={14} /> Full Name *</label>
                <input
                  type="text"
                  className="profile-input"
                  value={editForm.fullName}
                  onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="Your full name"
                />
              </div>

              <div className="profile-form-group">
                <label><Mail size={14} /> Email Address *</label>
                <input
                  type="email"
                  className="profile-input"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  disabled={profile.role !== 'admin' && profile.role !== 'ceo'}
                  style={profile.role !== 'admin' && profile.role !== 'ceo' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  placeholder="name@example.com"
                />
                <span className="profile-input-hint" style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  {profile.role !== 'admin' && profile.role !== 'ceo' ? 'Contact an administrator to change your email address.' : 'Updating your email preserves all historical system activities and records.'}
                </span>
              </div>

              <div className="profile-form-group">
                <label><Phone size={14} /> Phone Number</label>
                <input
                  type="tel"
                  className="profile-input"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+92 300 0000000"
                />
              </div>

              <div className="profile-form-group">
                <label><Briefcase size={14} /> Role</label>
                <input type="text" className="profile-input" value={roleLabel} disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>

              {/* Password change section */}
              <div className="profile-pw-toggle">
                <button type="button" className="profile-pw-toggle-btn" onClick={() => setShowPwSection(!showPwSection)}>
                  <Lock size={14} /> {showPwSection ? 'Cancel Password Change' : 'Change Password'}
                </button>
              </div>

              {showPwSection && (
                <div className="profile-pw-section">
                  <div className="profile-form-group">
                    <label>Current Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        className="profile-input"
                        value={pwForm.currentPassword}
                        onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                        placeholder="Enter your current password"
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                      >
                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="profile-form-group">
                    <label>New Password (Min 8 chars, uppercase, lowercase, number, special char)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        className="profile-input"
                        value={pwForm.newPassword}
                        onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        placeholder="Min 8 chars, 1 upper, 1 lower, 1 num, 1 special"
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                      >
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="profile-form-group">
                    <label>Confirm New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        className="profile-input"
                        value={pwForm.confirmPassword}
                        onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                        placeholder="Repeat new password"
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                      >
                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
