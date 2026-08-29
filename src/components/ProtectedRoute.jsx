import React from 'react';
import Login from '../pages/Login';

/**
 * ProtectedRoute Component
 * Ensures only authenticated users with valid backend tokens can view wrapped pages.
 */
export default function ProtectedRoute({ 
  isAuthenticated, 
  children, 
  onLoginSuccess, 
  onSwitchToRegister 
}) {
  if (!isAuthenticated) {
    return (
      <Login 
        onLoginSuccess={onLoginSuccess} 
        onSwitchToRegister={onSwitchToRegister} 
      />
    );
  }

  return children;
}
