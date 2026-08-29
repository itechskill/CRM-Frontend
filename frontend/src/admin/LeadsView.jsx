import React from 'react';
import { User, Phone, Mail, Star, ArrowUpRight } from 'lucide-react';
import './LeadsView.css';

const leadsData = [
  { id: 1, name: 'Alex Morgan', company: 'Stripe', score: 94, source: 'Website', email: 'alex@stripe.com', status: 'New', estValue: '$28,000' },
  { id: 2, name: 'Beatrice Vance', company: 'Notion', score: 88, source: 'LinkedIn', email: 'b.vance@notion.so', status: 'Contacted', estValue: '$42,000' },
  { id: 3, name: 'Carlos Gomez', company: 'Figma', score: 92, source: 'Referral', email: 'carlos@figma.com', status: 'Qualified', estValue: '$65,000' },
  { id: 4, name: 'Diana Prince', company: 'Vercel', score: 96, source: 'Direct', email: 'diana@vercel.com', status: 'Qualified', estValue: '$90,000' },
  { id: 5, name: 'Ethan Hunt', company: 'Linear', score: 79, source: 'Webinar', email: 'ethan@linear.app', status: 'Contacted', estValue: '$15,000' },
  { id: 6, name: 'Fiona Gallagher', company: 'Retool', score: 85, source: 'Website', email: 'fiona@retool.com', status: 'Converted', estValue: '$55,000' },
];

export default function LeadsView() {
  const columns = ['New', 'Contacted', 'Qualified', 'Converted'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Leads & Prospects Pipeline</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Kanban stage tracking for incoming lead conversions</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        minHeight: '500px'
      }}>
        {columns.map(col => {
          const colLeads = leadsData.filter(l => l.status === col);
          return (
            <div 
              key={col} 
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{col}</span>
                <span style={{
                  backgroundColor: '#E2E8F0',
                  color: '#475569',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {colLeads.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {colLeads.map(lead => (
                  <div key={lead.id} style={{
                    backgroundColor: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{lead.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>{lead.company}</div>
                      </div>
                      <span style={{
                        backgroundColor: lead.score > 90 ? '#DCFCE7' : '#EFF6FF',
                        color: lead.score > 90 ? '#15803D' : '#1D4ED8',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <Star size={10} fill="currentColor" /> {lead.score}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
                      <span>Val: <strong style={{ color: '#0F172A' }}>{lead.estValue}</strong></span>
                      <span>Source: <strong style={{ color: '#475569' }}>{lead.source}</strong></span>
                    </div>

                    <div style={{ 
                      paddingTop: '8px', 
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex', 
                      justify: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} /> {lead.email}
                      </span>
                      <ArrowUpRight size={14} color="#3B82F6" style={{ cursor: 'pointer' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
