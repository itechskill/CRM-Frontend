import React, { useState } from 'react';
import {
  Filter,
  Clock,
  Edit3,
  CheckCircle2,
  MessageSquare,
  UserPlus,
  ThumbsUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import './EmployeeActivityView.css';

const weeklyActivityData = [
  { day: 'Mon', tasks: 3, updates: 2, comments: 1 },
  { day: 'Tue', tasks: 2, updates: 3, comments: 2 },
  { day: 'Wed', tasks: 4, updates: 2, comments: 2 },
  { day: 'Thu', tasks: 1, updates: 4, comments: 1 },
  { day: 'Fri', tasks: 3, updates: 3, comments: 2 },
  { day: 'Sat', tasks: 0, updates: 0, comments: 0 },
  { day: 'Sun', tasks: 0, updates: 0, comments: 0 },
];

const thisWeekStats = [
  { label: 'Tasks Updated', value: '5', color: '#0F172A' },
  { label: 'Tasks Completed', value: '2', color: '#16A34A' },
  { label: 'Comments Made', value: '3', color: '#0F172A' },
  { label: 'Updates Logged', value: '4', color: '#D97706' },
  { label: 'Hours Tracked', value: '38.5h', color: '#EF4444' },
];

const filterOptions = ['All', 'Task Update', 'Completed', 'Comment', 'Assigned', 'Approval'];

const activityFeed = [
  {
    id: 1,
    type: 'Task Update',
    title: "Updated progress on 'Design new navigation component'",
    time: '10 minutes ago',
    icon: Edit3,
  },
  {
    id: 2,
    type: 'Completed',
    title: "Marked 'Fix ERP OAuth Token Refresh' as completed",
    time: '2 hours ago',
    icon: CheckCircle2,
  },
  {
    id: 3,
    type: 'Comment',
    title: "Commented on 'API gateway configuration'",
    time: '3 hours ago',
    icon: MessageSquare,
  },
  {
    id: 4,
    type: 'Assigned',
    title: "Assigned to 'Setup React Router Navigation'",
    time: '5 hours ago',
    icon: UserPlus,
  },
  {
    id: 5,
    type: 'Approval',
    title: "Approved proposal 'Q4 Analytics Dashboard'",
    time: 'Yesterday at 5:30 PM',
    icon: ThumbsUp,
  },
];

const typeIconStyle = {
  'Task Update': { bg: '#EFF6FF', color: '#2563EB' },
  Completed: { bg: '#DCFCE7', color: '#16A34A' },
  Comment: { bg: '#FEF3C7', color: '#D97706' },
  Assigned: { bg: '#F3E8FF', color: '#8B5CF6' },
  Approval: { bg: '#ECFDF5', color: '#10B981' },
};

const typeTagStyle = {
  'Task Update': { bg: '#EFF6FF', color: '#2563EB' },
  Completed: { bg: '#DCFCE7', color: '#15803D' },
  Comment: { bg: '#FEF3C7', color: '#B45309' },
  Assigned: { bg: '#F3E8FF', color: '#7C3AED' },
  Approval: { bg: '#ECFDF5', color: '#0F766E' },
};

export default function EmployeeActivityView() {
  const [filter, setFilter] = useState('All');

  const filteredFeed = activityFeed.filter((a) => filter === 'All' || a.type === filter);

  return (
    <div className="employee-activity-container">
      {/* Top Row: Weekly Activity Chart + This Week Stats */}
      <div className="activity-top-grid">
        <div className="activity-chart-card">
          <div className="activity-chart-header">
            <h3>Weekly Activity Overview</h3>
            <p>Your activity breakdown for this week</p>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  ticks={[0, 1, 2, 3, 4]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="left"
                  iconType="square"
                  wrapperStyle={{ fontSize: '0.82rem', fontWeight: 500, paddingTop: '12px' }}
                />
                <Bar dataKey="tasks" fill="#2563EB" radius={[3, 3, 0, 0]} barSize={14} name="Tasks" />
                <Bar dataKey="updates" fill="#10B981" radius={[3, 3, 0, 0]} barSize={14} name="Updates" />
                <Bar dataKey="comments" fill="#8B5CF6" radius={[3, 3, 0, 0]} barSize={14} name="Comments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="this-week-card">
          <h3>This Week</h3>
          <div className="this-week-list">
            {thisWeekStats.map((stat) => (
              <div className="this-week-row" key={stat.label}>
                <span className="this-week-label">{stat.label}</span>
                <span className="this-week-value" style={{ color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="activity-filter-bar">
        <Filter size={16} className="activity-filter-icon" />
        {filterOptions.map((f) => (
          <button
            key={f}
            className={`activity-filter-pill ${filter === f ? 'activity-filter-pill-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="activity-feed-list">
        {filteredFeed.map((act) => {
          const Icon = act.icon;
          const iconStyle = typeIconStyle[act.type];
          const tagStyle = typeTagStyle[act.type];
          return (
            <div className="activity-feed-card" key={act.id}>
              <div className="activity-feed-icon" style={{ backgroundColor: iconStyle.bg, color: iconStyle.color }}>
                <Icon size={17} />
              </div>
              <div className="activity-feed-content">
                <p className="activity-feed-title">{act.title}</p>
                <div className="activity-feed-time">
                  <Clock size={13} />
                  <span>{act.time}</span>
                </div>
              </div>
              <span className="activity-feed-tag" style={{ backgroundColor: tagStyle.bg, color: tagStyle.color }}>
                {act.type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
