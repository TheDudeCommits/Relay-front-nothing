import { useAuthContext, type AuthStatus } from './AuthProvider';

export interface UseAuthResult {
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth(): UseAuthResult {
  const { status } = useAuthContext();
  return {
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'bootstrapping',
  };
}
