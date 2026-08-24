import React, { useState } from 'react';
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
  GitCommit
} from 'lucide-react';
import './EmployeeDashboard.css';

export default function EmployeeDashboard({ currentUser, onNavigateTab, onOpenNewTaskModal }) {
  const [tasksList, setTasksList] = useState([
    {
      id: 1,
      title: 'Implement Dark Mode Theme Toggle in FlowBridge UI',
      project: 'Proxima Platform Migration',
      priority: 'High',
      dueDate: 'Today, 5:00 PM',
      estimated: '4.5h',
      status: 'In Progress',
      comments: 3
    },
    {
      id: 2,
      title: 'Optimize API Response Parsing for Analytics Engine',
      project: 'TechFlow Analytics Engine',
      priority: 'Critical',
      dueDate: 'Tomorrow',
      estimated: '6.0h',
      status: 'In Progress',
      comments: 5
    },
    {
      id: 3,
      title: 'Fix ERP OAuth Token Refresh Deadlock Bug',
      project: 'BuildCo ERP Integration',
      priority: 'High',
      dueDate: 'Jun 19, 2024',
      estimated: '2.0h',
      status: 'Pending',
      comments: 2
    },
    {
      id: 4,
      title: 'Refactor Security Audit Component Test Suite',
      project: 'Starlight Security Audit',
      priority: 'Medium',
      dueDate: 'Jun 20, 2024',
      estimated: '3.5h',
      status: 'Pending',
      comments: 1
    }
  ]);

  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'there';
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const handleToggleTaskStatus = (id) => {
    setTasksList(tasksList.map(task => {
      if (task.id === id) {
        const nextStatus = task.status === 'In Progress' ? 'Completed' : 'In Progress';
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  return (
    <div className="employee-dashboard-container">
      {/* Good Morning Greeting Banner */}
      <div className="employee-welcome-banner">
        <div className="employee-welcome-left">
          <h2 className="welcome-title">Good morning, {firstName} 👋</h2>
          <p className="welcome-subtitle">Here's what's happening with your work today — {todayFormatted}</p>
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="employee-kpi-grid">
        {/* Card 1: Assigned Projects */}
        <div className="employee-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Assigned Projects</span>
            <div className="kpi-icon-box blue">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-value">4</span>
            <span className="kpi-trend positive">+1 this month</span>
          </div>
        </div>

        {/* Card 2: Pending Tasks */}
        <div className="employee-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Pending Tasks</span>
            <div className="kpi-icon-box amber">
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-value">8</span>
            <span className="kpi-trend neutral">3 due soon</span>
          </div>
        </div>

        {/* Card 3: Completed Tasks */}
        <div className="employee-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Completed Tasks</span>
            <div className="kpi-icon-box green">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-value">6</span>
            <span className="kpi-trend positive">+2 this week</span>
          </div>
        </div>

        {/* Card 4: Overdue Tasks */}
        <div className="employee-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Overdue Tasks</span>
            <div className="kpi-icon-box red">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-value">1</span>
            <span className="kpi-trend negative">Needs attention</span>
          </div>
        </div>

        {/* Card 5: Hours Logged */}
        <div className="employee-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Hours Logged</span>
            <div className="kpi-icon-box purple">
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-value">38.5h</span>
            <span className="kpi-trend neutral">This week</span>
          </div>
        </div>

        {/* Card 6: Performance */}
        <div className="employee-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Performance</span>
            <div className="kpi-icon-box gold">
              <Star size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-value">94%</span>
            <span className="kpi-trend positive">Top 10%</span>
          </div>
        </div>
      </div>

      {/* Analytics & Charts Row */}
      <div className="employee-charts-row">
        {/* Weekly Hours Logged Line Chart */}
        <div className="employee-chart-card hours-logged-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Weekly Hours Logged</h3>
              <p className="chart-card-sub">38.5 hours this week</p>
            </div>
            <div className="chart-badge-trend">
              <TrendingUp size={14} />
              <span>+12%</span>
            </div>
          </div>

          <div className="hours-line-chart-wrapper">
            <svg viewBox="0 0 500 160" className="hours-svg-chart">
              {/* Grid lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5F9" strokeWidth="1" />

              {/* Area gradient under curve */}
              <defs>
                <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path 
                d="M 30 110 Q 100 130, 150 90 T 270 70 T 380 40 T 470 75 L 470 150 L 30 150 Z" 
                fill="url(#hoursGrad)" 
              />

              {/* Spline Line */}
              <path 
                d="M 30 110 Q 100 130, 150 90 T 270 70 T 380 40 T 470 75" 
                fill="none" 
                stroke="#2563EB" 
                strokeWidth="3.5" 
                strokeLinecap="round"
              />

              {/* Data points */}
              <circle cx="30" cy="110" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="110" cy="115" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="190" cy="85" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="270" cy="70" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="350" cy="40" r="6" fill="#2563EB" stroke="#FFFFFF" strokeWidth="3" />
              <circle cx="430" cy="65" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="470" cy="75" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            <div className="hours-chart-labels">
              <span>Mon (7.5h)</span>
              <span>Tue (7.0h)</span>
              <span>Wed (8.5h)</span>
              <span>Thu (8.0h)</span>
              <span>Fri (7.5h)</span>
              <span>Sat (0h)</span>
              <span>Sun (0h)</span>
            </div>
          </div>
        </div>

        {/* Task Status Donut Chart */}
        <div className="employee-chart-card task-status-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Task Status</h3>
              <p className="chart-card-sub">15 total tasks</p>
            </div>
          </div>

          <div className="donut-chart-container">
            <div className="donut-graphic">
              <svg viewBox="0 0 100 100" className="donut-svg">
                {/* Completed - 6/15 = 40% (Green) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="14"
                  strokeDasharray="95.5 143.2" strokeDashoffset="0" />
                {/* In Progress - 5/15 = 33.3% (Blue) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#2563EB" strokeWidth="14"
                  strokeDasharray="79.5 159.2" strokeDashoffset="-98.5" />
                {/* In Review - 3/15 = 20% (Amber) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="14"
                  strokeDasharray="47.7 191" strokeDashoffset="-179" />
                {/* Overdue - 1/15 = 6.7% (Red) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" strokeWidth="14"
                  strokeDasharray="16 222.7" strokeDashoffset="-227.7" />
              </svg>
              <div className="donut-center-text">
                <span className="donut-total">15</span>
                <span className="donut-label">Tasks</span>
              </div>
            </div>

            <div className="donut-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#10B981' }} />
                <span className="legend-name">Completed</span>
                <span className="legend-count">6</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#2563EB' }} />
                <span className="legend-name">In Progress</span>
                <span className="legend-count">5</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#F59E0B' }} />
                <span className="legend-name">In Review</span>
                <span className="legend-count">3</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#EF4444' }} />
                <span className="legend-name">Overdue</span>
                <span className="legend-count">1</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Active Tasks & Recent Activity */}
      <div className="employee-bottom-grid">
        {/* Active Assigned Tasks List */}
        <div className="employee-widget-card active-tasks-widget">
          <div className="widget-header">
            <div className="widget-title-area">
              <CheckSquare size={18} color="#2563EB" />
              <h3>My Active Tasks</h3>
            </div>
            <button className="widget-action-link" onClick={() => onNavigateTab('tasks')}>
              View All Tasks
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="tasks-list">
            {tasksList.map((task) => (
              <div key={task.id} className="task-item-card">
                <div className="task-left">
                  <input 
                    type="checkbox"
                    checked={task.status === 'Completed'}
                    onChange={() => handleToggleTaskStatus(task.id)}
                    className="task-checkbox"
                  />
                  <div className="task-info">
                    <span className={`task-title ${task.status === 'Completed' ? 'completed' : ''}`}>
                      {task.title}
                    </span>
                    <div className="task-meta-row">
                      <span className="task-project-tag">{task.project}</span>
                      <span className="task-due-date">Due: {task.dueDate}</span>
                      <span className="task-est">Est: {task.estimated}</span>
                    </div>
                  </div>
                </div>

                <div className="task-right">
                  <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                  <span className={`status-pill ${task.status.toLowerCase().replace(' ', '-')}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="employee-widget-card activity-feed-widget">
          <div className="widget-header">
            <div className="widget-title-area">
              <GitCommit size={18} color="#10B981" />
              <h3>Recent Activity</h3>
            </div>
            <button className="widget-action-link" onClick={() => onNavigateTab('activity')}>
              Full Feed
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="activity-timeline">
            <div className="activity-timeline-item">
              <div className="activity-node blue" />
              <div className="activity-content">
                <p className="activity-text">
                  <strong>You</strong> submitted code review for <span className="highlight">PR #142</span> (Platform Migration)
                </p>
                <span className="activity-time">35m ago</span>
              </div>
            </div>

            <div className="activity-timeline-item">
              <div className="activity-node green" />
              <div className="activity-content">
                <p className="activity-text">
                  <strong>Logged 3.5 hours</strong> on <span className="highlight">Analytics Engine API Parsing</span>
                </p>
                <span className="activity-time">2h ago</span>
              </div>
            </div>

            <div className="activity-timeline-item">
              <div className="activity-node purple" />
              <div className="activity-content">
                <p className="activity-text">
                  <strong>Daniel Torres</strong> assigned you task <span className="highlight">ERP OAuth Token Refresh</span>
                </p>
                <span className="activity-time">4h ago</span>
              </div>
            </div>

            <div className="activity-timeline-item">
              <div className="activity-node amber" />
              <div className="activity-content">
                <p className="activity-text">
                  Completed daily standup check-in: <span className="highlight">"Finished dark mode mockups"</span>
                </p>
                <span className="activity-time">9:00 AM Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
