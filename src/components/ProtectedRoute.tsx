import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - loading:', loading, 'user:', user?.email, 'location:', location.pathname);

  if (loading) {
    console.log('ProtectedRoute - Mostrando loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - Usuário não autenticado, redirecionando para /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute - Usuário autenticado, renderizando children');
  return <>{children}</>;
}