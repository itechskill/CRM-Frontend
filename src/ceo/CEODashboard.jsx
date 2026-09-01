import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { TrendingUp, DollarSign, Users, Award, ArrowRight, Folder, CheckSquare, Target, Plus, X, CheckCircle2 } from 'lucide-react';
import './CEODashboard.css';

export default function CEODashboard({ onNavigateTab, currentUser }) {
  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'Chief Executive Officer';
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/admin/executive-summary');
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
    fetchSummary();
  }, []);

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
        accountant: 'Finance & Accounting Department',
        sales_manager: 'Sales Department',
        project_manager: 'Project Management Department',
        marketing: 'Marketing Department',
        administration: 'Administration Department',
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
        fetchSummary();
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


  const kpis = [
    { title: 'Collected Revenue', value: summary ? `$${(summary.collectedRevenue || 0).toLocaleString()}` : '$0', change: summary ? `Invoiced: $${(summary.totalInvoiced || 0).toLocaleString()}` : 'Live', icon: DollarSign, iconClass: 'icon-blue' },
    { title: 'Won Sales Deals', value: summary ? `${summary.wonDealsCount || 0}` : '0', change: summary ? `Pipeline: $${(summary.pipelineValue || 0).toLocaleString()}` : 'Live', icon: Award, iconClass: 'icon-purple' },
    { title: 'Total Active Headcount', value: summary ? `${summary.totalEmployees || 0}` : '0', change: summary ? `Users: ${summary.totalUsers || 0}` : 'Live', icon: Users, iconClass: 'icon-green' },
    { title: 'Active Projects', value: summary ? `${summary.activeProjects || 0}` : '0', change: summary ? `Completed Tasks: ${summary.completedTasks || 0}` : 'Live', icon: TrendingUp, iconClass: 'icon-amber' },
  ];

  const strategicInitiatives = [
    { name: 'Global Market Expansion (EMEA)', owner: 'Sarah Mitchell', progress: '85%', status: 'On Track', tag: 'active' },
    { name: 'Enterprise CRM Platform v4.0', owner: 'Daniel Torres', progress: '62%', status: 'On Track', tag: 'active' },
    { name: 'AI Analytics Integration', owner: 'Alex Vance', progress: '40%', status: 'Review Needed', tag: 'warning' },
    { name: 'ISO 27001 Security Audit', owner: 'Elena Rostova', progress: '95%', status: 'Final Stage', tag: 'active' },
  ];

  return (
    <div className="ceo-dashboard-container">
      {/* Welcome Banner */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: '#0F172A', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            Good morning, {firstName} 👑
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '4px' }}>
            Executive Business Performance &amp; Strategic Operations
          </p>
        </div>

        <button
          onClick={openAssignTaskModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#6366F1',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
          }}
        >
          <Plus size={18} />
          <span>Assign Task to Manager</span>
        </button>
      </div>

      {/* Executive KPIs */}
      <div className="ceo-kpi-grid">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="ceo-kpi-card">
              <div className="ceo-kpi-header">
                <span className="ceo-kpi-title">{kpi.title}</span>
                <div className={`ceo-kpi-icon ${kpi.iconClass}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="ceo-kpi-value">{kpi.value}</div>
              <div className="ceo-kpi-footer">
                <span className="ceo-badge-pos">{kpi.change}</span>
                <span className="ceo-kpi-subtext">vs last quarter</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Strategic Overview */}
      <div className="ceo-charts-row">
        <div className="ceo-card-panel">
          <div className="ceo-card-title">
            <span>Strategic Growth &amp; Revenue Target</span>
            <button
              className="ceo-card-title-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => onNavigateTab('sales_finance')}
            >
              View Financial Detail <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
            </button>
          </div>
          <div
            style={{
              height: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F8FAFC',
              border: '1px dashed #E2E8F0',
              borderRadius: '10px',
              color: '#94A3B8',
              fontSize: '0.85rem',
            }}
          >
            [ Interactive ARR vs Forecast Chart Placeholder ]
          </div>
        </div>

        <div className="ceo-card-panel">
          <div className="ceo-card-title">
            <span>Quarterly Executive Summary</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="ceo-summary-highlight">
              <div className="ceo-summary-highlight-title">Revenue Milestone Exceeded</div>
              <div className="ceo-summary-highlight-desc">
                Q3 targets met 12 days ahead of schedule driven by Sales expansion.
              </div>
            </div>
            <div className="ceo-summary-highlight" style={{ borderLeftColor: '#2563EB' }}>
              <div className="ceo-summary-highlight-title">Engineering Velocity</div>
              <div className="ceo-summary-highlight-desc">
                Release pipeline delivery velocity increased by 22%.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Initiatives Table */}
      <div className="ceo-card-panel">
        <div className="ceo-card-title">
          <span>Key Strategic Initiatives</span>
          <button
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#2563EB',
              padding: '7px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
            onClick={() => onNavigateTab('business_overview')}
          >
            Full Strategic Roadmap
          </button>
        </div>
        <table className="ceo-table">
          <thead>
            <tr>
              <th>Initiative</th>
              <th>Executive Lead</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {strategicInitiatives.map((item, index) => (
              <tr key={index}>
                <td style={{ fontWeight: 700, color: '#0F172A' }}>{item.name}</td>
                <td>{item.owner}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: item.progress, height: '100%', background: '#2563EB' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>{item.progress}</span>
                  </div>
                </td>
                <td>
                  <span className={`ceo-status-tag ${item.tag}`}>{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CEO Assign Task Modal */}
      {isTaskModalOpen && (
        <div className="reg-modal-backdrop" onClick={() => setIsTaskModalOpen(false)}>
          <div className="reg-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', backgroundColor: '#1E293B', color: '#FFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={18} color="#818CF8" />
                Assign Executive Task
              </h3>
              <X size={18} style={{ cursor: 'pointer', color: '#94A3B8' }} onClick={() => setIsTaskModalOpen(false)} />
            </div>

            {taskAlert && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '14px',
                backgroundColor: taskAlert.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${taskAlert.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                color: taskAlert.type === 'success' ? '#6EE7B7' : '#FCA5A5',
                fontSize: '0.85rem'
              }}>
                {taskAlert.text}
              </div>
            )}

            <form onSubmit={handleAssignTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepare Quarterly Sales Forecast"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#FFF', padding: '10px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Assign To Department / Employee *</label>
                <select
                  required
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#FFF', padding: '10px', outline: 'none' }}
                >
                  <optgroup label="Entire Departments">
                    <option value="role:hr_manager">HR Department (HR Manager)</option>
                    <option value="role:accountant">Finance & Accounting Department (Accountant)</option>
                    <option value="role:sales_manager">Sales Department (Sales Manager)</option>
                    <option value="role:project_manager">Project Management Department (Project Manager)</option>
                    <option value="role:marketing">Marketing Department</option>
                    <option value="role:administration">Administration Department</option>
                    <option value="role:employee">All Employees</option>
                  </optgroup>
                  <optgroup label="Specific Team Members">
                    {userList.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.role ? u.role.replace('_', ' ').toUpperCase() : 'Employee'} — {u.department || 'General'})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>


              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#FFF', padding: '10px', outline: 'none' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#FFF', padding: '10px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Description & Directives</label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed task instructions..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#FFF', padding: '10px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="reg-btn-view" onClick={() => setIsTaskModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="reg-btn-approve" disabled={submittingTask}>
                  {submittingTask ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
