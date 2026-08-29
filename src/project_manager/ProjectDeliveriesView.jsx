import React, { useState } from 'react';
import './ProjectDeliveriesView.css';

const statusStyles = {
  'Pending': { bg: '#FEF3C7', color: '#B45309' },
  'In Review': { bg: '#F3E8FF', color: '#7E22CE' },
  'Approved': { bg: '#DCFCE7', color: '#15803D' },
  'Delivered': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Rejected': { bg: '#FEE2E2', color: '#B91C1C' },
};

const avatarColors = {
  PP: '#DB2777',
  MJ: '#7C3AED',
  JK: '#F59E0B',
  SC: '#2563EB',
  TB: '#0D9488',
};

const filterTabs = ['All', 'Pending', 'In Review', 'Approved', 'Delivered', 'Rejected'];
const formStatusOptions = ['Pending', 'In Review', 'Approved', 'Delivered', 'Rejected'];
const projectOptions = ['Nexus Platform', 'DataSync Integration', 'Mobile Commerce', 'Cloud Migration'];
const assigneeOptions = [
  { initials: 'PP', name: 'Priya' },
  { initials: 'MJ', name: 'Marcus' },
  { initials: 'JK', name: 'Jordan' },
  { initials: 'SC', name: 'Sarah' },
  { initials: 'TB', name: 'Taylor' },
];

const initialDeliverables = [
  {
    id: 1,
    name: 'UI Component Library v2.0',
    feedback: 'Looks great! Minor color adju...',
    project: 'Nexus Platform',
    assignee: 'PP',
    assigneeName: 'Priya',
    dueDate: 'Apr 30, 2025',
    progress: 90,
    status: 'In Review',
  },
  {
    id: 2,
    name: 'API Documentation Suite',
    feedback: null,
    project: 'DataSync Integration',
    assignee: 'MJ',
    assigneeName: 'Marcus',
    dueDate: 'May 15, 2025',
    progress: 45,
    status: 'Pending',
  },
  {
    id: 3,
    name: 'Beta App Build 1.0',
    feedback: 'Excellent work! Ready for inte...',
    project: 'Mobile Commerce',
    assignee: 'JK',
    assigneeName: 'Jordan',
    dueDate: 'Apr 20, 2025',
    progress: 100,
    status: 'Approved',
  },
  {
    id: 4,
    name: 'Security Audit Report',
    feedback: null,
    project: 'Cloud Migration',
    assignee: 'TB',
    assigneeName: 'Taylor',
    dueDate: 'May 5, 2025',
    progress: 20,
    status: 'Pending',
  },
  {
    id: 5,
    name: 'Onboarding Flow Prototype',
    feedback: 'Shipped to production ahead of schedule',
    project: 'Nexus Platform',
    assignee: 'SC',
    assigneeName: 'Sarah',
    dueDate: 'Apr 10, 2025',
    progress: 100,
    status: 'Delivered',
  },
];

function AddDeliverableModal({ onClose, onAddDeliverable }) {
  const [name, setName] = useState('');
  const [project, setProject] = useState(projectOptions[0]);
  const [assigneeInitials, setAssigneeInitials] = useState(assigneeOptions[0].initials);
  const [dueDate, setDueDate] = useState('');
  const [progress, setProgress] = useState('');
  const [status, setStatus] = useState('Pending');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const assignee = assigneeOptions.find((a) => a.initials === assigneeInitials);

    onAddDeliverable({
      id: Date.now(),
      name: name.trim(),
      feedback: feedback.trim() || null,
      project,
      assignee: assignee.initials,
      assigneeName: assignee.name,
      dueDate: dueDate || 'No date',
      progress: Math.min(100, Math.max(0, Number(progress) || 0)),
      status,
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add Deliverable</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Deliverable Name</label>
              <input
                className="form-input"
                placeholder="e.g. Payment API Integration Docs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Project</label>
              <select className="form-select" value={project} onChange={(e) => setProject(e.target.value)}>
                {projectOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Assignee</label>
                <select
                  className="form-select"
                  value={assigneeInitials}
                  onChange={(e) => setAssigneeInitials(e.target.value)}
                >
                  {assigneeOptions.map((a) => (
                    <option key={a.initials} value={a.initials}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  className="form-input"
                  placeholder="e.g. May 30, 2025"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Progress (%)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {formStatusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Client Feedback (optional)</label>
              <input
                className="form-input"
                placeholder="e.g. Looks great! Minor color adjustments needed"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Deliverable
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDeliveriesView() {
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const stats = {
    total: deliverables.length,
    pendingReview: deliverables.filter((d) => d.status === 'Pending' || d.status === 'In Review').length,
    approved: deliverables.filter((d) => d.status === 'Approved').length,
    delivered: deliverables.filter((d) => d.status === 'Delivered').length,
  };

  const filteredDeliverables =
    activeFilter === 'All' ? deliverables : deliverables.filter((d) => d.status === activeFilter);

  const addDeliverable = (newItem) => {
    setDeliverables((prev) => [newItem, ...prev]);
  };

  const deleteDeliverable = (id) => {
    setDeliverables((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="project-deliveries-container">
      <div className="deliveries-page-header">
        <div>
          <h1>Delivery Tracking</h1>
          <p>Track deliverables, approvals, and client feedback</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddOpen(true)}>
          + Add Deliverable
        </button>
      </div>

      <div className="deliveries-stats-grid">
        <div className="stat-card">
          <span className="stat-value" style={{ color: '#0F172A' }}>{stats.total}</span>
          <span className="stat-label">Total Deliverables</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: '#7E22CE' }}>{stats.pendingReview}</span>
          <span className="stat-label">Pending Review</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: '#15803D' }}>{stats.approved}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: '#1D4ED8' }}>{stats.delivered}</span>
          <span className="stat-label">Delivered</span>
        </div>
      </div>

      <div className="deliveries-filter-row">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            className={`filter-pill ${activeFilter === tab ? 'filter-pill-active' : ''}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="deliveries-table-container">
        <div className="deliveries-table-header">
          <span>DELIVERABLE</span>
          <span>PROJECT</span>
          <span>ASSIGNEE</span>
          <span>DUE DATE</span>
          <span>PROGRESS</span>
          <span>STATUS</span>
          <span></span>
        </div>

        <div className="deliveries-table-body">
          {filteredDeliverables.map((item) => (
            <div className="deliveries-table-row" key={item.id}>
              <div className="deliverable-name-cell">
                <h4>{item.name}</h4>
                {item.feedback && <span className="deliverable-feedback">{item.feedback}</span>}
              </div>

              <div className="project-cell">{item.project}</div>

              <div className="assignee-cell">
                <span
                  className="assignee-avatar"
                  style={{ background: avatarColors[item.assignee] || '#64748B' }}
                >
                  {item.assignee}
                </span>
                <span>{item.assigneeName}</span>
              </div>

              <div className="due-date-cell">{item.dueDate}</div>

              <div className="progress-cell">
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${item.progress}%`,
                      background: item.progress === 100 ? '#22C55E' : '#2563EB',
                    }}
                  />
                </div>
                <span className="progress-percent">{item.progress}%</span>
              </div>

              <div className="status-cell">
                <span
                  className="status-badge"
                  style={{
                    background: statusStyles[item.status]?.bg,
                    color: statusStyles[item.status]?.color,
                  }}
                >
                  {item.status}
                </span>
              </div>

              <div className="delete-cell">
                <button
                  className="delete-btn"
                  onClick={() => deleteDeliverable(item.id)}
                  title="Delete deliverable"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAddOpen && (
        <AddDeliverableModal onClose={() => setIsAddOpen(false)} onAddDeliverable={addDeliverable} />
      )}
    </div>
  );
}
