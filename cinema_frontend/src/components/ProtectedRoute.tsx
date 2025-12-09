import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EmailVerification } from './EmailVerification';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  requireVerification?: boolean;
}

export function ProtectedRoute({
  children,
  adminOnly = false,
  requireVerification = true
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Wait to see if user has been loaded
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in, redirect to login
  if (!user) {
    // Store message for login page
    localStorage.setItem('loginMessage', 'Please log in to access this page');
    return <Navigate to="/login" replace />;
  }

  // Require email verification but user is not verified
  if (requireVerification && !user.is_verified) {
    // Store message for email verification page
    localStorage.setItem('verificationMessage', 'Please verify your email address to access this page');
    return <EmailVerification />;
  }

  // Require admin but user is not admin
  if (adminOnly && user.role !== 'admin') {
    // Store message for home page
    localStorage.setItem('homeMessage', 'You need admin privileges to access this page');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
