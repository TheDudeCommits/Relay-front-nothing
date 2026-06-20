import type { AxiosInstance } from 'axios';
import { normalizeError } from './errors';

/**
 * Masked key summary (GET /api-keys). The exact masked field isn't specified in
 * the handoff, so we keep optional hints and render defensively.
 */
export interface ApiKeySummary {
  id: number | string;
  name: string;
  created_at?: string;
  last_used_at?: string;
  masked?: string;
  prefix?: string;
}

export interface CreateApiKeyRequest {
  name: string;
  scopes?: string[];
}

/** The full key is returned ONLY on create — shown once. */
export interface CreateApiKeyResponse {
  key: string;
}

export interface ApiKeysApi {
  list(): Promise<ApiKeySummary[]>;
  create(body: CreateApiKeyRequest): Promise<CreateApiKeyResponse>;
  remove(id: number | string): Promise<void>;
}

export function createApiKeysApi(http: AxiosInstance): ApiKeysApi {
  return {
    async list() {
      try {
        const { data } = await http.get<ApiKeySummary[]>('/v1/relay/api-keys');
        return data ?? [];
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async create(body) {
      try {
        const { data } = await http.post<CreateApiKeyResponse>('/v1/relay/api-keys', body);
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async remove(id) {
      try {
        await http.delete(`/v1/relay/api-keys/${id}`);
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}
