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
  Check,
  FileCheck,
  FolderKanban,
  CreditCard,
  Printer,
  Star
} from 'lucide-react';
import './SalesTeamMemberProfileView.css';

export default function SalesTeamMemberProfileView({ memberId, onBack, initialBreakdown = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leads');
  const [error, setError] = useState('');
  const [breakdownType, setBreakdownType] = useState(initialBreakdown);
  const [breakdownSearch, setBreakdownSearch] = useState('');

  // Target Modal State
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetForm, setTargetForm] = useState({
    period: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    periodType: 'Monthly',
    targetAmount: '',
    currency: 'PKR',
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
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState(null);

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
      console.error(e);
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
        <p>Loading team member profile...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="stmp-error">
        <AlertCircle size={32} color="#EF4444" />
        <p>{error || 'Member not found.'}</p>
        <button className="sv-btn-primary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Sales Team
        </button>
      </div>
    );
  }

  const {
    employee,
    performance,
    leads = [],
    deals = [],
    quotations = [],
    customerPOs = [],
    productFiles = [],
    orders = [],
    deliveryNotes = [],
    invoices = [],
    payments = [],
    followUps = [],
    targets = [],
    activities = []
  } = data;

  const tabs = [
    { id: 'leads', label: 'Leads', count: leads.length, icon: Users },
    { id: 'deals', label: 'Deals Pipeline', count: deals.length, icon: TrendingUp },
    { id: 'quotations', label: 'Quotations', count: quotations.length, icon: FileText },
    { id: 'customer_pos', label: 'Customer POs', count: customerPOs.length, icon: FileCheck },
    { id: 'product_files', label: 'Product Files', count: productFiles.length, icon: FolderKanban },
    { id: 'orders', label: 'Sales Orders', count: orders.length, icon: ShoppingCart },
    { id: 'delivery', label: 'Delivery Notes', count: deliveryNotes.length, icon: Truck },
    { id: 'invoices', label: 'Invoices', count: invoices.length, icon: DollarSign },
    { id: 'payments', label: 'Customer Payments', count: payments.length, icon: CreditCard },
    { id: 'targets', label: 'Targets & Quotas', count: targets.length, icon: Target },
    { id: 'followups', label: 'Follow-ups', count: followUps.length, icon: PhoneCall },
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
                currency: 'PKR',
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
            <span className="stmp-kpi-sub">Rs. {Number(performance.wonDealsValue || 0).toLocaleString()} volume</span>
          </div>

          <div className="stmp-kpi-card">
            <span className="stmp-kpi-lbl">Total Quotations</span>
            <span className="stmp-kpi-val">{performance.totalQuotations}</span>
            <span className="stmp-kpi-sub">{performance.totalOrders} Sales Orders</span>
          </div>

          <div className="stmp-kpi-card">
            <span className="stmp-kpi-lbl">Total Invoices</span>
            <span className="stmp-kpi-val">{invoices.length}</span>
            <span className="stmp-kpi-sub">Rs. {invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()} Settled</span>
          </div>

          <div
            className="stmp-kpi-card stmp-kpi-clickable"
            onClick={() => { setBreakdownType('overdue'); setBreakdownSearch(''); }}
            title="Click to view detailed itemized list of overdue amounts"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stmp-kpi-lbl">Overdue Amount</span>
              <span className="stmp-card-click-hint">View List →</span>
            </div>
            <span className="stmp-kpi-val" style={{ color: performance.overdueAmount > 0 ? '#DC2626' : '#059669' }}>
              Rs. {Number(performance.overdueAmount || 0).toLocaleString()}
            </span>
            <span className="stmp-kpi-sub" style={{ color: performance.overdueAmount > 0 ? '#DC2626' : '#64748B' }}>
              {performance.overdueAmount > 0 ? 'Past payment/delivery due date' : 'Zero overdue balance'}
            </span>
          </div>

          <div
            className="stmp-kpi-card stmp-kpi-clickable"
            onClick={() => { setBreakdownType('receivables'); setBreakdownSearch(''); }}
            title="Click to view detailed itemized list of outstanding receivables"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stmp-kpi-lbl">Receivables</span>
              <span className="stmp-card-click-hint">View List →</span>
            </div>
            <span className="stmp-kpi-val" style={{ color: '#0284C7' }}>Rs. {Number(performance.receivables || 0).toLocaleString()}</span>
            <span className="stmp-kpi-sub">Unpaid orders & invoices</span>
          </div>

          <div className="stmp-kpi-card highlight" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stmp-kpi-lbl">Monthly Sales Target</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563EB' }}>{performance.achievementPct}% Achieved</span>
            </div>
            <span className="stmp-kpi-val">
              Rs. {Number(performance.salesAchieved || 0).toLocaleString()}{' '}
              <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>
                / Rs. {Number(performance.monthlyTarget || 0).toLocaleString()}
              </span>
            </span>
            <div className="stmp-progress-track">
              <div className="stmp-progress-fill" style={{ width: `${Math.min(100, performance.achievementPct)}%` }} />
            </div>
            <span className="stmp-kpi-rem">Remaining to reach goal: Rs. {Number(performance.remainingTarget || 0).toLocaleString()}</span>
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
              {tab.count !== null && <span className="stmp-tab-badge">{tab.count}</span>}
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
                  <th>Contact</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={6} className="stmp-empty">No leads found for this member.</td></tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead._id}>
                      <td className="stmp-highlight">{lead.name}</td>
                      <td>{lead.company || '—'}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{lead.email || ''}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{lead.phone || ''}</div>
                      </td>
                      <td>{lead.source || 'Direct'}</td>
                      <td>
                        <span className={`stmp-status-pill status-${(lead.status || 'new').toLowerCase().replace(/\s+/g, '-')}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
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
                  <th>Company / Client</th>
                  <th>Value</th>
                  <th>Stage</th>
                  <th>Probability</th>
                  <th>Expected Close</th>
                </tr>
              </thead>
              <tbody>
                {deals.length === 0 ? (
                  <tr><td colSpan={6} className="stmp-empty">No active deals found for this member.</td></tr>
                ) : (
                  deals.map((d) => (
                    <tr key={d._id}>
                      <td className="stmp-highlight">{d.title}</td>
                      <td>{d.company || d.contactPerson || '—'}</td>
                      <td className="stmp-money">Rs. {Number(d.value || 0).toLocaleString()}</td>
                      <td>
                        <span className={`stmp-status-pill status-${(d.stage || 'lead').toLowerCase().replace(/\s+/g, '-')}`}>
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
                      <td>Rs. {Number(q.totalAmount || 0).toLocaleString()}</td>
                      <td className="stmp-money">Rs. {Number(q.netAmount || 0).toLocaleString()}</td>
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

        {/* TAB: CUSTOMER POs */}
        {activeTab === 'customer_pos' && (
          <div className="stmp-table-wrapper">
            <table className="stmp-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Customer Name</th>
                  <th>Quotation #</th>
                  <th>PO Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customerPOs.length === 0 ? (
                  <tr><td colSpan={6} className="stmp-empty">No Customer POs recorded by this member.</td></tr>
                ) : (
                  customerPOs.map((po) => (
                    <tr key={po._id}>
                      <td className="stmp-highlight">{po.poNumber}</td>
                      <td>{po.customerName}</td>
                      <td>{po.quotationNumber || '—'}</td>
                      <td>{new Date(po.poDate || po.createdAt).toLocaleDateString()}</td>
                      <td className="stmp-money">Rs. {Number(po.amount || 0).toLocaleString()}</td>
                      <td>
                        <span className={`stmp-status-pill status-${(po.status || 'received').toLowerCase()}`}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: PRODUCT FILES */}
        {activeTab === 'product_files' && (
          <div className="stmp-table-wrapper">
            <table className="stmp-table">
              <thead>
                <tr>
                  <th>File #</th>
                  <th>File Type</th>
                  <th>Customer Name</th>
                  <th>Quotation / PO</th>
                  <th>Products Count</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {productFiles.length === 0 ? (
                  <tr><td colSpan={6} className="stmp-empty">No Product Files created by this member.</td></tr>
                ) : (
                  productFiles.map((pf) => (
                    <tr key={pf._id}>
                      <td className="stmp-highlight">{pf.fileNumber || pf._id}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: pf.fileType === 'Blue' ? '#DBEAFE' : '#DCFCE7',
                          color: pf.fileType === 'Blue' ? '#1D4ED8' : '#15803D'
                        }}>
                          {pf.fileType} File
                        </span>
                      </td>
                      <td>{pf.customerName}</td>
                      <td>{pf.customerPONumber || pf.quotationNumber || '—'}</td>
                      <td>{pf.products?.length || 0} items</td>
                      <td>
                        <span className={`stmp-status-pill status-${(pf.status || 'created').toLowerCase()}`}>
                          {pf.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: SALES ORDERS */}
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
                      <td className="stmp-money">Rs. {Number(o.netAmount || 0).toLocaleString()}</td>
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

        {/* TAB: INVOICES */}
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
                      <td className="stmp-money">Rs. {Number(inv.amount || 0).toLocaleString()}</td>
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

        {/* TAB: PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="stmp-table-wrapper">
            <table className="stmp-table">
              <thead>
                <tr>
                  <th>Ref #</th>
                  <th>Customer Name</th>
                  <th>Order / Inv #</th>
                  <th>Payment Type</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={7} className="stmp-empty">No payments recorded by this member.</td></tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p._id}>
                      <td className="stmp-highlight">{p.paymentRefNumber}</td>
                      <td>{p.customerName}</td>
                      <td>{p.salesOrderNumber || p.invoiceNumber || '—'}</td>
                      <td>{p.paymentType}</td>
                      <td>{p.paymentMethod}</td>
                      <td className="stmp-money" style={{ color: '#059669' }}>Rs. {Number(p.amount || 0).toLocaleString()}</td>
                      <td>{new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: TARGETS */}
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
                    currency: 'PKR',
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
                targets.map((tgt) => (
                  <div key={tgt._id} className="sv-target-card">
                    <div className="sv-tc-header">
                      <div>
                        <div className="sv-tc-period">{tgt.period}</div>
                        <span className="sv-tc-type">{tgt.periodType} Target</span>
                      </div>
                      <span className={`stmp-status-pill status-${(tgt.status || 'active').toLowerCase()}`}>
                        {tgt.status}
                      </span>
                    </div>

                    <div className="sv-tc-metrics">
                      <div>
                        <span className="sv-tc-lbl">Target Quota</span>
                        <span className="sv-tc-val">Rs. {Number(tgt.targetAmount).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="sv-tc-lbl">Achieved</span>
                        <span className="sv-tc-val" style={{ color: '#059669' }}>
                          Rs. {Number(tgt.achievedAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="sv-tc-bar-wrap">
                      <div className="sv-tc-bar-track">
                        <div
                          className="sv-tc-bar-fill"
                          style={{
                            width: `${Math.min(100, Math.round(((tgt.achievedAmount || 0) / tgt.targetAmount) * 100))}%`
                          }}
                        />
                      </div>
                      <span className="sv-tc-bar-pct">
                        {Math.min(100, Math.round(((tgt.achievedAmount || 0) / tgt.targetAmount) * 100))}%
                      </span>
                    </div>
                    {tgt.notes && <p className="sv-tc-notes">{tgt.notes}</p>}
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                      <button
                        onClick={() => handleDeleteTarget(tgt._id)}
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
                  <th>Customer / Lead</th>
                  <th>Type</th>
                  <th>Scheduled Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {followUps.length === 0 ? (
                  <tr><td colSpan={6} className="stmp-empty">No scheduled follow-ups found for this member.</td></tr>
                ) : (
                  followUps.map((f) => (
                    <tr key={f._id}>
                      <td className="stmp-highlight">{f.title}</td>
                      <td>{f.customer || f.lead?.name || f.contactName || '—'}</td>
                      <td>{f.type || f.followUpType || 'Call'}</td>
                      <td>{new Date(f.scheduledAt).toLocaleString()}</td>
                      <td>
                        <span className={`stmp-status-pill status-${(f.status || 'pending').toLowerCase()}`}>
                          {f.status}
                        </span>
                      </td>
                      <td>{f.notes || '—'}</td>
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
                  <th>Recipient / Address</th>
                  <th>Carrier</th>
                  <th>Source Document</th>
                  <th>Scheduled Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveryNotes.length === 0 ? (
                  <tr><td colSpan={7} className="stmp-empty">No delivery notes issued for this member.</td></tr>
                ) : (
                  deliveryNotes.map((d) => (
                    <tr key={d._id} style={{ cursor: 'pointer' }} onClick={() => setSelectedDeliveryNote(d)}>
                      <td className="stmp-highlight" style={{ color: '#008784', fontWeight: 700 }}>
                        {d.deliveryNumber || d.deliveryNoteNumber || 'WH/OUT/00371'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{d.recipientName || d.clientName || 'ENGRO POLYMER'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{d.deliveryAddress || '—'}</div>
                      </td>
                      <td>{d.carrier || 'Fortline Logistics'}</td>
                      <td><span style={{ color: '#008784', fontWeight: 600 }}>{d.sourceDocument || d.salesOrderNumber || 'S01717'}</span></td>
                      <td style={{ color: '#991B1B', fontWeight: 600 }}>
                        {d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString() : (d.deliveryDate ? new Date(d.deliveryDate).toLocaleDateString() : 'Sep 4')}
                      </td>
                      <td>
                        <span className="stmp-status-pill status-completed">{d.status || 'Ready'}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="sv-btn-action-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDeliveryNote(d);
                          }}
                          title="View Odoo Format"
                        >
                          <FileText size={14} color="#008784" />
                        </button>
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
            <div
              className="sv-target-card stmp-kpi-clickable"
              style={{ borderLeft: '4px solid #0284C7', cursor: 'pointer' }}
              onClick={() => { setBreakdownType('receivables'); setBreakdownSearch(''); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="sv-ts-label">Total Receivables</span>
                <span className="stmp-card-click-hint">View List →</span>
              </div>
              <span className="sv-ts-value" style={{ color: '#0284C7' }}>Rs. {Number(performance.receivables || 0).toLocaleString()}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Unpaid invoices & pending orders (Click to inspect)</span>
            </div>
            <div
              className="sv-target-card stmp-kpi-clickable"
              style={{ borderLeft: '4px solid #DC2626', cursor: 'pointer' }}
              onClick={() => { setBreakdownType('overdue'); setBreakdownSearch(''); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="sv-ts-label">Overdue Balances</span>
                <span className="stmp-card-click-hint">View List →</span>
              </div>
              <span className="sv-ts-value" style={{ color: performance.overdueAmount > 0 ? '#DC2626' : '#059669' }}>
                Rs. {Number(performance.overdueAmount || 0).toLocaleString()}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Past due transactions (Click to inspect)</span>
            </div>
            <div className="sv-target-card" style={{ borderLeft: '4px solid #8B5CF6' }}>
              <span className="sv-ts-label">Salary Base / Target</span>
              <span className="sv-ts-value">Rs. {Number(performance.salaryTarget || 0).toLocaleString()}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Monthly compensation quota</span>
            </div>
            <div className="sv-target-card" style={{ borderLeft: '4px solid #64748B' }}>
              <span className="sv-ts-label">Liabilities</span>
              <span className="sv-ts-value">Rs. {Number(performance.liability || 0).toLocaleString()}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Returns and cancellations</span>
            </div>
            <div className="sv-target-card" style={{ borderLeft: '4px solid #059669' }}>
              <span className="sv-ts-label">Total Net Sales Revenue</span>
              <span className="sv-ts-value" style={{ color: '#059669' }}>Rs. {Number(performance.salesAchieved || 0).toLocaleString()}</span>
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
                  <label>Target Amount (PKR / Rs.) *</label>
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
                <label>Salary Target (PKR / Rs.)</label>
                <input
                  type="number"
                  value={editForm.salaryTarget}
                  onChange={(e) => setEditForm((p) => ({ ...p, salaryTarget: e.target.value }))}
                  placeholder="e.g. 70000"
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
      {/* CRM THEMED DELIVERY NOTE MODAL FOR SALES MANAGER */}
      {selectedDeliveryNote && (
        <div className="sv-modal-overlay" onClick={() => setSelectedDeliveryNote(null)}>
          <div className="sv-modal" style={{ maxWidth: '900px', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="crm-dn-topbar" style={{ borderRadius: '12px 12px 0 0' }}>
              <div className="crm-dn-actions-left">
                <button
                  type="button"
                  className="crm-btn-validate"
                  onClick={async () => {
                    await apiRequest(`/api/sales-manager/delivery-notes/${selectedDeliveryNote._id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: 'Done' })
                    });
                    setSelectedDeliveryNote(p => ({ ...p, status: 'Done' }));
                    fetchMemberData();
                  }}
                >
                  <Check size={14} /> Validate
                </button>
                <button type="button" className="crm-btn-action" onClick={() => window.print()}>
                  <Printer size={14} /> Print
                </button>
                <button type="button" className="crm-btn-action" onClick={() => setSelectedDeliveryNote(null)}>
                  Close
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="crm-pipeline">
                  {['Draft', 'Waiting', 'Ready', 'Done'].map(step => (
                    <div key={step} className={`crm-pipeline-step ${(selectedDeliveryNote.status || 'Ready') === step ? 'active' : ''}`}>
                      {step}
                    </div>
                  ))}
                </div>
                <button onClick={() => setSelectedDeliveryNote(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="crm-dn-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="crm-dn-title-row">
                <Star size={24} fill={selectedDeliveryNote.starred ? '#F59E0B' : 'none'} color={selectedDeliveryNote.starred ? '#F59E0B' : '#CBD5E1'} />
                <h2 className="crm-dn-heading">
                  {selectedDeliveryNote.deliveryNumber || selectedDeliveryNote.deliveryNoteNumber || 'WH/OUT/00371'}
                </h2>
              </div>

              <div className="crm-dn-meta-grid">
                <div className="crm-meta-group">
                  <div className="crm-meta-row">
                    <span className="crm-meta-label">Delivery Address</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedDeliveryNote.deliveryAddress || selectedDeliveryNote.clientName || 'ENGRO POLYMER & CHEMICALS LIMITED'}</span>
                  </div>
                  <div className="crm-meta-row">
                    <span className="crm-meta-label">Operation Type</span>
                    <span style={{ color: '#0F172A', fontWeight: 500 }}>{selectedDeliveryNote.operationType || 'Fortline: Delivery Orders'}</span>
                  </div>
                  <div className="crm-meta-row">
                    <span className="crm-meta-label">Source Location</span>
                    <span style={{ color: '#0F172A', fontWeight: 500 }}>{selectedDeliveryNote.sourceLocation || 'WH/Stock'}</span>
                  </div>
                </div>

                <div className="crm-meta-group">
                  <div className="crm-meta-row">
                    <span className="crm-meta-label">Scheduled Date ?</span>
                    <span className="crm-meta-value-highlight">
                      {selectedDeliveryNote.scheduledDate ? new Date(selectedDeliveryNote.scheduledDate).toLocaleString() : 'Sep 4, 6:02 PM'}
                    </span>
                  </div>
                  <div className="crm-meta-row">
                    <span className="crm-meta-label">Deadline ?</span>
                    <span className="crm-meta-value-highlight">
                      {selectedDeliveryNote.deadline ? new Date(selectedDeliveryNote.deadline).toLocaleString() : 'Sep 4, 6:02 PM'}
                    </span>
                  </div>
                  <div className="crm-meta-row">
                    <span className="crm-meta-label">Product Availability ?</span>
                    <span className="crm-meta-avail-badge">{selectedDeliveryNote.productAvailability || 'Available'}</span>
                  </div>
                  <div className="crm-meta-row">
                    <span className="crm-meta-label">Source Document ?</span>
                    <span style={{ color: '#2563EB', fontWeight: 600 }}>{selectedDeliveryNote.sourceDocument || selectedDeliveryNote.salesOrderNumber || 'S01717'}</span>
                  </div>
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', borderBottom: '2px solid #2563EB', paddingBottom: '6px', marginBottom: '14px', width: 'max-content' }}>
                Operations
              </div>

              <table className="crm-dn-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: 'right' }}>Demand</th>
                    <th style={{ textAlign: 'right' }}>Quantity</th>
                    <th>Unit</th>
                    <th style={{ textAlign: 'center' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedDeliveryNote.items?.length ? selectedDeliveryNote.items : [{ product: 'LAPTOP, ThinkBook,G8', demand: 50, quantity: 50, unit: 'Units', availability: 'Available' }]).map((item, i) => (
                    <tr key={i}>
                      <td>
                        <div className="crm-product-row">
                          <span style={{ color: '#0F172A', fontWeight: 600 }}>{item.product || item.description}</span>
                          <span className="crm-avail-pill">{item.availability || 'Available'}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(item.demand || item.quantity || 50).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(item.quantity || item.demand || 50).toFixed(2)}</td>
                      <td>{item.unit || 'Units'}</td>
                      <td style={{ textAlign: 'center', color: '#2563EB', fontWeight: 600 }}>Details</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── INTERACTIVE OVERDUE & RECEIVABLES BREAKDOWN MODAL ── */}
      {breakdownType && (
        <div className="sv-modal-overlay" onClick={() => setBreakdownType(null)}>
          <div className="sv-modal" style={{ maxWidth: '920px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="sv-modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: breakdownType === 'overdue' ? '#FEE2E2' : '#E0F2FE',
                  color: breakdownType === 'overdue' ? '#DC2626' : '#0284C7'
                }}>
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    {breakdownType === 'overdue' ? 'Overdue Amount Itemized Breakdown' : 'Outstanding Receivables Detailed Breakdown'}
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                    Itemized list of outstanding receivables and billing records for <strong>{employee.fullName}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setBreakdownType(null)}><X size={18} /></button>
            </div>

            {/* Modal Summary KPI Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              padding: '14px 18px',
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Total Outstanding</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: breakdownType === 'overdue' ? '#DC2626' : '#0284C7', marginTop: '2px' }}>
                  Rs. {Number(breakdownType === 'overdue' ? performance.overdueAmount : performance.receivables || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Unsettled Invoices / Orders</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {breakdownType === 'overdue'
                    ? (invoices.filter(i => i.status === 'Overdue' || (i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'Paid')).length || orders.length)
                    : (invoices.filter(i => i.status !== 'Paid').length || orders.length)} items
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Sales Representative</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>
                  {employee.fullName}
                </div>
              </div>
            </div>

            {/* Search filter in modal */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #F1F5F9' }}>
              <div className="sv-search-box" style={{ width: '100%', maxWidth: '380px' }}>
                <Search size={15} />
                <input
                  placeholder="Search customer, invoice #, order ref..."
                  value={breakdownSearch}
                  onChange={e => setBreakdownSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Table of Breakdown Items */}
            <div style={{ padding: '0 18px', overflowY: 'auto', flex: 1, maxHeight: '420px' }}>
              <table className="sv-table" style={{ marginTop: '8px' }}>
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Type</th>
                    <th>Customer / Client</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: 'right' }}>Total Value</th>
                    <th style={{ textAlign: 'right' }}>Paid Amount</th>
                    <th style={{ textAlign: 'right' }}>Remaining Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Compute breakdown rows
                    let items = [];
                    if (breakdownType === 'overdue') {
                      invoices.forEach(inv => {
                        const isPastDue = inv.dueDate && new Date(inv.dueDate) < new Date();
                        const paid = Number(inv.paidAmount || 0);
                        const total = Number(inv.amount || 0);
                        const rem = total - paid;
                        if (inv.status === 'Overdue' || (inv.status !== 'Paid' && isPastDue)) {
                          items.push({
                            id: inv._id,
                            num: inv.invoiceNumber,
                            type: 'Invoice',
                            customer: inv.clientName || inv.customerName || 'Client',
                            due: inv.dueDate,
                            total,
                            paid,
                            rem: rem > 0 ? rem : total,
                            status: inv.status || 'Overdue'
                          });
                        }
                      });
                      if (items.length === 0) {
                        orders.forEach(o => {
                          const isPastDue = o.deliveryDate && new Date(o.deliveryDate) < new Date();
                          const total = Number(o.netAmount || o.totalAmount || 0);
                          const paid = (o.paymentStatus === 'Paid' || o.paymentStatus === 'Fully Paid') ? total : (o.paymentStatus === 'Partially Paid' ? Math.round(total / 2) : 0);
                          const rem = total - paid;
                          if (rem > 0 && isPastDue) {
                            items.push({
                              id: o._id,
                              num: o.orderNumber,
                              type: 'Sales Order',
                              customer: o.clientName || 'Client',
                              due: o.deliveryDate,
                              total,
                              paid,
                              rem,
                              status: 'Overdue'
                            });
                          }
                        });
                      }
                    } else {
                      invoices.forEach(inv => {
                        const paid = Number(inv.paidAmount || 0);
                        const total = Number(inv.amount || 0);
                        const rem = total - paid;
                        if (inv.status !== 'Paid') {
                          items.push({
                            id: inv._id,
                            num: inv.invoiceNumber,
                            type: 'Invoice',
                            customer: inv.clientName || inv.customerName || 'Client',
                            due: inv.dueDate,
                            total,
                            paid,
                            rem: rem > 0 ? rem : total,
                            status: inv.status || 'Pending'
                          });
                        }
                      });
                      if (items.length === 0) {
                        orders.forEach(o => {
                          const total = Number(o.netAmount || o.totalAmount || 0);
                          const paid = (o.paymentStatus === 'Paid' || o.paymentStatus === 'Fully Paid') ? total : (o.paymentStatus === 'Partially Paid' ? Math.round(total / 2) : 0);
                          const rem = total - paid;
                          if (rem > 0) {
                            items.push({
                              id: o._id,
                              num: o.orderNumber,
                              type: 'Sales Order',
                              customer: o.clientName || 'Client',
                              due: o.deliveryDate,
                              total,
                              paid,
                              rem,
                              status: o.paymentStatus || 'Pending'
                            });
                          }
                        });
                      }
                    }

                    if (breakdownSearch.trim()) {
                      const term = breakdownSearch.toLowerCase();
                      items = items.filter(it =>
                        (it.num && it.num.toLowerCase().includes(term)) ||
                        (it.customer && it.customer.toLowerCase().includes(term)) ||
                        (it.status && it.status.toLowerCase().includes(term))
                      );
                    }

                    if (items.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="sv-empty" style={{ padding: '32px', textAlign: 'center' }}>
                            No {breakdownType} records found matching the criteria.
                          </td>
                        </tr>
                      );
                    }

                    return items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td style={{ fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>{it.num}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: it.type === 'Invoice' ? '#EFF6FF' : '#F1F5F9',
                            color: it.type === 'Invoice' ? '#1D4ED8' : '#475569'
                          }}>
                            {it.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#0F172A' }}>{it.customer}</td>
                        <td style={{ fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {it.due ? new Date(it.due).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                          Rs. {Number(it.total).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669', whiteSpace: 'nowrap' }}>
                          Rs. {Number(it.paid).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: breakdownType === 'overdue' ? '#DC2626' : '#0284C7', whiteSpace: 'nowrap' }}>
                          Rs. {Number(it.rem).toLocaleString()}
                        </td>
                        <td>
                          <span className={`stmp-status-pill status-${(it.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                            {it.status}
                          </span>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <div className="sv-modal-actions" style={{ padding: '14px 18px', borderTop: '1px solid #E2E8F0', marginTop: 0 }}>
              <button className="sv-btn-primary" onClick={() => setBreakdownType(null)}>Close Breakdown</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
