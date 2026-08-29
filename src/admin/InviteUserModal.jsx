import React, { useState } from 'react';
import { X } from 'lucide-react';
import './InviteUserModal.css';

export default function InviteUserModal({ isOpen, onClose, onInviteUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Account Executive');
  const [department, setDepartment] = useState('Sales');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    const names = name.trim().split(' ');
    const initials = names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : names[0].slice(0, 2).toUpperCase();
    const colors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    const avatarBg = colors[Math.floor(Math.random() * colors.length)];

    onInviteUser({
      id: Date.now(),
      name,
      email,
      initials,
      avatarBg,
      role,
      department,
      status: 'Active',
      lastActive: 'Just now',
      joined: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });

    setName('');
    setEmail('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Invite New User</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Full Name</label>
              <input 
                className="form-input" 
                placeholder="e.g. Alex Rivera" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Work Email Address</label>
              <input 
                type="email"
                className="form-input" 
                placeholder="alex.rivera@nexus.io" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <input 
                className="form-input" 
                placeholder="e.g. Sales Specialist" 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Department</label>
              <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Security">Security</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
