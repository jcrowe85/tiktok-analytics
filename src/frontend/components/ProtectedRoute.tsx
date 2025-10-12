import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="fixed inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20"></div>
        </div>
        <div className="text-center relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/10 rounded-full animate-spin border-t-blue-500"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-pulse border-t-purple-500"></div>
          </div>
          <p className="mt-6 text-white/80 font-medium text-lg text-center">Loading...</p>
          <p className="mt-2 text-white/50 text-sm text-center">Checking authentication</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Show protected content if authenticated
  return <>{children}</>;
}
