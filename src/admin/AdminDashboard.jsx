import React from 'react';
import KpiCard from './KpiCard';
import RevenueChart from './RevenueChart';
import PipelineDonutChart from './PipelineDonutChart';
import DealsOverviewChart from './DealsOverviewChart';
import RecentActivity from './RecentActivity';
import { Users, ShieldCheck, UserX } from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard({ onViewAllClients }) {
  return (
    <div className="admin-dashboard-container">
      {/* Top Admin KPI Cards */}
      <div className="admin-kpi-grid">
        <KpiCard 
          title="Total Users"
          value="3,847"
          change="+ 12.5%"
          isPositive={true}
          subtext="Registered accounts"
          icon={Users}
          colorTheme="blue"
        />
        <KpiCard 
          title="Active Users"
          value="3,521"
          change="+ 8.2%"
          isPositive={true}
          subtext="Active within 30 days"
          icon={ShieldCheck}
          colorTheme="green"
        />
        <KpiCard 
          title="Inactive / Pending"
          value="326"
          change="- 2.1%"
          isPositive={false}
          subtext="Pending invitations"
          icon={UserX}
          colorTheme="purple"
        />
      </div>

      {/* Admin Revenue & Pipeline Charts */}
      <div className="admin-analytics-grid">
        <RevenueChart />
        <PipelineDonutChart />
      </div>

      {/* Admin Bottom Grid */}
      <div className="admin-bottom-grid">
        <DealsOverviewChart />
        <RecentActivity onViewAll={onViewAllClients} />
      </div>
    </div>
  );
}
