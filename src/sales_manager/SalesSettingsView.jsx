import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Bell,
  Shield,
  ChevronRight,
  Plus,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  X,
  UserCheck,
  Power,
  Eye,
  EyeOff,
  Lock,
  Check,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import './SalesSettingsView.css';
import '../employee/sales/SalesViews.css';

const settingsNavItems = [
  { key: 'team', label: 'Team Management', icon: Users },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
];

const initialNotifications = [];

const avatarColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#38BDF8'];

export default function SalesSettingsView() {
  const [activeSection, setActiveSection] = useState('team');

  // Real Team state from MongoDB
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [statusTogglingId, setStatusTogglingId] = useState(null);
  const [teamFeedback, setTeamFeedback] = useState('');
  const [teamError, setTeamError] = useState('');

  // Invite Member Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    position: 'Sales Representative',
    branch: '',
    target: ''
  });
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState(initialNotifications);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [securityMsg, setSecurityMsg] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Password validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\-_~]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecialChar;

  const fetchTeamMembers = useCallback(async () => {
    setLoadingTeam(true);
    try {
      const { response, data } = await apiRequest('/api/sales-manager/team-members');
      if (response.ok && data.success) {
        setTeamMembers(data.data || []);
      }
    } catch (err) {
      console.error('Fetch team settings error:', err);
    } finally {
      setLoadingTeam(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Toggle active/inactive status
  const handleToggleStatus = async (member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    setStatusTogglingId(member._id);
    setTeamFeedback('');
    setTeamError('');
    try {
      const { response, data } = await apiRequest(`/api/sales-manager/team-members/${member._id}/details`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok && data.success) {
        setTeamFeedback(`Member ${member.fullName} status updated to ${newStatus.toUpperCase()}.`);
        setTimeout(() => setTeamFeedback(''), 3500);
        fetchTeamMembers();
      } else {
        setTeamError(data.message || 'Failed to update member status.');
      }
    } catch (err) {
      setTeamError('Server error updating status.');
    } finally {
      setStatusTogglingId(null);
    }
  };

  // Submit Invite Member Request to Admin
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim() || !inviteForm.password.trim()) {
      setInviteError('Full Name, Email, and Password are required.');
      return;
    }
    setInviting(true);
    setInviteError('');
    setInviteMsg('');
    try {
      const { response, data } = await apiRequest('/api/sales-manager/invite-member', {
        method: 'POST',
        body: JSON.stringify({
          fullName: inviteForm.fullName,
          email: inviteForm.email,
          password: inviteForm.password,
          phone: inviteForm.phone,
          position: inviteForm.position,
          branch: inviteForm.branch,
          target: inviteForm.target ? Number(inviteForm.target) : 0
        })
      });
      if (response.ok && data.success) {
        setInviteMsg(data.message || 'Registration request submitted to System Admin for approval!');
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteForm({
            fullName: '',
            email: '',
            password: '',
            phone: '',
            position: 'Sales Representative',
            branch: '',
            target: ''
          });
          setInviteMsg('');
          fetchTeamMembers();
        }, 2000);
      } else {
        setInviteError(data.message || 'Failed to submit invitation request.');
      }
    } catch (err) {
      setInviteError('Server error submitting invitation request.');
    } finally {
      setInviting(false);
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => prev.map(n => n.key === key ? { ...n, enabled: !n.enabled } : n));
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setSecurityMsg('');
    setSecurityError('');

    if (!currentPassword) {
      setSecurityError('Please enter your current password.');
      return;
    }

    if (!isPasswordValid) {
      setSecurityError('New password does not meet the complexity requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('New passwords do not match. Please ensure both passwords match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { response, data } = await apiRequest('/api/auth/update-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (response.ok && data.success) {
        setSecurityMsg('Password updated successfully! Your old password has expired and you will log in with your new password.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSecurityMsg(''), 5000);
      } else {
        setSecurityError(data.message || 'Failed to update password. Please verify your current password.');
      }
    } catch (err) {
      setSecurityError('Server error while updating password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const renderTeam = () => (
    <>
      <div className="settings-main-header settings-main-header-row">
        <div>
          <h1>Sales Team Management</h1>
          <p>{teamMembers.length} active registered sales team members in MongoDB</p>
        </div>
        <button
          className="invite-member-btn"
          onClick={() => {
            setInviteError('');
            setInviteMsg('');
            setShowInviteModal(true);
          }}
        >
          <Plus size={16} />
          <span>Invite Team Member</span>
        </button>
      </div>

      {teamFeedback && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '14px' }}>
          ✓ {teamFeedback}
        </div>
      )}
      {teamError && (
        <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 16px', borderRadius: '8px', border: '1px solid #FECACA', fontWeight: 600, fontSize: '0.85rem', marginBottom: '14px' }}>
          ✕ {teamError}
        </div>
      )}

      {loadingTeam ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading real sales team members...</div>
      ) : teamMembers.length === 0 ? (
        <div className="team-list-card" style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
          <UserCheck size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
          <h3>No Sales Team Members Found</h3>
          <p style={{ margin: '4px 0 16px', fontSize: '0.85rem' }}>Click "Invite Team Member" to register a new sales person.</p>
        </div>
      ) : (
        <div className="team-members-list">
          {teamMembers.map((member, index) => {
            const initials = member.fullName
              ? member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              : 'ST';
            const color = avatarColors[index % avatarColors.length];
            const isActive = member.status === 'active';
            const isToggling = statusTogglingId === member._id;

            return (
              <div className="team-member-row" key={member._id}>
                <div className="team-member-info">
                  <div className="team-member-avatar" style={{ backgroundColor: color }}>
                    {initials}
                  </div>
                  <div>
                    <div className="team-member-name-row">
                      <span className="team-member-name">{member.fullName}</span>
                      <span className={`member-role-badge ${isActive ? 'member-role-badge-active' : 'member-role-badge-suspended'}`}>
                        {member.status ? member.status.toUpperCase() : 'ACTIVE'}
                      </span>
                    </div>
                    <span className="team-member-email">{member.email}</span>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                      {((member.fullName || '').toLowerCase().includes('ahmed') || (member.position || '').toLowerCase().includes('rep') || member.role === 'sales_rep') ? 'Sales Rep' : (member.position || 'Sales Person')} · Target: Rs. {Number(member.stats?.targetAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="team-member-actions">
                  <button
                    className={`member-status-btn ${isActive ? 'member-status-active' : 'member-status-inactive'}`}
                    onClick={() => handleToggleStatus(member)}
                    disabled={isToggling}
                    title={isActive ? 'Click to deactivate access' : 'Click to activate account'}
                  >
                    <Power size={13} />
                    <span>{isToggling ? 'Updating...' : (isActive ? 'Deactivate' : 'Activate')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  const renderNotifications = () => (
    <>
      <div className="settings-main-header">
        <h1>Notification Preferences</h1>
        <p>Choose which CRM sales events trigger in-app alerts</p>
      </div>

      <div className="notifications-list">
        {notifications.map((n) => (
          <div className="notification-row" key={n.key}>
            <div className="notification-info">
              <span className="notification-title">{n.title}</span>
              <p className="notification-desc">{n.desc}</p>
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

  const renderSecurity = () => (
    <>
      <div className="settings-main-header">
        <h1>Security Settings</h1>
        <p>Manage authentication, password credentials, and manager access</p>
      </div>

      <div className="security-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Lock size={18} color="#2563EB" />
          <h3 className="security-card-title" style={{ margin: 0 }}>Change Account Password</h3>
        </div>

        {securityMsg && (
          <div style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
            ✓ {securityMsg}
          </div>
        )}

        {securityError && (
          <div style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
            ✕ {securityError}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Current Password */}
          <div className="profile-form-group">
            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '6px', display: 'block' }}>Current Password *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current active password"
                required
                style={{ width: '100%', padding: '10px 42px 10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                title={showCurrentPassword ? 'Hide password' : 'View password'}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="profile-form-group">
            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '6px', display: 'block' }}>New Password *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong new password"
                required
                style={{ width: '100%', padding: '10px 42px 10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                title={showNewPassword ? 'Hide password' : 'View password'}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Live Password Strength Criteria */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: hasMinLength ? '#059669' : '#64748B', fontWeight: hasMinLength ? 600 : 400 }}>
                {hasMinLength ? <Check size={14} color="#059669" /> : <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #CBD5E1', display: 'inline-block' }} />}
                At least 8 characters
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: hasUppercase ? '#059669' : '#64748B', fontWeight: hasUppercase ? 600 : 400 }}>
                {hasUppercase ? <Check size={14} color="#059669" /> : <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #CBD5E1', display: 'inline-block' }} />}
                1 uppercase letter (A-Z)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: hasNumber ? '#059669' : '#64748B', fontWeight: hasNumber ? 600 : 400 }}>
                {hasNumber ? <Check size={14} color="#059669" /> : <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #CBD5E1', display: 'inline-block' }} />}
                1 number (0-9)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: hasSpecialChar ? '#059669' : '#64748B', fontWeight: hasSpecialChar ? 600 : 400 }}>
                {hasSpecialChar ? <Check size={14} color="#059669" /> : <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #CBD5E1', display: 'inline-block' }} />}
                1 special character (!@#$...)
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="profile-form-group">
            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '6px', display: 'block' }}>Confirm New Password *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                style={{ width: '100%', padding: '10px 42px 10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                title={showConfirmPassword ? 'Hide password' : 'View password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '6px' }}>
            <button
              type="submit"
              className="update-password-btn"
              disabled={updatingPassword || !isPasswordValid || newPassword !== confirmPassword}
              style={{
                backgroundColor: isPasswordValid && newPassword === confirmPassword ? '#2563EB' : '#94A3B8',
                cursor: isPasswordValid && newPassword === confirmPassword ? 'pointer' : 'not-allowed',
                padding: '10px 20px',
                borderRadius: '8px',
                color: '#FFF',
                fontWeight: 600,
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Lock size={15} />
              {updatingPassword ? 'Updating Password...' : 'Update Password & Expire Old'}
            </button>
          </div>
        </form>
      </div>

      <div className="security-card">
        <h3 className="security-card-title">Two-Factor Authentication</h3>
        <p className="security-card-sub">Add an extra layer of security to your manager account</p>

        <div className="two-factor-row">
          <div>
            <div className="two-factor-title">Authenticator App (TOTP)</div>
            <div className="two-factor-desc">Google Authenticator, Microsoft Authenticator</div>
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

  const renderContent = () => {
    switch (activeSection) {
      case 'notifications':
        return renderNotifications();
      case 'security':
        return renderSecurity();
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
          <p>Sales Manager & Team Controls</p>
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
                  <Icon size={18} />
                  <span>{item.label}</span>
                </span>
                <ChevronRight size={16} className="settings-nav-chevron" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main settings content */}
      <div className="settings-main-panel">
        {renderContent()}
      </div>

      {/* ── INVITE MEMBER MODAL ── */}
      {showInviteModal && (
        <div className="sv-modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3><Plus size={18} color="#2563EB" /> Invite New Sales Team Member</h3>
              <button onClick={() => setShowInviteModal(false)}><X size={18} /></button>
            </div>
            {inviteError && <div className="sv-error">{inviteError}</div>}
            {inviteMsg && (
              <div style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '12px' }}>
                ✓ {inviteMsg}
              </div>
            )}
            <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '0 0 14px 0', lineHeight: 1.4 }}>
              Fill in the new employee details. The registration request will be submitted to the <strong>System Admin</strong> for approval.
            </p>
            <form onSubmit={handleInviteSubmit} className="sv-form">
              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Full Name *</label>
                  <input
                    placeholder="e.g. Tariq Mehmood"
                    value={inviteForm.fullName}
                    onChange={(e) => setInviteForm(p => ({ ...p, fullName: e.target.value }))}
                    required
                  />
                </div>
                <div className="sv-field">
                  <label>Email Address (Login ID) *</label>
                  <input
                    type="email"
                    placeholder="e.g. tariq@company.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Initial Password *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showInvitePassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={inviteForm.password}
                      onChange={(e) => setInviteForm(p => ({ ...p, password: e.target.value }))}
                      required
                      minLength={6}
                      style={{ width: '100%', paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowInvitePassword(!showInvitePassword)}
                      style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                      title={showInvitePassword ? 'Hide password' : 'View password'}
                    >
                      {showInvitePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="sv-field">
                  <label>Phone Number</label>
                  <input
                    placeholder="+92 300 1234567"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="sv-grid-2">
                <div className="sv-field">
                  <label style={{ fontWeight: 700, color: '#1E293B', marginBottom: '4px', display: 'block' }}>Role / Position *</label>
                  <select
                    value={inviteForm.position}
                    onChange={(e) => setInviteForm(p => ({ ...p, position: e.target.value }))}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #2563EB',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#0F172A',
                      fontSize: '0.92rem',
                      fontWeight: '600',
                      outline: 'none',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Sales Representative">
                      Sales Representative (Full Access: Leads to Invoices & Payments)
                    </option>
                    <option value="Sales Person">
                      Sales Person (Access till Sales Orders)
                    </option>
                  </select>
                </div>
                <div className="sv-field">
                  <label>Monthly Target (PKR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    value={inviteForm.target}
                    onChange={(e) => setInviteForm(p => ({ ...p, target: e.target.value }))}
                  />
                </div>
              </div>

              <div className="sv-field" style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: 700, color: '#1E293B', marginBottom: '4px', display: 'block' }}>Regional Branch / City Office</label>
                <select
                  value={inviteForm.branch}
                  onChange={(e) => setInviteForm(p => ({ ...p, branch: e.target.value }))}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#0F172A',
                    fontSize: '0.92rem',
                    fontWeight: '600',
                    outline: 'none',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Default (Inherit from My Regional Branch)</option>
                  <option value="Islamabad">Islamabad Branch (ISB)</option>
                  <option value="Karachi">Karachi Branch (KHI)</option>
                  <option value="Lahore">Lahore Branch (LHR)</option>
                </select>
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sv-btn-primary" disabled={inviting}>
                  <Plus size={15} /> {inviting ? 'Submitting to Admin...' : 'Submit to Admin for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
