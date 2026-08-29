import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  Users, UserCheck, UserX, Clock, CalendarX, TrendingUp,
  ArrowUpRight, Briefcase, Star
} from 'lucide-react';
import './HRDashboard.css';

const pendingLeavesMock = [
  { id: 1, name: 'Aisha Nkosi', initials: 'AN', bg: '#F59E0B', type: 'Annual Leave', dates: 'Aug 22 – Aug 24' },
  { id: 2, name: 'Daniel Torres', initials: 'DT', bg: '#10B981', type: 'Sick Leave', dates: 'Aug 21 – Aug 21' },
  { id: 3, name: 'Marcus Chen', initials: 'MC', bg: '#2563EB', type: 'Personal Leave', dates: 'Aug 25 – Aug 26' },
  { id: 4, name: 'Elena Rostova', initials: 'ER', bg: '#EC4899', type: 'Annual Leave', dates: 'Sep 1 – Sep 5' },
];

const openPositions = [
  { id: 1, title: 'Senior Frontend Developer', dept: 'Engineering', applicants: 28 },
  { id: 2, title: 'UX Designer', dept: 'Design', applicants: 17 },
  { id: 3, title: 'Product Manager', dept: 'Product', applicants: 45 },
  { id: 4, title: 'Data Analyst', dept: 'Analytics', applicants: 12 },
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const attendanceData = [
  { present: 95, absent: 8, leave: 12 },
  { present: 110, absent: 5, leave: 8 },
  { present: 108, absent: 7, leave: 10 },
  { present: 112, absent: 4, leave: 7 },
  { present: 105, absent: 6, leave: 14 },
];
const maxVal = 130;

export default function HRDashboard({ currentUser, onNavigateTab }) {
  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'there';
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  const [stats, setStats] = useState({
    totalEmployees: 22,
    presentToday: 18,
    absentToday: 2,
    onLeaveToday: 2,
    pendingLeavesCount: 1
  });

  const [pendingLeavesList, setPendingLeavesList] = useState([]);

  const fetchHRDashboardData = async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        apiRequest('/api/hr/stats'),
        apiRequest('/api/hr/leaves')
      ]);

      if (sRes.response.ok && sRes.data.success && sRes.data.data) {
        setStats(sRes.data.data);
      }

      if (lRes.response.ok && lRes.data.success && Array.isArray(lRes.data.data)) {
        const pendingOnly = lRes.data.data.filter(l => l.status === 'Pending').map((l, i) => ({
          id: l._id,
          name: l.userName || l.user?.fullName || 'Employee',
          initials: (l.userName || l.user?.fullName || 'E').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          bg: ['#F59E0B', '#10B981', '#2563EB', '#EC4899', '#8B5CF6'][i % 5],
          type: l.leaveType,
          dates: `${new Date(l.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(l.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        }));
        setPendingLeavesList(pendingOnly);
      }
    } catch (err) {
      console.error('Fetch HR dashboard error:', err);
    }
  };

  useEffect(() => {
    fetchHRDashboardData();
  }, []);

  const handleApproveLeave = async (id) => {
    await apiRequest(`/api/hr/leaves/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Approved' })
    });
    fetchHRDashboardData();
  };

  const handleRejectLeave = async (id) => {
    await apiRequest(`/api/hr/leaves/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Rejected' })
    });
    fetchHRDashboardData();
  };

  return (
    <div className="hr-dashboard">
      {/* Welcome Banner */}
      <div className="hr-welcome-banner">
        <div className="hr-welcome-left">
          <h2>Good morning, {firstName}! 👋</h2>
          <p>Here's your HR overview for today — {todayFormatted}</p>
        </div>
        <div className="hr-welcome-stats">
          <div className="hr-welcome-stat">
            <span className="hr-welcome-stat-value">{stats.totalEmployees}</span>
            <span className="hr-welcome-stat-label">Total Staff</span>
          </div>
          <div className="hr-welcome-stat">
            <span className="hr-welcome-stat-value">{stats.pendingLeavesCount}</span>
            <span className="hr-welcome-stat-label">Pending Leaves</span>
          </div>
          <div className="hr-welcome-stat">
            <span className="hr-welcome-stat-value">12</span>
            <span className="hr-welcome-stat-label">Open Positions</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="hr-kpi-grid">
        <div className="hr-kpi-card">
          <div className="hr-kpi-top">
            <span className="hr-kpi-label">Total Employees</span>
            <div className="hr-kpi-icon purple"><Users size={18} /></div>
          </div>
          <div className="hr-kpi-value">{stats.totalEmployees}</div>
          <div className="hr-kpi-trend up">Live MongoDB Count</div>
        </div>

        <div className="hr-kpi-card">
          <div className="hr-kpi-top">
            <span className="hr-kpi-label">Present Today</span>
            <div className="hr-kpi-icon green"><UserCheck size={18} /></div>
          </div>
          <div className="hr-kpi-value">{stats.presentToday}</div>
          <div className="hr-kpi-trend neutral">
            {stats.totalEmployees ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}% attendance
          </div>
        </div>

        <div className="hr-kpi-card">
          <div className="hr-kpi-top">
            <span className="hr-kpi-label">On Leave</span>
            <div className="hr-kpi-icon amber"><CalendarX size={18} /></div>
          </div>
          <div className="hr-kpi-value">{stats.onLeaveToday}</div>
          <div className="hr-kpi-trend neutral">{stats.pendingLeavesCount} pending approval</div>
        </div>

        <div className="hr-kpi-card">
          <div className="hr-kpi-top">
            <span className="hr-kpi-label">Absent</span>
            <div className="hr-kpi-icon red"><UserX size={18} /></div>
          </div>
          <div className="hr-kpi-value">{stats.absentToday}</div>
          <div className="hr-kpi-trend down">Today's recorded absent</div>
        </div>

        <div className="hr-kpi-card">
          <div className="hr-kpi-top">
            <span className="hr-kpi-label">Open Positions</span>
            <div className="hr-kpi-icon blue"><Briefcase size={18} /></div>
          </div>
          <div className="hr-kpi-value">12</div>
          <div className="hr-kpi-trend neutral">90 applicants total</div>
        </div>

        <div className="hr-kpi-card">
          <div className="hr-kpi-top">
            <span className="hr-kpi-label">Avg. Performance</span>
            <div className="hr-kpi-icon teal"><Star size={18} /></div>
          </div>
          <div className="hr-kpi-value">88%</div>
          <div className="hr-kpi-trend up">↑ +3% vs last Q</div>
        </div>

        <div className="hr-kpi-card">
          <div className="hr-kpi-top">
            <span className="hr-kpi-label">Avg. Hours/Week</span>
            <div className="hr-kpi-icon purple"><Clock size={18} /></div>
          </div>
          <div className="hr-kpi-value">41.2h</div>
          <div className="hr-kpi-trend neutral">Within normal range</div>
        </div>

        <div className="hr-kpi-card">
          <div className="hr-kpi-top">
            <span className="hr-kpi-label">Retention Rate</span>
            <div className="hr-kpi-icon green"><TrendingUp size={18} /></div>
          </div>
          <div className="hr-kpi-value">94%</div>
          <div className="hr-kpi-trend up">↑ +1.5% YoY</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="hr-charts-row">
        {/* Weekly Attendance Bar Chart */}
        <div className="hr-chart-card">
          <div className="hr-chart-header">
            <div>
              <h3 className="hr-chart-title">Weekly Attendance Overview</h3>
              <p className="hr-chart-sub">Present, absent & on leave — this week</p>
            </div>
            <div className="hr-chart-badge">
              <TrendingUp size={13} />
              <span>89% avg.</span>
            </div>
          </div>

          <div className="hr-bar-chart">
            {weekDays.map((day, i) => {
              const d = attendanceData[i];
              const pHeight = Math.round((d.present / maxVal) * 130);
              const aHeight = Math.round((d.absent / maxVal) * 130);
              const lHeight = Math.round((d.leave / maxVal) * 130);
              return (
                <div className="hr-bar-group" key={day}>
                  <div className="hr-bar-wrapper">
                    <div className="hr-bar present" style={{ height: pHeight }} title={`Present: ${d.present}`} />
                    <div className="hr-bar absent" style={{ height: aHeight }} title={`Absent: ${d.absent}`} />
                    <div className="hr-bar leave" style={{ height: lHeight }} title={`Leave: ${d.leave}`} />
                  </div>
                  <span className="hr-bar-label">{day}</span>
                </div>
              );
            })}
          </div>

          <div className="hr-bar-chart-legend">
            <div className="hr-legend-dot-item">
              <div className="hr-legend-dot" style={{ backgroundColor: '#7C3AED' }} />
              <span>Present</span>
            </div>
            <div className="hr-legend-dot-item">
              <div className="hr-legend-dot" style={{ backgroundColor: '#FCA5A5' }} />
              <span>Absent</span>
            </div>
            <div className="hr-legend-dot-item">
              <div className="hr-legend-dot" style={{ backgroundColor: '#FCD34D' }} />
              <span>On Leave</span>
            </div>
          </div>
        </div>

        {/* Headcount by Dept Donut */}
        <div className="hr-chart-card">
          <div className="hr-chart-header">
            <div>
              <h3 className="hr-chart-title">Headcount by Department</h3>
              <p className="hr-chart-sub">142 employees total</p>
            </div>
          </div>
          <div className="hr-donut-container">
            <div className="hr-donut-graphic">
              <svg viewBox="0 0 100 100" className="hr-donut-svg">
                {/* Engineering 35% */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#7C3AED" strokeWidth="14"
                  strokeDasharray="83.5 155" strokeDashoffset="0" />
                {/* Sales 22% */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#2563EB" strokeWidth="14"
                  strokeDasharray="52.4 185.9" strokeDashoffset="-86" />
                {/* Operations 18% */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="14"
                  strokeDasharray="43 195.3" strokeDashoffset="-141" />
                {/* Design 14% */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="14"
                  strokeDasharray="33.4 204.9" strokeDashoffset="-186" />
                {/* Other 11% */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EC4899" strokeWidth="14"
                  strokeDasharray="26.2 212.1" strokeDashoffset="-221" />
              </svg>
              <div className="hr-donut-center">
                <span className="hr-donut-total">142</span>
                <span className="hr-donut-lbl">Staff</span>
              </div>
            </div>
            <div className="hr-donut-legend">
              {[
                { label: 'Engineering', count: 50, color: '#7C3AED' },
                { label: 'Sales', count: 31, color: '#2563EB' },
                { label: 'Operations', count: 26, color: '#10B981' },
                { label: 'Design', count: 20, color: '#F59E0B' },
                { label: 'Other', count: 15, color: '#EC4899' },
              ].map((item) => (
                <div className="hr-legend-row" key={item.label}>
                  <div className="hr-legend-left">
                    <div className="hr-legend-dot" style={{ backgroundColor: item.color, width: 10, height: 10, borderRadius: '50%' }} />
                    <span className="hr-legend-name">{item.label}</span>
                  </div>
                  <span className="hr-legend-count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="hr-bottom-grid">
        {/* Pending Leave Requests */}
        <div className="hr-widget-card">
          <div className="hr-widget-header">
            <div className="hr-widget-title-area">
              <CalendarX size={18} color="#7C3AED" />
              <h3>Pending Leave Requests</h3>
            </div>
            <button className="hr-widget-link" onClick={() => onNavigateTab && onNavigateTab('attendance')}>
              View All <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="hr-leaves-list">
            {pendingLeavesList.length > 0 ? (
              pendingLeavesList.map((leave) => (
                <div className="hr-leave-row" key={leave.id}>
                  <div className="hr-leave-emp">
                    <div className="hr-leave-avatar" style={{ backgroundColor: leave.bg }}>{leave.initials}</div>
                    <div className="hr-leave-emp-info">
                      <span className="hr-leave-emp-name">{leave.name}</span>
                      <span className="hr-leave-type">{leave.type}</span>
                    </div>
                  </div>
                  <span className="hr-leave-dates">{leave.dates}</span>
                  <div className="hr-leave-actions">
                    <button className="hr-approve-btn" onClick={() => handleApproveLeave(leave.id)}>Approve</button>
                    <button className="hr-reject-btn" onClick={() => handleRejectLeave(leave.id)}>Reject</button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                No pending leave requests.
              </div>
            )}
          </div>
        </div>

        {/* Open Positions */}
        <div className="hr-widget-card">
          <div className="hr-widget-header">
            <div className="hr-widget-title-area">
              <Briefcase size={18} color="#2563EB" />
              <h3>Open Positions</h3>
            </div>
            <button className="hr-widget-link" onClick={() => onNavigateTab && onNavigateTab('recruitment')}>
              View All <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="hr-positions-list">
            {openPositions.map((pos) => (
              <div className="hr-position-row" key={pos.id}>
                <div>
                  <div className="hr-position-title">{pos.title}</div>
                  <div className="hr-position-dept">{pos.dept}</div>
                </div>
                <span className="hr-position-applicants">{pos.applicants} applicants</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
