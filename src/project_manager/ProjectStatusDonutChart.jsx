import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const statusData = [
  { name: 'In Progress', value: 3, color: '#2563EB' },
  { name: 'Planning', value: 1, color: '#94A3B8' },
  { name: 'Completed', value: 1, color: '#10B981' },
  { name: 'Review', value: 1, color: '#8B5CF6' },
];

export default function ProjectStatusDonutChart() {
  return (
    <div className="chart-widget">
      <div className="chart-widget-header">
        <div>
          <h3 className="chart-widget-title">Project Status</h3>
          <p className="chart-widget-subtitle">Distribution by status</p>
        </div>
      </div>

      <div style={{ width: '100%', height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={3}
              stroke="none"
            >
              {statusData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="status-legend">
        {statusData.map((entry) => (
          <div key={entry.name} className="status-legend-row">
            <div className="status-legend-left">
              <span className="status-legend-dot" style={{ backgroundColor: entry.color }}></span>
              <span className="status-legend-label">{entry.name}</span>
            </div>
            <span className="status-legend-value">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
