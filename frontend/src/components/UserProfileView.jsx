import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, Building, BadgeCheck, Calendar, ShieldCheck, CheckCircle2, AlertCircle, Save, Lock } from 'lucide-react';
import './UserProfileView.css';

import { authHeaders } from '../utils/api';
import { setUser } from '../utils/authStorage';

export default function UserProfileView() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', text: '' }

  // Editable Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/users/me', {
        headers: authHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setProfile(data.data);
        setFullName(data.data.fullName || '');
        setPhone(data.data.phone || '');
        setProfileImage(data.data.profileImage || '');
      } else {
        setAlert({ type: 'error', text: data.message || 'Failed to load profile.' });
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      setAlert({ type: 'error', text: 'Error connecting to backend server.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setAlert(null);
    setSaving(true);

    try {
      const response = await fetch('http://localhost:5000/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          fullName,
          phone,
          profileImage
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setProfile(data.data);
        setUser(data.data);
        setAlert({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setAlert({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setAlert({ type: 'error', text: 'Server error while updating profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ color: '#94A3B8', padding: '40px', textAlign: 'center' }}>
        Loading user profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ color: '#FCA5A5', padding: '40px', textAlign: 'center' }}>
        Unable to load profile data.
      </div>
    );
  }

  const initials = profile.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  return (
    <div className="profile-view-container">
      <div>
        <h1 style={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>My Account Profile</h1>
        <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '4px' }}>
          Manage your personal information and view system permissions
        </p>
      </div>

      {alert && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: alert.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${alert.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: alert.type === 'success' ? '#6EE7B7' : '#FCA5A5',
          fontSize: '0.875rem'
        }}>
          {alert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{alert.text}</span>
        </div>
      )}

      <div className="profile-card">
        {/* Header Avatar & Role Badges */}
        <div className="profile-header-row">
          <div className="profile-avatar">
            {profile.profileImage ? (
              <img 
                src={profile.profileImage} 
                alt="Avatar" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              initials
            )}
          </div>

          <div className="profile-identity-info">
            <h2 className="profile-name">{profile.fullName}</h2>
            <span className="profile-email-sub">{profile.email}</span>

            <div className="profile-badges-row">
              <span className="profile-role-badge">{profile.role ? profile.role.replace('_', ' ') : 'Employee'}</span>
              <span className="profile-status-badge">{profile.status || 'Active'}</span>
            </div>
          </div>
        </div>

        <hr style={{ borderColor: '#334155', margin: '4px 0' }} />

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Editable Fields Grid */}
          <div className="profile-form-grid">
            <div className="profile-field-group">
              <label className="profile-label">Full Name</label>
              <input
                type="text"
                className="profile-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="profile-field-group">
              <label className="profile-label">Phone Number</label>
              <input
                type="tel"
                className="profile-input"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="profile-field-group" style={{ gridColumn: 'span 2' }}>
              <label className="profile-label">Profile Image URL</label>
              <input
                type="url"
                className="profile-input"
                placeholder="https://example.com/avatar.jpg"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button type="submit" className="profile-save-btn" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        <hr style={{ borderColor: '#334155', margin: '4px 0' }} />

        {/* Read Only Administrative Information */}
        <div>
          <h3 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={16} color="#94A3B8" /> System Managed Administrative Information
          </h3>

          <div className="profile-form-grid">
            <div className="profile-field-group">
              <label className="profile-label">Email Address (Read Only)</label>
              <input type="text" className="profile-input" value={profile.email} disabled />
            </div>

            <div className="profile-field-group">
              <label className="profile-label">Assigned Role (Read Only)</label>
              <input type="text" className="profile-input" value={profile.role} disabled />
            </div>

            <div className="profile-field-group">
              <label className="profile-label">Department (Read Only)</label>
              <input type="text" className="profile-input" value={profile.department || 'General Operations'} disabled />
            </div>

            <div className="profile-field-group">
              <label className="profile-label">Employee ID (Read Only)</label>
              <input type="text" className="profile-input" value={profile.employeeId || 'N/A'} disabled />
            </div>

            <div className="profile-field-group">
              <label className="profile-label">Date Joined (Read Only)</label>
              <input type="text" className="profile-input" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'} disabled />
            </div>

            <div className="profile-field-group">
              <label className="profile-label">Account Approval Status (Read Only)</label>
              <input type="text" className="profile-input" value={profile.isApproved ? 'Approved by Administrator' : 'Pending Approval'} disabled />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
