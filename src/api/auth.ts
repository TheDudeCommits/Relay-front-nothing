import axios, { type AxiosInstance } from 'axios';
import { config } from '../config';
import { normalizeError } from './errors';

export interface ExchangeUser {
  id: string;
  email?: string | null;
  [key: string]: unknown;
}

export interface AuthResponse {
  access_token: string;
  expires_in: number;
  user?: ExchangeUser;
}

export interface AuthApi {
  exchangePrivy(privyToken: string): Promise<AuthResponse>;
  logout(): Promise<void>;
}

export function createAuthApi(http: AxiosInstance): AuthApi {
  return {
    async exchangePrivy(privyToken) {
      try {
        const { data } = await http.post<AuthResponse>('/v1/relay/auth/privy', {
          privy_token: privyToken, // ⚠ backend field name is privy_token
        });
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async logout() {
      try {
        await http.post('/v1/relay/auth/logout');
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}

/**
 * Refresh the access token via the HttpOnly cookie.
 * Uses a BARE axios client (no interceptors) so a 401 here cannot recurse.
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ access_token?: string }>(
      '/v1/relay/auth/refresh',
      undefined,
      { baseURL: config.apiBaseUrl, withCredentials: true },
    );
    return data?.access_token ?? null;
  } catch {
    return null;
  }
}
