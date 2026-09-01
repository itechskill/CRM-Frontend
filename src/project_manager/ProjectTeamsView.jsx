import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './ProjectTeamsView.css';

const avatarColors = ['#2563EB', '#7C3AED', '#DB2777', '#10B981', '#F59E0B', '#0D9488'];

const departments = ['All', 'Engineering', 'Design', 'Quality', 'Infrastructure', 'Management', 'Data Science'];

const teamMembers = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Lead Developer',
    department: 'Engineering',
    utilization: 90,
    projectsCount: 3,
    tasksCount: 12,
    tags: ['Nexus Platform', 'Mobile Commerce'],
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    role: 'Backend Engineer',
    department: 'Engineering',
    utilization: 75,
    projectsCount: 3,
    tasksCount: 9,
    tags: ['Nexus Platform', 'DataSync Integr...'],
  },
  {
    id: 3,
    name: 'Priya Patel',
    role: 'UX Designer',
    department: 'Design',
    utilization: 60,
    projectsCount: 2,
    tasksCount: 7,
    tags: [],
  },
  {
    id: 4,
    name: 'Alex Rivera',
    role: 'QA Engineer',
    department: 'Quality',
    utilization: 85,
    projectsCount: 3,
    tasksCount: 14,
    tags: [],
  },
  {
    id: 5,
    name: 'Jordan Kim',
    role: 'Frontend Developer',
    department: 'Engineering',
    utilization: 70,
    projectsCount: 2,
    tasksCount: 8,
    tags: ['DataSync Integr...', 'Mobile Commerce'],
  },
  {
    id: 6,
    name: 'Taylor Brooks',
    role: 'DevOps Engineer',
    department: 'Infrastructure',
    utilization: 55,
    projectsCount: 2,
    tasksCount: 6,
    tags: ['Mobile Commerce', 'Cloud Migration'],
  },
  {
    id: 7,
    name: 'Morgan Lee',
    role: 'Project Manager',
    department: 'Management',
    utilization: 80,
    projectsCount: 2,
    tasksCount: 11,
    tags: ['Cloud Migration', 'Security Audit'],
  },
  {
    id: 8,
    name: 'Casey Wu',
    role: 'Data Engineer',
    department: 'Data Science',
    utilization: 65,
    projectsCount: 2,
    tasksCount: 5,
    tags: ['DataSync Integr...', 'AI Analytics'],
  },
];

const departmentCapacity = [
  { name: 'Engineering', members: 3, utilization: 78 },
  { name: 'Design', members: 1, utilization: 60 },
  { name: 'Quality', members: 1, utilization: 85 },
  { name: 'Infrastructure', members: 1, utilization: 55 },
  { name: 'Management', members: 1, utilization: 80 },
  { name: 'Data Science', members: 1, utilization: 65 },
];

function utilizationColor(value) {
  if (value >= 85) return '#EF4444';
  if (value >= 70) return '#F59E0B';
  return '#22C55E';
}

function initialsOf(name) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function shortName(fullName) {
  const parts = fullName.split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0]} ${parts[1][0]}.`;
}

export default function ProjectTeamsView() {
  const [members, setMembers] = useState(teamMembers);
  const [activeDept, setActiveDept] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberDept, setMemberDept] = useState('Engineering');

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!memberName.trim()) return;
    const newMember = {
      id: Date.now(),
      name: memberName.trim(),
      role: memberRole.trim() || 'Team Member',
      department: memberDept,
      utilization: 50,
      projectsCount: 1,
      tasksCount: 3,
      tags: [memberDept]
    };
    setMembers([newMember, ...members]);
    setMemberName('');
    setMemberRole('');
    setIsAddModalOpen(false);
  };

  const filteredMembers =
    activeDept === 'All' ? members : members.filter((m) => m.department === activeDept);

  const totalDepartments = new Set(members.map((m) => m.department)).size;

  const taskLoadData = members.map((m) => ({
    name: shortName(m.name),
    tasks: m.tasksCount,
  }));

  return (
    <div className="project-teams-container">
      <div className="teams-page-header">
        <div>
          <h1>Team Assignment</h1>
          <p>{members.length} team members across {totalDepartments} departments</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>+ Add Member</button>
      </div>

      <div className="teams-filter-row">
        {departments.map((dept) => (
          <button
            key={dept}
            className={`filter-pill ${activeDept === dept ? 'filter-pill-active' : ''}`}
            onClick={() => setActiveDept(dept)}
          >
            {dept}
          </button>
        ))}
      </div>

      <div className="teams-layout-grid">
        {/* Member cards */}
        <div className="teams-card-grid">
          {filteredMembers.map((member, i) => (
            <div className="team-member-card" key={member.id}>
              <div className="team-member-header">
                <div className="team-member-identity">
                  <span
                    className="team-avatar"
                    style={{ background: avatarColors[i % avatarColors.length] }}
                  >
                    {initialsOf(member.name)}
                  </span>
                  <div>
                    <h3>{member.name}</h3>
                    <span className="team-member-role">{member.role}</span>
                    <span className="team-member-dept">{member.department}</span>
                  </div>
                </div>
                <span
                  className="utilization-badge"
                  style={{
                    background: `${utilizationColor(member.utilization)}1A`,
                    color: utilizationColor(member.utilization),
                  }}
                >
                  {member.utilization}%
                </span>
              </div>

              <div className="team-capacity-block">
                <div className="capacity-header-row">
                  <span className="meta-label">Capacity</span>
                  <span
                    className="capacity-utilized-label"
                    style={{ color: utilizationColor(member.utilization) }}
                  >
                    {member.utilization}% utilized
                  </span>
                </div>
                <div className="capacity-track">
                  <div
                    className="capacity-fill"
                    style={{
                      width: `${member.utilization}%`,
                      background: utilizationColor(member.utilization),
                    }}
                  />
                </div>
              </div>

              <div className="team-member-stats-row">
                <span>📁 {member.projectsCount} projects</span>
                <span>☑ {member.tasksCount} tasks</span>
              </div>

              {member.tags.length > 0 && (
                <div className="team-member-tags">
                  {member.tags.slice(0, 2).map((tag) => (
                    <span className="team-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                  {member.tags.length > 2 && (
                    <span className="team-tag team-tag-more">+{member.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Side panels */}
        <div className="teams-side-panels">
          <div className="side-panel">
            <h2>Department Capacity</h2>
            <div className="dept-capacity-list">
              {departmentCapacity.map((dept) => (
                <div className="dept-capacity-row" key={dept.name}>
                  <div className="dept-capacity-top">
                    <span className="dept-name">{dept.name}</span>
                    <span className="dept-meta">
                      {dept.members} member{dept.members > 1 ? 's' : ''} · {dept.utilization}%
                    </span>
                  </div>
                  <div className="capacity-track">
                    <div
                      className="capacity-fill"
                      style={{
                        width: `${dept.utilization}%`,
                        background: utilizationColor(dept.utilization),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="side-panel">
            <h2>Workload Summary</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={taskLoadData}
                layout="vertical"
                margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF2F6" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="tasks" fill="#2563EB" radius={[0, 4, 4, 0]} maxBarSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>Add New Team Member</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Role / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Department</label>
                <select
                  value={memberDept}
                  onChange={(e) => setMemberDept(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem' }}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Quality">Quality</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Management">Management</option>
                  <option value="Data Science">Data Science</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '8px 16px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563EB', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}>Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
