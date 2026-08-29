import React from 'react';
import ProjectKpiCard from './ProjectKpiCard';
import ProjectCompletionTrend from './ProjectCompletionChart';
import ProjectStatusDonutChart from './ProjectStatusDonutChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Folder, Activity, CheckCircle, Target, Clock, TrendingUp } from 'lucide-react';
import './ProjectManagerDashboard.css';

const statusStyles = {
  'In Progress': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Review': { bg: '#F3E8FF', color: '#7E22CE' },
  'Completed': { bg: '#DCFCE7', color: '#15803D' },
};

const healthStyles = {
  Good: '#22C55E',
  'At Risk': '#F59E0B',
  Critical: '#EF4444',
};

const dotColors = {
  info: '#3B82F6',
  success: '#22C55E',
  warning: '#EF4444',
  update: '#A855F7',
};

const avatarColors = ['#4F46E5', '#DB2777', '#F59E0B', '#0D9488', '#7C3AED', '#2563EB'];

const activeProjects = [
  { id: 1, name: 'Nexus Platform Redesign', status: 'In Progress', client: 'TechCorp Inc.', health: 'Good', progress: 68, team: ['SC', 'MJ', 'PP', 'X'] },
  { id: 2, name: 'DataSync Integration Suite', status: 'In Progress', client: 'FinanceHub Corp', health: 'At Risk', progress: 42, team: ['MJ', 'JK', 'CW'] },
  { id: 3, name: 'Mobile Commerce App', status: 'Review', client: 'RetailMax Global', health: 'Good', progress: 85, team: ['SC', 'PP', 'JK', 'X'] },
  { id: 4, name: 'Cloud Migration v2.0', status: 'In Progress', client: 'GlobalBank Financial', health: 'At Risk', progress: 31, team: ['MJ', 'AR', 'TB', 'X'] },
];

const activityItems = [
  { id: 1, type: 'info', text: 'Mobile Commerce App moved to Review stage', time: '2m ago' },
  { id: 2, type: 'info', text: 'Sarah Chen completed auth flow implementation', time: '18m ago' },
  { id: 3, type: 'success', text: 'Client TechCorp approved UI design mockups', time: '1h ago' },
  { id: 4, type: 'warning', text: 'Cloud Migration v2.0 marked At Risk', time: '3h ago' },
  { id: 5, type: 'update', text: 'New milestone added to DataSync project', time: '5h ago' },
  { id: 6, type: 'info', text: 'Alex Rivera submitted QA report for review', time: 'Yesterday' },
];

const taskDistributionData = [
  { project: 'Nexus', Backlog: 2, 'In Progress': 2 },
  { project: 'DataSync', 'In Progress': 1, Review: 1 },
  { project: 'Mobile', Review: 1, Testing: 1, Done: 1 },
  { project: 'Cloud', Backlog: 2 },
  { project: 'Security', Backlog: 2 },
];

const taskBarColors = {
  Backlog: '#CBD5E1',
  'In Progress': '#2563EB',
  Review: '#A855F7',
  Testing: '#F59E0B',
  Done: '#22C55E',
};

export default function ProjectManagerDashboard({ currentUser }) {
  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'there';
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="project-dashboard-container">
      {/* Welcome Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        padding: '20px 24px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
      }}>
        <h2 style={{ color: '#0F172A', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
          Good morning, {firstName} 📁
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '4px', margin: '4px 0 0 0' }}>
          Here's your project status, team velocity, and milestone overview — {todayFormatted}
        </p>
      </div>
      {/* 6 Top KPI Cards */}
      <div className="project-kpi-grid">
        <ProjectKpiCard title="Total Projects" value="6" subtext="+2 this month" subtextType="positive" icon={Folder} colorTheme="blue" isUp={true} />
        <ProjectKpiCard title="Active Projects" value="3" subtext="3 in progress" subtextType="positive" icon={Activity} colorTheme="indigo" isUp={true} />
        <ProjectKpiCard title="Completed" value="1" subtext="+1 this quarter" subtextType="positive" icon={CheckCircle} colorTheme="green" isUp={true} />
        <ProjectKpiCard title="Health Score" value="67%" subtext="Above target" subtextType="positive" icon={Target} colorTheme="teal" isUp={true} />
        <ProjectKpiCard title="Due This Month" value="6" subtext="4 deliverables" subtextType="warning" icon={Clock} colorTheme="amber" isUp={false} />
        <ProjectKpiCard title="Avg Completion" value="57%" subtext="+6% vs last month" subtextType="positive" icon={TrendingUp} colorTheme="purple" isUp={true} />
      </div>

      {/* Analytics Charts Grid */}
      <div className="project-analytics-grid">
        <ProjectCompletionTrend />
        <ProjectStatusDonutChart />
      </div>

      {/* Active Projects + Activity Feed */}
      <div className="project-panels-grid">
        {/* Active Projects */}
        <div className="active-projects-panel">
          <div className="panel-header">
            <h2>Active Projects</h2>
            <button className="view-all-link">View all →</button>
          </div>

          <div className="active-projects-list">
            {activeProjects.map((project) => (
              <div className="active-project-row" key={project.id}>
                <div className="project-info">
                  <div className="project-title-line">
                    <span className="project-name">{project.name}</span>
                    <span
                      className="status-badge"
                      style={{
                        background: statusStyles[project.status]?.bg,
                        color: statusStyles[project.status]?.color,
                      }}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="project-meta">
                    <span className="project-client">{project.client}</span>
                    <span className="health-dot" style={{ background: healthStyles[project.health] }} />
                    <span className="health-label" style={{ color: healthStyles[project.health] }}>
                      {project.health}
                    </span>
                  </div>
                </div>

                <div className="project-progress">
                  <span className="progress-percent">{project.progress}%</span>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div className="avatar-stack">
                  {project.team.slice(0, 3).map((initials, i) => (
                    <span
                      key={i}
                      className="avatar-chip"
                      style={{ background: avatarColors[i % avatarColors.length] }}
                    >
                      {initials}
                    </span>
                  ))}
                  {project.team.length > 3 && (
                    <span className="avatar-chip avatar-more">+{project.team.length - 3}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="activity-feed-panel">
          <div className="panel-header">
            <h2>Activity Feed</h2>
          </div>

          <div className="activity-feed-list">
            {activityItems.map((item) => (
              <div className="activity-row" key={item.id}>
                <span className="activity-dot" style={{ background: dotColors[item.type] || '#3B82F6' }} />
                <div className="activity-content">
                  <p className="activity-text">{item.text}</p>
                  <span className="activity-time">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Distribution by Project */}
      <div className="chart-widget">
        <div className="chart-widget-header">
          <div>
            <h3 className="chart-widget-title">Task Distribution by Project</h3>
            <p className="chart-widget-subtitle">Active task status across all projects</p>
          </div>
          <button className="manage-tasks-link">Manage tasks →</button>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={taskDistributionData} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F6" />
            <XAxis
              dataKey="project"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 13 }}
            />
            <YAxis
              domain={[0, 2]}
              ticks={[0, 0.5, 1, 1.5, 2]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 13 }}
            />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            {Object.keys(taskBarColors).map((key) => (
              <Bar key={key} dataKey={key} fill={taskBarColors[key]} radius={[3, 3, 0, 0]} maxBarSize={14} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
