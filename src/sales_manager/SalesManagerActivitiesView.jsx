import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiRequest } from '../utils/api';
import { Activity, Search, User, Filter, Calendar, Clock } from 'lucide-react';
import './SalesManagerDashboard.css';

const TYPE_BADGES = {
  'Lead Created': { bg: '#EFF6FF', color: '#1D4ED8' },
  'Deal Updated': { bg: '#F5F3FF', color: '#7C3AED' },
  'Quotation Created': { bg: '#FEF3C7', color: '#B45309' },
  'Customer PO Uploaded': { bg: '#ECFDF5', color: '#047857' },
  'Product File Created': { bg: '#EFF6FF', color: '#2563EB' },
  'Order Created': { bg: '#ECFDF5', color: '#059669' },
  'Delivery Note Created': { bg: '#F5F3FF', color: '#6D28D9' },
  'Delivery Completed': { bg: '#ECFDF5', color: '#047857' },
  'Payment Recorded': { bg: '#ECFDF5', color: '#065F46' },
  'Invoice Created': { bg: '#FEF2F2', color: '#B91C1C' },
  'Invoice Updated': { bg: '#FFFBEB', color: '#D97706' },
  'Follow-up Created': { bg: '#F1F5F9', color: '#475569' }
};

export default function SalesManagerActivitiesView() {
  const [activities, setActivities] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [actRes, tmRes] = await Promise.all([
        apiRequest('/api/sales-manager/all-activities'),
        apiRequest('/api/sales-manager/team-members')
      ]);
      if (actRes.response.ok && actRes.data.success) setActivities(actRes.data.data);
      if (tmRes.response.ok && tmRes.data.success) setTeamMembers(tmRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchesMember = selectedMember === 'all' || (a.performedBy?._id === selectedMember || a.performedBy === selectedMember);
      const matchesType = typeFilter === 'all' || a.type === typeFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        (a.description && a.description.toLowerCase().includes(term)) ||
        (a.type && a.type.toLowerCase().includes(term)) ||
        (a.relatedCustomer && a.relatedCustomer.toLowerCase().includes(term)) ||
        (a.salesMemberName && a.salesMemberName.toLowerCase().includes(term));
      return matchesMember && matchesType && matchesSearch;
    });
  }, [activities, selectedMember, typeFilter, searchTerm]);

  return (
    <div className="smd-section-container" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={24} color="#8B5CF6" /> Live Sales Team Activities
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.85rem' }}>
            Real-time chronological timeline of all sales actions, quotes, customer POs, and payments across the department
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search activity description, customer, member..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.875rem' }}
          />
        </div>

        <select
          value={selectedMember}
          onChange={e => setSelectedMember(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', fontSize: '0.875rem' }}
        >
          <option value="all">All Sales Members</option>
          {teamMembers.map(m => (
            <option key={m._id} value={m._id}>{m.fullName || m.email}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFF', fontSize: '0.875rem' }}
        >
          <option value="all">All Activity Types</option>
          <option value="Lead Created">Lead Created</option>
          <option value="Deal Updated">Deal Updated</option>
          <option value="Quotation Created">Quotation Created</option>
          <option value="Customer PO Uploaded">Customer PO Uploaded</option>
          <option value="Product File Created">Product File Created</option>
          <option value="Order Created">Order Created</option>
          <option value="Delivery Note Created">Delivery Note</option>
          <option value="Payment Recorded">Payment Recorded</option>
          <option value="Invoice Created">Invoice Created</option>
          <option value="Follow-up Created">Follow-up</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading activity feed...</div>
      ) : (
        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {filteredActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
              No activities found for the selected filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredActivities.map(act => {
                const badge = TYPE_BADGES[act.type] || { bg: '#F1F5F9', color: '#475569' };
                const member = act.performedBy?.fullName || act.salesMemberName || 'Sales Member';
                const initials = member.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                return (
                  <div
                    key={act._id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '14px',
                      borderRadius: '10px',
                      background: '#F8FAFC',
                      border: '1px solid #F1F5F9'
                    }}
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: '#E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: '#475569',
                      flexShrink: 0
                    }}>
                      {initials}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{member}</span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.color
                          }}>
                            {act.type}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#334155', lineHeight: 1.4 }}>
                        {act.description}
                      </p>

                      {act.relatedCustomer && (
                        <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#64748B' }}>
                          Customer: <strong>{act.relatedCustomer}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
