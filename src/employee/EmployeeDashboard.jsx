import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  Briefcase,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Calendar,
  MoreVertical,
  CheckSquare,
  MessageSquare,
  GitCommit,
  Users,
  FileText,
  Target,
  PhoneCall,
  DollarSign,
  ShoppingCart,
  BarChart2,
  FolderKanban,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Activity
} from 'lucide-react';
import './EmployeeDashboard.css';

export default function EmployeeDashboard({ currentUser, onNavigateTab, onOpenNewTaskModal }) {
  const [tasksList, setTasksList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesStats, setSalesStats] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);

  const isSalesDept = (currentUser?.department || '').trim().toLowerCase() === 'sales';
  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'there';
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Fetch real tasks and projects from MongoDB
  const fetchTasksAndProjects = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        apiRequest('/api/tasks'),
        apiRequest('/api/projects')
      ]);

      if (tasksRes.response.ok && tasksRes.data.success && Array.isArray(tasksRes.data.data)) {
        setTasksList(tasksRes.data.data.map(t => ({
          ...t,
          id: t._id,
          project: t.project || 'General CRM',
          dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date',
          priority: t.priority || 'Medium'
        })));
      }

      if (projectsRes.response.ok && projectsRes.data.success && Array.isArray(projectsRes.data.data)) {
        setProjectsList(projectsRes.data.data);
      }
    } catch (err) {
      console.error('Fetch tasks & projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real sales stats and activities from MongoDB (only if sales department)
  const fetchSalesData = async () => {
    if (!isSalesDept) return;
    setSalesLoading(true);
    try {
      const [statsRes, actRes] = await Promise.all([
        apiRequest('/api/sales-employee/stats'),
        apiRequest('/api/sales-employee/activities')
      ]);

      if (statsRes.response.ok && statsRes.data.success) {
        setSalesStats(statsRes.data.data);
      }
      if (actRes.response.ok && actRes.data.success && Array.isArray(actRes.data.data)) {
        setRecentActivities(actRes.data.data.slice(0, 6));
      }
    } catch (err) {
      console.error('Fetch sales stats error:', err);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndProjects();
    if (isSalesDept) {
      fetchSalesData();
    }
  }, [isSalesDept]);

  const handleToggleTaskStatus = async (id) => {
    const task = tasksList.find(t => t.id === id);
    const nextStatus = task?.status === 'Completed' ? 'In Progress' : 'Completed';
    setTasksList(tasksList.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    try {
      await apiRequest(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      if (isSalesDept) fetchSalesData();
    } catch (e) {
      console.error('Update task error:', e);
    }
  };

  const salesPerf = salesStats?.salesPerformance || {
    monthlyTarget: salesStats?.monthlyTarget || 0,
    salesAchieved: salesStats?.salesAchieved || 0,
    remainingTarget: salesStats?.remainingTarget || 0,
    targetAchievementPct: salesStats?.targetAchievementPct || 0,
    totalLeads: salesStats?.totalLeads || 0,
    convertedLeads: salesStats?.convertedLeads || 0,
    qualifiedLeads: 0,
    leadConversionRate: 0,
    totalQuotations: salesStats?.totalQuotations || 0,
    acceptedQuotations: salesStats?.acceptedQuotations || 0,
    totalOrders: salesStats?.totalOrders || 0,
    completedOrders: salesStats?.completedOrders || 0,
    wonDealsCount: 0,
    wonDealsValue: 0
  };

  const finPerf = salesStats?.financialPerformance || {
    receivables: salesStats?.receivables || 0,
    overdueAmount: salesStats?.overdueAmount || 0,
    salaryTarget: salesStats?.salaryTarget || 0,
    liability: salesStats?.liability || 0,
    netRevenue: salesStats?.salesAchieved || 0,
    totalInvoicesCount: salesStats?.totalInvoicesCount || 0,
    approvedInvoicesCount: salesStats?.approvedInvoicesCount || 0,
    paidInvoicesAmount: salesStats?.paidInvoicesAmount || 0
  };

  const pendingTasks = tasksList.filter(t => t.status !== 'Completed');
  const completedTasks = tasksList.filter(t => t.status === 'Completed');

  // ══════════════════════════════════════════════════════════════
  // STANDARD EMPLOYEE PORTAL (For Non-Sales Departments)
  // ══════════════════════════════════════════════════════════════
  if (!isSalesDept) {
    return (
      <div className="employee-dashboard-container">
        {/* Top Welcome Banner */}
        <div className="employee-welcome-banner">
          <div className="employee-welcome-left">
            <h2 className="welcome-title">Welcome back, {firstName} 👋</h2>
            <p className="welcome-subtitle">
              {currentUser?.department ? `${currentUser.department} Department` : 'Employee Workspace'} — Overview of your active tasks, projects, and work deliverables for {todayFormatted}
            </p>
          </div>
          <div className="welcome-quick-actions">
            <button className="sv-btn-primary" onClick={onOpenNewTaskModal}>
              <Plus size={15} /> New Task
            </button>
            <button className="sv-btn-cancel" onClick={() => onNavigateTab?.('work_updates')}>
              <FileText size={15} /> Work Updates
            </button>
          </div>
        </div>

        {/* 4 Standard Employee Metric Cards */}
        <div className="hero-pills-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '20px' }}>
          <div className="hero-pill-item" onClick={() => onNavigateTab?.('tasks')} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px' }}>
            <span className="pill-title" style={{ fontSize: '0.85rem', color: '#64748B' }}>Total Tasks</span>
            <span className="pill-value" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>{tasksList.length}</span>
            <span className="pill-sub" style={{ color: '#2563EB', fontWeight: 600 }}>Assigned to you</span>
          </div>

          <div className="hero-pill-item" onClick={() => onNavigateTab?.('tasks')} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px' }}>
            <span className="pill-title" style={{ fontSize: '0.85rem', color: '#64748B' }}>In Progress</span>
            <span className="pill-value" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706' }}>{pendingTasks.length}</span>
            <span className="pill-sub" style={{ color: '#D97706', fontWeight: 600 }}>Active task queue</span>
          </div>

          <div className="hero-pill-item" onClick={() => onNavigateTab?.('completed_tasks')} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px' }}>
            <span className="pill-title" style={{ fontSize: '0.85rem', color: '#64748B' }}>Completed</span>
            <span className="pill-value" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981' }}>{completedTasks.length}</span>
            <span className="pill-sub" style={{ color: '#10B981', fontWeight: 600 }}>Finished items</span>
          </div>

          <div className="hero-pill-item" onClick={() => onNavigateTab?.('projects')} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px' }}>
            <span className="pill-title" style={{ fontSize: '0.85rem', color: '#64748B' }}>Assigned Projects</span>
            <span className="pill-value" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6366F1' }}>{projectsList.length}</span>
            <span className="pill-sub" style={{ color: '#6366F1', fontWeight: 600 }}>Active projects</span>
          </div>
        </div>

        {/* Bottom Section: Assigned Projects & Pending Tasks */}
        <div className="employee-bottom-grid">
          {/* ASSIGNED PROJECTS */}
          <div className="employee-widget-card assigned-projects-widget">
            <div className="widget-header">
              <div className="widget-title-area">
                <FolderKanban size={18} color="#2563EB" />
                <h3>My Assigned Projects</h3>
              </div>
              <button className="widget-action-link" onClick={() => onNavigateTab?.('projects')}>
                View All <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="projects-scroll-list">
              {projectsList.length === 0 ? (
                <div className="sv-empty" style={{ padding: '28px 0' }}>
                  No assigned projects at this time.
                </div>
              ) : (
                projectsList.slice(0, 6).map((project) => (
                  <div key={project._id} className="project-item-card">
                    <div className="project-item-left">
                      <div className="project-icon-box">
                        <Briefcase size={16} color="#2563EB" />
                      </div>
                      <div className="project-item-info">
                        <h4 className="project-title">{project.name}</h4>
                        <div className="project-meta">
                          <span className="project-client">{project.client || 'Internal Project'}</span>
                          <span className="project-date">Due {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Ongoing'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="project-item-right">
                      <span className={`priority-badge ${(project.priority || 'medium').toLowerCase()}`}>
                        {project.priority || 'Medium'}
                      </span>
                      <span className="project-status-pill">
                        {project.status || 'Active'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PENDING TASKS */}
          <div className="employee-widget-card pending-tasks-widget">
            <div className="widget-header">
              <div className="widget-title-area">
                <CheckSquare size={18} color="#D97706" />
                <h3>My Task Checklist ({pendingTasks.length})</h3>
              </div>
              <button className="widget-action-link" onClick={() => onNavigateTab?.('tasks')}>
                Task Board <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="tasks-list">
              {pendingTasks.length === 0 ? (
                <div className="sv-empty" style={{ padding: '28px 0' }}>
                  <CheckCircle2 size={32} color="#10B981" style={{ marginBottom: '8px' }} />
                  <p>All caught up! No pending tasks.</p>
                </div>
              ) : (
                pendingTasks.slice(0, 6).map((task) => (
                  <div key={task.id} className="task-item-card">
                    <div className="task-left">
                      <input
                        type="checkbox"
                        checked={task.status === 'Completed'}
                        onChange={() => handleToggleTaskStatus(task.id)}
                        className="task-checkbox"
                      />
                      <div className="task-info">
                        <span className="task-title">{task.title}</span>
                        <div className="task-meta-row">
                          <span className="task-project-tag">{task.project}</span>
                          <span className="task-due-date">Due: {task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="task-right">
                      <span className={`priority-badge ${(task.priority || 'medium').toLowerCase()}`}>
                        {task.priority || 'Medium'}
                      </span>
                      <span className="status-pill in-progress">
                        {task.status || 'In Progress'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // SALES MEMBER DASHBOARD (For Sales Department Employees)
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="employee-dashboard-container">
      {/* Top Welcome Banner */}
      <div className="employee-welcome-banner">
        <div className="employee-welcome-left">
          <h2 className="welcome-title">Welcome back, {firstName} 👋</h2>
          <p className="welcome-subtitle">Here is your real-time sales quota, deals pipeline, and performance dashboard for {todayFormatted}</p>
        </div>
        <div className="welcome-quick-actions">
          <button className="sv-btn-primary" onClick={() => onNavigateTab?.('my_leads')}>
            <Plus size={15} /> New Lead
          </button>
          <button className="sv-btn-cancel" onClick={() => onNavigateTab?.('my_deals')}>
            Deals Pipeline
          </button>
        </div>
      </div>

      {/* ── TOP SECTION: 2 HERO KPI CARDS (Sales Performance & Financial Performance) ── */}
      <div className="hero-kpi-row">
        {/* HERO CARD 1: SALES PERFORMANCE */}
        <div className="hero-kpi-card sales-hero-card">
          <div className="hero-card-header">
            <div className="hero-header-left">
              <div className="hero-icon-box sales">
                <Target size={22} color="#FFFFFF" />
              </div>
              <div>
                <h3 className="hero-card-title">Sales Performance</h3>
                <p className="hero-card-subtitle">Monthly sales quota & deal conversion</p>
              </div>
            </div>
            <div className="hero-badge-pct">
              <span>{salesPerf.targetAchievementPct}%</span>
              <span className="hero-badge-sub">Achieved</span>
            </div>
          </div>

          <div className="hero-card-main-val">
            <div className="hero-val-group">
              <span className="hero-val-label">Sales Achieved</span>
              <span className="hero-val-num" title={`Rs. ${Number(salesPerf.salesAchieved || 0).toLocaleString()}`}>
                <span className="hero-val-prefix">Rs.</span>
                <span className="hero-val-text">{Math.round(Number(salesPerf.salesAchieved || 0)).toLocaleString()}</span>
              </span>
            </div>
            <div className="hero-val-group">
              <span className="hero-val-label">Target Quota</span>
              <span className="hero-val-num light" title={`Rs. ${Number(salesPerf.monthlyTarget || 0).toLocaleString()}`}>
                <span className="hero-val-prefix">Rs.</span>
                <span className="hero-val-text">{Math.round(Number(salesPerf.monthlyTarget || 0)).toLocaleString()}</span>
              </span>
            </div>
            <div className="hero-val-group">
              <span className="hero-val-label">Remaining</span>
              <span className="hero-val-num rem" title={`Rs. ${Number(salesPerf.remainingTarget || 0).toLocaleString()}`}>
                <span className="hero-val-prefix">Rs.</span>
                <span className="hero-val-text">{Math.round(Number(salesPerf.remainingTarget || 0)).toLocaleString()}</span>
              </span>
            </div>
          </div>

          {/* Target Progress Bar */}
          <div className="hero-progress-track">
            <div
              className="hero-progress-fill sales"
              style={{ width: `${Math.min(100, salesPerf.targetAchievementPct)}%` }}
            />
          </div>

          {/* Sales Performance Key Metric Pills */}
          <div className="hero-pills-grid">
            <div className="hero-pill-item" onClick={() => onNavigateTab?.('my_leads')}>
              <span className="pill-title">Total Leads</span>
              <span className="pill-value">{salesPerf.totalLeads}</span>
              <span className="pill-sub positive">+{salesPerf.convertedLeads} Converted</span>
            </div>
            <div className="hero-pill-item" onClick={() => onNavigateTab?.('my_deals')}>
              <span className="pill-title">Won Deals</span>
              <span className="pill-value" style={{ color: '#059669' }}>{salesPerf.wonDealsCount || 0}</span>
              <span className="pill-sub">Rs. {Math.round(Number(salesPerf.wonDealsValue || 0)).toLocaleString()} volume</span>
            </div>
            <div className="hero-pill-item" onClick={() => onNavigateTab?.('my_quotations')}>
              <span className="pill-title">Quotations</span>
              <span className="pill-value">{salesPerf.totalQuotations}</span>
              <span className="pill-sub">{salesPerf.acceptedQuotations} Accepted</span>
            </div>
            <div className="hero-pill-item" onClick={() => onNavigateTab?.('my_orders')}>
              <span className="pill-title">Sales Orders</span>
              <span className="pill-value">{salesPerf.totalOrders}</span>
              <span className="pill-sub">{salesPerf.completedOrders} Delivered</span>
            </div>
          </div>
        </div>

        {/* HERO CARD 2: FINANCIAL PERFORMANCE */}
        <div className="hero-kpi-card financial-hero-card">
          <div className="hero-card-header">
            <div className="hero-header-left">
              <div className="hero-icon-box finance">
                <DollarSign size={22} color="#FFFFFF" />
              </div>
              <div>
                <h3 className="hero-card-title">Financial Performance</h3>
                <p className="hero-card-subtitle">Receivables, overdue balances & settlement</p>
              </div>
            </div>
            <div className="hero-badge-pct green">
              <span>Rs. {Math.round(Number(finPerf.netRevenue || 0)).toLocaleString()}</span>
              <span className="hero-badge-sub">Net Revenue</span>
            </div>
          </div>

          <div className="hero-card-main-val">
            <div className="hero-val-group">
              <span className="hero-val-label">Overdue Amount</span>
              <span className="hero-val-num" style={{ color: finPerf.overdueAmount > 0 ? '#DC2626' : '#059669' }} title={`Rs. ${Number(finPerf.overdueAmount || 0).toLocaleString()}`}>
                <span className="hero-val-prefix">Rs.</span>
                <span className="hero-val-text">{Math.round(Number(finPerf.overdueAmount || 0)).toLocaleString()}</span>
              </span>
            </div>
            <div className="hero-val-group">
              <span className="hero-val-label">Total Receivables</span>
              <span className="hero-val-num" style={{ color: '#0284C7' }} title={`Rs. ${Number(finPerf.receivables || 0).toLocaleString()}`}>
                <span className="hero-val-prefix">Rs.</span>
                <span className="hero-val-text">{Math.round(Number(finPerf.receivables || 0)).toLocaleString()}</span>
              </span>
            </div>
            <div className="hero-val-group">
              <span className="hero-val-label">Salary Target</span>
              <span className="hero-val-num light" title={`Rs. ${Number(finPerf.salaryTarget || 0).toLocaleString()}`}>
                <span className="hero-val-prefix">Rs.</span>
                <span className="hero-val-text">{Math.round(Number(finPerf.salaryTarget || 0)).toLocaleString()}</span>
              </span>
            </div>
          </div>

          {/* Financial Indicator Bar */}
          <div className="hero-progress-track">
            <div
              className="hero-progress-fill finance"
              style={{
                width: finPerf.overdueAmount > 0 ? '60%' : '100%',
                background: finPerf.overdueAmount > 0
                  ? 'linear-gradient(90deg, #10B981 70%, #EF4444 100%)'
                  : 'linear-gradient(90deg, #10B981, #059669)'
              }}
            />
          </div>

          {/* Financial Performance Key Metric Pills */}
          <div className="hero-pills-grid">
            <div className="hero-pill-item" onClick={() => onNavigateTab?.('my_invoices')}>
              <span className="pill-title">Approved Invoices</span>
              <span className="pill-value">{finPerf.approvedInvoicesCount || 0}</span>
              <span className="pill-sub">Total {finPerf.totalInvoicesCount || 0} Invoices</span>
            </div>
            <div className="hero-pill-item" onClick={() => onNavigateTab?.('my_invoices')}>
              <span className="pill-title">Settled Invoices</span>
              <span className="pill-value" style={{ color: '#059669' }}>
                Rs. {Number(finPerf.paidInvoicesAmount || 0).toLocaleString()}
              </span>
              <span className="pill-sub positive">Collected</span>
            </div>
            <div className="hero-pill-item">
              <span className="pill-title">Liabilities</span>
              <span className="pill-value" style={{ color: '#64748B' }}>
                Rs. {Number(finPerf.liability || 0).toLocaleString()}
              </span>
              <span className="pill-sub">Cancellations/Returns</span>
            </div>
            <div className="hero-pill-item" onClick={() => onNavigateTab?.('sales_targets')}>
              <span className="pill-title">Follow-ups Done</span>
              <span className="pill-value">{salesPerf.completedFollowUps || 0}</span>
              <span className="pill-sub">{salesPerf.totalFollowUps || 0} Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE SECTION: SALES WORKFLOW & RECENT ACTIVITY ── */}
      <div className="employee-middle-grid">
        {/* Quick Sales Navigation Cards */}
        <div className="sales-quick-nav-card">
          <div className="widget-header">
            <div className="widget-title-area">
              <TrendingUp size={18} color="#2563EB" />
              <h3>Sales Workflow & Pipelines</h3>
            </div>
            <span className="widget-badge-count">{salesPerf.totalLeads + salesPerf.totalOrders} records</span>
          </div>

          <div className="sales-quick-grid">
            <div className="sales-workflow-item" onClick={() => onNavigateTab?.('my_leads')}>
              <div className="sw-icon-box blue"><Users size={18} /></div>
              <div className="sw-info">
                <h4>My Leads</h4>
                <p>{salesPerf.totalLeads} active leads assigned to you</p>
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </div>

            <div className="sales-workflow-item" onClick={() => onNavigateTab?.('my_deals')}>
              <div className="sw-icon-box green"><DollarSign size={18} /></div>
              <div className="sw-info">
                <h4>Deals Pipeline</h4>
                <p>{salesPerf.wonDealsCount || 0} won deals ready for invoice</p>
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </div>

            <div className="sales-workflow-item" onClick={() => onNavigateTab?.('my_quotations')}>
              <div className="sw-icon-box purple"><FileText size={18} /></div>
              <div className="sw-info">
                <h4>Quotations</h4>
                <p>{salesPerf.totalQuotations} formal proposals sent</p>
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </div>

            <div className="sales-workflow-item" onClick={() => onNavigateTab?.('my_invoices')}>
              <div className="sw-icon-box amber"><DollarSign size={18} /></div>
              <div className="sw-info">
                <h4>Sales Invoices</h4>
                <p>Generate & track invoices synced with Finance</p>
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </div>
          </div>
        </div>

        {/* Real Activity Stream from SalesActivity Collection */}
        <div className="sales-activity-stream-card">
          <div className="widget-header">
            <div className="widget-title-area">
              <Activity size={18} color="#10B981" />
              <h3>Recent Sales Activities</h3>
            </div>
            <button className="widget-action-link" onClick={() => onNavigateTab?.('sales_activities')}>
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="sales-activity-list">
            {recentActivities.length === 0 ? (
              <div className="sv-empty" style={{ padding: '24px 0' }}>
                No recent sales activity recorded yet. Actions you take on leads, quotations, deals, and orders will appear here automatically.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act._id} className="sales-activity-row-item">
                  <div className="sales-act-dot" />
                  <div className="sales-act-content">
                    <div className="sales-act-header">
                      <span className="sales-act-type">{act.type}</span>
                      <span className="sales-act-time">
                        {act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="sales-act-desc">{act.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: ASSIGNED PROJECTS & PENDING TASKS (Hidden for Sales Team Members) ── */}
      {!isSalesDept && (
        <div className="employee-bottom-grid">
          {/* ASSIGNED PROJECTS */}
          <div className="employee-widget-card assigned-projects-widget">
            <div className="widget-header">
              <div className="widget-title-area">
                <FolderKanban size={18} color="#2563EB" />
                <h3>Assigned Projects</h3>
              </div>
              <button className="widget-action-link" onClick={() => onNavigateTab?.('projects')}>
                All Projects <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="projects-scroll-list">
              {projectsList.length === 0 ? (
                <div className="sv-empty" style={{ padding: '28px 0' }}>
                  No assigned projects at this time.
                </div>
              ) : (
                projectsList.slice(0, 5).map((project) => (
                  <div key={project._id} className="project-item-card">
                    <div className="project-item-left">
                      <div className="project-icon-box">
                        <Briefcase size={16} color="#2563EB" />
                      </div>
                      <div className="project-item-info">
                        <h4 className="project-title">{project.name}</h4>
                        <div className="project-meta">
                          <span className="project-client">{project.client || 'Internal Client'}</span>
                          <span className="project-date">Due {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Ongoing'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="project-item-right">
                      <span className={`priority-badge ${(project.priority || 'medium').toLowerCase()}`}>
                        {project.priority || 'Medium'}
                      </span>
                      <span className="project-status-pill">
                        {project.status || 'Active'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PENDING TASKS */}
          <div className="employee-widget-card pending-tasks-widget">
            <div className="widget-header">
              <div className="widget-title-area">
                <CheckSquare size={18} color="#D97706" />
                <h3>Pending Tasks ({pendingTasks.length})</h3>
              </div>
              <button className="widget-action-link" onClick={() => onNavigateTab?.('tasks')}>
                Task Board <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="tasks-list">
              {pendingTasks.length === 0 ? (
                <div className="sv-empty" style={{ padding: '28px 0' }}>
                  <CheckCircle2 size={32} color="#10B981" style={{ marginBottom: '8px' }} />
                  <p>All caught up! No pending tasks.</p>
                </div>
              ) : (
                pendingTasks.slice(0, 6).map((task) => (
                  <div key={task.id} className="task-item-card">
                    <div className="task-left">
                      <input
                        type="checkbox"
                        checked={task.status === 'Completed'}
                        onChange={() => handleToggleTaskStatus(task.id)}
                        className="task-checkbox"
                      />
                      <div className="task-info">
                        <span className="task-title">{task.title}</span>
                        <div className="task-meta-row">
                          <span className="task-project-tag">{task.project}</span>
                          <span className="task-due-date">Due: {task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="task-right">
                      <span className={`priority-badge ${(task.priority || 'medium').toLowerCase()}`}>
                        {task.priority || 'Medium'}
                      </span>
                      <span className="status-pill in-progress">
                        {task.status || 'In Progress'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
