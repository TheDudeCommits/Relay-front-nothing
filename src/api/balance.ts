import type { AxiosInstance } from 'axios';
import { normalizeError } from './errors';

/** One row per currency. `balance` is a decimal STRING. */
export interface BalanceRow {
  currency: string;
  balance: string;
}

export interface BalanceApi {
  list(): Promise<BalanceRow[]>;
}

export function createBalanceApi(http: AxiosInstance): BalanceApi {
  return {
    async list() {
      try {
        const { data } = await http.get<{ balances?: BalanceRow[] }>('/v1/relay/balance');
        return data?.balances ?? [];
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}
