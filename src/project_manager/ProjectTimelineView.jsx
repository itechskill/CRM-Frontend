import React from 'react';
import { Circle, Download } from 'lucide-react';
import './ProjectTimelineView.css';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const statusStyles = {
  'In Progress': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Review': { bg: '#F3E8FF', color: '#7E22CE' },
  'Completed': { bg: '#DCFCE7', color: '#15803D' },
  'On Hold': { bg: '#F1F5F9', color: '#475569' },
  'Planning': { bg: '#F1F5F9', color: '#475569' },
};

// startMonth/endMonth are 1-12 (inclusive), progressEndMonth marks where the filled/solid portion ends
const timelineProjects = [
  {
    id: 1,
    name: 'Nexus Platform Redesign',
    client: 'TechCorp Inc.',
    status: 'In Progress',
    color: '#2563EB',
    startMonth: 1,
    endMonth: 7,
    progress: 68,
    progressEndMonth: 4.5,
    hasEndDiamond: true,
  },
  {
    id: 2,
    name: 'DataSync Integration Suite',
    client: 'FinanceHub Corp',
    status: 'In Progress',
    color: '#7C3AED',
    startMonth: 2,
    endMonth: 8,
    progress: 42,
    progressEndMonth: 4,
    hasEndDiamond: true,
  },
  {
    id: 3,
    name: 'Mobile Commerce App',
    client: 'RetailMax Global',
    status: 'Review',
    color: '#10B981',
    startMonth: 1,
    endMonth: 5,
    progress: 85,
    progressEndMonth: 4.3,
    hasEndDiamond: true,
  },
  {
    id: 4,
    name: 'Cloud Migration v2.0',
    client: 'GlobalBank Financial',
    status: 'In Progress',
    color: '#F59E0B',
    startMonth: 3,
    endMonth: 12,
    progress: 31,
    progressEndMonth: 4.3,
    hasEndDiamond: true,
  },
  {
    id: 5,
    name: 'AI Analytics Dashboard',
    client: 'MetaInsights Ltd',
    status: 'Completed',
    color: '#0D9488',
    startMonth: 2,
    endMonth: 4,
    progress: 100,
    progressEndMonth: 4,
    hasEndDiamond: false,
  },
  {
    id: 6,
    name: 'Security Audit System',
    client: 'SecureVault Inc',
    status: 'Planning',
    color: '#EF4444',
    startMonth: 4,
    endMonth: 9,
    progress: 15,
    progressEndMonth: 4.5,
    hasEndDiamond: true,
  },
];

const legendItems = timelineProjects.map((p) => ({ name: p.name, color: p.color }));

const upcomingMilestones = [
  { id: 1, title: 'Beta Launch', project: 'Nexus Platform', date: 'Jun 1, 2025', color: '#2563EB' },
  { id: 2, title: 'API Integration Complete', project: 'DataSync Integration', date: 'Apr 30, 2025', color: '#7C3AED' },
  { id: 3, title: 'App Store Submission', project: 'Mobile Commerce', date: 'Apr 25, 2025', color: '#10B981' },
  { id: 4, title: 'UAT Sign-off', project: 'Mobile Commerce', date: 'May 20, 2025', color: '#10B981' },
  { id: 5, title: 'Architecture Review', project: 'Cloud Migration', date: 'May 15, 2025', color: '#F59E0B' },
];

const todayMonth = 4;
const todayDay = 15;
const todayLabel = 'Today: Apr 15';

function monthToPercent(monthValue) {
  return ((monthValue - 1) / 12) * 100;
}

export default function ProjectTimelineView() {
  const todayPercent = monthToPercent(todayMonth + (todayDay - 1) / 30);

  return (
    <div className="project-timeline-container">
      <div className="timeline-page-header">
        <div>
          <h1>Project Timeline</h1>
          <p>2025 roadmap · Gantt view</p>
        </div>
        <div className="timeline-header-actions">
          <span className="today-indicator">
            <Circle size={10} fill="#EF4444" color="#EF4444" />
            {todayLabel}
          </span>
          <button className="btn-secondary">
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      <div className="gantt-container">
        {/* Month header row */}
        <div className="gantt-header-row">
          <div className="gantt-project-col-header">PROJECT</div>
          <div className="gantt-months-header">
            {months.map((m) => (
              <span key={m} className="gantt-month-label">{m}</span>
            ))}
          </div>
        </div>

        {/* Project rows */}
        <div className="gantt-body">
          {timelineProjects.map((project) => (
            <div className="gantt-row" key={project.id}>
              <div className="gantt-project-col">
                <h4>{project.name}</h4>
                <span className="gantt-client">{project.client}</span>
                <span
                  className="gantt-status-badge"
                  style={{
                    background: statusStyles[project.status]?.bg,
                    color: statusStyles[project.status]?.color,
                  }}
                >
                  {project.status}
                </span>
              </div>

              <div className="gantt-track">
                {/* Vertical month gridlines */}
                <div className="gantt-gridlines">
                  {months.map((m) => (
                    <div className="gantt-gridline" key={m} />
                  ))}
                </div>

                {/* Today marker */}
                <div className="gantt-today-line" style={{ left: `${todayPercent}%` }} />

                {/* Full duration bar (light) */}
                <div
                  className="gantt-bar-full"
                  style={{
                    left: `${monthToPercent(project.startMonth)}%`,
                    width: `${monthToPercent(project.endMonth + 1) - monthToPercent(project.startMonth)}%`,
                    background: `${project.color}33`,
                  }}
                >
                  {project.hasEndDiamond && (
                    <span className="gantt-diamond gantt-diamond-end gantt-diamond-upcoming" style={{ borderColor: project.color }} />
                  )}
                </div>

                {/* Progress bar (solid, filled portion) */}
                <div
                  className="gantt-bar-progress"
                  style={{
                    left: `${monthToPercent(project.startMonth)}%`,
                    width: `${monthToPercent(project.progressEndMonth) - monthToPercent(project.startMonth)}%`,
                    background: project.color,
                  }}
                >
                  <span
                    className={`gantt-diamond gantt-diamond-start ${project.progress === 100 ? 'gantt-diamond-completed' : ''}`}
                    style={{ borderColor: project.color, background: project.progress === 100 ? project.color : '#FFFFFF' }}
                  />
                  <span className="gantt-progress-label">{project.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend + Upcoming Milestones */}
      <div className="timeline-bottom-grid">
        <div className="timeline-panel">
          <h2>Legend</h2>
          <div className="legend-list">
            {legendItems.map((item) => (
              <div className="legend-row" key={item.name}>
                <span className="legend-swatch" style={{ background: item.color }} />
                <span className="legend-label">{item.name}</span>
              </div>
            ))}
          </div>
          <div className="legend-divider" />
          <div className="legend-row">
            <span className="legend-diamond legend-diamond-completed" />
            <span className="legend-label">Completed milestone</span>
          </div>
          <div className="legend-row">
            <span className="legend-diamond legend-diamond-upcoming" />
            <span className="legend-label">Upcoming milestone</span>
          </div>
        </div>

        <div className="timeline-panel">
          <h2>Upcoming Milestones</h2>
          <div className="milestones-list">
            {upcomingMilestones.map((m) => (
              <div className="milestone-row" key={m.id}>
                <div className="milestone-left">
                  <span className="milestone-dot" style={{ background: m.color }} />
                  <span className="milestone-title">{m.title}</span>
                  <span className="milestone-project">· {m.project}</span>
                </div>
                <span className="milestone-date">{m.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
