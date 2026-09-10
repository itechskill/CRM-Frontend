import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Bell,
  Zap,
  Shield,
  CreditCard,
  ChevronRight,
  Plus,
  Cloud,
  MessageSquare,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  X,
  UserCheck,
  Power
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import './SalesSettingsView.css';
import '../employee/sales/SalesViews.css';

const settingsNavItems = [
  { key: 'team', label: 'Team Management', icon: Users },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'integrations', label: 'Integrations', icon: Zap },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'billing', label: 'Billing & Plan', icon: CreditCard },
];

const initialNotifications = [
  { key: 'newLead', title: 'New Lead Assigned', desc: 'When a new lead is assigned to you', enabled: true },
  { key: 'dealWon', title: 'Deal Won', desc: 'When a deal is marked as won', enabled: true },
  { key: 'meetingReminders', title: 'Meeting Reminders', desc: '30 minutes before a scheduled meeting', enabled: true },
  { key: 'proposalViewed', title: 'Quotation / Proposal Viewed', desc: 'When a client views your quotation', enabled: true },
  { key: 'weeklyReport', title: 'Weekly Summary', desc: 'Summary of team performance every Monday', enabled: true },
  { key: 'teamActivity', title: 'Team Activity', desc: 'Real-time sales actions from your team', enabled: true },
  { key: 'clientAtRisk', title: 'Payment Overdue Alert', desc: 'When customer invoices are past due', enabled: true },
];

const initialIntegrations = [
  { key: 'salesforce', name: 'Salesforce Sync', desc: 'Sync leads and customer accounts bidirectionally', icon: Cloud, iconBg: '#EDE9FE', iconColor: '#7C3AED', connected: true },
  { key: 'hubspot', name: 'HubSpot Marketing', desc: 'Import marketing qualified leads', icon: Zap, iconBg: '#FFEDD5', iconColor: '#F97316', connected: false },
  { key: 'slack', name: 'Slack Alerts', desc: 'Get deal and invoice notifications in Slack channels', icon: MessageSquare, iconBg: '#F3E8FF', iconColor: '#A855F7', connected: true },
  { key: 'googleCalendar', name: 'Google Calendar', desc: 'Sync customer meetings and follow-up reminders', icon: Calendar, iconBg: '#DBEAFE', iconColor: '#2563EB', connected: true },
  { key: 'linkedinSalesNav', name: 'LinkedIn Sales Nav', desc: 'Import prospect data from LinkedIn', icon: Users, iconBg: '#DBEAFE', iconColor: '#2563EB', connected: false },
  { key: 'docusign', name: 'DocuSign Signatures', desc: 'Send and track contract signatures', icon: FileText, iconBg: '#F1F5F9', iconColor: '#475569', connected: false },
  { key: 'stripe', name: 'Banking & Payment Gateway', desc: 'Track customer wire transfers and payment status', icon: CreditCard, iconBg: '#F1F5F9', iconColor: '#475569', connected: false },
  { key: 'zapier', name: 'Zapier Automation', desc: 'Connect 5000+ apps via automated workflows', icon: Zap, iconBg: '#FFEDD5', iconColor: '#F97316', connected: false },
];

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
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    position: 'Sales Representative',
    target: ''
  });
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState(initialNotifications);

  // Integrations state
  const [integrations, setIntegrations] = useState(initialIntegrations);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [securityMsg, setSecurityMsg] = useState('');

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

  const toggleIntegration = (key) => {
    setIntegrations(prev => prev.map(i => i.key === key ? { ...i, connected: !i.connected } : i));
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSecurityMsg('New passwords do not match.');
      return;
    }
    setSecurityMsg('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSecurityMsg(''), 3000);
  };

  const renderTeam = () => (
    <>
      <div className="settings-main-header settings-main-header-row">
        <div>
          <h1>Sales Team Management</h1>
          <p>{teamMembers.length} active registered sales team members in MongoDB</p>
        </div>
        <button
          type="button"
          className="invite-member-btn"
          onClick={() => {
            setShowInviteModal(true);
            setInviteError('');
            setInviteMsg('');
          }}
        >
          <Plus size={16} />
          <span>Invite Member</span>
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
        <div className="sv-loading">Loading Team Data...</div>
      ) : teamMembers.length === 0 ? (
        <div className="team-list-card" style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
          <UserCheck size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
          <h3>No Sales Team Members Found</h3>
          <p style={{ margin: '4px 0 16px', fontSize: '0.85rem' }}>Click "Invite Member" to register a new sales representative.</p>
        </div>
      ) : (
        <div className="team-list-card">
          {teamMembers.map((member, idx) => {
            const initials = member.fullName
              ? member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              : 'SR';
            const bg = avatarColors[idx % avatarColors.length];
            const isActive = member.status === 'active';

            return (
              <div className="team-member-row" key={member._id}>
                <div className="team-member-left">
                  <span className="team-member-avatar" style={{ backgroundColor: bg }}>
                    {initials}
                  </span>
                  <div>
                    <div className="team-member-name">{member.fullName}</div>
                    <div className="team-member-email">{member.email} · <span style={{ color: '#2563EB', fontWeight: 600 }}>{member.position || 'Sales Representative'}</span></div>
                  </div>
                </div>

                <div className="team-member-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`team-status-badge ${isActive ? 'status-active' : 'status-invited'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(member)}
                    disabled={statusTogglingId === member._id}
                    title={isActive ? 'Deactivate account (block login)' : 'Activate account (allow login)'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '7px',
                      border: isActive ? '1px solid #FECACA' : '1px solid #A7F3D0',
                      background: isActive ? '#FEF2F2' : '#ECFDF5',
                      color: isActive ? '#DC2626' : '#059669',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Power size={13} />
                    {statusTogglingId === member._id ? 'Updating...' : (isActive ? 'Deactivate' : 'Activate')}
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
        <p>Control when and how you receive alerts and reports</p>
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
        <p>Connect CRM with enterprise services and tools</p>
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
        <h1>Security Settings</h1>
        <p>Manage authentication and access credentials</p>
      </div>

      <div className="security-card">
        <h3 className="security-card-title">Change Password</h3>
        {securityMsg && (
          <div style={{ background: '#ECFDF5', color: '#059669', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem' }}>
            {securityMsg}
          </div>
        )}
        <form onSubmit={handleUpdatePassword}>
          <div className="profile-form-group">
            <label>Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="profile-form-group">
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="profile-form-group">
            <label>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
          </div>

          <button type="submit" className="update-password-btn">Update Password</button>
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

  const renderBilling = () => (
    <>
      <div className="settings-main-header">
        <h1>Billing & Plan</h1>
        <p>Manage enterprise licensing and billing in PKR</p>
      </div>

      <div className="billing-plan-card">
        <div className="billing-plan-info">
          <span className="billing-plan-badge">Enterprise Edition</span>
          <div className="billing-plan-price">Rs. 49,999 / month</div>
          <p className="billing-plan-features">Unlimited sales reps · Complete sales workflow · Full audit retention</p>
          <p className="billing-plan-next">Billed in Pakistani Rupees (PKR) · Fortline CRM Enterprise</p>
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
          <p>Sales configuration</p>
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

      {/* INVITE NEW SALES TEAM MEMBER MODAL */}
      {showInviteModal && (
        <div className="sv-modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
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
              Fill in the new employee details. The registration request will be submitted to the <strong>System Admin</strong> for approval. The account remains pending until approved.
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
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={inviteForm.password}
                    onChange={(e) => setInviteForm(p => ({ ...p, password: e.target.value }))}
                    required
                    minLength={6}
                  />
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
                  <label>Role / Position</label>
                  <input
                    placeholder="Sales Representative"
                    value={inviteForm.position}
                    onChange={(e) => setInviteForm(p => ({ ...p, position: e.target.value }))}
                  />
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
