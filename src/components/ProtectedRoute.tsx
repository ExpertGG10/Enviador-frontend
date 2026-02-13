import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  onNavigate: (page: string) => void;
}

/**
 * Componente que protege rotas autenticadas
 * Redireciona para login se não autenticado
 */
export function ProtectedRoute({ children, onNavigate }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirecionar para login
    setTimeout(() => onNavigate('login'), 0);
    return null;
  }

  return <>{children}</>;
}
