import React from 'react';
import { Plus, Calendar } from 'lucide-react';
import './ProjectsView.css';

const initialProjectsData = [
  {
    id: 1,
    name: 'Proxima Platform Migration',
    client: 'Proxima Labs',
    leadName: 'Daniel Torres',
    leadInitials: 'DT',
    leadBg: '#2563EB',
    progress: 78,
    budgetSpent: 'Rs. 34K',
    budgetTotal: 'Rs. 42K',
    budgetRatio: 80,
    dueDate: 'Feb 28, 2025',
    priority: 'High',
    status: 'On Track'
  },
  {
    id: 2,
    name: 'BuildCo ERP Integration',
    client: 'BuildCo Industries',
    leadName: 'Sarah Mitchell',
    leadInitials: 'SM',
    leadBg: '#10B981',
    progress: 45,
    budgetSpent: 'Rs. 22K',
    budgetTotal: 'Rs. 28K',
    budgetRatio: 78,
    dueDate: 'Jan 15, 2025',
    priority: 'Critical',
    status: 'At Risk'
  },
  {
    id: 3,
    name: 'TechFlow Analytics Engine',
    client: 'TechFlow Inc',
    leadName: 'Clara Novak',
    leadInitials: 'CN',
    leadBg: '#F59E0B',
    progress: 90,
    budgetSpent: 'Rs. 17K',
    budgetTotal: 'Rs. 20K',
    budgetRatio: 85,
    dueDate: 'Dec 31, 2024',
    priority: 'Medium',
    status: 'On Track'
  },
  {
    id: 4,
    name: 'Starlight Security Audit',
    client: 'Starlight Ventures',
    leadName: 'Liam Chen',
    leadInitials: 'LC',
    leadBg: '#8B5CF6',
    progress: 60,
    budgetSpent: 'Rs. 45K',
    budgetTotal: 'Rs. 60K',
    budgetRatio: 75,
    dueDate: 'Mar 20, 2025',
    priority: 'Medium',
    status: 'On Track'
  },
  {
    id: 5,
    name: 'Apex Infrastructure Scale',
    client: 'Apex Software',
    leadName: 'Elena Rostova',
    leadInitials: 'ER',
    leadBg: '#EC4899',
    progress: 25,
    budgetSpent: 'Rs. 12K',
    budgetTotal: 'Rs. 50K',
    budgetRatio: 24,
    dueDate: 'Apr 10, 2025',
    priority: 'High',
    status: 'Delayed'
  }
];

export default function ProjectsView({ projectsList = initialProjectsData, onOpenNewProjectModal }) {
  const getPriorityStyle = (priority) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return { backgroundColor: '#FEE2E2', color: '#EF4444' };
      case 'high':
        return { backgroundColor: '#FEF3C7', color: '#D97706' };
      case 'medium':
        return { backgroundColor: '#EFF6FF', color: '#2563EB' };
      default:
        return { backgroundColor: '#F1F5F9', color: '#64748B' };
    }
  };

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'on track':
        return { backgroundColor: '#DCFCE7', color: '#15803D', dot: '#16A34A' };
      case 'at risk':
        return { backgroundColor: '#FEF3C7', color: '#B45309', dot: '#D97706' };
      case 'delayed':
        return { backgroundColor: '#FEE2E2', color: '#B91C1C', dot: '#EF4444' };
      default:
        return { backgroundColor: '#F3E8FF', color: '#6B21A8', dot: '#8B5CF6' };
    }
  };

  const currentProjects = projectsList && projectsList.length > 0 ? projectsList : initialProjectsData;

  const totalCount = 92;
  const onTrackCount = 42;
  const atRiskCount = 19;
  const completedCount = 31;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {/* Card 1: Total Projects */}
        <div className="project-stat-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563EB', flexShrink: 0 }}></span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{totalCount}</span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500, marginTop: '8px' }}>Total Projects</div>
        </div>

        {/* Card 2: On Track */}
        <div className="project-stat-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }}></span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{onTrackCount}</span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500, marginTop: '8px' }}>On Track</div>
        </div>

        {/* Card 3: At Risk / Delayed */}
        <div className="project-stat-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B', flexShrink: 0 }}></span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{atRiskCount}</span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500, marginTop: '8px' }}>At Risk / Delayed</div>
        </div>

        {/* Card 4: Completed (YTD) */}
        <div className="project-stat-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#8B5CF6', flexShrink: 0 }}></span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{completedCount}</span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500, marginTop: '8px' }}>Completed (YTD)</div>
        </div>
      </div>

      {/* Active Projects Table Widget Container */}
      <div className="data-table-container" style={{ borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
        {/* Table Toolbar */}
        <div className="table-header-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', margin: 0 }}>Active Projects</h2>
          <button
            className="btn-primary"
            onClick={onOpenNewProjectModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              border: 'none',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <Plus size={16} /> New Project
          </button>
        </div>

        {/* Projects Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '14px 12px 14px 24px', color: '#64748B', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'left' }}>PROJECT</th>
                <th style={{ padding: '14px 12px', color: '#64748B', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'left' }}>CLIENT</th>
                <th style={{ padding: '14px 12px', color: '#64748B', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'left' }}>LEAD</th>
                <th style={{ padding: '14px 12px', color: '#64748B', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'left' }}>PROGRESS</th>
                <th style={{ padding: '14px 12px', color: '#64748B', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'left' }}>BUDGET</th>
                <th style={{ padding: '14px 12px', color: '#64748B', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'left' }}>DUE DATE</th>
                <th style={{ padding: '14px 12px', color: '#64748B', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'left' }}>PRIORITY</th>
                <th style={{ padding: '14px 24px 14px 12px', color: '#64748B', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'right' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {currentProjects.map((proj) => {
                const statusStyle = getStatusStyle(proj.status);
                const priorityStyle = getPriorityStyle(proj.priority);
                const ratio = proj.budgetRatio || 75;

                return (
                  <tr key={proj.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {/* PROJECT NAME */}
                    <td style={{ padding: '16px 12px 16px 24px', fontWeight: 700, color: '#0F172A', lineHeight: 1.3, verticalAlign: 'middle', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {proj.name}
                    </td>

                    {/* CLIENT */}
                    <td style={{ padding: '16px 12px', color: '#475569', fontWeight: 500, verticalAlign: 'middle', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proj.client}
                    </td>

                    {/* LEAD */}
                    <td style={{ padding: '16px 12px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: proj.leadBg || '#2563EB',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {proj.leadInitials}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.leadName}</span>
                      </div>
                    </td>

                    {/* PROGRESS */}
                    <td style={{ padding: '16px 12px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', minWidth: '40px' }}>
                          <div style={{ width: `${proj.progress}%`, height: '100%', backgroundColor: '#2563EB', borderRadius: '4px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', flexShrink: 0 }}>{proj.progress}%</span>
                      </div>
                    </td>

                    {/* BUDGET */}
                    <td style={{ padding: '16px 12px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                          {proj.budgetSpent} / {proj.budgetTotal}
                        </span>
                        <div style={{ height: '3px', backgroundColor: '#E2E8F0', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                          <div style={{ width: `${ratio}%`, height: '100%', backgroundColor: '#10B981', borderRadius: '2px' }}></div>
                        </div>
                      </div>
                    </td>

                    {/* DUE DATE */}
                    <td style={{ padding: '16px 12px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B', fontSize: '0.8rem' }}>
                        <Calendar size={13} color="#94A3B8" style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.dueDate}</span>
                      </div>
                    </td>

                    {/* PRIORITY */}
                    <td style={{ padding: '16px 12px', verticalAlign: 'middle' }}>
                      <span style={{
                        ...priorityStyle,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'inline-block',
                        whiteSpace: 'nowrap'
                      }}>
                        {proj.priority}
                      </span>
                    </td>

                    {/* STATUS - Right Aligned cleanly matching right header padding */}
                    <td style={{ padding: '16px 24px 16px 12px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <span style={{
                        backgroundColor: statusStyle.backgroundColor,
                        color: statusStyle.color,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: statusStyle.dot,
                          flexShrink: 0
                        }}></span>
                        {proj.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
