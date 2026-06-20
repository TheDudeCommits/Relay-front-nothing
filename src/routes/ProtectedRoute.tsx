import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Logo } from '../components/brand/Logo';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="relay-bg flex min-h-dvh flex-col items-center justify-center gap-5">
        <div className="relative flex size-16 items-center justify-center">
          <span
            className="relay-spin absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.6), transparent 35%)',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))',
              WebkitMask:
                'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))',
            }}
            aria-hidden="true"
          />
          <Logo size={30} withWordmark={false} />
        </div>
        <p className="text-sm text-muted" role="status">
          Restoring your session…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
