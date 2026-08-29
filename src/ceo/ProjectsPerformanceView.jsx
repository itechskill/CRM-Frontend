import React from 'react';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import './ProjectsPerformanceView.css';

export default function ProjectsPerformanceView() {
  const projects = [
    { name: 'Proxima Platform Migration', lead: 'Daniel Torres', budget: '$42,000', progress: '78%', status: 'On Track', statusClass: 'active' },
    { name: 'BuildCo ERP Integration', lead: 'Sarah Mitchell', budget: '$28,000', progress: '45%', status: 'At Risk', statusClass: 'warning' },
    { name: 'TechFlow Analytics Engine', lead: 'Clara Novak', budget: '$20,000', progress: '90%', status: 'On Track', statusClass: 'active' },
    { name: 'Starlight Security Audit', lead: 'Liam Chen', budget: '$60,000', progress: '60%', status: 'On Track', statusClass: 'active' },
  ];

  return (
    <div className="ceo-view-container">
      <div className="ceo-card-panel">
        <div className="ceo-card-title">
          <span>Enterprise Project Portfolio Health</span>
        </div>
        <div className="ceo-table-wrapper">
          <table className="ceo-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Lead</th>
                <th>Budget</th>
                <th>Completion Progress</th>
                <th>Health Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p, idx) => (
                <tr key={idx}>
                  <td className="ceo-table-name">{p.name}</td>
                  <td>{p.lead}</td>
                  <td>{p.budget}</td>
                  <td>{p.progress}</td>
                  <td>
                    <span className={`ceo-status-tag ${p.statusClass}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}