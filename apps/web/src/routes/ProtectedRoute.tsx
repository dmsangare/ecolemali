import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  requiredPermission?: string;
  requiredRole?: string;
  children?: ReactNode;
}

export function ProtectedRoute({
  requiredPermission,
  requiredRole,
  children,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/forbidden" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/forbidden" replace />;
  }

  // Si un enfant est fourni, on l'affiche (mode "wrapper")
  // Sinon, on affiche l'Outlet (mode "route parent")
  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
}
