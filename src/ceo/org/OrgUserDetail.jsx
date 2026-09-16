import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  User,
  ArrowLeft,
  FileDown,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  Shield,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Wallet,
  Package,
  FileText,
  Truck,
  Building,
  RefreshCw,
  Lock,
  Layers,
  FileCheck,
  Receipt,
  HeartHandshake
} from 'lucide-react';
import { exportUserPDF } from './OrgPDFService';

export default function OrgUserDetail({ userId, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserPerformance = async () => {
    setLoading(true);
    try {
      const { response, data: resData } = await apiRequest(`/api/admin/org/users/${userId}/performance`);
      if (response.ok && resData.success) {
        setData(resData.data);
      }
    } catch (err) {
      console.error('Error fetching user performance details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserPerformance();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="org-container" style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Loading employee centralized details from database...</p>
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="org-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>User details not found.</p>
        <button className="org-btn org-btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Directory
        </button>
      </div>
    );
  }

  const { user, metrics, monthlyData, activities, roleDetails } = data;
  const score = metrics?.score || 0;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'profile', label: 'Profile' },
    { id: 'activities', label: 'Activities' },
    { id: 'performance', label: 'Performance' },
    { id: 'monthly', label: 'Monthly Trend' },
    { id: 'department_data', label: 'Department Data' },
    { id: 'reports', label: 'Reports & Export' }
  ];

  const role = user.role || '';
  const isSales = ['sales_manager', 'sales_member', 'sales_rep', 'sales_person'].includes(role) || (user.department && user.department.toLowerCase().includes('sale'));
  const isSupport = role === 'support' || (user.department && user.department.toLowerCase().includes('support'));
  const isAccounts = role === 'accountant' || (user.department && user.department.toLowerCase().includes('account'));
  const isFinance = role === 'finance' || (user.department && user.department.toLowerCase().includes('finance'));
  const isHR = ['hr_manager', 'administration'].includes(role) || (user.department && user.department.toLowerCase().includes('hr'));

  return (
    <div className="org-container">
      {/* Top Bar with Back button and Actions */}
      <div className="org-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="org-btn org-btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} />
            Back to Directory
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem' }}>
              {user.fullName}
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.8rem' }}>
              {user.employeeId ? `ID: ${user.employeeId} • ` : ''}
              {(user.role || '').replace('_', ' ').toUpperCase()} • {user.department || 'General'}
            </p>
          </div>
        </div>

        <div className="org-actions-group">
          <div className="org-view-only-banner">
            <Lock size={14} />
            READ-ONLY AUDIT MODE
          </div>
          <button
            className="org-btn org-btn-primary"
            onClick={() => exportUserPDF(data)}
            title="Download PDF Report"
          >
            <FileDown size={16} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Detail Navigation Tabs */}
      <div className="org-detail-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`org-detail-tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ----------------- TAB 1: OVERVIEW ----------------- */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="org-kpi-grid">
            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Performance Score</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                  <Award size={18} />
                </div>
              </div>
              <span className="org-kpi-value" style={{ color: score >= 80 ? '#10B981' : (score >= 50 ? '#2563EB' : '#D97706') }}>
                {score}%
              </span>
              <span className="org-kpi-subtext">Completion &amp; achievement rating</span>
            </div>

            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Total Handled</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#F8FAFC', color: '#475569' }}>
                  <Package size={18} />
                </div>
              </div>
              <span className="org-kpi-value">{metrics?.totalItems || 0}</span>
              <span className="org-kpi-subtext">Orders, DNs, Invoices, Tasks</span>
            </div>

            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Completed Items</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <span className="org-kpi-value" style={{ color: '#15803D' }}>
                {metrics?.completedItems || 0}
              </span>
              <span className="org-kpi-subtext">Successfully finalized</span>
            </div>

            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Financial Attributed</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <Wallet size={18} />
                </div>
              </div>
              <span className="org-kpi-value">
                PKR {(metrics?.revenueAttributed || 0).toLocaleString()}
              </span>
              <span className="org-kpi-subtext">Volume generated / managed</span>
            </div>
          </div>

          {/* Role-Specific Operational Summary Card */}
          {roleDetails && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#2563EB" />
                Department Workflow Breakdown (Role: {(user.role || 'employee').replace('_', ' ').toUpperCase()})
              </h3>

              {isSales && roleDetails.sales && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Total Leads</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#0F172A' }}>{roleDetails.sales.totalLeads}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Total Deals</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#0F172A' }}>{roleDetails.sales.totalDeals}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Active Quotations</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#0F172A' }}>{roleDetails.sales.activeQuotations}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Converted Quotations</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#16A34A' }}>{roleDetails.sales.convertedQuotations}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                    <span style={{ fontSize: '0.75rem', color: '#1D4ED8', fontWeight: 700 }}>Total Sales Orders</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.3rem', color: '#1D4ED8' }}>{roleDetails.sales.totalSalesOrders}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Finance Approved</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#16A34A' }}>{roleDetails.sales.ordersFinanceApproved}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Pending Finance</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#D97706' }}>{roleDetails.sales.ordersPendingFinance}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Sent to Support</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#0284C7' }}>{roleDetails.sales.ordersSentToSupport}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Linked Delivery Notes</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#0D9488' }}>{roleDetails.sales.linkedDeliveryNotes}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Linked Final Invoices</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#7C3AED' }}>{roleDetails.sales.linkedFinalInvoices}</p>
                  </div>
                </div>
              )}

              {isSupport && roleDetails.support && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Sales Orders Received</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#0F172A' }}>{roleDetails.support.salesOrdersReceived}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Total Delivery Notes</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#0D9488' }}>{roleDetails.support.totalDeliveryNotes}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Pending Delivery Notes</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#D97706' }}>{roleDetails.support.pendingDeliveryNotes}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Confirmed Delivery Notes</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#16A34A' }}>{roleDetails.support.confirmedDeliveryNotes}</p>
                  </div>
                </div>
              )}

              {isAccounts && roleDetails.accounts && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Delivery Notes Received</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#0F172A' }}>{roleDetails.accounts.deliveryNotesReceived}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Draft Invoices Created</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#2563EB' }}>{roleDetails.accounts.draftInvoicesCreated}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Pending Finance Finalization</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#D97706' }}>{roleDetails.accounts.pendingFinanceFinalization}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Draft Invoices Value</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#7C3AED' }}>PKR {(roleDetails.accounts.draftInvoicesAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {isFinance && roleDetails.finance && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Orders Approved</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#16A34A' }}>{roleDetails.finance.ordersApproved}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Orders Rejected</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#DC2626' }}>{roleDetails.finance.ordersRejected}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Draft Invoices Received</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#D97706' }}>{roleDetails.finance.draftInvoicesReceived}</p>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Final Invoices Finalized</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.2rem', color: '#2563EB' }}>{roleDetails.finance.finalInvoicesFinalized}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Info Block */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', color: '#0F172A' }}>
              Employee Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Full Name</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#0F172A' }}>{user.fullName}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Email</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#0F172A' }}>{user.email}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Department</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#0F172A' }}>{user.department || 'General'}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Role</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#0F172A' }}>{(user.role || '').replace('_', ' ').toUpperCase()}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Account Status</span>
                <p style={{ margin: '4px 0 0 0' }}>
                  <span className={`org-badge org-badge-${user.status === 'active' ? 'active' : 'inactive'}`}>
                    {(user.status || 'active').toUpperCase()}
                  </span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Last Login</span>
                <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.85rem' }}>
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: PROFILE ----------------- */}
      {activeTab === 'profile' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 20px 0', color: '#0F172A' }}>
            Full Employee Profile &amp; Account Specifications
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Employee ID</span>
              <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#0F172A' }}>{user.employeeId || 'Not Assigned'}</p>
            </div>
            <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Phone Contact</span>
              <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#0F172A' }}>{user.phone || 'No phone registered'}</p>
            </div>
            <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Designation / Position</span>
              <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#0F172A' }}>{user.position || user.role}</p>
            </div>
            <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Joined / Created Date</span>
              <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#0F172A' }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Last Active Session</span>
              <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#0F172A' }}>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
            </div>
            <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Verification Status</span>
              <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#16A34A' }}>{user.isApproved ? 'Approved by Administration' : 'Pending Verification'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 3: ACTIVITIES ----------------- */}
      {activeTab === 'activities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="org-table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700 }}>
              Sales Orders ({activities?.salesOrders?.length || 0})
            </div>
            <div className="org-table-responsive">
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>Delivery Status</th>
                    <th>Payment Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {activities?.salesOrders?.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>No sales orders recorded.</td></tr>
                  ) : (
                    activities.salesOrders.slice(0, 25).map(o => (
                      <tr key={o._id}>
                        <td style={{ fontWeight: 600, color: '#2563EB' }}>{o.orderNumber || o.orderReference || 'N/A'}</td>
                        <td>{o.clientName || 'N/A'}</td>
                        <td>PKR {(o.netAmount || o.totalAmount || 0).toLocaleString()}</td>
                        <td><span className="org-badge org-badge-role">{o.deliveryStatus || 'Pending'}</span></td>
                        <td><span className="org-badge org-badge-active">{o.paymentStatus || 'Pending'}</span></td>
                        <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="org-table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700 }}>
              Delivery Notes &amp; Assigned Tasks ({((activities?.deliveryNotes?.length || 0) + (activities?.tasks?.length || 0))})
            </div>
            <div className="org-table-responsive">
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Reference / Title</th>
                    <th>Client / Assignment</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {activities?.deliveryNotes?.slice(0, 15).map(d => (
                    <tr key={d._id}>
                      <td><span className="org-badge org-badge-dept">Delivery Note</span></td>
                      <td style={{ fontWeight: 600 }}>{d.deliveryNumber || d.deliveryNoteNumber || 'DN'}</td>
                      <td>{d.clientName || 'N/A'}</td>
                      <td><span className="org-badge org-badge-active">{d.status}</span></td>
                      <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}</td>
                    </tr>
                  ))}
                  {activities?.tasks?.slice(0, 15).map(t => (
                    <tr key={t._id}>
                      <td><span className="org-badge org-badge-role">Task</span></td>
                      <td style={{ fontWeight: 600 }}>{t.title}</td>
                      <td>{t.priority || 'Medium'}</td>
                      <td><span className="org-badge org-badge-pending">{t.status}</span></td>
                      <td>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}</td>
                    </tr>
                  ))}
                  {(activities?.deliveryNotes?.length || 0) === 0 && (activities?.tasks?.length || 0) === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>No delivery notes or tasks recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 4: PERFORMANCE ----------------- */}
      {activeTab === 'performance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', color: '#0F172A' }}>
              Performance Evaluation Breakdown
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '20px' }}>
              Dynamic real-time calculation based on completed assignments and workflow turnaround rate.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: `8px solid ${score >= 80 ? '#10B981' : (score >= 50 ? '#3B82F6' : '#F59E0B')}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>{score}%</span>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>SCORE</span>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '240px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Completion Progress</span>
                    <span style={{ color: '#16A34A', fontWeight: 700 }}>{metrics?.completedItems || 0} / {metrics?.totalItems || 0} Completed</span>
                  </div>
                  <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: score >= 80 ? '#10B981' : '#3B82F6', borderRadius: '4px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Pending Items</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#D97706' }}>{metrics?.pendingItems || 0}</p>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Total Revenue Value</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#2563EB' }}>PKR {(metrics?.revenueAttributed || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 5: MONTHLY TREND ----------------- */}
      {activeTab === 'monthly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="org-table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700 }}>
              6-Month Historical Trajectory
            </div>
            <div className="org-table-responsive">
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Items Handled</th>
                    <th>Completed</th>
                    <th>Revenue Attributed</th>
                    <th>Performance Score</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData?.map((m, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{m.month}</td>
                      <td>{m.totalItems}</td>
                      <td style={{ color: '#16A34A', fontWeight: 600 }}>{m.completedItems}</td>
                      <td>PKR {(m.revenue || 0).toLocaleString()}</td>
                      <td>
                        <div className="org-score-box">
                          <div className="org-score-bar-bg">
                            <div className="org-score-bar-fill" style={{ width: `${m.score}%`, backgroundColor: m.score >= 80 ? '#10B981' : '#3B82F6' }} />
                          </div>
                          <span className="org-score-text">{m.score}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 6: DEPARTMENT DATA ----------------- */}
      {activeTab === 'department_data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="org-table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700 }}>
              Invoices Handled / Issued ({activities?.invoices?.length || 0})
            </div>
            <div className="org-table-responsive">
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {activities?.invoices?.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>No invoices recorded.</td></tr>
                  ) : (
                    activities.invoices.slice(0, 15).map(inv => (
                      <tr key={inv._id}>
                        <td style={{ fontWeight: 600, color: '#2563EB' }}>{inv.invoiceNumber || 'INV'}</td>
                        <td>{inv.clientName || 'N/A'}</td>
                        <td>PKR {(inv.amount || 0).toLocaleString()}</td>
                        <td>
                          <span className={`org-badge org-badge-${inv.status === 'Paid' ? 'active' : 'pending'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="org-table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700 }}>
              Attendance &amp; Leave Logs ({activities?.attendance?.length || 0} Records)
            </div>
            <div className="org-table-responsive">
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                  </tr>
                </thead>
                <tbody>
                  {activities?.attendance?.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>No recent attendance logs.</td></tr>
                  ) : (
                    activities.attendance.slice(0, 10).map((a, i) => (
                      <tr key={i}>
                        <td>{a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}</td>
                        <td><span className="org-badge org-badge-active">{a.status || 'Present'}</span></td>
                        <td>{a.checkInTime || '09:00 AM'}</td>
                        <td>{a.checkOutTime || '06:00 PM'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 7: REPORTS & EXPORT ----------------- */}
      {activeTab === 'reports' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
          <FileText size={48} color="#2563EB" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
            Generate Full Performance &amp; Audit Report PDF
          </h3>
          <p style={{ color: '#64748B', maxWidth: '480px', margin: '0 auto 24px', fontSize: '0.88rem' }}>
            Download an official Fortline executive document containing complete verified employee profile, performance score history, and activity records.
          </p>
          <button
            className="org-btn org-btn-primary"
            onClick={() => exportUserPDF(data)}
            style={{ padding: '12px 28px', fontSize: '0.95rem' }}
          >
            <FileDown size={18} />
            Download Complete User PDF
          </button>
        </div>
      )}
    </div>
  );
}
