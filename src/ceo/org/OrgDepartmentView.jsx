import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  TrendingUp,
  Briefcase,
  Calculator,
  Wallet,
  Heart,
  Users,
  FileDown,
  RefreshCw,
  Package,
  Truck,
  Plane,
  CheckCircle2,
  Clock,
  Lock,
  ArrowUpRight,
  Eye
} from 'lucide-react';
import { exportDepartmentPDF } from './OrgPDFService';

export default function OrgDepartmentView({ departmentKey = 'sales', onSelectUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDepartmentData = async () => {
    setLoading(true);
    try {
      const { response, data: resData } = await apiRequest('/api/admin/org/departments');
      if (response.ok && resData.success) {
        setData(resData.data);
      }
    } catch (err) {
      console.error('Error fetching department data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
  }, [departmentKey]);

  if (loading) {
    return (
      <div className="org-container" style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Loading department operational data...</p>
      </div>
    );
  }

  const dept = data ? data[departmentKey] : null;
  if (!dept) {
    return (
      <div className="org-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Department data not available.</p>
      </div>
    );
  }

  const getDepartmentIcon = (key) => {
    switch (key) {
      case 'sales': return <TrendingUp size={24} color="#2563EB" />;
      case 'logistics': return <Plane size={24} color="#2563EB" />;
      case 'support': return <Truck size={24} color="#0D9488" />;
      case 'accounts': return <Calculator size={24} color="#7C3AED" />;
      case 'finance': return <Wallet size={24} color="#059669" />;
      case 'hr': return <Heart size={24} color="#E11D48" />;
      default: return <Briefcase size={24} color="#2563EB" />;
    }
  };

  return (
    <div className="org-container">
      {/* Header Bar */}
      <div className="org-header-bar">
        <div className="org-header-title-group">
          <h1>
            {getDepartmentIcon(departmentKey)}
            {dept.name} Overview & Department Audit
          </h1>
          <p>
            Real-time operational records, staff roster, and output performance metrics
          </p>
        </div>

        <div className="org-actions-group">
          <button className="org-btn org-btn-secondary" onClick={fetchDepartmentData}>
            <RefreshCw size={15} />
            Refresh
          </button>

          <button className="org-btn org-btn-primary" onClick={() => exportDepartmentPDF(departmentKey, dept)}>
            <FileDown size={16} />
            Export Dept PDF
          </button>
        </div>
      </div>

      {/* Department KPI Grid */}
      <div className="org-kpi-grid">
        <div className="org-kpi-card">
          <div className="org-kpi-header">
            <span className="org-kpi-title">Department Score</span>
            <div className="org-kpi-icon" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <span className="org-kpi-value">{dept.score || 0}%</span>
          <span className="org-kpi-subtext">Aggregated staff efficiency</span>
        </div>

        <div className="org-kpi-card">
          <div className="org-kpi-header">
            <span className="org-kpi-title">Active Personnel</span>
            <div className="org-kpi-icon" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
              <Users size={18} />
            </div>
          </div>
          <span className="org-kpi-value">{dept.users?.length || 0}</span>
          <span className="org-kpi-subtext">Registered employees</span>
        </div>

        {departmentKey === 'sales' && (
          <>
            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Total Sales Orders</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                  <Package size={18} />
                </div>
              </div>
              <span className="org-kpi-value">{dept.kpis?.totalOrders || 0}</span>
              <span className="org-kpi-subtext">
                PKR {(dept.kpis?.totalOrderAmount || 0).toLocaleString()} Total Value
              </span>
            </div>

            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Won Deals Revenue</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <Wallet size={18} />
                </div>
              </div>
              <span className="org-kpi-value">
                PKR {(dept.kpis?.wonRevenue || 0).toLocaleString()}
              </span>
              <span className="org-kpi-subtext">
                {dept.kpis?.wonDeals || 0} Deals Won
              </span>
            </div>
          </>
        )}

        {departmentKey === 'logistics' && (
          <>
            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Total Shipments</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                  <Plane size={18} />
                </div>
              </div>
              <span className="org-kpi-value">{dept.kpis?.totalShipments || 0}</span>
              <span className="org-kpi-subtext">
                {dept.kpis?.blueFileOrders || 0} Blue File Orders
              </span>
            </div>

            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">In-Transit &amp; Received</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                  <Truck size={18} />
                </div>
              </div>
              <span className="org-kpi-value">
                {dept.kpis?.inTransitShipments || 0} / {dept.kpis?.receivedShipments || 0}
              </span>
              <span className="org-kpi-subtext">
                {dept.kpis?.receivedShipments || 0} Received in Office
              </span>
            </div>
          </>
        )}

        {departmentKey === 'support' && (
          <>
            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Total Delivery Notes</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#CCFBF1', color: '#0D9488' }}>
                  <Truck size={18} />
                </div>
              </div>
              <span className="org-kpi-value">{dept.kpis?.totalDeliveryNotes || 0}</span>
              <span className="org-kpi-subtext">{dept.kpis?.confirmedDNs || 0} Confirmed / Delivered</span>
            </div>

            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Pending Fulfillment</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <Clock size={18} />
                </div>
              </div>
              <span className="org-kpi-value">{dept.kpis?.pendingDNs || 0}</span>
              <span className="org-kpi-subtext">In warehouse or transit</span>
            </div>
          </>
        )}

        {departmentKey === 'accounts' && (
          <>
            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Total Invoiced</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                  <Calculator size={18} />
                </div>
              </div>
              <span className="org-kpi-value">PKR {(dept.kpis?.totalInvoiced || 0).toLocaleString()}</span>
              <span className="org-kpi-subtext">{dept.kpis?.totalInvoices || 0} Invoices Issued</span>
            </div>

            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Outstanding Receivables</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
                  <Clock size={18} />
                </div>
              </div>
              <span className="org-kpi-value">PKR {(dept.kpis?.outstandingReceivables || 0).toLocaleString()}</span>
              <span className="org-kpi-subtext">Awaiting payment</span>
            </div>
          </>
        )}

        {departmentKey === 'finance' && (
          <>
            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Revenue Collected</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                  <Wallet size={18} />
                </div>
              </div>
              <span className="org-kpi-value">PKR {(dept.kpis?.totalCollectedRevenue || 0).toLocaleString()}</span>
              <span className="org-kpi-subtext">{dept.kpis?.paymentsCount || 0} Customer Payments</span>
            </div>

            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Net Margin</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <span className="org-kpi-value">PKR {(dept.kpis?.netProfit || 0).toLocaleString()}</span>
              <span className="org-kpi-subtext">After PKR {(dept.kpis?.totalExpenses || 0).toLocaleString()} expenses</span>
            </div>
          </>
        )}

        {departmentKey === 'hr' && (
          <>
            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Attendance Rate</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#FFE4E6', color: '#E11D48' }}>
                  <Heart size={18} />
                </div>
              </div>
              <span className="org-kpi-value">{dept.kpis?.attendanceRate || 100}%</span>
              <span className="org-kpi-subtext">Present on duty</span>
            </div>

            <div className="org-kpi-card">
              <div className="org-kpi-header">
                <span className="org-kpi-title">Active Staff</span>
                <div className="org-kpi-icon" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <span className="org-kpi-value">{dept.kpis?.activeEmployees || 0}</span>
              <span className="org-kpi-subtext">{dept.kpis?.pendingLeaves || 0} Pending Leaves</span>
            </div>
          </>
        )}
      </div>

      {/* Department Staff Table */}
      <div className="org-table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Department Staff Roster ({dept.users?.length || 0})</span>
        </div>
        <div className="org-table-responsive">
          <table className="org-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Email</th>
                <th>Status</th>
                <th>Last Active</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dept.users?.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>No employees registered in this department.</td></tr>
              ) : (
                dept.users?.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="org-user-cell">
                        <div className="org-avatar">
                          {u.profileImage ? <img src={u.profileImage} alt={u.fullName} /> : u.fullName?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="org-user-cell-info">
                          <span className="org-user-cell-name">{u.fullName}</span>
                          <span className="org-user-cell-sub">{u.employeeId ? `ID: ${u.employeeId}` : ''}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="org-badge org-badge-role">{(u.role || '').replace('_', ' ').toUpperCase()}</span></td>
                    <td>{u.email}</td>
                    <td><span className={`org-badge org-badge-${u.status === 'active' ? 'active' : 'inactive'}`}>{(u.status || 'active').toUpperCase()}</span></td>
                    <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="org-btn org-btn-outline"
                        onClick={() => onSelectUser && onSelectUser(u)}
                        style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                      >
                        <Eye size={13} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Records Section */}
      <div className="org-table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700 }}>
          Live Department Operational Records (Read-Only)
        </div>
        <div className="org-table-responsive">
          {departmentKey === 'sales' && (
            <table className="org-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Client</th>
                  <th>Total Amount</th>
                  <th>Delivery Status</th>
                  <th>Payment Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {dept.records?.salesOrders?.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>No sales orders recorded.</td></tr>
                ) : (
                  dept.records?.salesOrders?.slice(0, 20).map(o => (
                    <tr key={o._id}>
                      <td style={{ fontWeight: 600, color: '#2563EB' }}>{o.orderNumber || o.orderReference || 'N/A'}</td>
                      <td>{o.clientName}</td>
                      <td>PKR {(o.netAmount || o.totalAmount || 0).toLocaleString()}</td>
                      <td><span className="org-badge org-badge-dept">{o.deliveryStatus || 'Pending'}</span></td>
                      <td><span className="org-badge org-badge-active">{o.paymentStatus || 'Pending'}</span></td>
                      <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {departmentKey === 'logistics' && (
            <table className="org-table">
              <thead>
                <tr>
                  <th>Shipment ID</th>
                  <th>Sales Order</th>
                  <th>Customer</th>
                  <th>Supplier &amp; Country</th>
                  <th>Flight / Carrier</th>
                  <th>ETA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dept.records?.shipments?.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>No international shipments recorded.</td></tr>
                ) : (
                  dept.records?.shipments?.slice(0, 20).map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600, color: '#2563EB' }}>{s.shipmentId || 'SHP'}</td>
                      <td>{s.salesOrderNumber || '—'}</td>
                      <td>{s.clientName || '—'}</td>
                      <td>{s.supplierName} ({s.supplierCountry || 'Int'})</td>
                      <td>{s.flightNumber || s.carrier || '—'}</td>
                      <td>{s.eta ? new Date(s.eta).toLocaleDateString() : 'Pending'}</td>
                      <td><span className={`org-badge org-badge-${s.status === 'Received in Office' ? 'active' : 'dept'}`}>{s.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {departmentKey === 'support' && (
            <table className="org-table">
              <thead>
                <tr>
                  <th>Delivery Note #</th>
                  <th>Client</th>
                  <th>Carrier</th>
                  <th>Scheduled Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dept.records?.deliveryNotes?.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>No delivery notes recorded.</td></tr>
                ) : (
                  dept.records?.deliveryNotes?.slice(0, 20).map(d => (
                    <tr key={d._id}>
                      <td style={{ fontWeight: 600, color: '#0D9488' }}>{d.deliveryNumber || d.deliveryNoteNumber || 'DN'}</td>
                      <td>{d.clientName || 'N/A'}</td>
                      <td>{d.carrier || 'Standard'}</td>
                      <td>{d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString() : ''}</td>
                      <td><span className="org-badge org-badge-active">{d.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {departmentKey === 'accounts' && (
            <table className="org-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {dept.records?.invoices?.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>No invoices recorded.</td></tr>
                ) : (
                  dept.records?.invoices?.slice(0, 20).map(inv => (
                    <tr key={inv._id}>
                      <td style={{ fontWeight: 600, color: '#7C3AED' }}>{inv.invoiceNumber || 'INV'}</td>
                      <td>{inv.clientName}</td>
                      <td>PKR {(inv.amount || 0).toLocaleString()}</td>
                      <td><span className={`org-badge org-badge-${inv.status === 'Paid' ? 'active' : 'pending'}`}>{inv.status}</span></td>
                      <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {departmentKey === 'finance' && (
            <table className="org-table">
              <thead>
                <tr>
                  <th>Payment Ref #</th>
                  <th>Customer</th>
                  <th>Amount Received</th>
                  <th>Payment Method</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {dept.records?.payments?.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>No customer payments recorded.</td></tr>
                ) : (
                  dept.records?.payments?.slice(0, 20).map(p => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 600, color: '#059669' }}>{p.paymentRefNumber || 'PAY'}</td>
                      <td>{p.customerName}</td>
                      <td>PKR {(p.amount || 0).toLocaleString()}</td>
                      <td><span className="org-badge org-badge-dept">{p.paymentMethod}</span></td>
                      <td>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {departmentKey === 'hr' && (
            <table className="org-table">
              <thead>
                <tr>
                  <th>Employee / Applicant</th>
                  <th>Request Type</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {dept.records?.leaves?.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>No leave requests on file.</td></tr>
                ) : (
                  dept.records?.leaves?.slice(0, 20).map(l => (
                    <tr key={l._id}>
                      <td style={{ fontWeight: 600 }}>{l.user?.fullName || 'Employee'}</td>
                      <td>{l.leaveType || 'General Leave'}</td>
                      <td><span className={`org-badge org-badge-${l.status === 'Approved' ? 'active' : 'pending'}`}>{l.status}</span></td>
                      <td>{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
