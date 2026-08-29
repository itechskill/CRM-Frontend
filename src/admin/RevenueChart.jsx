import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import './RevenueChart.css';

const data = [
  { month: 'Jan', thisYear: 42000, lastYear: 31000 },
  { month: 'Feb', thisYear: 58000, lastYear: 38000 },
  { month: 'Mar', thisYear: 51000, lastYear: 42000 },
  { month: 'Apr', thisYear: 67000, lastYear: 48000 },
  { month: 'May', thisYear: 82000, lastYear: 54000 },
  { month: 'Jun', thisYear: 75000, lastYear: 61000 },
  { month: 'Jul', thisYear: 94000, lastYear: 69000 },
  { month: 'Aug', thisYear: 88000, lastYear: 72000 },
  { month: 'Sep', thisYear: 105000, lastYear: 78000 },
  { month: 'Oct', thisYear: 112000, lastYear: 84000 },
  { month: 'Nov', thisYear: 128000, lastYear: 91000 },
  { month: 'Dec', thisYear: 142000, lastYear: 98000 },
];

export default function RevenueChart() {
  const [period, setPeriod] = useState('2026');

  const formatYAxis = (tickItem) => {
    return `$${tickItem / 1000}k`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#0F172A',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
          fontSize: '0.8rem',
          border: '1px solid #334155'
        }}>
          <p style={{ fontWeight: 700, marginBottom: '6px', color: '#94A3B8' }}>{label} Performance</p>
          <p style={{ color: '#3B82F6', fontWeight: 600 }}>
            This Year: ${payload[0]?.value?.toLocaleString()}
          </p>
          <p style={{ color: '#14B8A6', fontWeight: 600, marginTop: '2px' }}>
            Last Year: ${payload[1]?.value?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="widget-card" style={{ height: '380px' }}>
      <div className="widget-header">
        <div className="widget-title-group">
          <h3>Revenue Analytics</h3>
          <p>Monthly revenue performance comparison</p>
        </div>
        <select 
          className="pill-select" 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="2026">Fiscal Year 2026</option>
          <option value="2025">Fiscal Year 2025</option>
        </select>
      </div>

      <div style={{ width: '100%', height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorThisYear" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorLastYear" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '0.8rem', fontWeight: 500 }}
            />
            <Area 
              type="monotone" 
              dataKey="thisYear" 
              name="This Year"
              stroke="#3B82F6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorThisYear)" 
            />
            <Area 
              type="monotone" 
              dataKey="lastYear" 
              name="Last Year"
              stroke="#14B8A6" 
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1} 
              fill="url(#colorLastYear)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
