import React, { useState } from 'react';
import { FolderKanban, CheckSquare, Clock, User, Calendar, ExternalLink, Filter, Search } from 'lucide-react';
import './EmployeeProjectsView.css';

export default function EmployeeProjectsView() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const projects = [
    {
      id: 1,
      name: 'Proxima Platform Migration',
      client: 'Proxima Labs',
      lead: 'Daniel Torres',
      role: 'Lead Frontend Developer',
      progress: 78,
      myTasksCount: 5,
      completedMyTasks: 3,
      loggedHours: '34h / 45h',
      dueDate: 'Feb 28, 2025',
      priority: 'High',
      status: 'On Track',
      color: '#2563EB'
    },
    {
      id: 2,
      name: 'BuildCo ERP Integration',
      client: 'BuildCo Industries',
      lead: 'Sarah Mitchell',
      role: 'Frontend Integrator',
      progress: 45,
      myTasksCount: 4,
      completedMyTasks: 1,
      loggedHours: '22h / 30h',
      dueDate: 'Jan 15, 2025',
      priority: 'Critical',
      status: 'At Risk',
      color: '#10B981'
    },
    {
      id: 3,
      name: 'TechFlow Analytics Engine',
      client: 'TechFlow Inc',
      lead: 'Clara Novak',
      role: 'UI Component Architect',
      progress: 90,
      myTasksCount: 6,
      completedMyTasks: 5,
      loggedHours: '42h / 45h',
      dueDate: 'Dec 31, 2024',
      priority: 'Medium',
      status: 'On Track',
      color: '#F59E0B'
    },
    {
      id: 4,
      name: 'Starlight Security Audit UI',
      client: 'Starlight Ventures',
      lead: 'Liam Chen',
      role: 'Security Dashboard Specialist',
      progress: 60,
      myTasksCount: 3,
      completedMyTasks: 2,
      loggedHours: '18h / 25h',
      dueDate: 'Mar 20, 2025',
      priority: 'Medium',
      status: 'On Track',
      color: '#8B5CF6'
    }
  ];

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase());
    if (filter === 'On Track') return matchesSearch && p.status === 'On Track';
    if (filter === 'At Risk') return matchesSearch && p.status === 'At Risk';
    return matchesSearch;
  });

  return (
    <div className="employee-projects-container">
      {/* Controls Bar */}
      <div className="projects-controls-bar">
        <div className="projects-search">
          <Search size={16} color="#94A3B8" />
          <input 
            type="text"
            placeholder="Search projects by name or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="projects-filter-pills">
          {['All', 'On Track', 'At Risk'].map(f => (
            <button 
              key={f}
              className={`filter-pill ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-cards-grid">
        {filteredProjects.map(proj => (
          <div key={proj.id} className="employee-project-card">
            <div className="card-top-bar">
              <div className="project-icon-box" style={{ backgroundColor: `${proj.color}15`, color: proj.color }}>
                <FolderKanban size={20} />
              </div>
              <span className={`status-badge ${proj.status.toLowerCase().replace(' ', '-')}`}>
                {proj.status}
              </span>
            </div>

            <h3 className="project-card-title">{proj.name}</h3>
            <p className="project-client-name">Client: {proj.client}</p>

            <div className="project-role-badge">
              <span>Your Role: <strong>{proj.role}</strong></span>
            </div>

            {/* Progress Bar */}
            <div className="project-progress-section">
              <div className="progress-info">
                <span>Completion</span>
                <span className="progress-pct">{proj.progress}%</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ width: `${proj.progress}%`, backgroundColor: proj.color }}
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="project-stats-grid">
              <div className="stat-box">
                <CheckSquare size={14} color="#64748B" />
                <span>Tasks: <strong>{proj.completedMyTasks}/{proj.myTasksCount}</strong></span>
              </div>
              <div className="stat-box">
                <Clock size={14} color="#64748B" />
                <span>Hours: <strong>{proj.loggedHours}</strong></span>
              </div>
              <div className="stat-box">
                <User size={14} color="#64748B" />
                <span>Lead: <strong>{proj.lead}</strong></span>
              </div>
              <div className="stat-box">
                <Calendar size={14} color="#64748B" />
                <span>Due: <strong>{proj.dueDate}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
