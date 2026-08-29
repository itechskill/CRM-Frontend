import React, { useState, useRef, useEffect } from 'react';
import { User, ShieldCheck, UserX, Search, Plus, MoreHorizontal, Trash2, Pencil, Eye, KeyRound, X } from 'lucide-react';
import { apiRequest } from '../utils/api';
import EmployeeDirectoryModal from '../components/EmployeeDirectoryModal';
import './UsersView.css';

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'CEO', value: 'ceo' },
  { label: 'Administration', value: 'administration' },
  { label: 'HR Manager', value: 'hr_manager' },
  { label: 'Sales Manager', value: 'sales_manager' },
  { label: 'Project Manager', value: 'project_manager' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Accountant', value: 'accountant' },
  { label: 'Employee', value: 'employee' }
];

const departmentOptions = [
  'Executive Administration',
  'Executive Leadership',
  'Operations Management',
  'Human Resources',
  'Sales & Business',
  'Software Engineering',
  'Growth Marketing',
  'Finance & Accounting',
  'Product Design',
  'Data Analytics',
  'Quality Assurance',
  'DevOps & Cloud',
  'Customer Success'
];

function EditUserModal({ user, onClose, onSave }) {
  const [role, setRole] = useState(user.role || 'employee');
  const [department, setDepartment] = useState(user.department || '');
  const [status, setStatus] = useState(user.status === 'Active' || user.status === 'active' ? 'active' : 'suspended');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      // Role Update
      if (role !== user.role) {
        const rRes = await apiRequest(`/api/admin/users/${user.rawId || user.id}/role`, {
          method: 'PATCH',
          body: JSON.stringify({ role })
        });
        if (!rRes.response.ok || !rRes.data.success) {
          setErrorMsg(rRes.data.message || 'Failed to update role.');
          setSaving(false);
          return;
        }
      }

      // Department Update
      if (department !== user.department) {
        await apiRequest(`/api/admin/users/${user.rawId || user.id}/department`, {
          method: 'PATCH',
          body: JSON.stringify({ department })
        });
      }

      // Status Update
      const oldStatusNorm = user.status === 'Active' || user.status === 'active' ? 'active' : 'suspended';
      if (status !== oldStatusNorm) {
        await apiRequest(`/api/admin/users/${user.rawId || user.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });
      }

      // Password Update if provided
      if (newPassword) {
        const pRes = await apiRequest(`/api/admin/users/${user.rawId || user.id}/password`, {
          method: 'PATCH',
          body: JSON.stringify({ newPassword, confirmPassword })
        });
        if (!pRes.response.ok || !pRes.data.success) {
          setErrorMsg(pRes.data.message || 'Failed to update password.');
          setSaving(false);
          return;
        }
      }

      onSave();
      onClose();
    } catch (err) {
      setErrorMsg('Error updating user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit User & Access Control</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', fontSize: '0.84rem' }}>
                {errorMsg}
              </div>
            )}

            <div className="edit-user-identity">
              <span className="edit-user-avatar" style={{ background: user.avatarBg }}>
                {user.initials}
              </span>
              <div>
                <h4>{user.name}</h4>
                <span>{user.email}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Department</label>
              <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">-- Select Department --</option>
                {departmentOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Account Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#0F172A' }}>Reset Password (Optional)</h4>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 8 chars, upper, lower, number, special"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              {newPassword && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersView({ onOpenInviteModal }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const menuRef = useRef(null);

  const avatarColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0EA5E9', '#EF4444', '#7C3AED'];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/admin/directory');
      if (response.ok && data.success && Array.isArray(data.data)) {
        setUsers(data.data.map((u, idx) => ({
          id: u._id,
          rawId: u._id,
          name: u.fullName,
          email: u.email,
          initials: (u.fullName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          avatarBg: avatarColors[idx % avatarColors.length],
          role: u.role,
          department: u.department || 'General',
          status: u.status === 'active' || u.status === 'Active' ? 'Active' : 'Inactive',
          lastActive: 'Just now',
          joined: new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        })));
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (userId, userName) => {
    const confirmed = window.confirm(`Are you sure you want to delete user account for ${userName}?`);
    if (!confirmed) return;

    try {
      const { response, data } = await apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (response.ok && data.success) {
        setUsers(prev => prev.filter(user => user.id !== userId));
        setOpenMenuId(null);
      } else {
        alert(data.message || 'Could not delete user.');
      }
    } catch (err) {
      alert('Error deleting user.');
    }
  };

  const activeCount = users.filter(u => u.status === 'Active').length;
  const inactiveCount = users.filter(u => u.status !== 'Active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 3 Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div className="stat-card" style={{
          backgroundColor: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <User size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{users.length}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Total Registered Users</div>
          </div>
        </div>

        <div className="stat-card" style={{
          backgroundColor: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            backgroundColor: '#DCFCE7',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{activeCount}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Active Accounts</div>
          </div>
        </div>

        <div className="stat-card" style={{
          backgroundColor: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            backgroundColor: '#FEE2E2',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <UserX size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{inactiveCount}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Inactive / Suspended</div>
          </div>
        </div>
      </div>

      {/* Users Data Table Section */}
      <div className="data-table-container">
        <div className="table-header-toolbar" style={{ padding: '20px 24px' }}>
          <div className="global-search" style={{ width: '280px' }}>
            <Search size={16} className="global-search-icon" />
            <input
              type="text"
              placeholder="Search directory by name, role, dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={onOpenInviteModal}>
            <Plus size={16} /> Invite / Add User
          </button>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: '24px' }}>User</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Joined</th>
              <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td style={{ paddingLeft: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: user.avatarBg,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {user.initials}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{user.name}</span>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#475569', fontWeight: 600, fontSize: '0.85rem' }}>
                    <span style={{ textTransform: 'capitalize' }}>{user.role.replace('_', ' ')}</span>
                  </td>
                  <td>
                    <span style={{
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'inline-block'
                    }}>
                      {user.department}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      backgroundColor: user.status === 'Active' ? '#DCFCE7' : '#FEF3C7',
                      color: user.status === 'Active' ? '#15803D' : '#B45309',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: user.status === 'Active' ? '#16A34A' : '#D97706'
                      }}></span>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ color: '#64748B', fontSize: '0.85rem' }}>{user.joined}</td>
                  <td style={{ textAlign: 'right', paddingRight: '24px', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        className="icon-btn"
                        title="View Profile"
                        style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer', background: 'white' }}
                        onClick={() => setViewingProfileId(user.id)}
                      >
                        <Eye size={14} /> Profile
                      </button>

                      <button
                        className="icon-btn"
                        style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                      >
                        <MoreHorizontal size={16} color="#94A3B8" />
                      </button>

                      {openMenuId === user.id && (
                        <div
                          className="row-menu"
                          ref={menuRef}
                          style={{ position: 'absolute', right: '24px', top: '100%', zIndex: 100, background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '6px' }}
                        >
                          <button
                            className="row-menu-item"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                            onClick={() => {
                              setEditingUser(user);
                              setOpenMenuId(null);
                            }}
                          >
                            <Pencil size={14} /> Edit Role / Details
                          </button>
                          <button
                            className="row-menu-item row-menu-item-danger"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#EF4444' }}
                            onClick={() => handleDelete(user.id, user.name)}
                          >
                            <Trash2 size={14} /> Delete Account
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                  {loading ? 'Loading database users...' : `No users found matching "${searchTerm}".`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={fetchUsers}
        />
      )}

      {viewingProfileId && (
        <EmployeeDirectoryModal
          userId={viewingProfileId}
          onClose={() => setViewingProfileId(null)}
        />
      )}
    </div>
  );
}