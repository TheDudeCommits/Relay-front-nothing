import type { AxiosInstance } from 'axios';
import { normalizeError } from './errors';

export type TransactionSource = 'topup' | 'card_spend' | 'withdrawal';

/** Aggregated activity row. `amount` is a decimal STRING; conditional fields vary by source. */
export interface Transaction {
  id: number;
  source: TransactionSource;
  amount: string;
  currency: string;
  chain?: string;
  token?: string;
  tx_hash?: string;
  merchant?: string;
  card_san?: string;
  status?: string;
  created_at: string;
}

export interface ListTransactionsParams {
  page?: number;
  size?: number;
}

export interface TransactionsApi {
  list(params?: ListTransactionsParams): Promise<Transaction[]>;
}

export function createTransactionsApi(http: AxiosInstance): TransactionsApi {
  return {
    async list({ page = 1, size = 20 } = {}) {
      try {
        const { data } = await http.get<Transaction[]>('/v1/relay/transactions', {
          params: { page, size },
        });
        return data ?? [];
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}
