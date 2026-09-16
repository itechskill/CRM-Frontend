import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import './ProjectTasksView.css';

const priorityStyles = {
  Critical: '#EF4444',
  High: '#F59E0B',
  Medium: '#EAB308',
  Low: '#22C55E',
};

const priorityOptions = ['All Priorities', 'Critical', 'High', 'Medium', 'Low'];
const formPriorityOptions = ['Critical', 'High', 'Medium', 'Low'];
const formColumnOptions = ['Pending', 'In Progress', 'Under Review', 'Completed'];

const priorityMeta = {
  Critical: { bg: '#FEE2E2', color: '#DC2626', dot: '#DC2626' },
  High: { bg: '#FEF3C7', color: '#D97706', dot: '#D97706' },
  Medium: { bg: '#FEF3C7', color: '#D97706', dot: '#D97706' },
  Low: { bg: '#DCFCE7', color: '#16A34A', dot: '#16A34A' },
};

const columnMeta = {
  'Pending': { dot: '#64748B', tint: '#FFFFFF', border: '#E2E8F0', badgeBg: '#F1F5F9', badgeColor: '#475569' },
  'In Progress': { dot: '#2563EB', tint: '#FFFFFF', border: '#E2E8F0', badgeBg: '#EFF6FF', badgeColor: '#1D4ED8' },
  'Under Review': { dot: '#9333EA', tint: '#FFFFFF', border: '#E2E8F0', badgeBg: '#FAF5FF', badgeColor: '#7E22CE' },
  'Completed': { dot: '#16A34A', tint: '#FFFFFF', border: '#E2E8F0', badgeBg: '#F0FDF4', badgeColor: '#15803D' },
};

const columnOrder = ['Pending', 'In Progress', 'Under Review', 'Completed'];

const initialTasks = [];

const avatarColors = {
  SC: '#2563EB',
  TB: '#7C3AED',
  MJ: '#DB2777',
  JK: '#10B981',
  PP: '#F59E0B',
};

const projectOptions = ['All Projects', ...new Set(initialTasks.map((t) => t.project))];
const formProjectOptions = projectOptions.filter((p) => p !== 'All Projects');
const assigneeOptions = [...new Set(initialTasks.map((t) => t.assignee))];

function actionButtonsFor(column) {
  switch (column) {
    case 'Pending':
      return [{ label: 'Start', target: 'In Progress' }, { label: 'Review', target: 'Under Review' }];
    case 'In Progress':
      return [{ label: 'Back', target: 'Pending' }, { label: 'Review', target: 'Under Review' }];
    case 'Under Review':
      return [{ label: 'Back', target: 'In Progress' }, { label: 'Complete', target: 'Completed' }];
    case 'Completed':
      return [{ label: 'Re-Open', target: 'In Progress' }];
    default:
      return [];
  }
}

function AddTaskModal({ onClose, onAddTask, projects = [], employees = [] }) {
  const [title, setTitle] = useState('');
  const [project, setProject] = useState(projects[0]?.name || 'General');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState(employees[0]?._id || '');
  const [dueDate, setDueDate] = useState('');
  const [column, setColumn] = useState('Pending');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    const assignedEmp = employees.find(e => e._id === assignedTo);
    await onAddTask({
      title: title.trim(),
      project: project || 'General',
      priority,
      status: column,
      assignedTo: assignedTo || null,
      assignedToName: assignedEmp ? assignedEmp.fullName : '',
      dueDate: dueDate || null
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add Task</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Task Title *</label>
              <input
                className="form-input"
                placeholder="e.g. Set up CI/CD pipeline"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Project</label>
              <select className="form-select" value={project} onChange={(e) => setProject(e.target.value)}>
                {projects.length > 0 ? projects.map((p) => (
                  <option key={p._id || p.name} value={p.name}>{p.name}</option>
                )) : <option value="General">General</option>}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Priority</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {formPriorityOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status Column</label>
                <select className="form-select" value={column} onChange={(e) => setColumn(e.target.value)}>
                  {formColumnOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Assign Employee</label>
                <select className="form-select" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>{emp.fullName} ({emp.department || emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectTasksView() {
  const [tasks, setTasks] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [projectFilter, setProjectFilter] = useState('All Projects');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  const fetchTaskData = async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes, empRes] = await Promise.all([
        apiRequest('/api/tasks'),
        apiRequest('/api/projects'),
        apiRequest('/api/users')
      ]);

      if (tasksRes.data && tasksRes.data.success) {
        setTasks(tasksRes.data.data.map(t => ({
          ...t,
          id: t._id,
          column: t.status || 'Pending',
          assignee: t.assignedTo?.fullName || t.assignedToName || 'Unassigned'
        })));
      }
      if (projectsRes.data && projectsRes.data.success) {
        setProjectsList(projectsRes.data.data || []);
      }
      if (empRes.data && empRes.data.success) {
        setEmployeesList(empRes.data.data || []);
      }
    } catch (err) {
      console.error('Fetch task data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskData();
  }, []);

  const moveTask = async (taskId, targetColumn) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, column: targetColumn, status: targetColumn } : t)));
    await apiRequest(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: targetColumn })
    });
  };

  const addTask = async (newTaskData) => {
    const res = await apiRequest('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(newTaskData)
    });
    if (res.data && res.data.success) {
      fetchTaskData();
    }
  };

  const projectOptions = ['All Projects', ...new Set(projectsList.map(p => p.name))];

  const filteredTasks = tasks.filter((t) => {
    const matchesPriority = priorityFilter === 'All Priorities' || t.priority === priorityFilter;
    const matchesProject = projectFilter === 'All Projects' || t.project === projectFilter;
    return matchesPriority && matchesProject;
  });

  const activeCount = tasks.filter((t) => t.column !== 'Completed').length;
  const completedCount = tasks.filter((t) => t.column === 'Completed').length;

  const tasksByColumn = columnOrder.reduce((acc, col) => {
    acc[col] = filteredTasks.filter((t) => t.column === col);
    return acc;
  }, {});

  return (
    <div className="project-tasks-container">
      <div className="tasks-page-header">
        <div>
          <h1>Task Management</h1>
          <p>{activeCount} active tasks · {completedCount} completed</p>
        </div>

        <div className="tasks-header-controls">
          <select
            className="tasks-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            {projectOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <select
            className="tasks-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            {priorityOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'kanban' ? 'view-toggle-active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              Board
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'view-toggle-active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
          <button className="btn-primary" onClick={() => setIsAddTaskOpen(true)}>
            + Add Task
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="kanban-board">
          {columnOrder.map((column) => (
            <div
              className="kanban-column"
              key={column}
              style={{
                background: columnMeta[column].tint,
                borderColor: columnMeta[column].border,
              }}
            >
              <div className="kanban-column-header">
                <div className="kanban-column-title">
                  <span
                    className="kanban-column-dot"
                    style={{ background: columnMeta[column].dot }}
                  />
                  <span>{column}</span>
                  <span
                    className="kanban-column-count"
                    style={{
                      background: columnMeta[column].badgeBg,
                      color: columnMeta[column].badgeColor,
                    }}
                  >
                    {tasksByColumn[column].length}
                  </span>
                </div>
                <button className="kanban-add-btn" onClick={() => setIsAddTaskOpen(true)}>
                  +
                </button>
              </div>

              <div className="kanban-column-body">
                {tasksByColumn[column].length === 0 && (
                  <div className="kanban-empty-state">No tasks</div>
                )}
                {tasksByColumn[column].map((task) => (
                  <div className="kanban-card" key={task.id}>
                    <h4 className="kanban-card-title">{task.title}</h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="kanban-card-project">{task.project}</span>
                      {(task.assignedByName || task.createdBy?.fullName) && (
                        <span style={{ fontSize: '0.72rem', background: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                          Assigned by: {task.assignedByName || task.createdBy?.fullName}
                        </span>
                      )}
                    </div>

                    <div className="kanban-card-meta">
                      <span
                        className="priority-pill"
                        style={{
                          background: priorityMeta[task.priority]?.bg || '#F1F5F9',
                          color: priorityMeta[task.priority]?.color || '#475569',
                        }}
                      >
                        <span
                          className="priority-dot"
                          style={{ background: priorityMeta[task.priority]?.dot || '#64748B' }}
                        />
                        {task.priority}
                      </span>
                      <span className="kanban-card-date">🕐 {task.dueDate}</span>
                    </div>

                    <div className="kanban-progress-track">
                      <div
                        className="kanban-progress-fill"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>

                    <div className="kanban-card-footer">
                      <span
                        className="kanban-avatar"
                        style={{ background: avatarColors[task.assignee] || '#64748B' }}
                      >
                        {task.assignee}
                      </span>
                      <div className="kanban-card-actions">
                        {actionButtonsFor(column).map((btn) => (
                          <button
                            key={btn.label}
                            className="kanban-action-btn"
                            onClick={() => moveTask(task.id, btn.target)}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tasks-list-view">
          {filteredTasks.map((task) => (
            <div className="task-list-row" key={task.id}>
              <div className="task-list-main">
                <h4>{task.title}</h4>
                <span className="kanban-card-project">{task.project}</span>
              </div>
              <span
                className="priority-tag"
                style={{ color: priorityStyles[task.priority] }}
              >
                <span
                  className="priority-dot"
                  style={{ background: priorityStyles[task.priority] }}
                />
                {task.priority}
              </span>
              <span className="kanban-card-date">🕐 {task.dueDate}</span>
              <span className="task-list-column-tag">{task.column}</span>
              <span
                className="kanban-avatar"
                style={{ background: avatarColors[task.assignee] || '#64748B' }}
              >
                {task.assignee}
              </span>
            </div>
          ))}
        </div>
      )}

      {isAddTaskOpen && (
        <AddTaskModal
          onClose={() => setIsAddTaskOpen(false)}
          onAddTask={addTask}
          projects={projectsList}
          employees={employeesList}
        />
      )}
    </div>
  );
}
