import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from './auth/AuthForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'admin' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthForm />;
  }

  if (requireRole && currentUser.role !== requireRole) {
    // Redirect to appropriate dashboard instead of showing access denied
    window.location.href = currentUser.role === 'admin' ? '/admin' : '/dashboard';
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;