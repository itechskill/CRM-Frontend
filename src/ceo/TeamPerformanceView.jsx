import React from 'react';
import { Users, Award, Zap, CheckCircle2 } from 'lucide-react';
import './TeamPerformanceView.css';

export default function TeamPerformanceView() {
  const departments = [
    { name: 'Engineering & Product', head: 'Daniel Torres', count: 142, performance: '94%', budget: '$1.4M' },
    { name: 'Sales & Business Dev', head: 'Sarah Mitchell', count: 86, performance: '98%', budget: '$1.1M' },
    { name: 'Marketing & Growth', head: 'Jessica Blake', count: 42, performance: '91%', budget: '$450K' },
    { name: 'Customer Success & Ops', head: 'Aisha Nkosi', count: 68, performance: '95%', budget: '$620K' },
    { name: 'Finance & Administration', head: 'Alex Vance', count: 46, performance: '96%', budget: '$380K' },
  ];

  return (
    <div className="ceo-view-container">
      <div className="ceo-card-panel">
        <div className="ceo-card-title">
          <span>Departmental Headcount & Performance Output</span>
        </div>
        <div className="ceo-table-wrapper">
          <table className="ceo-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Executive Head</th>
                <th>Team Size</th>
                <th>Performance Index</th>
                <th>Quarterly Budget</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, idx) => (
                <tr key={idx}>
                  <td className="ceo-table-name">{dept.name}</td>
                  <td>{dept.head}</td>
                  <td>{dept.count} employees</td>
                  <td className="ceo-perf-positive">{dept.performance}</td>
                  <td>{dept.budget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}