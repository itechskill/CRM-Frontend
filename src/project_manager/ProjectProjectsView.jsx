import React, { useState } from 'react';
import './ProjectProjectsView.css';

const statusStyles = {
  'Planning': { bg: '#FEF3C7', color: '#B45309' },
  'In Progress': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Review': { bg: '#F3E8FF', color: '#7E22CE' },
  'Completed': { bg: '#DCFCE7', color: '#15803D' },
  'On Hold': { bg: '#F1F5F9', color: '#475569' },
};

const healthStyles = {
  Good: '#22C55E',
  'At Risk': '#F59E0B',
  Critical: '#EF4444',
};

const avatarColors = ['#4F46E5', '#DB2777', '#F59E0B', '#0D9488', '#7C3AED', '#2563EB'];

const filterTabs = ['All', 'Planning', 'In Progress', 'Review', 'Completed', 'On Hold'];

// Maps whatever status string the data source uses onto the filter tab categories
function normalizeStatus(rawStatus) {
  const map = {
    'On Track': 'In Progress',
    'At Risk': 'In Progress',
    'Delayed': 'On Hold',
    'Planning': 'Planning',
    'In Progress': 'In Progress',
    'Review': 'Review',
    'Completed': 'Completed',
    'On Hold': 'On Hold',
  };
  return map[rawStatus] || rawStatus;
}

export default function ProjectProjectsView({ projectsList = [] }) {
  const [activeFilter, setActiveFilter] = useState('All');

  const normalizedProjects = projectsList.map((p) => ({
    ...p,
    normalizedStatus: normalizeStatus(p.status),
  }));

  const counts = filterTabs.reduce((acc, tab) => {
    acc[tab] =
      tab === 'All'
        ? normalizedProjects.length
        : normalizedProjects.filter((p) => p.normalizedStatus === tab).length;
    return acc;
  }, {});

  const filteredProjects =
    activeFilter === 'All'
      ? normalizedProjects
      : normalizedProjects.filter((p) => p.normalizedStatus === activeFilter);

  return (
    <div className="project-projects-container">
      <div className="projects-page-header">
        <div>
          <h1>Projects</h1>
          <p>
            {projectsList.length} total projects across{' '}
            {new Set(projectsList.map((p) => p.client)).size} clients
          </p>
        </div>
        <div className="projects-header-actions">
          <button className="btn-secondary">↓ Export</button>
        </div>
      </div>

      <div className="projects-filter-row">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            className={`filter-pill ${activeFilter === tab ? 'filter-pill-active' : ''}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab} {tab !== 'All' && <span className="filter-pill-count">{counts[tab]}</span>}
          </button>
        ))}
      </div>

      <div className="projects-card-grid">
        {filteredProjects.map((project) => (
          <div className="project-card" key={project.id}>
            <div className="project-card-header">
              <div>
                <h3>{project.name}</h3>
                <span className="project-card-client">{project.client}</span>
              </div>
              <span
                className="status-badge"
                style={{
                  background: statusStyles[project.normalizedStatus]?.bg,
                  color: statusStyles[project.normalizedStatus]?.color,
                }}
              >
                {project.normalizedStatus}
              </span>
            </div>

            <p className="project-card-desc">{project.description}</p>

            <div className="project-card-meta-grid">
              <div>
                <span className="meta-label">Budget</span>
                <span className="meta-value">{project.budget || project.budgetTotal || '—'}</span>
              </div>
              <div>
                <span className="meta-label">Health</span>
                <span className="meta-value health-value">
                  <span className="health-dot" style={{ background: healthStyles[project.health] || '#94A3B8' }} />
                  <span style={{ color: healthStyles[project.health] || '#94A3B8' }}>
                    {project.health || '—'}
                  </span>
                </span>
              </div>
              <div>
                <span className="meta-label">Start Date</span>
                <span className="meta-value">{project.startDate || '—'}</span>
              </div>
              <div>
                <span className="meta-label">Due Date</span>
                <span className="meta-value">{project.dueDate || '—'}</span>
              </div>
            </div>

            <div className="project-card-progress">
              <div className="progress-header-row">
                <span className="meta-label">Progress</span>
                <span className="progress-percent">{project.progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${project.progress}%` }} />
              </div>
            </div>

            <div className="project-card-footer">
              <div className="avatar-stack">
                {(project.team || (project.leadInitials ? [project.leadInitials] : [])).slice(0, 4).map((initials, i) => (
                  <span
                    key={i}
                    className="avatar-chip"
                    style={{ background: avatarColors[i % avatarColors.length] }}
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <span className="tasks-count">
                ☑ {project.tasksDone ?? 0}/{project.tasksTotal ?? 0} tasks
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
