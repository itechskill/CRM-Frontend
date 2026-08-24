/**
 * Centralized Role-to-Portal Configuration
 * Defines the mapping between backend user roles and corresponding frontend CRM portals.
 */

export const ROLE_CONFIG = {
  admin: {
    backendRole: 'admin',
    frontendRole: 'admin',
    portalName: 'Admin Portal',
    defaultTab: 'dashboard'
  },
  ceo: {
    backendRole: 'ceo',
    frontendRole: 'ceo',
    portalName: 'CEO Portal',
    defaultTab: 'dashboard'
  },
  administration: {
    backendRole: 'administration',
    frontendRole: 'administration',
    portalName: 'Administration Portal',
    defaultTab: 'dashboard'
  },
  hr_manager: {
    backendRole: 'hr_manager',
    frontendRole: 'hr',
    portalName: 'HR Manager Portal',
    defaultTab: 'dashboard'
  },
  sales_manager: {
    backendRole: 'sales_manager',
    frontendRole: 'sales_manager',
    portalName: 'Sales Manager Portal',
    defaultTab: 'dashboard'
  },
  project_manager: {
    backendRole: 'project_manager',
    frontendRole: 'project_manager',
    portalName: 'Project Manager Portal',
    defaultTab: 'dashboard'
  },
  marketing: {
    backendRole: 'marketing',
    frontendRole: 'marketing',
    portalName: 'Marketing Portal',
    defaultTab: 'dashboard'
  },
  accountant: {
    backendRole: 'accountant',
    frontendRole: 'accountant',
    portalName: 'Finance / Accountant Portal',
    defaultTab: 'dashboard'
  },
  employee: {
    backendRole: 'employee',
    frontendRole: 'employee',
    portalName: 'Employee Portal',
    defaultTab: 'dashboard'
  }
};

/**
 * Maps backend role string to corresponding frontend role identifier
 * @param {string} backendRole - Role received from API (e.g. 'hr_manager', 'ceo', 'admin')
 * @returns {string} frontendRole (e.g. 'hr', 'ceo', 'admin')
 */
export const getFrontendRole = (backendRole) => {
  if (!backendRole) return 'employee';
  const key = backendRole.toLowerCase().trim();
  return ROLE_CONFIG[key] ? ROLE_CONFIG[key].frontendRole : 'employee';
};

/**
 * Retrieves the full portal configuration object for a role
 * @param {string} roleKey - Role string
 * @returns {Object} Portal configuration object
 */
export const getRoleConfig = (roleKey) => {
  if (!roleKey) return ROLE_CONFIG.employee;
  const key = roleKey.toLowerCase().trim();
  return ROLE_CONFIG[key] || ROLE_CONFIG.employee;
};
