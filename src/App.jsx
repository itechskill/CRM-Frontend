import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import { getFrontendRole } from './config/roleConfig';
import {
  migrateLegacyAuth,
  getToken,
  getUser,
  setUser,
  clearAuth,
  getViewPortal,
  setViewPortal,
  getActiveTab as getStoredActiveTab,
  setActiveTabStorage,
  resolveDisplayPortal,
  canSwitchPortal
} from './utils/authStorage';
import { API_BASE } from './utils/api';

// 1. Admin Components (src/admin/)
import Sidebar from './admin/Sidebar';
import Header from './admin/Header';
import KpiCard from './admin/KpiCard';
import RevenueChart from './admin/RevenueChart';
import PipelineDonutChart from './admin/PipelineDonutChart';
import DealsOverviewChart from './admin/DealsOverviewChart';
import RecentActivity from './admin/RecentActivity';
import UsersView from './admin/UsersView';
import InviteUserModal from './admin/InviteUserModal';
import ClientsView from './admin/ClientsView';
import AddClientModal from './admin/AddClientModal';
import ProjectsView from './admin/ProjectsView';
import NewProjectModal from './admin/NewProjectModal';
import FinanceView from './admin/FinanceView';
import ReportsView from './admin/ReportsView';
import SettingsView from './admin/SettingsView';
import RegistrationRequestsView from './admin/RegistrationRequestsView';
import CreateCEOAccountView from './admin/CreateCEOAccountView';
import AuditLogsView from './admin/AuditLogsView';

// 2. Project Manager Components (src/project_manager/)
import ProjectSidebar from './project_manager/ProjectSidebar';
import ProjectHeader from './project_manager/ProjectHeader';
import ProjectManagerDashboard from './project_manager/ProjectManagerDashboard';
import ProjectProjectsView from './project_manager/ProjectProjectsView';
import ProjectTeamsView from './project_manager/ProjectTeamsView';
import ProjectTasksView from './project_manager/ProjectTasksView';
import ProjectTimelineView from './project_manager/ProjectTimelineView';
import ProjectDeliveriesView from './project_manager/ProjectDeliveriesView';
import ProjectReportsView from './project_manager/ProjectReportsView';
import ProjectSettings from './project_manager/Settings';

// 3. Sales Manager Components (src/sales_manager/)
import SalesSidebar from './sales_manager/SalesSidebar';
import SalesHeader from './sales_manager/SalesHeader';
import SalesManagerDashboard from './sales_manager/SalesManagerDashboard';
import SalesLeadsView from './sales_manager/SalesLeadsView';
import SalesDealsView from './sales_manager/SalesDealsView';
import SalesPipelineView from './sales_manager/SalesPipelineView';
import SalesTeamsView from './sales_manager/SalesTeamsView';
import SalesReportsView from './sales_manager/SalesReportsView';
import SalesSettingsView from './sales_manager/SalesSettingsView';
import SalesContactsView from './sales_manager/SalesContactsView';
import SalesMeetingsView from './sales_manager/SalesMeetingsView';
import SalesProposalsView from './sales_manager/SalesProposalsView';
import SalesClientsView from './sales_manager/ClientsView';
import SalesNotificationsView from './sales_manager/SalesNotificationsView';

// 4. Employee Components (src/employee/)
import EmployeeSidebar from './employee/EmployeeSidebar';
import EmployeeHeader from './employee/EmployeeHeader';
import EmployeeDashboard from './employee/EmployeeDashboard';
import EmployeeProjectsView from './employee/EmployeeProjectsView';
import EmployeeTasksView from './employee/EmployeeTasksView';
import EmployeeWorkUpdatesView from './employee/EmployeeWorkUpdatesView';
import EmployeeCompletedTasksView from './employee/EmployeeCompletedTasksView';
import EmployeeActivityView from './employee/EmployeeActivityView';
import EmployeeNotificationsView from './employee/EmployeeNotificationsView';
import EmployeeProfileView from './employee/EmployeeProfileView';
import EmployeeSettingsView from './employee/EmployeeSettingsView';
import NewTaskModal from './employee/NewTaskModal';

// 5. HR Components (src/hr/)
import HRSidebar from './hr/HRSidebar';
import HRHeader from './hr/HRHeader';
import HRDashboard from './hr/HRDashboard';
import HREmployeesView from './hr/HREmployeesView';
import HRAttendanceView from './hr/HRAttendanceView';
import HRRecruitmentView from './hr/HRRecruitmentView';
import HRPerformanceView from './hr/HRPerformanceView';
import HRReportsView from './hr/HRReportsView';
import HRNotificationsView from './hr/HRNotificationsView';
import HRSettingsView from './hr/HRSettingsView';

// 6. Accountant Components (src/accountant/)
import AccountantSidebar from './accountant/AccountantSidebar';
import AccountantHeader from './accountant/AccountantHeader';
import AccountantDashboard from './accountant/AccountantDashboard';
import AccountantInvoicesView from './accountant/AccountantInvoicesView';
import AccountantExpensesView from './accountant/AccountantExpensesView';
import AccountantPayrollView from './accountant/AccountantPayrollView';
import AccountantAccountsView from './accountant/AccountantAccountsView';
import AccountantReportsView from './accountant/AccountantReportsView';
import AccountantNotificationsView from './accountant/AccountantNotificationsView';
import AccountantSettingsView from './accountant/AccountantSettingsView';

// 7. Marketing Components (src/marketing/)
import MarketingSidebar from './marketing/MarketingSidebar';
import MarketingHeader from './marketing/MarketingHeader';
import MarketingDashboard from './marketing/MarketingDashboard';
import MarketingCampaignsView from './marketing/MarketingCampaignsView';
import MarketingLeadsView from './marketing/MarketingLeadsView';
import MarketingContentView from './marketing/MarketingContentView';
import MarketingAnalyticsView from './marketing/MarketingAnalyticsView';
import MarketingReportsView from './marketing/MarketingReportsView';
import MarketingNotificationsView from './marketing/MarketingNotificationsView';
import MarketingSettingsView from './marketing/MarketingSettingsView';

// 8. CEO Components (src/ceo/)
import CEOSidebar from './ceo/CEOSidebar';
import CEOHeader from './ceo/CEOHeader';
import CEODashboard from './ceo/CEODashboard';
import BusinessOverviewView from './ceo/BusinessOverviewView';
import ProjectsPerformanceView from './ceo/ProjectsPerformanceView';
import SalesFinanceView from './ceo/SalesFinanceView';
import TeamPerformanceView from './ceo/TeamPerformanceView';
import ReportsAnalyticsView from './ceo/ReportsAnalyticsView';

// 9. Administration Components (src/administration/)
import AdministrationSidebar from './administration/AdministrationSidebar';
import AdministrationHeader from './administration/AdministrationHeader';
import AdministrationDashboard from './administration/AdministrationDashboard';
import AdministrationEmployeesView from './administration/AdministrationEmployeesView';
import AdministrationDepartmentsView from './administration/AdministrationDepartmentsView';
import AdministrationAttendanceLeaveView from './administration/AdministrationAttendanceLeaveView';
import AdministrationCompanyResourcesView from './administration/AdministrationCompanyResourcesView';
import AdministrationReportsView from './administration/AdministrationReportsView';

import { Users, ShieldCheck, UserX } from 'lucide-react';

const initialUsersList = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@nexus.io',
    initials: 'SM',
    avatarBg: '#2563EB',
    role: 'Sales Manager',
    department: 'Sales',
    status: 'Active',
    lastActive: 'Just now',
    joined: 'Jan 12, 2023'
  },
  {
    id: 2,
    name: 'Daniel Torres',
    email: 'd.torres@nexus.io',
    initials: 'DT',
    avatarBg: '#10B981',
    role: 'Project Lead',
    department: 'Operations',
    status: 'Active',
    lastActive: '5m ago',
    joined: 'Mar 4, 2022'
  },
  {
    id: 3,
    name: 'Aisha Nkosi',
    email: 'aisha.n@nexus.io',
    initials: 'AN',
    avatarBg: '#F59E0B',
    role: 'Account Executive',
    department: 'Sales',
    status: 'Active',
    lastActive: '1h ago',
    joined: 'Jun 18, 2023'
  }
];

const initialClientsList = [
  {
    id: 1,
    name: 'Proxima Labs',
    country: 'USA',
    initials: 'PL',
    avatarBg: '#2563EB',
    industry: 'Technology',
    contactName: 'Eric Vance',
    contactEmail: 'e.vance@proxima.io',
    revenueYtd: '$148,000',
    dealsCount: 4,
    status: 'Active'
  },
  {
    id: 2,
    name: 'BuildCo Industries',
    country: 'Germany',
    initials: 'BC',
    avatarBg: '#10B981',
    industry: 'Construction',
    contactName: 'Rachel Okafor',
    contactEmail: 'r.okafor@buildco.com',
    revenueYtd: '$112,000',
    dealsCount: 2,
    status: 'Active'
  },
  {
    id: 3,
    name: 'Starlight Ventures',
    country: 'UK',
    initials: 'SV',
    avatarBg: '#F59E0B',
    industry: 'Finance & VC',
    contactName: 'David Miller',
    contactEmail: 'd.miller@starlight.io',
    revenueYtd: '$210,000',
    dealsCount: 7,
    status: 'Active'
  },
  {
    id: 4,
    name: 'Nexus Dynamics',
    country: 'Canada',
    initials: 'NX',
    avatarBg: '#EF4444',
    industry: 'Logistics',
    contactName: 'Sophia Martinez',
    contactEmail: 's.martinez@nexusdyn.com',
    revenueYtd: '$85,000',
    dealsCount: 1,
    status: 'At Risk'
  }
];

const initialProjectsList = [
  {
    id: 1,
    name: 'Proxima Platform Migration',
    client: 'Proxima Labs',
    leadName: 'Daniel Torres',
    leadInitials: 'DT',
    leadBg: '#2563EB',
    progress: 78,
    budgetSpent: '$34K',
    budgetTotal: '$42K',
    budgetRatio: 80,
    dueDate: 'Feb 28, 2025',
    priority: 'High',
    status: 'On Track'
  },
  {
    id: 2,
    name: 'BuildCo ERP Integration',
    client: 'BuildCo Industries',
    leadName: 'Sarah Mitchell',
    leadInitials: 'SM',
    leadBg: '#10B981',
    progress: 45,
    budgetSpent: '$22K',
    budgetTotal: '$28K',
    budgetRatio: 78,
    dueDate: 'Jan 15, 2025',
    priority: 'Critical',
    status: 'At Risk'
  },
  {
    id: 3,
    name: 'TechFlow Analytics Engine',
    client: 'TechFlow Inc',
    leadName: 'Clara Novak',
    leadInitials: 'CN',
    leadBg: '#F59E0B',
    progress: 90,
    budgetSpent: '$17K',
    budgetTotal: '$20K',
    budgetRatio: 85,
    dueDate: 'Dec 31, 2024',
    priority: 'Medium',
    status: 'On Track'
  },
  {
    id: 4,
    name: 'Starlight Security Audit',
    client: 'Starlight Ventures',
    leadName: 'Liam Chen',
    leadInitials: 'LC',
    leadBg: '#8B5CF6',
    progress: 60,
    budgetSpent: '$45K',
    budgetTotal: '$60K',
    budgetRatio: 75,
    dueDate: 'Mar 20, 2025',
    priority: 'Medium',
    status: 'On Track'
  },
  {
    id: 5,
    name: 'Apex Infrastructure Scale',
    client: 'Apex Software',
    leadName: 'Elena Rostova',
    leadInitials: 'ER',
    leadBg: '#EC4899',
    progress: 25,
    budgetSpent: '$12K',
    budgetTotal: '$50K',
    budgetRatio: 24,
    dueDate: 'Apr 10, 2025',
    priority: 'High',
    status: 'Delayed'
  }
];

export default function App() {
  migrateLegacyAuth();

  const cachedUser = getUser();
  const cachedToken = getToken();

  const [authLoading, setAuthLoading] = useState(() => !!cachedToken);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!(cachedToken && cachedUser));
  const [authView, setAuthView] = useState('login');

  const initialVerifiedRole = cachedUser ? getFrontendRole(cachedUser.role) : 'employee';
  const initialDisplayRole = cachedUser
    ? resolveDisplayPortal(cachedUser.role, initialVerifiedRole)
    : 'employee';

  const [currentRole, setCurrentRole] = useState(initialDisplayRole);
  const [activeTab, setActiveTab] = useState(() => getStoredActiveTab());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [isMktModalOpen, setIsMktModalOpen] = useState(false);
  const [portalSearch, setPortalSearch] = useState('');

  const [currentUser, setCurrentUser] = useState(cachedUser);
  const [backendVerifiedRole, setBackendVerifiedRole] = useState(initialVerifiedRole);

  useEffect(() => {
    const verifyPersistedSession = async () => {
      const token = getToken();
      if (!token) {
        setAuthLoading(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && data.success && data.data) {
          const verifiedRole = getFrontendRole(data.data.role);
          if (!canSwitchPortal(data.data.role)) {
            setViewPortal('');
          }
          const displayRole = resolveDisplayPortal(data.data.role, verifiedRole);

          setCurrentUser(data.data);
          setBackendVerifiedRole(verifiedRole);
          setCurrentRole(displayRole);
          setIsAuthenticated(true);
          setAuthView('login');
          setUser(data.data);
        } else {
          clearAuth();
          setCurrentUser(null);
          setIsAuthenticated(false);
          setAuthView('login');
        }
      } catch (err) {
        console.error('Session persistence check failed:', err);
        if (cachedUser && cachedToken) {
          setIsAuthenticated(true);
          setCurrentUser(cachedUser);
          setBackendVerifiedRole(initialVerifiedRole);
          setCurrentRole(initialDisplayRole);
        } else {
          setIsAuthenticated(false);
        }
      } finally {
        setAuthLoading(false);
      }
    };

    verifyPersistedSession();
  }, []);

  const handleLoginSuccess = (frontendRole, userData) => {
    setViewPortal('');
    setBackendVerifiedRole(frontendRole);
    setCurrentRole(frontendRole);
    setCurrentUser(userData || null);
    setActiveTab('dashboard');
    setActiveTabStorage('dashboard');
    setIsAuthenticated(true);
    setAuthView('login');
    if (userData) setUser(userData);
  };

  const handleLogout = async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      clearAuth();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setBackendVerifiedRole('employee');
      setCurrentRole('employee');
      setAuthView('login');
      setPortalSearch('');

      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', window.location.href);
      }
    }
  };

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    setActiveTabStorage(tab);
    setIsSidebarOpen(false);
  };

  const handleSwitchRole = (role) => {
    if (canSwitchPortal(currentUser?.role)) {
      setViewPortal(role);
    }
    setCurrentRole(role);
    setActiveTab('dashboard');
    setActiveTabStorage('dashboard');
    setIsSidebarOpen(false);
    setPortalSearch('');
  };
  
  const [usersList, setUsersList] = useState(initialUsersList);
  const [clientsList, setClientsList] = useState(initialClientsList);
  const [projectsList, setProjectsList] = useState(initialProjectsList);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [hrHeaderAction, setHrHeaderAction] = useState(null);

  const handleHrPrimaryAction = (tab) => {
    if (tab === 'employees') setHrHeaderAction({ type: 'add_employee', ts: Date.now() });
    if (tab === 'attendance') setHrHeaderAction({ type: 'mark_attendance', ts: Date.now() });
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: '#6366F1',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ fontSize: '0.95rem', color: '#94A3B8', fontWeight: 500 }}>
          Checking authentication...
        </span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot-password') {
      return <ForgotPassword onSwitchToLogin={() => setAuthView('login')} />;
    }
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setAuthView('register')}
        onSwitchToForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  }

  const handleInviteUser = (newUser) => {
    setUsersList([newUser, ...usersList]);
  };

  const handleAddClient = (newClient) => {
    setClientsList([newClient, ...clientsList]);
  };

  const handleAddProject = (newProject) => {
    setProjectsList([newProject, ...projectsList]);
  };

  const handleOpenPrimaryAction = () => {
    if (activeTab === 'clients') {
      setIsAddClientModalOpen(true);
    } else if (activeTab === 'projects') {
      setIsNewProjectModalOpen(true);
    } else {
      setIsInviteModalOpen(true);
    }
  };

  return (
    <div className="app-container">
      {/* ----------------- EMPLOYEE SIDE ----------------- */}
      {currentRole === 'employee' && (
        <RoleProtectedRoute
          userRole={backendVerifiedRole}
          allowedRoles="employee"
          onReturnToDashboard={() => setCurrentRole(backendVerifiedRole)}
        >
          <EmployeeSidebar 
            activeTab={activeTab} 
            setActiveTab={handleSetActiveTab} 
            currentRole={currentRole}
            userRole={backendVerifiedRole}
            currentUser={currentUser}
            onSwitchRole={handleSwitchRole}
            isMobileOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onLogout={handleLogout}
          />
          <div className="main-wrapper">
            <EmployeeHeader 
              activeTab={activeTab} 
              onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
              onMenuToggle={() => setIsSidebarOpen(true)}
            />
            <main className="content-area">
              {activeTab === 'dashboard' && (
                <EmployeeDashboard 
                  currentUser={currentUser}
                  onNavigateTab={(tab) => setActiveTab(tab)} 
                  onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)} 
                />
              )}
              {activeTab === 'projects' && <EmployeeProjectsView />}
              {activeTab === 'tasks' && (
                <EmployeeTasksView 
                  onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)} 
                />
              )}
              {activeTab === 'work_updates' && <EmployeeWorkUpdatesView />}
              {activeTab === 'completed_tasks' && <EmployeeCompletedTasksView />}
              {activeTab === 'activity' && <EmployeeActivityView />}
              {activeTab === 'notifications' && <EmployeeNotificationsView />}
              {activeTab === 'profile' && <EmployeeProfileView />}
              {activeTab === 'settings' && <EmployeeSettingsView />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- SALES MANAGER SIDE ----------------- */}
      {currentRole === 'sales_manager' && (
        <RoleProtectedRoute
          userRole={backendVerifiedRole}
          allowedRoles="sales_manager"
          onReturnToDashboard={() => setCurrentRole(backendVerifiedRole)}
        >
          <SalesSidebar 
            activeTab={activeTab} 
            setActiveTab={handleSetActiveTab} 
            currentRole={currentRole}
            userRole={backendVerifiedRole}
            currentUser={currentUser}
            onSwitchRole={handleSwitchRole}
            isMobileOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onLogout={handleLogout}
          />
          <div className="main-wrapper">
            <SalesHeader 
              activeTab={activeTab} 
              onOpenNewDealModal={() => setIsNewProjectModalOpen(true)}
              onMenuToggle={() => setIsSidebarOpen(true)}
            />
            <main className="content-area">
             {activeTab === 'dashboard' && <SalesManagerDashboard currentUser={currentUser} onNavigateTab={(tab) => setActiveTab(tab)} />}
             {activeTab === 'leads' && <SalesLeadsView />}
             {activeTab === 'contacts' && <SalesContactsView />}
             {activeTab === 'deals' && <SalesDealsView />}
             {activeTab === 'pipeline' && <SalesPipelineView />}
             {activeTab === 'team' && <SalesTeamsView />}
             {activeTab === 'reports' && <SalesReportsView />}
             {activeTab === 'settings' && <SalesSettingsView />}
             {activeTab === 'meetings' && <SalesMeetingsView />}
             {activeTab === 'proposals' && <SalesProposalsView />}
             {activeTab === 'clients' && <SalesClientsView />}
             {activeTab === 'notifications' && <SalesNotificationsView />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- PROJECT MANAGER SIDE ----------------- */}
      {currentRole === 'project_manager' && (
        <RoleProtectedRoute
          userRole={backendVerifiedRole}
          allowedRoles="project_manager"
          onReturnToDashboard={() => setCurrentRole(backendVerifiedRole)}
        >
          <ProjectSidebar 
            activeTab={activeTab} 
            setActiveTab={handleSetActiveTab} 
            currentRole={currentRole}
            userRole={backendVerifiedRole}
            currentUser={currentUser}
            onSwitchRole={handleSwitchRole}
            isMobileOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onLogout={handleLogout}
          />
          <div className="main-wrapper">
            <ProjectHeader 
              activeTab={activeTab} 
              onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
              onMenuToggle={() => setIsSidebarOpen(true)}
            />
            <main className="content-area">
              {activeTab === 'dashboard' && <ProjectManagerDashboard currentUser={currentUser} />}
              {activeTab === 'projects' && <ProjectProjectsView projectsList={projectsList} />}
              {activeTab === 'teams' && <ProjectTeamsView />}
              {activeTab === 'tasks' && <ProjectTasksView />}
              {activeTab === 'timeline' && <ProjectTimelineView />}
              {activeTab === 'deliveries' && <ProjectDeliveriesView />}
              {activeTab === 'reports' && <ProjectReportsView />}
              {activeTab === 'settings' && <ProjectSettings />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- ADMIN SIDE ----------------- */}
      {currentRole === 'admin' && (
        <RoleProtectedRoute
          userRole={backendVerifiedRole}
          allowedRoles="admin"
          onReturnToDashboard={() => setCurrentRole(backendVerifiedRole)}
        >
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={handleSetActiveTab} 
            currentRole={currentRole}
            userRole={backendVerifiedRole}
            currentUser={currentUser}
            onSwitchRole={handleSwitchRole}
            isMobileOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onLogout={handleLogout}
          />
          <div className="main-wrapper">
            <Header
              activeTab={activeTab}
              currentUser={currentUser}
              onOpenPrimaryAction={handleOpenPrimaryAction}
              onMenuToggle={() => setIsSidebarOpen(true)}
              searchQuery={portalSearch}
              onSearchChange={setPortalSearch}
            />

            <main className="content-area">
              {activeTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '0' }}>
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

                  <div className="analytics-grid">
                    <RevenueChart />
                    <PipelineDonutChart />
                  </div>

                  <div className="bottom-grid">
                    <DealsOverviewChart />
                    <RecentActivity onViewAll={() => setActiveTab('clients')} />
                  </div>
                </div>
              )}

              {activeTab === 'clients' && (
                <ClientsView
                  clientsList={clientsList}
                  onOpenAddClientModal={() => setIsAddClientModalOpen(true)}
                />
              )}

              {activeTab === 'registration_requests' && (
                <RegistrationRequestsView searchQuery={portalSearch} />
              )}
              {activeTab === 'create_ceo' && <CreateCEOAccountView />}
              {activeTab === 'audit_logs' && <AuditLogsView searchQuery={portalSearch} />}

              {activeTab === 'users' && (
                <UsersView
                  usersList={usersList}
                  onOpenInviteModal={() => setIsInviteModalOpen(true)}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectsView
                  projectsList={projectsList}
                  onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
                />
              )}

              {activeTab === 'finance' && <FinanceView />}
              {activeTab === 'reports' && <ReportsView />}
              {activeTab === 'settings' && <SettingsView />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- HR SIDE ----------------- */}
      {currentRole === 'hr' && (
        <RoleProtectedRoute
          userRole={backendVerifiedRole}
          allowedRoles="hr"
          onReturnToDashboard={() => setCurrentRole(backendVerifiedRole)}
        >
          <HRSidebar
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            currentRole={currentRole}
            userRole={backendVerifiedRole}
            currentUser={currentUser}
            onSwitchRole={handleSwitchRole}
            isMobileOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onLogout={handleLogout}
          />
          <div className="main-wrapper">
            <HRHeader
              activeTab={activeTab}
              onMenuToggle={() => setIsSidebarOpen(true)}
              searchQuery={portalSearch}
              onSearchChange={setPortalSearch}
              onPrimaryAction={handleHrPrimaryAction}
            />
            <main className="content-area">
              {activeTab === 'dashboard' && <HRDashboard currentUser={currentUser} onNavigateTab={(tab) => setActiveTab(tab)} />}
              {activeTab === 'employees' && <HREmployeesView searchQuery={portalSearch} headerAction={hrHeaderAction} />}
              {activeTab === 'attendance' && <HRAttendanceView searchQuery={portalSearch} headerAction={hrHeaderAction} />}
              {activeTab === 'recruitment' && <HRRecruitmentView />}
              {activeTab === 'performance' && <HRPerformanceView />}
              {activeTab === 'hr_reports' && <HRReportsView />}
              {activeTab === 'hr_notifications' && <HRNotificationsView />}
              {activeTab === 'hr_settings' && <HRSettingsView />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- ACCOUNTANT SIDE ----------------- */}
      {currentRole === 'accountant' && (
        <RoleProtectedRoute
          userRole={backendVerifiedRole}
          allowedRoles="accountant"
          onReturnToDashboard={() => setCurrentRole(backendVerifiedRole)}
        >
          <AccountantSidebar
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            currentRole={currentRole}
            userRole={backendVerifiedRole}
            currentUser={currentUser}
            onSwitchRole={handleSwitchRole}
            isMobileOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onLogout={handleLogout}
          />
          <div className="main-wrapper">
            <AccountantHeader
              activeTab={activeTab}
              onMenuToggle={() => setIsSidebarOpen(true)}
              onOpenPrimaryAction={() => setIsAccModalOpen(true)}
            />
            <main className="content-area">
              {activeTab === 'dashboard' && (
                <AccountantDashboard
                  currentUser={currentUser}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenInvoiceModal={() => { setActiveTab('invoices'); setIsAccModalOpen(true); }}
                  onOpenExpenseModal={() => { setActiveTab('expenses'); setIsAccModalOpen(true); }}
                />
              )}
              {activeTab === 'invoices' && (
                <AccountantInvoicesView
                  isModalOpen={isAccModalOpen}
                  onCloseModal={() => setIsAccModalOpen(false)}
                />
              )}
              {activeTab === 'expenses' && (
                <AccountantExpensesView
                  isModalOpen={isAccModalOpen}
                  onCloseModal={() => setIsAccModalOpen(false)}
                />
              )}
              {activeTab === 'payroll' && (
                <AccountantPayrollView
                  isModalOpen={isAccModalOpen}
                  onCloseModal={() => setIsAccModalOpen(false)}
                />
              )}
              {activeTab === 'accounts' && (
                <AccountantAccountsView
                  isModalOpen={isAccModalOpen}
                  onCloseModal={() => setIsAccModalOpen(false)}
                />
              )}
              {activeTab === 'acc_reports' && <AccountantReportsView />}
              {activeTab === 'acc_notifications' && <AccountantNotificationsView />}
              {activeTab === 'acc_settings' && <AccountantSettingsView />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- MARKETING DEPT SIDE ----------------- */}
      {currentRole === 'marketing' && (
        <RoleProtectedRoute
          userRole={backendVerifiedRole}
          allowedRoles="marketing"
          onReturnToDashboard={() => setCurrentRole(backendVerifiedRole)}
        >
          <MarketingSidebar
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            currentRole={currentRole}
            userRole={backendVerifiedRole}
            currentUser={currentUser}
            onSwitchRole={handleSwitchRole}
            isMobileOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onLogout={handleLogout}
          />
          <div className="main-wrapper">
            <MarketingHeader
              activeTab={activeTab}
              onMenuToggle={() => setIsSidebarOpen(true)}
              onOpenPrimaryAction={() => setIsMktModalOpen(true)}
            />
            <main className="content-area">
              {activeTab === 'dashboard' && (
                <MarketingDashboard
                  currentUser={currentUser}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenCampaignModal={() => { setActiveTab('campaigns'); setIsMktModalOpen(true); }}
                  onOpenLeadModal={() => { setActiveTab('mkt_leads'); setIsMktModalOpen(true); }}
                />
              )}
              {activeTab === 'campaigns' && (
                <MarketingCampaignsView
                  isModalOpen={isMktModalOpen}
                  onCloseModal={() => setIsMktModalOpen(false)}
                />
              )}
              {activeTab === 'mkt_leads' && (
                <MarketingLeadsView
                  isModalOpen={isMktModalOpen}
                  onCloseModal={() => setIsMktModalOpen(false)}
                />
              )}
              {activeTab === 'content' && (
                <MarketingContentView
                  isModalOpen={isMktModalOpen}
                  onCloseModal={() => setIsMktModalOpen(false)}
                />
              )}
              {activeTab === 'analytics' && <MarketingAnalyticsView />}
              {activeTab === 'mkt_reports' && <MarketingReportsView />}
              {activeTab === 'mkt_notifications' && <MarketingNotificationsView />}
              {activeTab === 'mkt_settings' && <MarketingSettingsView />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- CEO PORTAL ----------------- */}
      {currentRole === 'ceo' && (
        <RoleProtectedRoute
          userRole={backendVerifiedRole}
          allowedRoles="ceo"
          onReturnToDashboard={() => setCurrentRole(backendVerifiedRole)}
        >
          <CEOSidebar
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            currentRole={currentRole}
            userRole={backendVerifiedRole}
            currentUser={currentUser}
            onSwitchRole={handleSwitchRole}
            isMobileOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onLogout={handleLogout}
          />
          <div className="main-wrapper">
            <CEOHeader
              activeTab={activeTab}
              onMenuToggle={() => setIsSidebarOpen(true)}
            />
            <main className="content-area">
              {activeTab === 'dashboard' && <CEODashboard onNavigateTab={(tab) => setActiveTab(tab)} currentUser={currentUser} />}
              {activeTab === 'business_overview' && <BusinessOverviewView />}
              {activeTab === 'projects_performance' && <ProjectsPerformanceView />}
              {activeTab === 'sales_finance' && <SalesFinanceView />}
              {activeTab === 'team_performance' && <TeamPerformanceView />}
              {activeTab === 'reports_analytics' && <ReportsAnalyticsView />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- ADMINISTRATION PORTAL ----------------- */}
      {currentRole === 'administration' && (
        <RoleProtectedRoute
          userRole={backendVerifiedRole}
          allowedRoles="administration"
          onReturnToDashboard={() => setCurrentRole(backendVerifiedRole)}
        >
          <AdministrationSidebar
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            currentRole={currentRole}
            userRole={backendVerifiedRole}
            currentUser={currentUser}
            onSwitchRole={handleSwitchRole}
            isMobileOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onLogout={handleLogout}
          />
          <div className="main-wrapper">
            <AdministrationHeader
              activeTab={activeTab}
              onMenuToggle={() => setIsSidebarOpen(true)}
            />
            <main className="content-area">
              {(activeTab === 'dashboard' || activeTab === 'administration') && (
                <AdministrationDashboard currentUser={currentUser} onNavigateTab={(tab) => setActiveTab(tab)} />
              )}
              {activeTab === 'employees' && <AdministrationEmployeesView />}
              {activeTab === 'departments' && <AdministrationDepartmentsView />}
              {activeTab === 'attendance_leave' && <AdministrationAttendanceLeaveView />}
              {activeTab === 'company_resources' && <AdministrationCompanyResourcesView />}
              {activeTab === 'reports' && <AdministrationReportsView />}
              {/* Catch-all: if activeTab doesn't match any known administration tab, show dashboard */}
              {!['dashboard','administration','employees','departments','attendance_leave','company_resources','reports'].includes(activeTab) && (
                <AdministrationDashboard currentUser={currentUser} onNavigateTab={(tab) => setActiveTab(tab)} />
              )}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* Shared Modals */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteUser={handleInviteUser}
      />

      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onAddClient={handleAddClient}
      />

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onAddProject={handleAddProject}
      />

      <NewTaskModal 
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onAddTask={(newTask) => console.log('New Task Added:', newTask)}
      />
    </div>
  );
}
