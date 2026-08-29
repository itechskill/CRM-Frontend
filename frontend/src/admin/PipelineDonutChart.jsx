import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './PipelineDonutChart.css';

const data = [
  { name: 'Qualified', value: 45, count: 128, color: '#10B981' },
  { name: 'Proposal', value: 25, count: 71, color: '#F59E0B' },
  { name: 'Negotiation', value: 20, count: 57, color: '#3B82F6' },
  { name: 'Lost', value: 10, count: 28, color: '#EF4444' },
];

export default function PipelineDonutChart() {
  const totalDeals = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="widget-card" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div className="widget-header">
        <div className="widget-title-group">
          <h3>Project Status</h3>
          <p>Close rate & pipeline breakdown</p>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
        <div style={{ width: '180px', height: '180px', position: 'relative', flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value}% of total`, name]}
                contentStyle={{ 
                  backgroundColor: '#0F172A', 
                  color: 'white', 
                  borderRadius: '8px', 
                  border: 'none',
                  fontSize: '0.8rem' 
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{totalDeals}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>Total Deals</div>
          </div>
        </div>
      </div>

      {/* Legend Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
        gap: '10px 12px',
        paddingTop: '12px',
        borderTop: '1px solid #F1F5F9'
      }}>
        {data.map((item) => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }}></span>
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', flexShrink: 0 }}>{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}