import React, { useState, useEffect } from 'react';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './ProjectsPerformanceView.css';

export default function ProjectsPerformanceView() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/projects');
      if (response.ok && data.success) {
        setProjects(data.data || []);
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'active';
      case 'In Progress': return 'active';
      case 'On Hold': return 'warning';
      case 'Cancelled': return 'danger';
      default: return 'active';
    }
  };

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const completedCount = projects.filter(p => p.status === 'Completed').length;
  const inProgressCount = projects.filter(p => p.status === 'In Progress').length;

  return (
    <div className="ceo-view-container">
      <div className="ceo-grid-3">
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Total Active Projects</span>
          <span className="ceo-stat-num">{inProgressCount}</span>
          <span style={{ color: '#6366F1', fontSize: '0.8rem', fontWeight: 600 }}>Currently in Progress</span>
        </div>
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Completed Projects</span>
          <span className="ceo-stat-num">{completedCount}</span>
          <span style={{ color: '#16A34A', fontSize: '0.8rem', fontWeight: 600 }}>Delivered to Clients</span>
        </div>
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Portfolio Total Budget</span>
          <span className="ceo-stat-num">${totalBudget.toLocaleString()}</span>
          <span style={{ color: '#2563EB', fontSize: '0.8rem', fontWeight: 600 }}>Real MongoDB Projects Sum</span>
        </div>
      </div>

      <div className="ceo-card-panel">
        <div className="ceo-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Enterprise Project Portfolio Health (Real-Time DB Data)</span>
          <button
            onClick={fetchProjects}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#475569' }}
          >
            <RefreshCw size={12} /> Refresh Projects
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading project performance data...</div>
        ) : (
          <div className="ceo-table-wrapper">
            <table className="ceo-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Client</th>
                  <th>Priority</th>
                  <th>Budget</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p._id}>
                    <td className="ceo-table-name">{p.name}</td>
                    <td>{p.client || 'Internal'}</td>
                    <td>{p.priority || 'Medium'}</td>
                    <td>${(p.budget || 0).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${p.progress || 0}%`, height: '100%', backgroundColor: '#2563EB' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.progress || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`ceo-status-tag ${getStatusClass(p.status)}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>
                      No projects recorded in the database yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}