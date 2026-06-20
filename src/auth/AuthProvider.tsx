import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createHttp } from '../api/http';
import { refreshAccessToken } from '../api/auth';
import { createRelayApi, type RelayApi } from '../api/client';
import { getAccessToken, setAccessToken, useAuthTokenStore } from './token-store';

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  api: RelayApi;
  /** Call after a successful login exchange. */
  setAuthenticated: (accessToken: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useAuthTokenStore((s) => s.token);
  const [bootStatus, setBootStatus] = useState<AuthStatus>('bootstrapping');

  const api = useMemo<RelayApi>(() => {
    const http = createHttp({
      getToken: getAccessToken,
      setToken: setAccessToken,
      refresh: refreshAccessToken,
      onAuthFailure: () => {
        setAccessToken(null);
        setBootStatus('unauthenticated');
      },
    });
    return createRelayApi(http);
  }, []);

  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void (async () => {
      if (getAccessToken()) {
        setBootStatus('authenticated');
        return;
      }
      const fresh = await refreshAccessToken();
      if (fresh) {
        setAccessToken(fresh);
        setBootStatus('authenticated');
      } else {
        setBootStatus('unauthenticated');
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const status: AuthStatus =
      bootStatus === 'bootstrapping'
        ? 'bootstrapping'
        : token
          ? 'authenticated'
          : 'unauthenticated';
    return {
      status,
      api,
      setAuthenticated: (accessToken) => {
        setAccessToken(accessToken);
        setBootStatus('authenticated');
      },
      logout: async () => {
        try {
          await api.auth.logout();
        } finally {
          setAccessToken(null);
          setBootStatus('unauthenticated');
        }
      },
    };
  }, [bootStatus, token, api]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
}
