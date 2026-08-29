import React, { useState, useRef, useEffect } from 'react';
import { User, ShieldCheck, UserX, Search, Plus, MoreHorizontal, Trash2, Pencil, X } from 'lucide-react';
import './UsersView.css';

const initialUsersData = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@nexus.io',
    initials: 'SM',
    avatarBg: '#2563EB',
    role: 'Sales Manager',
    department: 'Sales',
    deptTheme: 'blue',
    status: 'Active',
    lastActive: 'Just now',
    joined: 'Jan 12, 2023'
  },
  {
    id: 2,
    name: 'Daniel Torres',
    email: 'd.torres@nexus.io',
    initials: 'DT',
    avatarBg: '#10B981',
    role: 'Project Lead',
    department: 'Operations',
    deptTheme: 'green',
    status: 'Active',
    lastActive: '5m ago',
    joined: 'Mar 4, 2022'
  },
  {
    id: 3,
    name: 'Aisha Nkosi',
    email: 'aisha.n@nexus.io',
    initials: 'AN',
    avatarBg: '#F59E0B',
    role: 'Account Executive',
    department: 'Sales',
    deptTheme: 'blue',
    status: 'Active',
    lastActive: '1h ago',
    joined: 'Jun 18, 2023'
  },
  {
    id: 4,
    name: 'Liam Chen',
    email: 'liam.chen@nexus.io',
    initials: 'LC',
    avatarBg: '#8B5CF6',
    role: 'Lead Architect',
    department: 'Engineering',
    deptTheme: 'purple',
    status: 'Active',
    lastActive: '2h ago',
    joined: 'Nov 09, 2021'
  },
  {
    id: 5,
    name: 'Elena Rostova',
    email: 'e.rostova@nexus.io',
    initials: 'ER',
    avatarBg: '#EC4899',
    role: 'Product Designer',
    department: 'Product',
    deptTheme: 'amber',
    status: 'Inactive',
    lastActive: '3d ago',
    joined: 'Feb 21, 2024'
  },
  {
    id: 6,
    name: 'Marcus Vance',
    email: 'marcus.v@nexus.io',
    initials: 'MV',
    avatarBg: '#64748B',
    role: 'Security Analyst',
    department: 'Security',
    deptTheme: 'green',
    status: 'Active',
    lastActive: '15m ago',
    joined: 'Aug 14, 2022'
  }
];

const roleOptions = [
  'Sales Manager', 'Account Executive', 'Project Lead', 'Lead Architect',
  'Product Designer', 'Security Analyst', 'Engineer', 'Admin'
];
const departmentOptions = ['Sales', 'Operations', 'Engineering', 'Product', 'Security'];
const statusOptions = ['Active', 'Inactive'];

function EditUserModal({ user, onClose, onSave }) {
  const [role, setRole] = useState(user.role);
  const [department, setDepartment] = useState(user.department);
  const [status, setStatus] = useState(user.status);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user.id, { role, department, status });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit User</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Department</label>
              <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                {departmentOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersView({ usersList = initialUsersData, onOpenInviteModal, onDeleteUser }) {
  const [users, setUsers] = useState(usersList);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const menuRef = useRef(null);

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

  const handleDelete = (userId) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (!confirmed) return;

    setUsers(prev => prev.filter(user => user.id !== userId));
    setOpenMenuId(null);

    if (onDeleteUser) onDeleteUser(userId);
  };

  const handleSaveEdit = (userId, updates) => {
    setUsers(prev =>
      prev.map(user => (user.id === userId ? { ...user, ...updates } : user))
    );
  };

  const getDeptBadgeStyle = (dept) => {
    switch (dept.toLowerCase()) {
      case 'sales':
        return { backgroundColor: '#EFF6FF', color: '#2563EB' };
      case 'operations':
        return { backgroundColor: '#DCFCE7', color: '#16A34A' };
      case 'engineering':
        return { backgroundColor: '#F3E8FF', color: '#7C3AED' };
      case 'product':
        return { backgroundColor: '#FEF3C7', color: '#D97706' };
      default:
        return { backgroundColor: '#F1F5F9', color: '#475569' };
    }
  };

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
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>3,847</div>
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Total Users</div>
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
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>3,521</div>
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Active Users</div>
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
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>326</div>
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Inactive / Pending</div>
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={onOpenInviteModal}>
            <Plus size={16} /> Invite User
          </button>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: '24px' }}>User</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Joined</th>
              <th style={{ textAlign: 'right', paddingRight: '24px' }}></th>
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
                  <td style={{ color: '#475569', fontWeight: 500, fontSize: '0.875rem' }}>{user.role}</td>
                  <td>
                    <span style={{
                      ...getDeptBadgeStyle(user.department),
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
                  <td style={{ color: '#64748B', fontSize: '0.85rem' }}>{user.lastActive}</td>
                  <td style={{ color: '#64748B', fontSize: '0.85rem' }}>{user.joined}</td>
                  <td style={{ textAlign: 'right', paddingRight: '24px', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <button
                        className="icon-btn"
                        style={{ width: '32px', height: '32px', border: 'none', background: 'transparent' }}
                        onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                      >
                        <MoreHorizontal size={16} color="#94A3B8" />
                      </button>
                 {openMenuId === user.id && (
                    <div
                  className={`row-menu ${filteredUsers.indexOf(user) === filteredUsers.length - 1 ? 'row-menu-up' : ''}`}
                 ref={menuRef}
                    >
                          <button
                            className="row-menu-item"
                            onClick={() => {
                              setEditingUser(user);
                              setOpenMenuId(null);
                            }}
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            className="row-menu-item row-menu-item-danger"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                  No users found matching "{searchTerm}".
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
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}