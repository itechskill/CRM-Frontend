import React, { useState, useEffect } from 'react';
import { Mail, Calendar, BadgeCheck, Pencil, TrendingUp, Award, Clock, Star, Phone, Building, Briefcase, X, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import './EmployeeProfileView.css';
import { getToken, getUser, setUser } from '../utils/authStorage';
import { API_BASE } from '../utils/api';

const statCards = [
  { label: 'Active Projects', value: '4', icon: TrendingUp, iconBg: '#EFF6FF', iconColor: '#2563EB' },
  { label: 'Tasks Completed', value: '6', icon: Award, iconBg: '#DCFCE7', iconColor: '#16A34A' },
  { label: 'Hours This Month', value: '154h', icon: Clock, iconBg: '#F3E8FF', iconColor: '#8B5CF6' },
  { label: 'Performance Score', value: '94%', icon: Star, iconBg: '#FEF9C3', iconColor: '#CA8A04' },
];

const monthlyPerformanceData = [
  { month: 'Jan', score: 86 },
  { month: 'Feb', score: 90 },
  { month: 'Mar', score: 84 },
  { month: 'Apr', score: 95 },
  { month: 'May', score: 88 },
  { month: 'Jun', score: 94 },
];

const skillProficiency = [
  { skill: 'React / TypeScript', value: 95, color: '#16A34A' },
  { skill: 'UI/UX Design', value: 82, color: '#2563EB' },
  { skill: 'API Integration', value: 78, color: '#F59E0B' },
  { skill: 'Testing (Jest, Cypress)', value: 74, color: '#F59E0B' },
];

export default function EmployeeProfileView() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setProfile(data.data);
        setFullName(data.data.fullName || '');
        setPhone(data.data.phone || '');
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim()
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setProfile(data.data);
        setAlert({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditModalOpen(false);
        // Also update local storage current user if present
        const savedUser = getUser();
        if (savedUser && savedUser._id === data.data._id) {
          setUser({ ...savedUser, ...data.data });
        }
      } else {
        setAlert({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (err) {
      console.error('Save profile error:', err);
      setAlert({ type: 'error', text: 'Server error updating profile.' });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'US';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="employee-profile-container">
      {alert && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: alert.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${alert.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: alert.type === 'success' ? '#6EE7B7' : '#FCA5A5',
          marginBottom: '16px'
        }}>
          {alert.text}
        </div>
      )}

      {/* Hero Banner Card */}
      <div className="profile-hero-card">
        <div className="profile-hero-banner"></div>
        <div className="profile-hero-body">
          <div className="profile-hero-avatar">{getInitials(profile?.fullName)}</div>

          <div className="profile-hero-info">
            <h2>{profile?.fullName || 'User Profile'}</h2>
            <p style={{ textTransform: 'capitalize' }}>
              {profile?.role ? profile.role.replace('_', ' ') : 'Employee'} · {profile?.department || 'General'}
            </p>
            <div className="profile-hero-meta">
              <span><Mail size={14} /> {profile?.email}</span>
              <span><Phone size={14} /> {profile?.phone || 'N/A'}</span>
              <span><Calendar size={14} /> Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</span>
              <span><BadgeCheck size={14} /> Employee ID: {profile?.employeeId || 'N/A'}</span>
            </div>
          </div>

          <button className="edit-profile-btn" onClick={() => setIsEditModalOpen(true)}>
            <Pencil size={15} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="profile-stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="profile-stat-card" key={card.label}>
              <div className="profile-stat-top">
                <div className="profile-stat-icon" style={{ backgroundColor: card.iconBg, color: card.iconColor }}>
                  <Icon size={20} />
                </div>
                <span className="profile-stat-label">{card.label}</span>
              </div>
              <div className="profile-stat-value">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Bottom Row: Chart + Skill Proficiency */}
      <div className="profile-bottom-grid">
        <div className="profile-chart-card">
          <div className="profile-chart-header">
            <h3>Monthly Performance Score</h3>
            <p>Averaged from task quality, timeliness, and feedback</p>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPerformanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis
                  domain={[78, 100]}
                  ticks={[78, 86, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="score" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={48} name="Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="skill-proficiency-card">
          <h3>Skill Proficiency</h3>
          <div className="skill-list">
            {skillProficiency.map((skill) => (
              <div className="skill-row" key={skill.skill}>
                <div className="skill-row-top">
                  <span className="skill-name">{skill.skill}</span>
                  <span className="skill-percent" style={{ color: skill.color }}>{skill.value}%</span>
                </div>
                <div className="skill-track">
                  <div className="skill-fill" style={{ width: `${skill.value}%`, backgroundColor: skill.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="reg-modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="reg-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', backgroundColor: '#1E293B', color: '#FFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Edit Personal Profile</h3>
              <X size={18} style={{ cursor: 'pointer', color: '#94A3B8' }} onClick={() => setIsEditModalOpen(false)} />
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#FFF',
                    padding: '10px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 234 567 890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#FFF',
                    padding: '10px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ fontSize: '0.75rem', color: '#94A3B8', backgroundColor: '#0F172A', padding: '10px', borderRadius: '6px' }}>
                Note: Role, Account Status, and Employee ID can only be modified by System Administration.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="reg-btn-view" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="reg-btn-approve" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
