import type { AxiosInstance } from 'axios';
import { normalizeError } from './errors';

export type DepositChain = 'evm' | 'solana' | 'tron';

export interface DepositAddress {
  chain: DepositChain;
  address: string;
}

export interface DepositAddressesApi {
  list(): Promise<DepositAddress[]>;
}

export function createDepositAddressesApi(http: AxiosInstance): DepositAddressesApi {
  return {
    async list() {
      try {
        const { data } = await http.get<{ addresses?: DepositAddress[] }>(
          '/v1/relay/deposit-addresses',
        );
        return data?.addresses ?? [];
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}
