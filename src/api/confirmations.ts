import type { AxiosInstance } from 'axios';
import { normalizeError } from './errors';

export interface ConfirmResponse {
  status: string;
}

export interface ConfirmationsApi {
  /** Confirm an email link (§2C). NOT JWT-gated — the page is the trust boundary. */
  confirm(token: string): Promise<ConfirmResponse>;
}

export function createConfirmationsApi(http: AxiosInstance): ConfirmationsApi {
  return {
    async confirm(token) {
      try {
        const { data } = await http.post<ConfirmResponse>(
          `/v1/relay/confirmations/${token}/confirm`,
        );
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}
