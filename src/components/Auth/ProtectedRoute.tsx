import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, isApproved, isAdminCheckComplete, isAdmin } = useAuth();

  if (loading || !isAdminCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin always has access, bypass approval check
  if (isAdmin) {
    return <>{children}</>;
  }

  // Regular users need approval
  if (!isApproved) {
    return <Navigate to="/waiting-approval" replace />;
  }

  return <>{children}</>;
};