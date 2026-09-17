import React, { useState, useEffect } from 'react';
import {
  Mail, Calendar, BadgeCheck, Pencil, TrendingUp, Award, Clock, Star, Phone,
  Building, Briefcase, X, AlertCircle, Target, Users, FileText, ShoppingCart,
  CreditCard, CheckCircle2, DollarSign, ArrowUpRight, BarChart3, ShieldCheck
} from 'lucide-react';
import './EmployeeProfileView.css';
import { getToken, getUser, setUser } from '../utils/authStorage';
import { API_BASE, authHeaders, apiRequest } from '../utils/api';

export default function EmployeeProfileView({ onUpdateCurrentUser }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const fetchProfileAndStats = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        apiRequest('/api/users/me'),
        apiRequest('/api/sales-employee/stats')
      ]);

      if (pRes.response.ok && pRes.data.success) {
        setProfile(pRes.data.data);
        setFullName(pRes.data.data.fullName || '');
        setPhone(pRes.data.data.phone || '');
        setProfileImage(pRes.data.data.profileImage || '');
      }
      if (sRes.response.ok && sRes.data.success) {
        setStats(sRes.data.data);
      }
    } catch (err) {
      console.error('Fetch profile & stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAlert({ type: 'error', text: 'Image file size must be less than 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    try {
      const { response, data } = await apiRequest('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          profileImage: profileImage
        })
      });

      if (response.ok && data.success) {
        setProfile(data.data);
        setAlert({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditModalOpen(false);
        const savedUser = getUser();
        if (savedUser) {
          const updated = { ...savedUser, ...data.data };
          setUser(updated);
          if (onUpdateCurrentUser) onUpdateCurrentUser(updated);
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

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
        <p>Loading performance profile...</p>
      </div>
    );
  }

  const isSalesRole = (profile?.department || '').toLowerCase() === 'sales' ||
    profile?.role === 'sales_member' ||
    profile?.role === 'sales_rep' ||
    profile?.role === 'sales_person' ||
    profile?.role === 'sales_manager';

  const monthlyTarget = Number(stats?.monthlyTarget || 0);
  const salesAchieved = Number(stats?.salesAchieved || 0);
  const remainingTarget = Math.max(0, monthlyTarget - salesAchieved);
  const targetPct = monthlyTarget > 0 ? Math.min(100, Math.round((salesAchieved / monthlyTarget) * 100)) : 0;

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
          <div className="profile-hero-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {profile?.profileImage ? (
              <img src={profile.profileImage} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(profile?.fullName)
            )}
          </div>

          <div className="profile-hero-info">
            <h2>{profile?.fullName || 'User Profile'}</h2>
            <p>
              {profile?.position || (profile?.role ? profile.role.replace(/_/g, ' ').toUpperCase() : 'Employee')} · {profile?.department || 'Fortline Operations'}
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

      {/* Target & Quota Section (Real DB metrics in PKR) */}
      {isSalesRole && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '22px 24px',
          border: '1px solid #E2E8F0',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={20} color="#2563EB" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A', fontWeight: 800 }}>Sales Target &amp; Quota Performance</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>Assigned monthly target tracked against finalized sales value</p>
              </div>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563EB' }}>
              {targetPct}% Achieved
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '10px', background: '#F1F5F9', borderRadius: '5px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{
              width: `${targetPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #2563EB 0%, #10B981 100%)',
              borderRadius: '5px',
              transition: 'width 0.6s ease'
            }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Assigned Target</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
                Rs. {monthlyTarget.toLocaleString()}
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: '#ECFDF5', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Sales Achieved</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                Rs. {salesAchieved.toLocaleString()}
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase' }}>Remaining Target</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>
                Rs. {remainingTarget.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Performance Statistics Grid (Driven strictly from MongoDB) */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} color="#2563EB" /> Actual Operational Statistics
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', borderLeft: '4px solid #2563EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Leads</span>
              <Users size={16} color="#2563EB" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
              {stats?.totalLeads ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
              {stats?.convertedLeads ?? 0} converted ({stats?.leadConversionRate ?? 0}%)
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', borderLeft: '4px solid #059669' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Quotations</span>
              <FileText size={16} color="#059669" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
              {stats?.totalQuotations ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
              {stats?.acceptedQuotations ?? 0} accepted by client
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', borderLeft: '4px solid #6366F1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sales Orders</span>
              <ShoppingCart size={16} color="#6366F1" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
              {stats?.totalOrders ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
              {stats?.completedOrders ?? 0} completed deliveries
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', borderLeft: '4px solid #D97706' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Deals Closed</span>
              <TrendingUp size={16} color="#D97706" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
              {stats?.wonDealsCount ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
              {stats?.totalDeals ?? 0} total in pipeline
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', borderLeft: '4px solid #0891B2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Invoices</span>
              <FileText size={16} color="#0891B2" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
              {stats?.totalInvoicesCount ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
              {stats?.approvedInvoicesCount ?? 0} approved / finalized
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', borderLeft: '4px solid #10B981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Paid Realization</span>
              <DollarSign size={16} color="#10B981" />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
              Rs. {Number(stats?.paidInvoicesAmount || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
              Cash inflows settled
            </div>
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
                  placeholder="+92 300 0000000"
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  style={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#FFF',
                    padding: '8px',
                    fontSize: '0.85rem'
                  }}
                />
                {profileImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <img src={profileImage} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3B82F6' }} />
                    <span style={{ fontSize: '0.75rem', color: '#10B981' }}>Picture ready to save</span>
                    <button
                      type="button"
                      onClick={() => setProfileImage('')}
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer', marginLeft: 'auto' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
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
