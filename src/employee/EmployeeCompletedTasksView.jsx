import React, { useState } from 'react';
import { CheckCircle2, Award, Clock, Star, Calendar } from 'lucide-react';
import './EmployeeCompletedTasksView.css';

const statCards = [
  { label: 'Total Completed', value: '6', icon: CheckCircle2, iconBg: '#DCFCE7', iconColor: '#16A34A' },
  { label: 'Approved Tasks', value: '5', icon: Award, iconBg: '#EFF6FF', iconColor: '#2563EB' },
  { label: 'Hours Invested', value: '66h', icon: Clock, iconBg: '#F3E8FF', iconColor: '#8B5CF6' },
  { label: 'Avg Quality Score', value: '94%', icon: Star, iconBg: '#FEF9C3', iconColor: '#CA8A04' },
];

const filterOptions = ['All', 'Approved', 'Pending Review', 'Rejected'];

const completedTasks = [
  {
    id: 1,
    title: 'Setup CI/CD pipeline',
    approvedBy: 'Sarah Mitchell',
    project: 'Fortline CRM',
    completedDate: '2024-06-10',
    status: 'Approved',
    quality: 96,
  },
  {
    id: 2,
    title: 'OAuth 2.0 integration',
    approvedBy: 'Sarah Mitchell',
    project: 'Fortline CRM',
    completedDate: '2024-06-08',
    status: 'Approved',
    quality: 92,
  },
  {
    id: 3,
    title: 'Dashboard wireframes',
    approvedBy: 'David Park',
    project: 'Customer Analytics',
    completedDate: '2024-06-05',
    status: 'Approved',
    quality: 98,
  },
  {
    id: 4,
    title: 'Redis caching layer',
    approvedBy: null,
    project: 'API Performance',
    completedDate: '2024-06-03',
    status: 'Pending Review',
    quality: null,
  },
  {
    id: 5,
    title: 'Legacy report export tool',
    approvedBy: null,
    project: 'Internal Tools',
    completedDate: '2024-05-30',
    status: 'Rejected',
    quality: null,
  },
];

const statusStyle = {
  Approved: { bg: '#DCFCE7', color: '#15803D', dot: '#16A34A' },
  'Pending Review': { bg: '#FEF3C7', color: '#B45309', dot: '#D97706' },
  Rejected: { bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' },
};

export default function EmployeeCompletedTasksView() {
  const [filter, setFilter] = useState('All');

  const filteredTasks = completedTasks.filter(
    (t) => filter === 'All' || t.status === filter
  );

  return (
    <div className="employee-completed-container">
      {/* 4 KPI Stat Cards */}
      <div className="completed-stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="completed-kpi-card" key={card.label}>
              <div className="completed-kpi-top">
                <div className="completed-kpi-icon" style={{ backgroundColor: card.iconBg, color: card.iconColor }}>
                  <Icon size={20} />
                </div>
                <span className="completed-kpi-label">{card.label}</span>
              </div>
              <div className="completed-kpi-value">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Filter Pills */}
      <div className="completed-filter-bar">
        {filterOptions.map((f) => (
          <button
            key={f}
            className={`completed-filter-pill ${filter === f ? 'completed-filter-pill-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Completed Tasks Table */}
      <div className="completed-table-card">
        <table className="completed-table">
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Project</th>
              <th>Completed</th>
              <th>Approval Status</th>
              <th>Quality</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => {
              const st = statusStyle[task.status];
              return (
                <tr key={task.id}>
                  <td>
                    <div className="completed-task-name-cell">
                      <span className="completed-task-check">
                        <CheckCircle2 size={18} color="#16A34A" />
                      </span>
                      <div>
                        <div className="completed-task-title">{task.title}</div>
                        {task.approvedBy && (
                          <div className="completed-task-approver">Approved by {task.approvedBy}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="completed-project-cell">{task.project}</td>
                  <td className="completed-date-cell">
                    <Calendar size={14} />
                    <span>{task.completedDate}</span>
                  </td>
                  <td>
                    <span className="completed-status-badge" style={{ backgroundColor: st.bg, color: st.color }}>
                      <span className="completed-status-dot" style={{ backgroundColor: st.dot }}></span>
                      {task.status}
                    </span>
                  </td>
                  <td>
                    {task.quality !== null ? (
                      <div className="completed-quality-cell">
                        <div className="completed-quality-track">
                          <div className="completed-quality-fill" style={{ width: `${task.quality}%` }}></div>
                        </div>
                        <span className="completed-quality-value">{task.quality}%</span>
                      </div>
                    ) : (
                      <span className="completed-quality-pending">Pending</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
