import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  User,
  Users,
  FileText,
  ShoppingCart,
  Truck,
  PhoneCall,
  Target,
  ClipboardList,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  X,
  Save,
  Check
} from 'lucide-react';
import './SalesTeamMemberProfileView.css';

export default function SalesTeamMemberProfileView({ memberId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leads');
  const [error, setError] = useState('');

  // Target Modal State
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetForm, setTargetForm] = useState({
    period: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    periodType: 'Monthly',
    targetAmount: '',
    currency: 'USD',
    notes: ''
  });
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetError, setTargetError] = useState('');

  // Edit Member Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    position: '',
    salaryTarget: '',
    phone: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { response, data: resData } = await apiRequest(`/api/sales-manager/team-members/${memberId}/profile`);
      if (response.ok && resData.success) {
        setData(resData.data);
      } else {
        setError(resData.message || 'Failed to load member profile.');
      }
    } catch (err) {
      setError('Server error loading profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memberId) fetchProfile();
  }, [memberId]);

  const handleAssignTarget = async (e) => {
    e.preventDefault();
    if (!targetForm.targetAmount || Number(targetForm.targetAmount) <= 0) {
      setTargetError('Please enter a valid target amount.');
      return;
    }
    setSavingTarget(true);
    setTargetError('');
    try {
      const payload = {
        employeeId: memberId,
        period: targetForm.period,
        periodType: targetForm.periodType,
        targetAmount: Number(targetForm.targetAmount),
        currency: targetForm.currency,
        notes: targetForm.notes
      };
      const { response, data: resData } = await apiRequest('/api/sales-manager/targets', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (response.ok && resData.success) {
        setShowTargetModal(false);
        fetchProfile();
      } else {
        setTargetError(resData.message || 'Failed to assign target.');
      }
    } catch (e) {
      setTargetError('Server error assigning target.');
    } finally {
      setSavingTarget(false);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const { response, data: resData } = await apiRequest(`/api/sales-manager/team-members/${memberId}/details`, {
        method: 'PATCH',
        body: JSON.stringify(editForm)
      });
      if (response.ok && resData.success) {
        setShowEditModal(false);
        fetchProfile();
      }
    } catch (e) {
      console.error('Update details error:', e);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteTarget = async (targetId) => {
    if (!window.confirm('Delete this sales target?')) return;
    try {
      await apiRequest(`/api/sales-manager/targets/${targetId}`, { method: 'DELETE' });
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="stmp-loading">
        <div className="stmp-spinner" />
        <span>Loading Sales Team Member profile & MongoDB records...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="stmp-container">
        <button className="stmp-back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Team Members
        </button>
        <div className="stmp-error-box">
          <AlertCircle size={24} color="#EF4444" />
          <p>{error || 'Member profile not found.'}</p>
        </div>
      </div>
    );
  }

  const {
    employee,
    performance,
    leads = [],
    deals = [],
    quotations = [],
    orders = [],
    invoices = [],
    deliveryNotes = [],
    followUps = [],
    targets = [],
    activities = []
  } = data;

  const tabs = [
    { id: 'leads', label: 'Leads', count: leads.length, icon: Users },
    { id: 'deals', label: 'Deals Pipeline', count: deals.length, icon: TrendingUp },
    { id: 'quotations', label: 'Quotations', count: quotations.length, icon: FileText },
    { id: 'orders', label: 'Sales Orders', count: orders.length, icon: ShoppingCart },
    { id: 'invoices', label: 'Invoices', count: invoices.length, icon: DollarSign },
    { id: 'targets', label: 'Targets & Quotas', count: targets.length, icon: Target },
    { id: 'followups', label: 'Follow-ups', count: followUps.length, icon: PhoneCall },
    { id: 'delivery', label: 'Delivery Notes', count: deliveryNotes.length, icon: Truck },
    { id: 'financials', label: 'Financial Summary', count: null, icon: DollarSign },
    { id: 'activities', label: 'Activity Feed', count: activities.length, icon: ClipboardList }
  ];

  const initials = employee.fullName
    ? employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SR';

  return (
    <div className="stmp-container">
      {/* Top Header & Navigation */}
      <div className="stmp-header">
        <button className="stmp-back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Sales Team
        </button>
        <div className="stmp-header-actions">
          <button
            className="sv-btn-cancel"
            onClick={() => {
              setEditForm({
                position: employee.position || '',
                salaryTarget: employee.salaryTarget || '',
                phone: employee.phone || ''
              });
              setShowEditModal(true);
            }}
          >
            <Edit2 size={14} /> Edit Member
          </button>
          <button
            className="sv-btn-primary"
            onClick={() => {
              setTargetForm({
                period: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                periodType: 'Monthly',
                targetAmount: performance.monthlyTarget || '',
                currency: 'USD',
                notes: ''
              });
              setShowTargetModal(true);
            }}
          >
            <Target size={15} /> Assign Monthly Target
          </button>
        </div>
      </div>

      {/* Employee Profile Header Card */}
      <div className="stmp-profile-card">
        <div className="stmp-avatar-box">
          {employee.profileImage ? (
            <img src={employee.profileImage} alt={employee.fullName} />
          ) : (
            <div className="stmp-avatar-initials">{initials}</div>
          )}
        </div>
        <div className="stmp-profile-info">
          <div className="stmp-name-row">
            <h2 className="stmp-name">{employee.fullName}</h2>
            <span className={`stmp-badge-active ${employee.status === 'active' ? 'active' : ''}`}>
              {employee.status || 'Active'}
            </span>
          </div>
          <p className="stmp-title-line">
            <Briefcase size={14} /> {employee.position || 'Sales Representative'} · {employee.department || 'Sales'} Department
          </p>
          <div className="stmp-meta-grid">
            <div className="stmp-meta-item">
              <Mail size={14} />
              <a href={`mailto:${employee.email}`}>{employee.email}</a>
            </div>
            <div className="stmp-meta-item">
              <Phone size={14} />
              <span>{employee.phone || 'No phone provided'}</span>
            </div>
            <div className="stmp-meta-item">
              <Calendar size={14} />
              <span>Joined {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SALES & FINANCIAL PERFORMANCE KPI GRID ── */}
      <div className="stmp-kpi-section">
        <h3 className="stmp-section-title">Sales Performance & Financial Metrics</h3>
        <div className="stmp-kpi-grid">
          <div className="stmp-kpi-card">
            <span className="stmp-kpi-lbl">Total Leads</span>
            <span className="stmp-kpi-val">{performance.totalLeads}</span>
            <span className="stmp-kpi-sub positive">{performance.convertedLeads} Converted ({performance.pendingLeads} Pending)</span>
          </div>

          <div className="stmp-kpi-card">
            <span className="stmp-kpi-lbl">Won Deals</span>
            <span className="stmp-kpi-val" style={{ color: '#059669' }}>{performance.wonDealsCount || 0}</span>
            <span className="stmp-kpi-sub">${Number(performance.wonDealsValue || 0).toLocaleString()} volume</span>
          </div>

          <div className="stmp-kpi-card">
            <span className="stmp-kpi-lbl">Total Quotations</span>
            <span className="stmp-kpi-val">{performance.totalQuotations}</span>
            <span className="stmp-kpi-sub">{performance.totalOrders} Sales Orders</span>
          </div>

          <div className="stmp-kpi-card">
            <span className="stmp-kpi-lbl">Total Invoices</span>
            <span className="stmp-kpi-val">{invoices.length}</span>
            <span className="stmp-kpi-sub">${invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()} Settled</span>
          </div>

          <div className="stmp-kpi-card">
            <span className="stmp-kpi-lbl">Receivables</span>
            <span className="stmp-kpi-val" style={{ color: '#0284C7' }}>${Number(performance.receivables || 0).toLocaleString()}</span>
            <span className="stmp-kpi-sub">Unpaid orders & invoices</span>
          </div>

          <div className="stmp-kpi-card">
            <span className="stmp-kpi-lbl">Overdue Amount</span>
            <span className="stmp-kpi-val" style={{ color: performance.overdueAmount > 0 ? '#DC2626' : '#059669' }}>
              ${Number(performance.overdueAmount || 0).toLocaleString()}
            </span>
            <span className="stmp-kpi-sub" style={{ color: performance.overdueAmount > 0 ? '#DC2626' : '#64748B' }}>
              {performance.overdueAmount > 0 ? 'Past payment/delivery due date' : 'Zero overdue balance'}
            </span>
          </div>

          <div className="stmp-kpi-card highlight" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stmp-kpi-lbl">Monthly Sales Target</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563EB' }}>{performance.achievementPct}% Achieved</span>
            </div>
            <span className="stmp-kpi-val">
              ${Number(performance.salesAchieved || 0).toLocaleString()}{' '}
              <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>
                / ${Number(performance.monthlyTarget || 0).toLocaleString()}
              </span>
            </span>
            <div className="stmp-progress-track">
              <div className="stmp-progress-fill" style={{ width: `${Math.min(100, performance.achievementPct)}%` }} />
            </div>
            <span className="stmp-kpi-rem">Remaining to reach goal: ${Number(performance.remainingTarget || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="stmp-tabs-bar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`stmp-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== null && <span className="stmp-tab-count">{tab.count}</span>}
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENTS ── */}
      <div className="stmp-tab-content">
        {/* TAB 1: LEADS */}
        {activeTab === 'leads' && (
          <div className="stmp-table-wrapper">
            <table className="stmp-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={7} className="stmp-empty">No leads assigned to or created by this member.</td></tr>
                ) : (
                  leads.map((l) => (
                    <tr key={l._id}>
                      <td className="stmp-highlight">{l.name}</td>
                      <td>{l.company || '—'}</td>
                      <td>{l.email || '—'}</td>
                      <td>{l.phone || '—'}</td>
                      <td>
                        <span className={`stmp-status-pill status-${(l.status || 'new').toLowerCase()}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="stmp-money">${Number(l.value || 0).toLocaleString()}</td>
                      <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: DEALS */}
        {activeTab === 'deals' && (
          <div className="stmp-table-wrapper">
            <table className="stmp-table">
              <thead>
                <tr>
                  <th>Deal Title</th>
                  <th>Client Name</th>
                  <th>Deal Value</th>
                  <th>Stage</th>
                  <th>Probability</th>
                  <th>Closing Date</th>
                </tr>
              </thead>
              <tbody>
                {deals.length === 0 ? (
                  <tr><td colSpan={6} className="stmp-empty">No deals created by this member yet.</td></tr>
                ) : (
                  deals.map((d) => (
                    <tr key={d._id}>
                      <td className="stmp-highlight">{d.title}</td>
                      <td>{d.clientName}</td>
                      <td className="stmp-money">${Number(d.value || 0).toLocaleString()}</td>
                      <td>
                        <span className="stmp-status-pill in-progress">
                          {d.stage}
                        </span>
                      </td>
                      <td>{d.probability || 0}%</td>
                      <td>{d.closingDate ? new Date(d.closingDate).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: QUOTATIONS */}
        {activeTab === 'quotations' && (
          <div className="stmp-table-wrapper">
            <table className="stmp-table">
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th>Client</th>
                  <th>Total Amount</th>
                  <th>Net Amount</th>
                  <th>Status</th>
                  <th>Valid Until</th>
                </tr>
              </thead>
              <tbody>
                {quotations.length === 0 ? (
                  <tr><td colSpan={6} className="stmp-empty">No quotations created by this member.</td></tr>
                ) : (
                  quotations.map((q) => (
                    <tr key={q._id}>
                      <td className="stmp-highlight">{q.quotationNumber}</td>
                      <td>{q.clientName}</td>
                      <td>${Number(q.totalAmount || 0).toLocaleString()}</td>
                      <td className="stmp-money">${Number(q.netAmount || 0).toLocaleString()}</td>
                      <td>
                        <span className={`stmp-status-pill status-${(q.status || 'draft').toLowerCase()}`}>
                          {q.status}
                        </span>
                      </td>
                      <td>{q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: SALES ORDERS */}
        {activeTab === 'orders' && (
          <div className="stmp-table-wrapper">
            <table className="stmp-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Client</th>
                  <th>Net Amount</th>
                  <th>Status</th>
                  <th>Delivery Date</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={6} className="stmp-empty">No sales orders found for this member.</td></tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o._id}>
                      <td className="stmp-highlight">{o.orderNumber}</td>
                      <td>{o.clientName}</td>
                      <td className="stmp-money">${Number(o.netAmount || 0).toLocaleString()}</td>
                      <td>
                        <span className={`stmp-status-pill status-${(o.status || 'pending').toLowerCase()}`}>
                          {o.status}
                        </span>
                      </td>
                      <td>{o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : '—'}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: INVOICES */}
        {activeTab === 'invoices' && (
          <div className="stmp-table-wrapper">
            <table className="stmp-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client Name</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={6} className="stmp-empty">No invoices issued by this member.</td></tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td className="stmp-highlight">{inv.invoiceNumber}</td>
                      <td>{inv.clientName}</td>
                      <td className="stmp-money">${Number(inv.amount || 0).toLocaleString()}</td>
                      <td>
                        <span className={`stmp-status-pill status-${(inv.status || 'draft').toLowerCase()}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td>{new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}</td>
                      <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 6: TARGETS */}
        {activeTab === 'targets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: '#0F172A', fontSize: '1rem', fontWeight: 700 }}>Assigned Monthly Targets</h4>
              <button
                className="sv-btn-primary"
                onClick={() => {
                  setTargetForm({
                    period: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                    periodType: 'Monthly',
                    targetAmount: '',
                    currency: 'USD',
                    notes: ''
                  });
                  setShowTargetModal(true);
                }}
              >
                <Plus size={15} /> Assign Target
              </button>
            </div>

            <div className="sv-cards-grid">
              {targets.length === 0 ? (
                <div className="sv-empty-card" style={{ gridColumn: '1 / -1' }}>
                  <Target size={36} color="#94A3B8" />
                  <p>No sales targets assigned yet. Assign a target to track performance!</p>
                </div>
              ) : (
                targets.map((t) => (
                  <div key={t._id} className="sv-target-card">
                    <div className="sv-target-header">
                      <div>
                        <h4 className="sv-target-period">{t.period}</h4>
                        <span className="sv-target-type-badge">{t.periodType} Target</span>
                      </div>
                      <span className="sv-target-status-badge" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
                        {t.status || 'Active'}
                      </span>
                    </div>

                    <div className="sv-target-stats">
                      <div className="sv-target-stat">
                        <span className="sv-ts-label">Target</span>
                        <span className="sv-ts-value">${Number(t.targetAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="sv-target-stat">
                        <span className="sv-ts-label">Achieved</span>
                        <span className="sv-ts-value" style={{ color: '#059669' }}>${Number(t.achievedAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="sv-target-stat">
                        <span className="sv-ts-label">Remaining</span>
                        <span className="sv-ts-value" style={{ color: '#D97706' }}>
                          ${Math.max(0, (t.targetAmount || 0) - (t.achievedAmount || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {t.notes && <p className="sv-target-notes">{t.notes}</p>}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                      <button
                        onClick={() => handleDeleteTarget(t._id)}
                        className="rep-action-btn delete-btn"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        <Trash2 size={13} /> Delete Target
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: FOLLOW-UPS */}
        {activeTab === 'followups' && (
          <div className="stmp-table-wrapper">
            <table className="stmp-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Scheduled Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {followUps.length === 0 ? (
                  <tr><td colSpan={5} className="stmp-empty">No follow-ups recorded.</td></tr>
                ) : (
                  followUps.map((f) => (
                    <tr key={f._id}>
                      <td className="stmp-highlight">{f.title}</td>
                      <td>{f.contactName || '—'}</td>
                      <td>{f.type}</td>
                      <td>{f.scheduledAt ? new Date(f.scheduledAt).toLocaleString() : '—'}</td>
                      <td>
                        <span className={`stmp-status-pill status-${(f.status || 'pending').toLowerCase()}`}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 8: DELIVERY NOTES */}
        {activeTab === 'delivery' && (
          <div className="stmp-table-wrapper">
            <table className="stmp-table">
              <thead>
                <tr>
                  <th>Delivery Note #</th>
                  <th>Sales Order</th>
                  <th>Recipient</th>
                  <th>Carrier</th>
                  <th>Tracking #</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {deliveryNotes.length === 0 ? (
                  <tr><td colSpan={6} className="stmp-empty">No delivery notes generated.</td></tr>
                ) : (
                  deliveryNotes.map((d) => (
                    <tr key={d._id}>
                      <td className="stmp-highlight">{d.deliveryNoteNumber}</td>
                      <td>{d.salesOrder?.orderNumber || '—'}</td>
                      <td>{d.recipientName}</td>
                      <td>{d.carrier || '—'}</td>
                      <td>{d.trackingNumber || '—'}</td>
                      <td>
                        <span className="stmp-status-pill status-completed">{d.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 9: FINANCIAL SUMMARY */}
        {activeTab === 'financials' && (
          <div className="sv-grid-3">
            <div className="sv-target-card" style={{ borderLeft: '4px solid #0284C7' }}>
              <span className="sv-ts-label">Total Receivables</span>
              <span className="sv-ts-value" style={{ color: '#0284C7' }}>${Number(performance.receivables || 0).toLocaleString()}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Unpaid invoices & pending orders</span>
            </div>
            <div className="sv-target-card" style={{ borderLeft: '4px solid #DC2626' }}>
              <span className="sv-ts-label">Overdue Balances</span>
              <span className="sv-ts-value" style={{ color: performance.overdueAmount > 0 ? '#DC2626' : '#059669' }}>
                ${Number(performance.overdueAmount || 0).toLocaleString()}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Past due transactions</span>
            </div>
            <div className="sv-target-card" style={{ borderLeft: '4px solid #8B5CF6' }}>
              <span className="sv-ts-label">Salary Base / Target</span>
              <span className="sv-ts-value">${Number(performance.salaryTarget || 0).toLocaleString()}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Monthly compensation quota</span>
            </div>
            <div className="sv-target-card" style={{ borderLeft: '4px solid #64748B' }}>
              <span className="sv-ts-label">Liabilities</span>
              <span className="sv-ts-value">${Number(performance.liability || 0).toLocaleString()}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Returns and cancellations</span>
            </div>
            <div className="sv-target-card" style={{ borderLeft: '4px solid #059669' }}>
              <span className="sv-ts-label">Total Net Sales Revenue</span>
              <span className="sv-ts-value" style={{ color: '#059669' }}>${Number(performance.salesAchieved || 0).toLocaleString()}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Confirmed sales orders and won deals</span>
            </div>
          </div>
        )}

        {/* TAB 10: ACTIVITIES */}
        {activeTab === 'activities' && (
          <div className="stmp-table-wrapper">
            <table className="stmp-table">
              <thead>
                <tr>
                  <th>Activity Type</th>
                  <th>Description</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr><td colSpan={3} className="stmp-empty">No recent activity logged for this member.</td></tr>
                ) : (
                  activities.map((a) => (
                    <tr key={a._id}>
                      <td className="stmp-highlight">{a.type}</td>
                      <td>{a.description}</td>
                      <td>{new Date(a.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ASSIGN TARGET MODAL ── */}
      {showTargetModal && (
        <div className="sv-modal-overlay" onClick={() => setShowTargetModal(false)}>
          <div className="sv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3><Target size={18} color="#2563EB" /> Assign Monthly Sales Target</h3>
              <button onClick={() => setShowTargetModal(false)}><X size={18} /></button>
            </div>
            {targetError && <div className="sv-error">{targetError}</div>}
            <form onSubmit={handleAssignTarget} className="sv-form">
              <div className="sv-field">
                <label>Team Member</label>
                <input value={employee.fullName} disabled style={{ background: '#F1F5F9', fontWeight: 600 }} />
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
                  <label>Target Amount ($) *</label>
                  <input
                    type="number"
                    value={targetForm.targetAmount}
                    onChange={(e) => setTargetForm((p) => ({ ...p, targetAmount: e.target.value }))}
                    placeholder="e.g. 50000"
                    required
                    min="1"
                  />
                </div>
              </div>
              <div className="sv-field">
                <label>Target Notes / Details</label>
                <textarea
                  rows={3}
                  value={targetForm.notes}
                  onChange={(e) => setTargetForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Incentives, specific accounts, or target guidelines..."
                />
              </div>
              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowTargetModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sv-btn-primary" disabled={savingTarget}>
                  <Save size={15} /> {savingTarget ? 'Saving...' : 'Save Target in MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT DETAILS MODAL ── */}
      {showEditModal && (
        <div className="sv-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="sv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header">
              <h3><Edit2 size={18} color="#2563EB" /> Edit Member Position & Target</h3>
              <button onClick={() => setShowEditModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveDetails} className="sv-form">
              <div className="sv-field">
                <label>Position / Role Title</label>
                <input
                  value={editForm.position}
                  onChange={(e) => setEditForm((p) => ({ ...p, position: e.target.value }))}
                  placeholder="e.g. Senior Account Executive"
                />
              </div>
              <div className="sv-field">
                <label>Salary Target ($)</label>
                <input
                  type="number"
                  value={editForm.salaryTarget}
                  onChange={(e) => setEditForm((p) => ({ ...p, salaryTarget: e.target.value }))}
                  placeholder="e.g. 7000"
                />
              </div>
              <div className="sv-field">
                <label>Contact Phone</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div className="sv-modal-actions">
                <button type="button" className="sv-btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sv-btn-primary" disabled={savingEdit}>
                  <Save size={15} /> {savingEdit ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
