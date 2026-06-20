import type { AxiosInstance } from 'axios';
import { normalizeError } from './errors';

/** A connected agent (OAuth client or API key) with its spending policy + usage. */
export interface Authorization {
  id: number;
  display_name: string;
  daily_limit_usd: number | null;
  per_tx_limit_usd: number | null;
  allowed_actions: string[];
  blocked_actions: string[];
  today_usd: number;
  today_tx_count: number;
  lifetime_usd: number;
  lifetime_tx_count: number;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateAuthorizationRequest {
  display_name?: string;
  daily_limit_usd?: number;
  per_tx_limit_usd?: number;
  allowed_actions?: string[];
  blocked_actions?: string[];
  clear_daily_limit?: boolean;
  clear_per_tx_limit?: boolean;
}

export interface AuthorizationsApi {
  list(): Promise<Authorization[]>;
  get(id: number): Promise<Authorization>;
  update(id: number, body: UpdateAuthorizationRequest): Promise<Authorization>;
  revoke(id: number): Promise<void>;
}

export function createAuthorizationsApi(http: AxiosInstance): AuthorizationsApi {
  return {
    async list() {
      try {
        const { data } = await http.get<Authorization[]>('/v1/relay/authorizations');
        return data ?? [];
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async get(id) {
      try {
        const { data } = await http.get<Authorization>(`/v1/relay/authorizations/${id}`);
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async update(id, body) {
      try {
        const { data } = await http.patch<Authorization>(
          `/v1/relay/authorizations/${id}`,
          body,
        );
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async revoke(id) {
      try {
        await http.post(`/v1/relay/authorizations/${id}/revoke`);
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}
