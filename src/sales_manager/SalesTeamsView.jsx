import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  Users,
  Mail,
  Phone,
  Target,
  ArrowRight,
  UserCheck,
  Search,
  ShieldCheck,
  Edit2,
  Trash2,
  Eye,
  Plus,
  X,
  Save,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import SalesTeamMemberProfileView from './SalesTeamMemberProfileView';
import './SalesTeamsView.css';

const avatarColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#38BDF8'];

export default function SalesTeamsView() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    salaryTarget: '',
    status: 'active'
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Member Modal State
  const [deletingMember, setDeletingMember] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Invite Member Modal State
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
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Target Assignment Modal State
  const [targetMember, setTargetMember] = useState(null);
  const [targetForm, setTargetForm] = useState({
    period: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    periodType: 'Monthly',
    targetAmount: '',
    currency: 'PKR',
    notes: ''
  });
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetError, setTargetError] = useState('');
  const [targetSuccess, setTargetSuccess] = useState('');

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/sales-manager/team-members');
      if (response.ok && data.success) {
        setTeamMembers(data.data);
      }
    } catch (err) {
      console.error('Fetch sales team error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim() || !inviteForm.password.trim()) {
      setInviteError('Full Name, Email, and Password are required.');
      return;
    }
    setInviting(true);
    setInviteError('');
    setInviteSuccess('');
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
        setInviteSuccess(data.message || 'Invitation submitted to System Admin for approval!');
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
          setInviteSuccess('');
          fetchTeam();
        }, 2000);
      } else {
        setInviteError(data.message || 'Failed to submit invitation.');
      }
    } catch (err) {
      setInviteError('Server error submitting invitation.');
    } finally {
      setInviting(false);
    }
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setEditForm({
      fullName: member.fullName || '',
      email: member.email || '',
      phone: member.phone || '',
      position: member.position || 'Sales Representative',
      salaryTarget: member.salaryTarget || member.stats?.salaryTarget || '',
      status: member.status || 'active'
    });
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      setEditError('Full Name and Email are required.');
      return;
    }
    setSavingEdit(true);
    setEditError('');
    try {
      const { response, data } = await apiRequest(`/api/sales-manager/team-members/${editingMember._id}/details`, {
        method: 'PATCH',
        body: JSON.stringify(editForm)
      });
      if (response.ok && data.success) {
        setEditingMember(null);
        fetchTeam();
      } else {
        setEditError(data.message || 'Failed to update member.');
      }
    } catch (err) {
      setEditError('Server error updating member.');
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteMember = async () => {
    if (!deletingMember) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const { response, data } = await apiRequest(`/api/sales-manager/team-members/${deletingMember._id}`, {
        method: 'DELETE'
      });
      if (response.ok && data.success) {
        setDeletingMember(null);
        fetchTeam();
      } else {
        setDeleteError(data.message || 'Failed to delete member.');
      }
    } catch (err) {
      setDeleteError('Server error deleting member.');
    } finally {
      setDeleting(false);
    }
  };

  const openTargetModal = (member) => {
    setTargetMember(member);
    setTargetForm({
      period: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      periodType: 'Monthly',
      targetAmount: member.stats?.targetAmount || '',
      currency: 'PKR',
      notes: ''
    });
    setTargetError('');
    setTargetSuccess('');
  };

  const handleAssignTarget = async (e) => {
    e.preventDefault();
    if (!targetForm.targetAmount || Number(targetForm.targetAmount) <= 0) {
      setTargetError('Valid target amount is required.');
      return;
    }
    setSavingTarget(true);
    setTargetError('');
    setTargetSuccess('');
    try {
      const payload = {
        employeeId: targetMember._id,
        period: targetForm.period,
        periodType: targetForm.periodType,
        targetAmount: Number(targetForm.targetAmount),
        currency: targetForm.currency,
        notes: targetForm.notes
      };
      const { response, data } = await apiRequest('/api/sales-manager/targets', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (response.ok && data.success) {
        setTargetSuccess('Target successfully assigned and saved to MongoDB!');
        setTimeout(() => {
          setTargetMember(null);
          fetchTeam();
        }, 1200);
      } else {
        setTargetError(data.message || 'Failed to assign target.');
      }
    } catch (err) {
      setTargetError('Server error assigning target.');
    } finally {
      setSavingTarget(false);
    }
  };

  if (selectedMemberId) {
    return (
      <SalesTeamMemberProfileView
        memberId={selectedMemberId}
        onBack={() => {
          setSelectedMemberId(null);
          fetchTeam();
        }}
      />
    );
  }

  const filteredMembers = teamMembers.filter((m) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      m.fullName?.toLowerCase().includes(term) ||
      m.email?.toLowerCase().includes(term) ||
      m.phone?.includes(term) ||
      m.position?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="sales-sm-teams-view">
      {/* Header */}
      <div className="teams-header">
        <div className="teams-header-top">
          <div>
            <h2 className="teams-title">Sales Representatives & Team Management</h2>
            <p className="teams-sub">Manage organization sales members, track real-time target attainments, and review full CRM records</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="teams-search-wrap">
              <Search size={15} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search team members by name, email, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="sv-btn-primary"
              onClick={() => {
                setShowInviteModal(true);
                setInviteError('');
                setInviteSuccess('');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <Plus size={16} /> Invite Member
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="teams-loading-box">
          <div className="teams-spinner" />
          <span>Loading Team Data...</span>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="teams-empty-box">
          <UserCheck size={48} color="#334155" />
          <h3>No Sales Team Members Found</h3>
          <p>Active registered employees in the Sales Department will automatically appear here.</p>
        </div>
      ) : (
        <div className="reps-grid">
          {filteredMembers.map((rep, idx) => {
            const stats = rep.stats || {
              totalLeads: 0,
              totalQuotations: 0,
              totalOrders: 0,
              totalDeals: 0,
              targetAmount: 0,
              achievedAmount: 0,
              targetAchievementPct: 0,
              receivables: 0,
              overdueAmount: 0
            };

            const initials = rep.fullName
              ? rep.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              : 'SR';

            const avatarBg = avatarColors[idx % avatarColors.length];

            return (
              <div key={rep._id} className="rep-card">
                <div className="rep-card-top">
                  <div className="rep-avatar-lg" style={{ backgroundColor: avatarBg }}>
                    {rep.profileImage ? (
                      <img src={rep.profileImage} alt={rep.fullName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="rep-header-info">
                    <div className="rep-name-row">
                      <h3 className="rep-name-lg">{rep.fullName}</h3>
                      <span className={`rep-status-badge ${rep.status === 'active' ? 'active' : 'inactive'}`}>
                        {rep.status === 'active' ? 'Active' : (rep.status === 'inactive' ? 'Inactive' : (rep.status || 'Active'))}
                      </span>
                    </div>
                    <span className="rep-role-lg">{rep.position || 'Sales Representative'} · {rep.department || 'Sales'}</span>
                  </div>
                </div>

                {/* Target Attainment Progress */}
                <div className="rep-quota-box">
                  <div className="quota-text-row">
                    <span>Monthly Target Attainment</span>
                    <span className="quota-percent">{stats.targetAchievementPct}%</span>
                  </div>
                  <div className="quota-progress-bar">
                    <div className="quota-fill" style={{ width: `${Math.min(100, stats.targetAchievementPct)}%` }} />
                  </div>
                  <div className="quota-sub">
                    Rs. {Number(stats.achievedAmount || 0).toLocaleString()} achieved / {stats.targetAmount > 0 ? `Rs. ${Number(stats.targetAmount).toLocaleString()}` : 'No Target Set'}
                  </div>
                </div>

                {/* Row 1: Counts (Leads, Quotations, Orders) */}
                <div className="rep-stats-row">
                  <div className="rep-stat-box">
                    <span className="stat-num">{stats.totalLeads}</span>
                    <span className="stat-lbl">Leads</span>
                  </div>
                  <div className="rep-stat-box">
                    <span className="stat-num">{stats.totalQuotations}</span>
                    <span className="stat-lbl">Quotations</span>
                  </div>
                  <div className="rep-stat-box">
                    <span className="stat-num">{stats.totalOrders}</span>
                    <span className="stat-lbl">Orders</span>
                  </div>
                </div>

                {/* Row 2: Financials (Overdue & Receivables) */}
                <div className="rep-financials-row">
                  <div className="rep-stat-box overdue-box">
                    <span className="stat-num overdue-val">Rs. {Number(stats.overdueAmount || 0).toLocaleString()}</span>
                    <span className="stat-lbl">Overdue</span>
                  </div>
                  <div className="rep-stat-box receivables-box">
                    <span className="stat-num receivables-val">Rs. {Number(stats.receivables || 0).toLocaleString()}</span>
                    <span className="stat-lbl">Receivables</span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="rep-contact-info-row">
                  {rep.email && (
                    <span className="rep-meta-txt" title={rep.email}><Mail size={13} /> {rep.email}</span>
                  )}
                  {rep.phone && (
                    <span className="rep-meta-txt"><Phone size={13} /> {rep.phone}</span>
                  )}
                </div>

                {/* Action Buttons: View, Edit, Delete, Assign Target (Required) */}
                <div className="rep-actions-footer">
                  <button
                    type="button"
                    className="rep-action-btn view-btn"
                    onClick={() => setSelectedMemberId(rep._id)}
                    title="View Detailed Member Profile & CRM Records"
                  >
                    <Eye size={14} /> View
                  </button>
                  <button
                    type="button"
                    className="rep-action-btn edit-btn"
                    onClick={() => openEditModal(rep)}
                    title="Edit Member Details"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    className="rep-action-btn target-btn"
                    onClick={() => openTargetModal(rep)}
                    title="Assign Monthly Target"
                  >
                    <Target size={14} /> Target
                  </button>
                  <button
                    type="button"
                    className="rep-action-btn delete-btn"
                    onClick={() => setDeletingMember(rep)}
                    title="Delete Team Member"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── EDIT MEMBER MODAL ── */}
      {editingMember && (
        <div className="sv-modal-overlay" onClick={() => setEditingMember(null)}>
          <div className="sv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3><Edit2 size={18} color="#2563EB" /> Edit Sales Team Member</h3>
              <button onClick={() => setEditingMember(null)}><X size={18} /></button>
            </div>
            {editError && <div className="sv-error">{editError}</div>}
            <form onSubmit={handleSaveEdit} className="sv-form">
              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Full Name *</label>
                  <input
                    value={editForm.fullName}
                    onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
                    required
                  />
                </div>
                <div className="sv-field">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Phone Number</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="sv-field">
                  <label>Position / Title</label>
                  <input
                    value={editForm.position}
                    onChange={(e) => setEditForm((p) => ({ ...p, position: e.target.value }))}
                    placeholder="e.g. Senior Sales Specialist"
                  />
                </div>
              </div>

              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Salary Target / Base (PKR / Rs.)</label>
                  <input
                    type="number"
                    value={editForm.salaryTarget}
                    onChange={(e) => setEditForm((p) => ({ ...p, salaryTarget: e.target.value }))}
                    placeholder="e.g. 65000"
                  />
                </div>
                <div className="sv-field">
                  <label>Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setEditingMember(null)}>
                  Cancel
                </button>
                <button type="submit" className="sv-btn-primary" disabled={savingEdit}>
                  <Save size={15} /> {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deletingMember && (
        <div className="sv-modal-overlay" onClick={() => setDeletingMember(null)}>
          <div className="sv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3 style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#DC2626" /> Confirm Member Removal
              </h3>
              <button onClick={() => setDeletingMember(null)}><X size={18} /></button>
            </div>
            {deleteError && <div className="sv-error">{deleteError}</div>}
            <p style={{ color: '#334155', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Are you sure you want to remove <strong>{deletingMember.fullName}</strong> ({deletingMember.email}) from the Sales Team?
            </p>
            <p style={{ color: '#64748B', fontSize: '0.8rem', background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              ℹ️ Historical CRM records (Leads, Quotations, Sales Orders, Invoices, and Deals) will remain fully preserved in MongoDB.
            </p>
            <div className="sv-modal-actions">
              <button type="button" className="sv-btn-cancel" onClick={() => setDeletingMember(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="sv-btn-primary"
                style={{ backgroundColor: '#DC2626' }}
                onClick={confirmDeleteMember}
                disabled={deleting}
              >
                <Trash2 size={15} /> {deleting ? 'Removing...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSIGN MONTHLY TARGET MODAL ── */}
      {targetMember && (
        <div className="sv-modal-overlay" onClick={() => setTargetMember(null)}>
          <div className="sv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3><Target size={18} color="#2563EB" /> Assign Monthly Target</h3>
              <button onClick={() => setTargetMember(null)}><X size={18} /></button>
            </div>
            {targetError && <div className="sv-error">{targetError}</div>}
            {targetSuccess && (
              <div style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                {targetSuccess}
              </div>
            )}
            <form onSubmit={handleAssignTarget} className="sv-form">
              <div className="sv-field">
                <label>Team Member</label>
                <input value={targetMember.fullName} disabled style={{ background: '#F1F5F9', fontWeight: 600 }} />
              </div>
              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Target Month / Period *</label>
                  <input
                    value={targetForm.period}
                    onChange={(e) => setTargetForm((p) => ({ ...p, period: e.target.value }))}
                    placeholder="e.g. October 2026"
                    required
                  />
                </div>
                <div className="sv-field">
                  <label>Target Amount (PKR) *</label>
                  <input
                    type="number"
                    value={targetForm.targetAmount}
                    onChange={(e) => setTargetForm((p) => ({ ...p, targetAmount: e.target.value }))}
                    placeholder="e.g. 500000"
                    required
                    min="1"
                  />
                </div>
              </div>
              <div className="sv-field">
                <label>Target Notes / Details (Optional)</label>
                <textarea
                  rows={3}
                  value={targetForm.notes}
                  onChange={(e) => setTargetForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Specific focus areas, incentives, key accounts..."
                />
              </div>
              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setTargetMember(null)}>
                  Cancel
                </button>
                <button type="submit" className="sv-btn-primary" disabled={savingTarget}>
                  <CheckCircle size={15} /> {savingTarget ? 'Assigning...' : 'Assign Target in MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── INVITE NEW SALES TEAM MEMBER MODAL ── */}
      {showInviteModal && (
        <div className="sv-modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="sv-modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3><Plus size={18} color="#2563EB" /> Invite New Sales Team Member</h3>
              <button onClick={() => setShowInviteModal(false)}><X size={18} /></button>
            </div>
            {inviteError && <div className="sv-error">{inviteError}</div>}
            {inviteSuccess && (
              <div style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '12px' }}>
                ✓ {inviteSuccess}
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
                    onChange={(e) => setInviteForm((p) => ({ ...p, fullName: e.target.value }))}
                    required
                  />
                </div>
                <div className="sv-field">
                  <label>Email Address (Login ID) *</label>
                  <input
                    type="email"
                    placeholder="e.g. tariq@company.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
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
                    onChange={(e) => setInviteForm((p) => ({ ...p, password: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>
                <div className="sv-field">
                  <label>Phone Number</label>
                  <input
                    placeholder="+92 300 1234567"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="sv-grid-2">
                <div className="sv-field">
                  <label>Role / Position</label>
                  <input
                    placeholder="Sales Representative"
                    value={inviteForm.position}
                    onChange={(e) => setInviteForm((p) => ({ ...p, position: e.target.value }))}
                  />
                </div>
                <div className="sv-field">
                  <label>Monthly Target (PKR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    value={inviteForm.target}
                    onChange={(e) => setInviteForm((p) => ({ ...p, target: e.target.value }))}
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
