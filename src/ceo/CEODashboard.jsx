import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { 
  TrendingUp, 
  Users, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  RefreshCw, 
  Calculator, 
  Briefcase, 
  Truck, 
  Receipt, 
  Wallet, 
  Award, 
  Calendar,
  AlertTriangle,
  Send,
  Building2,
  FileText
} from 'lucide-react';
import './CEODashboard.css';

export default function CEODashboard({ onNavigateTab, currentUser }) {
  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'Chief Executive Officer';
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  // Task assignment modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [userList, setUserList] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [taskPriority, setTaskPriority] = useState('High');
  const [taskProject, setTaskProject] = useState('Executive Directive');
  const [taskCategory, setTaskCategory] = useState('Management');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskAlert, setTaskAlert] = useState(null);

  const fetchSummary = async (selectedPeriod = period) => {
    setLoading(true);
    try {
      const qs = selectedPeriod && selectedPeriod !== 'all' ? `?period=${selectedPeriod}` : '';
      const { response, data } = await apiRequest(`/api/admin/executive-summary${qs}`);
      if (response.ok && data.success) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error('Fetch CEO executive summary error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(period);
  }, [period]);

  const openAssignTaskModal = async () => {
    setIsTaskModalOpen(true);
    setTaskAlert(null);
    try {
      const { response, data } = await apiRequest('/api/users');
      if (response.ok && data.success && Array.isArray(data.data)) {
        setUserList(data.data);
        if (data.data.length > 0 && !assignedUserId) {
          setAssignedUserId(data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Fetch users for CEO task error:', err);
    }
  };

  const handleAssignTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !assignedUserId) return;

    setSubmittingTask(true);
    setTaskAlert(null);

    let assignedTo = null;
    let assignedToName = '';
    let assignedToRole = '';

    if (assignedUserId.startsWith('role:')) {
      assignedToRole = assignedUserId.replace('role:', '');
      const roleLabels = {
        hr_manager: 'HR Department',
        accountant: 'Accounts Department',
        finance: 'Finance Department',
        sales_manager: 'Sales Department',
        project_manager: 'Project Management Department',
        marketing: 'Marketing Department',
        administration: 'Administration Department',
        support: 'Support Department',
        employee: 'All Employees'
      };
      assignedToName = roleLabels[assignedToRole] || 'Department';
    } else {
      const selectedUser = userList.find(u => u._id === assignedUserId);
      if (selectedUser) {
        assignedTo = selectedUser._id;
        assignedToName = selectedUser.fullName;
        assignedToRole = selectedUser.role;
      }
    }

    try {
      const { response, data } = await apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: taskTitle.trim(),
          project: taskProject || 'Executive Directive',
          assignedTo,
          assignedToName,
          assignedToRole,
          assignedByName: currentUser?.fullName ? `${currentUser.fullName} (CEO)` : 'CEO',
          status: 'Pending',
          priority: taskPriority,
          category: taskCategory,
          dueDate: taskDueDate || null,
          description: taskDescription.trim()
        })
      });

      if (response.ok && data.success) {
        setTaskAlert({ type: 'success', text: `Task successfully assigned to ${assignedToName}!` });
        setTaskTitle('');
        setTaskDescription('');
        fetchSummary(period);
        setTimeout(() => {
          setIsTaskModalOpen(false);
          setTaskAlert(null);
        }, 1200);
      } else {
        setTaskAlert({ type: 'error', text: data.message || 'Failed to assign task.' });
      }
    } catch (err) {
      console.error('CEO task assignment error:', err);
      setTaskAlert({ type: 'error', text: 'Server error assigning task.' });
    } finally {
      setSubmittingTask(false);
    }
  };

  const data = summary || {};

  const kpis = [
    {
      title: 'Collected Revenue',
      value: `PKR ${(data.collectedRevenue || 0).toLocaleString()}`,
      subtext: `Invoiced: PKR ${(data.totalInvoiced || 0).toLocaleString()}`,
      icon: Wallet,
      iconClass: 'icon-green',
      badge: 'Finalized Receipts'
    },
    {
      title: 'Actual Receivables',
      value: `PKR ${(data.actualReceivables || 0).toLocaleString()}`,
      subtext: `Overdue: PKR ${(data.actualOverdueAmount || 0).toLocaleString()}`,
      icon: Receipt,
      iconClass: 'icon-blue',
      badge: `${data.unpaidInvoices || 0} Unpaid Invoices`
    },
    {
      title: 'Active Sales Orders',
      value: `${data.salesOrders || 0}`,
      subtext: `${data.ordersFinanceApproved || 0} Approved • ${data.ordersPendingFinance || 0} Pending`,
      icon: TrendingUp,
      iconClass: 'icon-purple',
      badge: `PKR ${(data.totalSalesOrderRevenue || 0).toLocaleString()}`
    },
    {
      title: 'Active Organization Staff',
      value: `${data.activeEmployees || 0}`,
      subtext: `${data.salesTeamCount || 0} Sales • ${data.supportTeamCount || 0} Support • ${data.accountsTeamCount || 0} Accounts`,
      icon: Users,
      iconClass: 'icon-amber',
      badge: `${data.presentToday || 0} Present Today`
    }
  ];

  return (
    <div className="ceo-dashboard-container">
      {/* Top Header Banner */}
      <div className="ceo-banner">
        <div>
          <h1 className="ceo-banner-title">
            Good morning, {firstName}
          </h1>
          <p className="ceo-banner-subtitle">
            Executive Organizational Overview &amp; Live Workflow Metrics
          </p>
        </div>

        <div className="ceo-banner-actions">
          <div className="ceo-period-selector">
            <Calendar size={15} color="#64748B" />
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="ceo-period-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
            </select>
          </div>

          <button
            onClick={() => fetchSummary(period)}
            className="ceo-secondary-btn"
            title="Refresh Live Data"
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openAssignTaskModal}
            className="ceo-assign-btn"
          >
            <Plus size={16} />
            <span>Assign Task</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="ceo-kpi-grid">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="ceo-kpi-card">
              <div className="ceo-kpi-header">
                <span className="ceo-kpi-title">{kpi.title}</span>
                <div className={`ceo-kpi-icon ${kpi.iconClass}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="ceo-kpi-value">{kpi.value}</div>
              <div className="ceo-kpi-footer">
                <span className="ceo-badge-pos">{kpi.badge}</span>
                <span className="ceo-kpi-subtext">{kpi.subtext}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4-Stage Operational Workflow: Sales -> Support -> Accounts -> Finance */}
      <div className="ceo-card-panel" style={{ marginTop: '20px' }}>
        <div className="ceo-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>End-to-End Operational Workflow Pipeline</span>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
              Sales &rarr; Support &rarr; Accounts &rarr; Finance (Live Database Records)
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('sales_finance')}
            className="ceo-card-title-link"
          >
            Detailed Sales &amp; Finance <ArrowRight size={14} />
          </button>
        </div>

        <div className="ceo-workflow-grid">
          {/* Stage 1: Sales */}
          <div className="ceo-workflow-card">
            <div className="ceo-wf-header">
              <div className="ceo-wf-icon sales">
                <TrendingUp size={16} />
              </div>
              <span className="ceo-wf-stage">Stage 1: Sales</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Total Leads:</span>
              <span className="ceo-wf-val">{data.totalLeads || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Active / Won Deals:</span>
              <span className="ceo-wf-val">{data.activeDeals || 0} / {data.wonDealsCount || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Quotations:</span>
              <span className="ceo-wf-val">{data.activeQuotations || 0} Active ({data.convertedQuotations || 0} Converted)</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Sales Orders:</span>
              <span className="ceo-wf-val font-bold">{data.salesOrders || 0}</span>
            </div>
            <div className="ceo-wf-footer-status">
              <span className="ceo-mini-badge approved">{data.ordersFinanceApproved || 0} Approved</span>
              <span className="ceo-mini-badge pending">{data.ordersPendingFinance || 0} Pending</span>
            </div>
          </div>

          {/* Stage 2: Support */}
          <div className="ceo-workflow-card">
            <div className="ceo-wf-header">
              <div className="ceo-wf-icon support">
                <Truck size={16} />
              </div>
              <span className="ceo-wf-stage">Stage 2: Support &amp; Ops</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Orders Received:</span>
              <span className="ceo-wf-val">{data.salesOrdersReceived || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Total Delivery Notes:</span>
              <span className="ceo-wf-val font-bold">{data.totalDeliveryNotes || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Pending / In-Transit:</span>
              <span className="ceo-wf-val">{data.pendingDeliveryNotes || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Confirmed Delivered:</span>
              <span className="ceo-wf-val font-bold text-success">{data.confirmedDeliveryNotes || 0}</span>
            </div>
            <div className="ceo-wf-footer-status">
              <span className="ceo-mini-badge done">{data.confirmedDeliveryNotes || 0} Completed</span>
              <span className="ceo-mini-badge in-progress">{data.pendingDeliveryNotes || 0} In Progress</span>
            </div>
          </div>

          {/* Stage 3: Accounts */}
          <div className="ceo-workflow-card">
            <div className="ceo-wf-header">
              <div className="ceo-wf-icon accounts">
                <Receipt size={16} />
              </div>
              <span className="ceo-wf-stage">Stage 3: Accounts Billing</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">DNs Received:</span>
              <span className="ceo-wf-val">{data.deliveryNotesReceived || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Draft Invoices:</span>
              <span className="ceo-wf-val font-bold">{data.draftInvoices || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Draft Amount:</span>
              <span className="ceo-wf-val">PKR {(data.draftInvoicesAmount || 0).toLocaleString()}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Pending Finalization:</span>
              <span className="ceo-wf-val">{data.pendingFinanceFinalization || 0}</span>
            </div>
            <div className="ceo-wf-footer-status">
              <span className="ceo-mini-badge warning">{data.pendingFinanceFinalization || 0} Pending Review</span>
            </div>
          </div>

          {/* Stage 4: Finance */}
          <div className="ceo-workflow-card">
            <div className="ceo-wf-header">
              <div className="ceo-wf-icon finance">
                <Calculator size={16} />
              </div>
              <span className="ceo-wf-stage">Stage 4: Finance &amp; Cash</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Finalized Invoices:</span>
              <span className="ceo-wf-val font-bold">{data.finalInvoices || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Paid / Partial:</span>
              <span className="ceo-wf-val">{data.paidInvoices || 0} / {data.partiallyPaidInvoicesCount || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">GST / Cash Split:</span>
              <span className="ceo-wf-val">{data.gstInvoicesCount || 0} GST • {data.cashInvoicesCount || 0} Cash</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Total Collected:</span>
              <span className="ceo-wf-val font-bold text-success">PKR {(data.collectedRevenue || 0).toLocaleString()}</span>
            </div>
            <div className="ceo-wf-footer-status">
              <span className="ceo-mini-badge success">PKR {(data.collectedRevenue || 0).toLocaleString()} Paid</span>
              <span className="ceo-mini-badge danger">PKR {(data.actualReceivables || 0).toLocaleString()} Due</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real Recent Orders & Workflow Ledger */}
      <div className="ceo-card-panel" style={{ marginTop: '20px' }}>
        <div className="ceo-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>Recent Sales Orders &amp; Department Status</span>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
              Real Database Records • Live Status Handoff
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('business_overview')}
            className="ceo-card-title-link"
          >
            View Business Overview <ArrowRight size={14} />
          </button>
        </div>

        <div className="ceo-table-wrapper">
          <table className="ceo-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Client Organization</th>
                <th>Net Amount</th>
                <th>Workflow Stage</th>
                <th>Delivery Status</th>
                <th>Payment Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentOrders || []).map((order) => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{order.orderNumber}</td>
                  <td className="ceo-table-name">{order.clientName}</td>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>PKR {(order.amount || 0).toLocaleString()}</td>
                  <td>
                    <span className="ceo-status-tag active">
                      {order.workflowStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`ceo-status-tag ${order.deliveryStatus === 'Delivered' || order.deliveryStatus === 'Done' ? 'active' : 'warning'}`}>
                      {order.deliveryStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`ceo-status-tag ${order.paymentStatus === 'Paid' || order.paymentStatus === 'Fully Paid' ? 'active' : (order.paymentStatus === 'Partially Paid' ? 'warning' : 'danger')}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td style={{ color: '#64748B', fontSize: '0.8rem' }}>
                    {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {(!data.recentOrders || data.recentOrders.length === 0) && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>
                    No sales order records found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Assignment Modal */}
      {isTaskModalOpen && (
        <div className="ceo-modal-overlay">
          <div className="ceo-modal-box">
            <div className="ceo-modal-header">
              <h3>Executive Task Assignment</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="ceo-modal-close-btn">&times;</button>
            </div>

            {taskAlert && (
              <div className={`ceo-alert ${taskAlert.type}`}>
                {taskAlert.text}
              </div>
            )}

            <form onSubmit={handleAssignTaskSubmit} className="ceo-modal-form">
              <div className="ceo-form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conduct Q3 Accounts Reconciliation"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="ceo-input"
                />
              </div>

              <div className="ceo-form-row">
                <div className="ceo-form-group">
                  <label>Assign To (Manager or User) *</label>
                  <select
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    required
                    className="ceo-input"
                  >
                    <optgroup label="Departments / Managers">
                      <option value="role:sales_manager">Sales Department</option>
                      <option value="role:support">Support Department</option>
                      <option value="role:accountant">Accounts Department</option>
                      <option value="role:finance">Finance Department</option>
                      <option value="role:hr_manager">HR Department</option>
                      <option value="role:project_manager">Project Management</option>
                      <option value="role:administration">Administration</option>
                    </optgroup>
                    <optgroup label="Individual Employees">
                      {userList.map(u => (
                        <option key={u._id} value={u._id}>
                          {u.fullName} ({u.role ? u.role.replace('_', ' ') : 'Employee'})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="ceo-form-group">
                  <label>Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="ceo-input"
                  >
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="ceo-form-row">
                <div className="ceo-form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="ceo-input"
                  />
                </div>

                <div className="ceo-form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="ceo-input"
                  />
                </div>
              </div>

              <div className="ceo-form-group">
                <label>Directives &amp; Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Provide instructions for this managerial directive..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="ceo-input"
                />
              </div>

              <div className="ceo-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="ceo-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="ceo-btn-submit"
                >
                  {submittingTask ? 'Assigning...' : 'Assign Directive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
