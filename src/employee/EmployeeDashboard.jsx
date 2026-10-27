import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  Briefcase,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  CheckSquare,
  FileText,
  Target,
  DollarSign,
  ShoppingCart,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';
import './EmployeeDashboard.css';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const money = value => `Rs. ${Number(value || 0).toLocaleString()}`;

const DashboardTile = ({ icon: Icon, label, count, amount, note, onClick, tone = '#2563EB' }) => (
  <button type="button" className="sales-dashboard-nine-tile" onClick={onClick} disabled={!onClick}>
    <span className="sales-dashboard-nine-icon" style={{ color: tone, background: `${tone}14` }}><Icon size={21} /></span>
    <span className="sales-dashboard-nine-label">{label}</span>
    {count != null && <span className="sales-dashboard-nine-count">{count}</span>}
    <span className="sales-dashboard-nine-amount">{amount}</span>
    {note && <span className="sales-dashboard-nine-note">{note}</span>}
  </button>
);

export default function EmployeeDashboard({ currentUser, onNavigateTab, onOpenNewTaskModal }) {
  const [tasksList, setTasksList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [salesStats, setSalesStats] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [targetPerformance, setTargetPerformance] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const isAhmedAnjum = (currentUser?.fullName || '').toLowerCase().includes('ahmed') ||
    (currentUser?.email || '').toLowerCase().includes('quote@fortline.net') ||
    (currentUser?.email || '').toLowerCase().includes('ahmed');
  const isSalesRep = isAhmedAnjum || 
    (currentUser?.position || '').toLowerCase().includes('representative') || 
    (currentUser?.position || '').toLowerCase().includes('sales rep') ||
    (currentUser?.role || '').toLowerCase() === 'sales_rep';
  const isSalesDept = (currentUser?.department || '').trim().toLowerCase() === 'sales' ||
    (currentUser?.role || '').toLowerCase() === 'sales_member' ||
    (currentUser?.role || '').toLowerCase() === 'sales_rep' ||
    (currentUser?.role || '').toLowerCase() === 'sales_person' ||
    isSalesRep;
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
    }
  };

  // Fetch real sales dashboard and Target Performance data (only for Sales)
  const fetchSalesData = async () => {
    if (!isSalesDept) return;
    setSalesLoading(true);
    try {
      const [statsRes, targetRes] = await Promise.all([
        apiRequest(`/api/sales-employee/stats?month=${selectedMonth}`),
        apiRequest(`/api/target-performance/me?month=${selectedMonth}`)
      ]);

      if (statsRes.response.ok && statsRes.data.success) {
        setSalesStats(statsRes.data.data);
      }
      if (targetRes.response.ok && targetRes.data.success) {
        setTargetPerformance(targetRes.data.data || null);
      } else {
        setTargetPerformance(null);
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
  }, [isSalesDept, selectedMonth]);

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
  const tiles = salesStats?.dashboardTiles || {};
  const targetIsSet = Boolean(targetPerformance?.visible && Number(targetPerformance?.salaryCents || 0) > 0);
  const targetAmount = targetIsSet ? Number(targetPerformance.targetCents || 0) / 100 : null;
  const achievedGP = targetIsSet ? Number(targetPerformance.achievedGrossProfitCents || 0) / 100 : null;
  const remainingTarget = targetIsSet ? Math.max(0, targetAmount - achievedGP) : null;
  const go = tab => () => onNavigateTab?.(tab);
  const dashboardTiles = [
    { label: 'Price Requested', ...tiles.priceRequested, amount: 'requests created', icon: DollarSign, onClick: go('price_requests') },
    { label: 'Price Received', ...tiles.priceReceived, amount: 'priced requests', icon: CheckCircle, tone: '#059669', onClick: go('price_requests') },
    { label: 'Quotation Sent', ...tiles.quotationSent, amount: money(tiles.quotationSent?.amount), icon: FileText, onClick: go('my_quotations') },
    { label: 'Sale Order', ...tiles.saleOrder, amount: money(tiles.saleOrder?.amount), icon: ShoppingCart, onClick: go('my_orders') },
    { label: 'Invoiced', ...tiles.invoiced, amount: money(tiles.invoiced?.amount), icon: FileText, tone: '#7C3AED', onClick: go('my_invoices') },
    { label: 'Safe Receivable', ...tiles.safeReceivable, amount: money(tiles.safeReceivable?.amount), note: '1-30 days', icon: DollarSign, tone: '#0284C7', onClick: go('my_invoices') },
    { label: 'Due Receivable', ...tiles.dueReceivable, amount: money(tiles.dueReceivable?.amount), note: '31-45 days, grace period', icon: AlertTriangle, tone: '#D97706', onClick: go('my_invoices') },
    { label: 'GP Target', count: null, amount: targetIsSet ? money(targetAmount) : 'Target not set', note: targetIsSet ? 'Salary × 5 for selected month' : '', icon: Target, tone: '#D97706', onClick: go('target_performance') },
    { label: 'Remaining Target', count: null, amount: targetIsSet ? money(remainingTarget) : 'Target not set', icon: Target, tone: '#EA580C', onClick: go('target_performance') },
    { label: 'Above 45 days', ...tiles.above45Days, amount: money(tiles.above45Days?.amount), icon: AlertTriangle, tone: '#DC2626', onClick: go('my_invoices') },
    { label: 'GP Achieved', count: null, amount: targetIsSet ? money(achievedGP) : 'Target not set', icon: CheckCircle, tone: '#059669', onClick: go('target_performance') }
  ];

  return (
    <div className="employee-dashboard-container">
      <div className="employee-welcome-banner">
        <div className="employee-welcome-left"><h2 className="welcome-title">Welcome back, {firstName} 👋</h2><p className="welcome-subtitle">Your own sales activity and financial position</p></div>
        <label className="sales-dashboard-month"><span>Month</span><input type="month" value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)} /></label>
      </div>
      {salesLoading ? <div className="sv-empty">Loading dashboard…</div> : <div className="sales-dashboard-nine-grid">{dashboardTiles.map(tile => <DashboardTile key={tile.label} {...tile} />)}</div>}
    </div>
  );
}
