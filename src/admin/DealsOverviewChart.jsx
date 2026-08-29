import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './DealsOverviewChart.css';

const data = [
  { month: 'Jan', deals: 42, target: 50 },
  { month: 'Feb', deals: 58, target: 50 },
  { month: 'Mar', deals: 65, target: 60 },
  { month: 'Apr', deals: 48, target: 60 },
  { month: 'May', deals: 84, target: 70 },
  { month: 'Jun', deals: 92, target: 70 },
  { month: 'Jul', deals: 78, target: 80 },
  { month: 'Aug', deals: 95, target: 80 },
  { month: 'Sep', deals: 110, target: 90 },
];

export default function DealsOverviewChart() {
  return (
    <div className="widget-card" style={{ height: '340px' }}>
      <div className="widget-header">
        <div className="widget-title-group">
          <h3>Deals Overview</h3>
          <p>Monthly target achievement</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#3B82F6' }}></span> Closed Deals
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
            <Tooltip 
              cursor={{ fill: '#F8FAFC' }}
              contentStyle={{ backgroundColor: '#0F172A', color: 'white', borderRadius: '8px', border: 'none', fontSize: '0.8rem' }}
            />
            <Bar dataKey="deals" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.deals >= entry.target ? '#3B82F6' : '#94A3B8'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
