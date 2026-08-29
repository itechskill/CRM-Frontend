import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const trendData = [
  { month: 'Nov', rate: 38 },
  { month: 'Dec', rate: 48 },
  { month: 'Jan', rate: 55 },
  { month: 'Feb', rate: 62 },
  { month: 'Mar', rate: 68 },
  { month: 'Apr', rate: 73 },
];

function DotShape(props) {
  const { cx, cy } = props;
  return (
    <circle cx={cx} cy={cy} r={5} fill="#FFFFFF" stroke="#2563EB" strokeWidth={2.5} />
  );
}

export default function ProjectCompletionTrend() {
  return (
    <div className="chart-widget chart-widget-wide">
      <div className="chart-widget-header">
        <div>
          <h3 className="chart-widget-title">Project Completion Trend</h3>
          <p className="chart-widget-subtitle">Average completion rate over 6 months</p>
        </div>
        <span className="growth-pill">+31% growth</span>
      </div>

      <div style={{ width: '100%', height: '260px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              dy={8}
            />
            <YAxis
              domain={[30, 100]}
              ticks={[30, 50, 70, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(val) => [`${val}%`, 'Completion']}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#2563EB"
              strokeWidth={2.5}
              fill="url(#completionGradient)"
              dot={<DotShape />}
              activeDot={{ r: 6, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
