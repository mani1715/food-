import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function ProtectedRoute() {
  const { supabaseUser, authLoading } = useApp();
  const location = useLocation();
  if (authLoading) return <p role="status" className="p-12 text-center">Checking your session...</p>;
  if (!supabaseUser) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return <Outlet />;
}
