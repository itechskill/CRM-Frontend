import React, { useState } from 'react';
import './OrgOverview.css';
import OrgUsersDirectory from './OrgUsersDirectory';
import OrgUserDetail from './OrgUserDetail';
import OrgDepartmentView from './OrgDepartmentView';
import OrgPerformanceRanking from './OrgPerformanceRanking';
import OrgMonthlyReports from './OrgMonthlyReports';
import {
  Users,
  TrendingUp,
  Plane,
  Briefcase,
  Calculator,
  Wallet,
  Heart,
  Crown,
  Calendar,
  Building2,
  ShoppingBag,
  Globe
} from 'lucide-react';

export default function OrgOverview({ activeTab = 'org_users', setActiveTab }) {
  const [selectedUser, setSelectedUser] = useState(null);

  const subtabs = [
    { id: 'org_users', label: 'All Users Directory', icon: Users },
    { id: 'org_dept_sales', label: 'Sales Dept', icon: TrendingUp },
    { id: 'org_dept_logistics', label: 'Logistics Dept', icon: Plane },
    { id: 'org_dept_local_purchaser', label: 'Local Purchaser Dept', icon: ShoppingBag },
    { id: 'org_dept_global_purchaser', label: 'Global Purchaser Dept', icon: Globe },
    { id: 'org_dept_support', label: 'Support & Ops', icon: Briefcase },
    { id: 'org_dept_accounts', label: 'Accounts Dept', icon: Calculator },
    { id: 'org_dept_finance', label: 'Finance Dept', icon: Wallet },
    { id: 'org_dept_hr', label: 'HR Dept', icon: Heart },
    { id: 'org_ranking', label: 'Performance Rankings', icon: Crown },
    { id: 'org_monthly', label: 'Monthly Reports', icon: Calendar },
  ];

  // If viewing single user detail
  if (selectedUser) {
    return (
      <OrgUserDetail
        userId={selectedUser._id}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  const currentTab = activeTab.startsWith('org_') ? activeTab : 'org_users';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Section Navigation Ribbon */}
      <div className="org-subtabs-nav">
        {subtabs.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`org-subtab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (setActiveTab) setActiveTab(item.id);
                setSelectedUser(null);
              }}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Render */}
      {currentTab === 'org_users' && (
        <OrgUsersDirectory onSelectUser={(u) => setSelectedUser(u)} />
      )}

      {currentTab === 'org_dept_sales' && (
        <OrgDepartmentView departmentKey="sales" onSelectUser={(u) => setSelectedUser(u)} />
      )}

      {currentTab === 'org_dept_logistics' && (
        <OrgDepartmentView departmentKey="logistics" onSelectUser={(u) => setSelectedUser(u)} />
      )}

      {currentTab === 'org_dept_local_purchaser' && (
        <OrgDepartmentView departmentKey="local_purchaser" onSelectUser={(u) => setSelectedUser(u)} />
      )}

      {currentTab === 'org_dept_global_purchaser' && (
        <OrgDepartmentView departmentKey="global_purchaser" onSelectUser={(u) => setSelectedUser(u)} />
      )}

      {currentTab === 'org_dept_support' && (
        <OrgDepartmentView departmentKey="support" onSelectUser={(u) => setSelectedUser(u)} />
      )}

      {currentTab === 'org_dept_accounts' && (
        <OrgDepartmentView departmentKey="accounts" onSelectUser={(u) => setSelectedUser(u)} />
      )}

      {currentTab === 'org_dept_finance' && (
        <OrgDepartmentView departmentKey="finance" onSelectUser={(u) => setSelectedUser(u)} />
      )}

      {currentTab === 'org_dept_hr' && (
        <OrgDepartmentView departmentKey="hr" onSelectUser={(u) => setSelectedUser(u)} />
      )}

      {currentTab === 'org_ranking' && (
        <OrgPerformanceRanking onSelectUser={(u) => setSelectedUser(u)} />
      )}

      {currentTab === 'org_monthly' && (
        <OrgMonthlyReports onSelectUser={(u) => setSelectedUser(u)} />
      )}
    </div>
  );
}
