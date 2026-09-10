import React from 'react';
import { TrendingUp, Download } from 'lucide-react';
import './ReportsView.css';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const radarData = [
  { subject: 'Revenue', A: 95 },
  { subject: 'Retention', A: 88 },
  { subject: 'NPS', A: 80 },
  { subject: 'Deals Won', A: 92 },
  { subject: 'Response Time', A: 78 },
  { subject: 'Upsell Rate', A: 84 }
];

const teamPerformanceData = [
  { month: 'Jul', Sarah: 82, Daniel: 74, Aisha: 68, Marcus: 70 },
  { month: 'Aug', Sarah: 86, Daniel: 78, Aisha: 76, Marcus: 77 },
  { month: 'Sep', Sarah: 85, Daniel: 82, Aisha: 80, Marcus: 75 },
  { month: 'Oct', Sarah: 92, Daniel: 85, Aisha: 83, Marcus: 82 },
  { month: 'Nov', Sarah: 90, Daniel: 87, Aisha: 84, Marcus: 80 },
  { month: 'Dec', Sarah: 95, Daniel: 93, Aisha: 90, Marcus: 86 }
];

const funnelData = [
  { stage: 'Leads', value: 248, pct: '100%', delta: '+18%', color: '#2563EB' },
  { stage: 'Qualified', value: 142, pct: '57%', delta: '+16%', color: '#3B82F6' },
  { stage: 'Proposal', value: 87, pct: '35%', delta: '+10%', color: '#38BDF8' },
  { stage: 'Negotiation', value: 54, pct: '22%', delta: '+13%', color: '#22D3D9' },
  { stage: 'Closed Won', value: 31, pct: '13%', delta: '+19%', color: '#2DD4BF' },
];

const maxFunnelValue = funnelData[0].value;

const savedReportsData = [
  { name: 'Q4 2024 Revenue Report', type: 'Finance', typeColor: { bg: '#EDE9FE', color: '#7C3AED' }, generated: 'Dec 15, 2024', size: '2.4 MB' },
  { name: 'Sales Pipeline Snapshot', type: 'Sales', typeColor: { bg: '#DBEAFE', color: '#2563EB' }, generated: 'Dec 12, 2024', size: '1.1 MB' },
  { name: 'Team Performance Summary', type: 'HR', typeColor: { bg: '#DCFCE7', color: '#15803D' }, generated: 'Dec 8, 2024', size: '860 KB' },
  { name: 'Customer Churn Analysis', type: 'Finance', typeColor: { bg: '#EDE9FE', color: '#7C3AED' }, generated: 'Dec 3, 2024', size: '1.8 MB' },
];

export default function ReportsView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 4 Top KPI Stat Cards matching exact screenshot */}
      <div className="reports-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {/* Card 1: Avg Deal Size */}
        <div className="report-box" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>Rs. 21.7K</div>
          <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Avg Deal Size</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '0.825rem', fontWeight: 600, marginTop: '8px' }}>
            <TrendingUp size={14} />
            <span>+12.4% vs last quarter</span>
          </div>
        </div>

        {/* Card 2: Win Rate */}
        <div className="report-box" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>34.8%</div>
          <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Win Rate</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '0.825rem', fontWeight: 600, marginTop: '8px' }}>
            <TrendingUp size={14} />
            <span>+3.2 pts vs last quarter</span>
          </div>
        </div>

        {/* Card 3: Sales Cycle */}
        <div className="report-box" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>28 days</div>
          <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Sales Cycle</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '0.825rem', fontWeight: 600, marginTop: '8px' }}>
            <TrendingUp size={14} />
            <span>-2.1d vs last quarter</span>
          </div>
        </div>

        {/* Card 4: Churn Rate */}
        <div className="report-box" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>2.3%</div>
          <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>Churn Rate</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '0.825rem', fontWeight: 600, marginTop: '8px' }}>
            <TrendingUp size={14} />
            <span>-0.4 pts vs last quarter</span>
          </div>
        </div>
      </div>

      {/* 2 Charts Grid */}
      <div className="reports-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Chart: Business Health Score Radar */}
        <div className="report-box" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Business Health Score</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '2px 0 0 0' }}>Composite KPI radar — Q4 2024</p>
          </div>

          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Radar name="Health Score" dataKey="A" stroke="#2563EB" strokeWidth={2} fill="#2563EB" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Team Performance Line Chart */}
        <div className="report-box" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Team Performance</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '2px 0 0 0' }}>Individual performance scores — H2 2024</p>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teamPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis domain={[60, 100]} ticks={[60, 70, 80, 90, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="Sarah" stroke="#2563EB" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Daniel" stroke="#10B981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Aisha" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Marcus" stroke="#8B5CF6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend at bottom matching screenshot */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }}></span>
              Sarah
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
              Daniel
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>
              Aisha
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B5CF6' }}></span>
              Marcus
            </div>
          </div>
        </div>
      </div>

      {/* Sales Pipeline Funnel */}
      <div className="report-box" style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Sales Pipeline Funnel</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '2px 0 0 0' }}>Conversion at each deal stage — Dec 2024</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {funnelData.map((row) => (
            <div key={row.stage} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '110px', flexShrink: 0, fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>
                {row.stage}
              </div>
              <div style={{ flex: 1, position: 'relative', backgroundColor: '#F1F5F9', borderRadius: '10px', height: '38px' }}>
                <div
                  style={{
                    width: `${Math.max((row.value / maxFunnelValue) * 100, 14)}%`,
                    height: '100%',
                    backgroundColor: row.color,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '16px',
                  }}
                >
                  <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9rem' }}>{row.value}</span>
                </div>
              </div>
              <div style={{ width: '48px', flexShrink: 0, textAlign: 'right', fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>
                {row.pct}
              </div>
              <div style={{ width: '48px', flexShrink: 0, textAlign: 'right', fontSize: '0.85rem', color: '#16A34A', fontWeight: 700 }}>
                {row.delta}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Reports Table */}
      <div className="report-box" style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Saved Reports</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                {['Report Name', 'Type', 'Generated', 'Size', ''].map((header) => (
                  <th
                    key={header}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#64748B',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #E2E8F0',
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {savedReportsData.map((report, idx) => (
  <tr
    key={report.name}
    className="report-row"
    style={{
      borderBottom: idx === savedReportsData.length - 1 ? 'none' : '1px solid #F1F5F9',
    }}
  >
                  <td style={{ padding: '16px', fontSize: '0.9rem', color: '#0F172A', fontWeight: 600 }}>
                    {report.name}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      display: 'inline-block',
                      backgroundColor: report.typeColor.bg,
                      color: report.typeColor.color,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}>
                      {report.type}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748B' }}>
                    {report.generated}
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.875rem', color: '#94A3B8' }}>
                    {report.size}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#0F172A',
                      cursor: 'pointer',
                    }}>
                      <Download size={14} />
                      Download
                    </button>
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