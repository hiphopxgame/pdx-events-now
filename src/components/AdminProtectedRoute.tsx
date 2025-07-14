import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;