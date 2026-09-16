import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

/**
 * RoleProtectedRoute Component
 * - Admin can access all portals.
 * - CEO can access all business portals (except technical Admin).
 * - Departmental roles can access their designated portal.
 */
export default function RoleProtectedRoute({ 
  userRole, 
  allowedRoles, 
  onReturnToDashboard, 
  children 
}) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  // 1. Role matches authorized portal list
  const isDirectRoleMatch = userRole && (
    rolesArray.includes(userRole) || 
    (userRole === 'hr' && (rolesArray.includes('hr') || rolesArray.includes('hr_manager'))) ||
    (userRole === 'hr_manager' && (rolesArray.includes('hr') || rolesArray.includes('hr_manager'))) ||
    (userRole === 'accountant' && (rolesArray.includes('accountant') || rolesArray.includes('accounts'))) ||
    (userRole === 'finance' && (rolesArray.includes('finance') || rolesArray.includes('accounts'))) ||
    (userRole === 'support' && rolesArray.includes('support')) ||
    (userRole === 'administration' && rolesArray.includes('administration')) ||
    ((userRole === 'sales_member' || userRole === 'sales_rep' || userRole === 'sales_person') && (rolesArray.includes('employee') || rolesArray.includes('sales_member') || rolesArray.includes('sales_rep') || rolesArray.includes('sales_person')))
  );

  const isAuthorized = isDirectRoleMatch;

  if (!isAuthorized) {
    return (
      <div style={{
        minHeight: '80vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        fontFamily: 'Inter, system-ui, sans-serif',
        boxSizing: 'border-box'
      }}>
        <div style={{
          backgroundColor: '#1E293B',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '36px 28px',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={32} color="#F87171" />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
            Unauthorized Access
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
            You do not have permission to view this section.
          </p>

          <button
            onClick={onReturnToDashboard}
            style={{
              marginTop: '8px',
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '11px 20px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ArrowLeft size={16} /> Return to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
}
