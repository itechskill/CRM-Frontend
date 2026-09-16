import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PublicWebsite from './website/PublicWebsite';
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
import { API_BASE, authHeaders, apiRequest } from './utils/api';

// 1. Admin Components (src/admin/)
import Sidebar from './admin/Sidebar';
import Header from './admin/Header';
import AdminDashboard from './admin/AdminDashboard';
import UsersView from './admin/UsersView';
import InviteUserModal from './admin/InviteUserModal';
import AddClientModal from './admin/AddClientModal';
import NewProjectModal from './admin/NewProjectModal';
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
import SalesMgrInvoicesView from './sales_manager/SalesInvoicesView';
import SalesManagerOrdersView from './sales_manager/SalesManagerOrdersView';
import SalesManagerPaymentsView from './sales_manager/SalesManagerPaymentsView';
import SalesManagerActivitiesView from './sales_manager/SalesManagerActivitiesView';

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
import EmployeeLeaveView from './employee/EmployeeLeaveView';
import NewTaskModal from './employee/NewTaskModal';

// Sales Employee Components (src/employee/sales/)
import EmpSalesLeadsView from './employee/sales/SalesLeadsView';
import EmpSalesDealsView from './employee/sales/SalesDealsView';
import EmpSalesQuotationsView from './employee/sales/SalesQuotationsView';
import EmpSalesCustomerPOsView from './employee/sales/SalesCustomerPOsView';
import EmpSalesProductFilesView from './employee/sales/SalesProductFilesView';
import EmpSalesOrdersView from './employee/sales/SalesOrdersView';
import EmpSalesProformaInvoicesView from './employee/sales/SalesProformaInvoicesView';
import EmpSalesInvoicesView from './employee/sales/SalesInvoicesView';
import EmpSalesDeliveryNotesView from './employee/sales/SalesDeliveryNotesView';
import EmpSalesPaymentsView from './employee/sales/SalesPaymentsView';
import EmpSalesFollowUpsView from './employee/sales/SalesFollowUpsView';
import EmpSalesTargetsView from './employee/sales/SalesTargetsView';
import EmpSalesActivitiesView from './employee/sales/SalesActivitiesView';

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
import AccountantMaintenanceView from './accountant/AccountantMaintenanceView';
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
import OrgOverview from './ceo/org/OrgOverview';

// 9. Administration Components (src/administration/)
import AdministrationSidebar from './administration/AdministrationSidebar';
import AdministrationHeader from './administration/AdministrationHeader';
import AdministrationDashboard from './administration/AdministrationDashboard';
import AdministrationEmployeesView from './administration/AdministrationEmployeesView';
import AdministrationDepartmentsView from './administration/AdministrationDepartmentsView';
import AdministrationAttendanceLeaveView from './administration/AdministrationAttendanceLeaveView';
import AdministrationCompanyResourcesView from './administration/AdministrationCompanyResourcesView';
import AdministrationReportsView from './administration/AdministrationReportsView';
import ProfileView from './components/ProfileView';

// 10. Support Department Components (src/support/)
import SupportSidebar from './support/SupportSidebar';
import SupportHeader from './support/SupportHeader';
import SupportDashboard from './support/SupportDashboard';
import SupportOrdersView from './support/SupportOrdersView';
import SupportInventoryView from './support/SupportInventoryView';
import SupportDeliveryNotesView from './support/SupportDeliveryNotesView';
import SupportLeaveView from './support/SupportLeaveView';

// 11. Accounts Department Components (src/accounts/)
import AccountsSidebar from './accounts/AccountsSidebar';
import AccountsHeader from './accounts/AccountsHeader';
import AccountsDashboard from './accounts/AccountsDashboard';
import AccountsOrdersReadyView from './accounts/AccountsOrdersReadyView';
import AccountsInvoicesView from './accounts/AccountsInvoicesView';
import AccountsLeaveView from './accounts/AccountsLeaveView';

// 12. Finance Department Components (src/finance_dept/)
import FinanceSidebar from './finance_dept/FinanceSidebar';
import FinanceHeader from './finance_dept/FinanceHeader';
import FinanceDashboard from './finance_dept/FinanceDashboard';
import FinanceInvoicesView from './finance_dept/FinanceInvoicesView';
import FinancePaymentsView from './finance_dept/FinancePaymentsView';
import FinanceReceivablesView from './finance_dept/FinanceReceivablesView';
import FinanceReportsView from './finance_dept/FinanceReportsView';
import FinanceLeaveView from './finance_dept/FinanceLeaveView';

import { Users, ShieldCheck, UserX } from 'lucide-react';

const initialUsersList = [];

const initialClientsList = [];

const initialProjectsList = [];

export default function App() {
  migrateLegacyAuth();

  const cachedUser = getUser();
  const cachedToken = getToken();

  const [authLoading, setAuthLoading] = useState(() => !!cachedToken);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!(cachedToken && cachedUser));
  const [authView, setAuthView] = useState('landing');
  const [resetToken, setResetToken] = useState('');

  // Detect reset-password token in URL path or query params
  useEffect(() => {
    const checkResetPasswordUrl = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const queryToken = searchParams.get('token');

      if (path.startsWith('/reset-password/')) {
        const extractedToken = path.replace('/reset-password/', '').trim();
        if (extractedToken) {
          setResetToken(extractedToken);
          setAuthView('reset-password');
        }
      } else if (path === '/reset-password' && queryToken) {
        setResetToken(queryToken);
        setAuthView('reset-password');
      } else if (path === '/forgot-password') {
        setAuthView('forgot-password');
      }
    };

    checkResetPasswordUrl();
    window.addEventListener('popstate', checkResetPasswordUrl);
    return () => window.removeEventListener('popstate', checkResetPasswordUrl);
  }, []);

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

  // Departmental cross-view navigation pre-fill state
  const [supportOrderForDN, setSupportOrderForDN] = useState(null);
  const [dnOrderForInvoice, setDnOrderForInvoice] = useState(null);
  const [financeInvoiceForPayment, setFinanceInvoiceForPayment] = useState(null);

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
          headers: authHeaders()
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
          setAuthView('landing');
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
          headers: authHeaders()
        }).catch(() => { });
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      clearAuth();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setBackendVerifiedRole('employee');
      setCurrentRole('employee');
      setAuthView('landing');
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
    const defTab = (role === 'sales_member' || role === 'sales_rep') ? 'my_leads' : 'dashboard';
    setActiveTab(defTab);
    setActiveTabStorage(defTab);
    setIsSidebarOpen(false);
    setPortalSearch('');
  };

  const [usersList, setUsersList] = useState(initialUsersList);
  const [clientsList, setClientsList] = useState(initialClientsList);
  const [projectsList, setProjectsList] = useState(initialProjectsList);

  const fetchSharedData = async () => {
    try {
      const [pRes, cRes, uRes] = await Promise.all([
        apiRequest('/api/projects'),
        apiRequest('/api/crm/clients'),
        apiRequest('/api/users')
      ]);

      if (pRes.data?.success && Array.isArray(pRes.data.data)) {
        const avatarColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
        setProjectsList(pRes.data.data.map((p, idx) => {
          const lead = p.createdBy?.fullName || 'Project Lead';
          const initials = lead.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          const budget = p.budget || 0;
          const spent = p.spent || 0;
          return {
            ...p,
            id: p._id,
            name: p.name,
            client: p.client || 'Internal',
            leadName: lead,
            leadInitials: initials,
            leadBg: avatarColors[idx % avatarColors.length],
            status: p.status || 'In Progress',
            priority: p.priority || 'Medium',
            progress: p.progress || 0,
            budgetSpent: spent ? `Rs. ${Math.round(spent / 1000)}K` : 'Rs. 0',
            budgetTotal: budget ? `Rs. ${Math.round(budget / 1000)}K` : 'Rs. 0',
            budgetRatio: budget ? Math.round((spent / budget) * 100) : 0,
            dueDate: p.endDate ? new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Feb 28, 2025'
          };
        }));
      }

      if (cRes.data?.success && Array.isArray(cRes.data.data)) {
        const avatarColors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        setClientsList(cRes.data.data.map((c, idx) => ({
          ...c,
          id: c._id,
          name: c.name,
          country: 'USA',
          initials: (c.name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          avatarBg: avatarColors[idx % avatarColors.length],
          industry: c.industry || 'Technology',
          contactName: c.name,
          contactEmail: c.email || 'contact@client.com',
          revenueYtd: c.totalValue ? `Rs. ${c.totalValue.toLocaleString()}` : 'Rs. 0',
          dealsCount: 1,
          status: c.status || 'Active'
        })));
      }

      if (uRes.data?.success && Array.isArray(uRes.data.data)) {
        const avatarColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
        setUsersList(uRes.data.data.map((u, idx) => ({
          ...u,
          id: u._id,
          name: u.fullName,
          email: u.email,
          initials: (u.fullName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          avatarBg: avatarColors[idx % avatarColors.length],
          role: u.role,
          department: u.department || 'Operations',
          status: u.status === 'active' || u.status === 'Active' ? 'Active' : 'Inactive',
          lastActive: 'Just now',
          joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 2026'
        })));
      }
    } catch (err) {
      console.error('Fetch shared data error:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSharedData();
    }
  }, [isAuthenticated]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [hrHeaderAction, setHrHeaderAction] = useState(null);

  const handleHrPrimaryAction = (tab) => {
    if (tab === 'employees') setHrHeaderAction({ type: 'add_employee', ts: Date.now() });
    if (tab === 'attendance') setHrHeaderAction({ type: 'mark_attendance', ts: Date.now() });
    if (tab === 'recruitment') setHrHeaderAction({ type: 'post_job', ts: Date.now() });
    if (tab === 'performance') setHrHeaderAction({ type: 'new_review', ts: Date.now() });
  };

  const knownRoles = [
    'employee', 'sales_member', 'sales_rep', 'sales_person', 'sales_manager', 'project_manager', 'admin',
    'hr', 'accountant', 'marketing', 'ceo', 'administration', 'support', 'finance'
  ];

  const effectiveRole = knownRoles.includes(currentRole)
    ? currentRole
    : (getFrontendRole(currentRole) || 'employee');

  // Keep this hook ABOVE every conditional return.
  // React requires hooks to run in the same order on every render.
  useEffect(() => {
    const roleValidTabs = {
      employee: [
        'dashboard', 'leave', 'projects', 'tasks', 'work_updates', 'completed_tasks', 'activity', 'notifications', 'profile', 'settings',
        'my_leads', 'my_deals', 'my_quotations', 'customer_pos', 'product_files', 'my_orders', 'proforma_invoices', 'delivery_notes', 'my_invoices', 'my_payments', 'followups', 'sales_targets', 'sales_activities'
      ],
      sales_member: [
        'dashboard', 'leave', 'projects', 'tasks', 'work_updates', 'completed_tasks', 'activity', 'notifications', 'profile', 'settings',
        'my_leads', 'my_deals', 'my_quotations', 'customer_pos', 'product_files', 'my_orders'
      ],
      sales_person: [
        'dashboard', 'leave', 'projects', 'tasks', 'work_updates', 'completed_tasks', 'activity', 'notifications', 'profile', 'settings',
        'my_leads', 'my_deals', 'my_quotations', 'customer_pos', 'product_files', 'my_orders'
      ],
      sales_rep: [
        'dashboard', 'leave', 'projects', 'tasks', 'work_updates', 'completed_tasks', 'activity', 'notifications', 'profile', 'settings',
        'my_leads', 'my_deals', 'my_quotations', 'customer_pos', 'product_files', 'my_orders', 'proforma_invoices', 'delivery_notes', 'my_invoices', 'my_payments', 'followups', 'sales_targets', 'sales_activities'
      ],
      support: ['dashboard', 'leave', 'support_orders', 'inventory', 'delivery_notes', 'profile'],
      sales_manager: ['dashboard', 'leads', 'deals', 'pipeline', 'orders', 'proforma_invoices', 'deliveries', 'payments', 'activities', 'invoices', 'contacts', 'meetings', 'clients', 'team', 'settings', 'notifications', 'profile'],
      project_manager: ['dashboard', 'projects', 'teams', 'tasks', 'timeline', 'deliveries', 'reports', 'settings', 'profile'],
      admin: ['dashboard', 'registration_requests', 'create_ceo', 'audit_logs', 'users', 'settings', 'profile', 'org_users', 'org_dept_sales', 'org_dept_support', 'org_dept_accounts', 'org_dept_finance', 'org_dept_hr', 'org_ranking', 'org_monthly'],
      hr: ['dashboard', 'employees', 'attendance', 'recruitment', 'performance', 'hr_reports', 'hr_notifications', 'hr_settings', 'profile'],
      accountant: ['dashboard', 'leave', 'orders_ready', 'invoices', 'expenses', 'payroll', 'maintenance', 'acc_reports', 'acc_notifications', 'acc_settings', 'profile'],
      finance: ['dashboard', 'leave', 'finance_invoices', 'customer_payments', 'finance_payments', 'receivables', 'finance_receivables', 'finance_reports', 'reports', 'profile'],
      marketing: ['dashboard', 'campaigns', 'mkt_leads', 'content', 'analytics', 'mkt_reports', 'mkt_notifications', 'mkt_settings', 'profile'],
      ceo: ['dashboard', 'business_overview', 'projects_performance', 'sales_finance', 'team_performance', 'reports_analytics', 'profile', 'org_users', 'org_dept_sales', 'org_dept_support', 'org_dept_accounts', 'org_dept_finance', 'org_dept_hr', 'org_ranking', 'org_monthly'],
      administration: ['dashboard', 'administration', 'employees', 'departments', 'attendance_leave', 'company_resources', 'reports', 'profile']
    };

    const validTabs = roleValidTabs[effectiveRole] || [];

    if (
      activeTab &&
      validTabs.length > 0 &&
      !validTabs.includes(activeTab)
    ) {
      const fallback = (effectiveRole === 'sales_member' || effectiveRole === 'sales_rep') ? 'my_leads' : 'dashboard';
      setActiveTab(fallback);
      setActiveTabStorage(fallback);
    }
  }, [effectiveRole, activeTab]);

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
      return <Register onSwitchToLogin={() => setAuthView('login')} onSwitchToLanding={() => setAuthView('landing')} />;
    }
    if (authView === 'forgot-password') {
      return (
        <ForgotPassword
          onSwitchToLogin={() => setAuthView('login')}
          onSwitchToLanding={() => setAuthView('landing')}
        />
      );
    }

    if (authView === 'reset-password') {
      return (
        <ResetPassword
          token={resetToken}
          onSwitchToLogin={() => {
            setResetToken('');
            setAuthView('login');
          }}
          onSwitchToLanding={() => setAuthView('landing')}
        />
      );
    }
    if (authView === 'login') {
      return (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setAuthView('register')}
          onSwitchToForgotPassword={() => setAuthView('forgot-password')}
          onSwitchToLanding={() => setAuthView('landing')}
        />
      );
    }
    return (
      <PublicWebsite
        onNavigateToLogin={() => setAuthView('login')}
        onNavigateToRegister={() => setAuthView('register')}
      />
    );
  }


  const handleInviteUser = (newUser) => {
    fetchSharedData();
  };

  const handleAddClient = (newClient) => {
    fetchSharedData();
  };

  const handleAddProject = (newProject) => {
    fetchSharedData();
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
      {(effectiveRole === 'employee' || effectiveRole === 'sales_member' || effectiveRole === 'sales_rep' || effectiveRole === 'sales_person') && (
        <RoleProtectedRoute
          userRole={backendVerifiedRole}
          allowedRoles={['employee', 'sales_member', 'sales_rep', 'sales_person']}
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
              currentUser={currentUser}
              onNavigateTab={(tab) => handleSetActiveTab(tab)}
              onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
              onMenuToggle={() => setIsSidebarOpen(true)}
            />
            <main className="content-area">
              {(activeTab === 'dashboard' || !['leave', 'projects', 'tasks', 'work_updates', 'completed_tasks', 'activity', 'notifications', 'profile', 'settings', 'my_leads', 'my_deals', 'my_quotations', 'customer_pos', 'product_files', 'my_orders', 'proforma_invoices', 'delivery_notes', 'my_invoices', 'my_payments', 'followups', 'sales_targets', 'sales_activities'].includes(activeTab)) && (
                <EmployeeDashboard
                  currentUser={currentUser}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
                />
              )}
              {activeTab === 'leave' && <EmployeeLeaveView />}
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
              {activeTab === 'profile' && <EmployeeProfileView onUpdateCurrentUser={(updated) => setCurrentUser(updated)} />}
              {activeTab === 'settings' && <EmployeeSettingsView />}

              {/* Sales Department Features inside Employee Portal */}
              {activeTab === 'my_leads' && <EmpSalesLeadsView />}
              {activeTab === 'my_deals' && <EmpSalesDealsView onNavigateInvoices={() => setActiveTab('my_invoices')} />}
              {activeTab === 'my_quotations' && <EmpSalesQuotationsView />}
              {activeTab === 'customer_pos' && <EmpSalesCustomerPOsView />}
              {activeTab === 'product_files' && <EmpSalesProductFilesView />}
              {activeTab === 'my_orders' && <EmpSalesOrdersView />}
              {activeTab === 'proforma_invoices' && <EmpSalesProformaInvoicesView onNavigateDeliveryNotes={() => setActiveTab('delivery_notes')} />}
              {activeTab === 'delivery_notes' && <EmpSalesDeliveryNotesView />}
              {activeTab === 'my_invoices' && <EmpSalesInvoicesView />}
              {activeTab === 'my_payments' && <EmpSalesPaymentsView />}
              {activeTab === 'followups' && <EmpSalesFollowUpsView />}
              {activeTab === 'sales_targets' && <EmpSalesTargetsView />}
              {activeTab === 'sales_activities' && <EmpSalesActivitiesView />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- SALES MANAGER SIDE ----------------- */}
      {effectiveRole === 'sales_manager' && (
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
              currentUser={currentUser}
              onNavigateTab={(tab) => handleSetActiveTab(tab)}
              onOpenNewDealModal={() => setIsNewProjectModalOpen(true)}
              onMenuToggle={() => setIsSidebarOpen(true)}
              searchQuery={portalSearch}
              onSearchChange={setPortalSearch}
            />
            <main className="content-area">
              {(activeTab === 'dashboard' || !['leads', 'deals', 'pipeline', 'orders', 'proforma_invoices', 'deliveries', 'payments', 'activities', 'invoices', 'contacts', 'meetings', 'clients', 'team', 'settings', 'notifications', 'profile'].includes(activeTab)) && <SalesManagerDashboard currentUser={currentUser} onNavigateTab={(tab) => handleSetActiveTab(tab)} />}
              {activeTab === 'leads' && <SalesLeadsView />}
              {activeTab === 'deals' && <SalesDealsView />}
              {activeTab === 'pipeline' && <SalesPipelineView />}
              {activeTab === 'orders' && <SalesManagerOrdersView />}
              {activeTab === 'proforma_invoices' && <EmpSalesProformaInvoicesView onNavigateDeliveryNotes={() => handleSetActiveTab('deliveries')} />}
              {activeTab === 'deliveries' && <EmpSalesDeliveryNotesView />}
              {activeTab === 'payments' && <SalesManagerPaymentsView />}
              {activeTab === 'activities' && <SalesManagerActivitiesView />}
              {activeTab === 'invoices' && <SalesMgrInvoicesView />}
              {activeTab === 'contacts' && <SalesContactsView />}
              {activeTab === 'meetings' && <SalesMeetingsView />}
              {activeTab === 'clients' && <SalesClientsView />}
              {activeTab === 'team' && <SalesTeamsView />}
              {activeTab === 'settings' && <SalesSettingsView />}
              {activeTab === 'notifications' && <SalesNotificationsView />}
              {activeTab === 'profile' && <ProfileView currentUser={currentUser} onUpdateCurrentUser={(updated) => { setCurrentUser(updated); setUser(updated); }} />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- PROJECT MANAGER SIDE ----------------- */}
      {effectiveRole === 'project_manager' && (
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
              searchQuery={portalSearch}
              onSearchChange={setPortalSearch}
            />
            <main className="content-area">
              {(activeTab === 'dashboard' || !['projects', 'teams', 'tasks', 'timeline', 'deliveries', 'reports', 'settings', 'profile'].includes(activeTab)) && <ProjectManagerDashboard currentUser={currentUser} />}
              {activeTab === 'projects' && <ProjectProjectsView projectsList={projectsList} />}
              {activeTab === 'teams' && <ProjectTeamsView />}
              {activeTab === 'tasks' && <ProjectTasksView />}
              {activeTab === 'timeline' && <ProjectTimelineView />}
              {activeTab === 'deliveries' && <ProjectDeliveriesView />}
              {activeTab === 'reports' && <ProjectReportsView />}
              {activeTab === 'settings' && <ProjectSettings />}
              {activeTab === 'profile' && <ProfileView currentUser={currentUser} onUpdateCurrentUser={(updated) => setCurrentUser(updated)} />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- ADMIN SIDE ----------------- */}
      {effectiveRole === 'admin' && (
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
              {(activeTab === 'dashboard' || (!['registration_requests', 'create_ceo', 'audit_logs', 'users', 'settings', 'profile'].includes(activeTab) && !activeTab.startsWith('org_'))) && (
                <AdminDashboard onNavigateTab={(tab) => setActiveTab(tab)} currentUser={currentUser} />
              )}

              {activeTab === 'registration_requests' && (
                <RegistrationRequestsView searchQuery={portalSearch} />
              )}
              {activeTab === 'create_ceo' && <CreateCEOAccountView />}
              {activeTab === 'audit_logs' && <AuditLogsView searchQuery={portalSearch} />}

              {activeTab === 'users' && (
                <UsersView
                  onOpenInviteModal={() => setIsInviteModalOpen(true)}
                />
              )}

              {activeTab.startsWith('org_') && <OrgOverview activeTab={activeTab} setActiveTab={handleSetActiveTab} />}
              {activeTab === 'settings' && <SettingsView />}
              {activeTab === 'profile' && <ProfileView currentUser={currentUser} onUpdateCurrentUser={(updated) => setCurrentUser(updated)} />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- HR SIDE ----------------- */}
      {effectiveRole === 'hr' && (
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
              {(activeTab === 'dashboard' || !['employees', 'attendance', 'recruitment', 'performance', 'hr_reports', 'hr_notifications', 'hr_settings', 'profile'].includes(activeTab)) && <HRDashboard currentUser={currentUser} onNavigateTab={(tab) => setActiveTab(tab)} />}
              {activeTab === 'employees' && <HREmployeesView searchQuery={portalSearch} headerAction={hrHeaderAction} />}
              {activeTab === 'attendance' && <HRAttendanceView searchQuery={portalSearch} headerAction={hrHeaderAction} />}
              {activeTab === 'recruitment' && <HRRecruitmentView searchQuery={portalSearch} isModalOpen={hrHeaderAction?.type === 'post_job'} />}
              {activeTab === 'performance' && <HRPerformanceView searchQuery={portalSearch} isModalOpen={hrHeaderAction?.type === 'new_review'} />}
              {activeTab === 'hr_reports' && <HRReportsView />}
              {activeTab === 'hr_notifications' && <HRNotificationsView />}
              {activeTab === 'hr_settings' && <HRSettingsView />}
              {activeTab === 'profile' && <ProfileView currentUser={currentUser} onUpdateCurrentUser={(updated) => setCurrentUser(updated)} />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- SUPPORT DEPARTMENT PORTAL ----------------- */}
      {effectiveRole === 'support' && (
        <RoleProtectedRoute
          userRole={backendVerifiedRole}
          allowedRoles={['support', 'admin', 'ceo']}
          onReturnToDashboard={() => setCurrentRole(backendVerifiedRole)}
        >
          <SupportSidebar
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
            <SupportHeader
              activeTab={activeTab}
              currentUser={currentUser}
              onMenuToggle={() => setIsSidebarOpen(true)}
              searchQuery={portalSearch}
              onSearchChange={setPortalSearch}
              onNavigateTab={(tab) => handleSetActiveTab(tab)}
            />
            <main className="content-area">
              {(activeTab === 'dashboard' || !['leave', 'support_orders', 'inventory', 'delivery_notes', 'profile'].includes(activeTab)) && (
                <SupportDashboard
                  currentUser={currentUser}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'leave' && <SupportLeaveView />}
              {activeTab === 'support_orders' && (
                <SupportOrdersView
                  onNavigateDeliveryNotes={(order) => {
                    setSupportOrderForDN(order);
                    setActiveTab('delivery_notes');
                  }}
                />
              )}
              {activeTab === 'inventory' && <SupportInventoryView />}
              {activeTab === 'delivery_notes' && (
                <SupportDeliveryNotesView
                  initialSelectedOrder={supportOrderForDN}
                  onClearSelectedOrder={() => setSupportOrderForDN(null)}
                />
              )}
              {activeTab === 'profile' && <ProfileView currentUser={currentUser} onUpdateCurrentUser={(updated) => setCurrentUser(updated)} />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- ACCOUNTS DEPARTMENT PORTAL ----------------- */}
      {effectiveRole === 'accountant' && (
        <RoleProtectedRoute
          userRole={backendVerifiedRole}
          allowedRoles={['accountant', 'admin', 'ceo']}
          onReturnToDashboard={() => setCurrentRole(backendVerifiedRole)}
        >
          <AccountsSidebar
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
            <AccountsHeader
              activeTab={activeTab}
              currentUser={currentUser}
              onMenuToggle={() => setIsSidebarOpen(true)}
              searchQuery={portalSearch}
              onSearchChange={setPortalSearch}
              onNavigateTab={(tab) => handleSetActiveTab(tab)}
            />
            <main className="content-area">
              {(activeTab === 'dashboard' || !['leave', 'orders_ready', 'invoices', 'expenses', 'payroll', 'maintenance', 'acc_reports', 'acc_notifications', 'acc_settings', 'profile'].includes(activeTab)) && (
                <AccountsDashboard
                  currentUser={currentUser}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'leave' && <AccountsLeaveView />}
              {activeTab === 'orders_ready' && (
                <AccountsOrdersReadyView
                  onNavigateCreateInvoice={(order) => {
                    setDnOrderForInvoice(order);
                    setActiveTab('invoices');
                  }}
                />
              )}
              {activeTab === 'invoices' && (
                <AccountsInvoicesView
                  initialOrder={dnOrderForInvoice}
                  onClearInitialOrder={() => setDnOrderForInvoice(null)}
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

              {activeTab === 'maintenance' && (
                <AccountantMaintenanceView
                  isModalOpen={isAccModalOpen}
                  onCloseModal={() => setIsAccModalOpen(false)}
                />
              )}
              {activeTab === 'acc_reports' && (
                <AccountantReportsView
                  isModalOpen={isAccModalOpen}
                  onCloseModal={() => setIsAccModalOpen(false)}
                />
              )}
              {activeTab === 'acc_notifications' && <AccountantNotificationsView />}
              {activeTab === 'acc_settings' && <AccountantSettingsView />}
              {activeTab === 'profile' && <ProfileView currentUser={currentUser} onUpdateCurrentUser={(updated) => setCurrentUser(updated)} />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- FINANCE DEPARTMENT PORTAL ----------------- */}
      {effectiveRole === 'finance' && (
        <RoleProtectedRoute
          userRole={backendVerifiedRole}
          allowedRoles={['finance', 'admin', 'ceo']}
          onReturnToDashboard={() => setCurrentRole(backendVerifiedRole)}
        >
          <FinanceSidebar
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
            <FinanceHeader
              activeTab={activeTab}
              currentUser={currentUser}
              onMenuToggle={() => setIsSidebarOpen(true)}
              searchQuery={portalSearch}
              onSearchChange={setPortalSearch}
              onNavigateTab={(tab) => handleSetActiveTab(tab)}
            />
            <main className="content-area">
              {(activeTab === 'dashboard' || !['leave', 'finance_invoices', 'customer_payments', 'finance_payments', 'receivables', 'finance_receivables', 'finance_reports', 'reports', 'profile'].includes(activeTab)) && (
                <FinanceDashboard
                  currentUser={currentUser}
                  onNavigateTab={(tab) => handleSetActiveTab(tab)}
                />
              )}
              {activeTab === 'leave' && <FinanceLeaveView />}
              {activeTab === 'finance_invoices' && (
                <FinanceInvoicesView
                  onNavigatePayment={(inv) => {
                    setFinanceInvoiceForPayment(inv);
                    handleSetActiveTab('customer_payments');
                  }}
                />
              )}
              {(activeTab === 'customer_payments' || activeTab === 'finance_payments') && (
                <FinancePaymentsView
                  initialInvoice={financeInvoiceForPayment}
                  onClearInitialInvoice={() => setFinanceInvoiceForPayment(null)}
                />
              )}
              {(activeTab === 'receivables' || activeTab === 'finance_receivables') && (
                <FinanceReceivablesView
                  onNavigatePayment={(inv) => {
                    setFinanceInvoiceForPayment(inv);
                    handleSetActiveTab('customer_payments');
                  }}
                />
              )}
              {(activeTab === 'finance_reports' || activeTab === 'reports') && <FinanceReportsView />}
              {activeTab === 'profile' && <ProfileView currentUser={currentUser} onUpdateCurrentUser={(updated) => setCurrentUser(updated)} />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- MARKETING DEPT SIDE ----------------- */}
      {effectiveRole === 'marketing' && (
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
              searchQuery={portalSearch}
              onSearchChange={setPortalSearch}
            />
            <main className="content-area">
              {(activeTab === 'dashboard' || !['campaigns', 'mkt_leads', 'content', 'analytics', 'mkt_reports', 'mkt_notifications', 'mkt_settings', 'profile'].includes(activeTab)) && (
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
              {activeTab === 'profile' && <ProfileView currentUser={currentUser} onUpdateCurrentUser={(updated) => setCurrentUser(updated)} />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- CEO PORTAL ----------------- */}
      {effectiveRole === 'ceo' && (
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
              currentUser={currentUser}
              onMenuToggle={() => setIsSidebarOpen(true)}
              searchQuery={portalSearch}
              onSearchChange={setPortalSearch}
            />
            <main className="content-area">
              {(activeTab === 'dashboard' || (!['business_overview', 'projects_performance', 'sales_finance', 'team_performance', 'reports_analytics', 'profile'].includes(activeTab) && !activeTab.startsWith('org_'))) && <CEODashboard onNavigateTab={(tab) => setActiveTab(tab)} currentUser={currentUser} />}
              {activeTab === 'business_overview' && <BusinessOverviewView />}
              {activeTab === 'projects_performance' && <ProjectsPerformanceView />}
              {activeTab === 'sales_finance' && <SalesFinanceView />}
              {activeTab === 'team_performance' && <TeamPerformanceView />}
              {activeTab === 'reports_analytics' && <ReportsAnalyticsView />}
              {activeTab.startsWith('org_') && <OrgOverview activeTab={activeTab} setActiveTab={handleSetActiveTab} />}
              {activeTab === 'profile' && <ProfileView currentUser={currentUser} onUpdateCurrentUser={(updated) => setCurrentUser(updated)} />}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {/* ----------------- ADMINISTRATION PORTAL ----------------- */}
      {effectiveRole === 'administration' && (
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
              currentUser={currentUser}
              onMenuToggle={() => setIsSidebarOpen(true)}
              searchQuery={portalSearch}
              onSearchChange={setPortalSearch}
            />
            <main className="content-area">
              {(activeTab === 'dashboard' || activeTab === 'administration') && (
                <AdministrationDashboard currentUser={currentUser} onNavigateTab={(tab) => setActiveTab(tab)} />
              )}
              {activeTab === 'employees' && <AdministrationEmployeesView />}
              {activeTab === 'departments' && <AdministrationDepartmentsView searchQuery={portalSearch} />}
              {activeTab === 'attendance_leave' && <AdministrationAttendanceLeaveView />}
              {activeTab === 'company_resources' && <AdministrationCompanyResourcesView />}
              {activeTab === 'reports' && <AdministrationReportsView />}
              {activeTab === 'profile' && <ProfileView currentUser={currentUser} onUpdateCurrentUser={(updated) => setCurrentUser(updated)} />}
              {/* Catch-all: if activeTab doesn't match any known administration tab, show dashboard */}
              {!['dashboard', 'administration', 'employees', 'departments', 'attendance_leave', 'company_resources', 'reports', 'profile'].includes(activeTab) && (
                <AdministrationDashboard currentUser={currentUser} onNavigateTab={(tab) => setActiveTab(tab)} />
              )}
            </main>
          </div>
        </RoleProtectedRoute>
      )}

      {!knownRoles.includes(effectiveRole) && (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
            Portal View ({currentRole})
          </h2>
          <p style={{ color: '#94A3B8', marginBottom: '20px' }}>
            Click below to return to your main dashboard.
          </p>
          <button
            onClick={() => handleSwitchRole(backendVerifiedRole || 'employee')}
            style={{
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Go to Dashboard
          </button>
        </div>
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
