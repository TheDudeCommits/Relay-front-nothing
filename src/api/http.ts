import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { config } from '../config';
import { normalizeError } from './errors';

/** Wiring the HTTP layer needs from the auth layer. */
export interface AuthBridge {
  getToken: () => string | null;
  setToken: (token: string | null) => void;
  /** Resolves to a fresh access token, or null if refresh failed. Must NOT use this instance. */
  refresh: () => Promise<string | null>;
  onAuthFailure: () => void;
}

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export function createHttp(bridge: AuthBridge): AxiosInstance {
  const instance = axios.create({
    baseURL: config.apiBaseUrl,
    withCredentials: true, // send/receive the HttpOnly refresh cookie
  });

  instance.interceptors.request.use((req) => {
    const token = bridge.getToken();
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  });

  let refreshing: Promise<string | null> | null = null;

  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as RetryableConfig | undefined;

      if (error.response?.status === 401 && original && !original._retried) {
        original._retried = true;
        try {
          refreshing = refreshing ?? bridge.refresh();
          const newToken = await refreshing;
          refreshing = null;
          if (newToken) {
            bridge.setToken(newToken);
            original.headers.Authorization = `Bearer ${newToken}`;
            return instance(original);
          }
        } catch {
          refreshing = null;
        }
        bridge.onAuthFailure();
      }

      return Promise.reject(normalizeError(error));
    },
  );

  return instance;
}
