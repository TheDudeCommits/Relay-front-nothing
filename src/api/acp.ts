import type { AxiosInstance } from 'axios';
import { normalizeError } from './errors';

export interface ConfirmLinkResponse {
  linked: boolean;
  wallet: string;
}

export interface AcpApi {
  /** Bind an ACP buyer agent (via its one-time link token) to the signed-in relay user. */
  confirmLink(token: string): Promise<ConfirmLinkResponse>;
}

export function createAcpApi(http: AxiosInstance): AcpApi {
  return {
    async confirmLink(token) {
      try {
        const { data } = await http.post<ConfirmLinkResponse>('/v1/relay/acp/link/confirm', {
          token,
        });
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}
