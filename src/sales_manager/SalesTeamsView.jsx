import React from 'react';
import { Award, Mail, Phone, TrendingUp, CheckCircle2, DollarSign } from 'lucide-react';
import './SalesTeamsView.css';

const teamMembers = [
  { id: 1, name: 'Sarah Mitchell', role: 'Sales Lead', email: 'sarah.m@nexus.io', phone: '+1 555 101 2020', closedRevenue: '$180,000', target: '$200,000', winRate: '42%', activeDeals: 8, avatarBg: '#2563EB' },
  { id: 2, name: 'Aisha Nkosi', role: 'Senior Account Exec', email: 'aisha.n@nexus.io', phone: '+1 555 303 4040', closedRevenue: '$240,000', target: '$220,000', winRate: '48%', activeDeals: 11, avatarBg: '#10B981' },
  { id: 3, name: 'David Miller', role: 'Account Exec', email: 'd.miller@nexus.io', phone: '+1 555 505 6060', closedRevenue: '$140,000', target: '$160,000', winRate: '35%', activeDeals: 7, avatarBg: '#F59E0B' },
  { id: 4, name: 'Elena Rostova', role: 'Enterprise Specialist', email: 'e.rostova@nexus.io', phone: '+1 555 707 8080', closedRevenue: '$195,000', target: '$210,000', winRate: '39%', activeDeals: 6, avatarBg: '#EC4899' },
];

export default function SalesTeamsView() {
  return (
    <div className="sales-sm-teams-view">
      <div className="teams-header">
        <h2 className="teams-title">Sales Representatives & Team Quotas</h2>
        <p className="teams-sub">Track individual performance, conversion rates, and closed revenue</p>
      </div>

      <div className="reps-grid">
        {teamMembers.map((rep) => {
          const ratio = Math.min(100, Math.round((parseInt(rep.closedRevenue.replace(/\$|,/g, '')) / parseInt(rep.target.replace(/\$|,/g, ''))) * 100));
          return (
            <div key={rep.id} className="rep-card">
              <div className="rep-card-top">
                <div className="rep-avatar-lg" style={{ backgroundColor: rep.avatarBg }}>
                  {rep.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="rep-header-info">
                  <h3 className="rep-name-lg">{rep.name}</h3>
                  <span className="rep-role-lg">{rep.role}</span>
                </div>
              </div>

              <div className="rep-quota-box">
                <div className="quota-text-row">
                  <span>Quota Attainment</span>
                  <span className="quota-percent">{ratio}%</span>
                </div>
                <div className="quota-progress-bar">
                  <div className="quota-fill" style={{ width: `${ratio}%` }}></div>
                </div>
                <div className="quota-sub">
                  {rep.closedRevenue} / {rep.target} Target
                </div>
              </div>

              <div className="rep-stats-row">
                <div className="rep-stat-box">
                  <span className="stat-num">{rep.winRate}</span>
                  <span className="stat-lbl">Win Rate</span>
                </div>
                <div className="rep-stat-box">
                  <span className="stat-num">{rep.activeDeals}</span>
                  <span className="stat-lbl">Active Deals</span>
                </div>
              </div>

              <div className="rep-contact-footer">
                <a href={`mailto:${rep.email}`} className="rep-contact-btn"><Mail size={14} /> Email Rep</a>
                <a href={`tel:${rep.phone}`} className="rep-contact-btn"><Phone size={14} /> Call</a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
