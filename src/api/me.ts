import type { AxiosInstance } from 'axios';
import { normalizeError } from './errors';
import type { CardSummary } from './cards';

export interface Wallet {
  address: string;
  chain_type: string;
  is_primary?: boolean;
}

/** GET /me — redacted relay profile. `total_balance` is a decimal STRING. */
export interface Profile {
  email?: string;
  username?: string;
  avatar_url?: string;
  profile_name?: string;
  selected_design_id?: number;
  total_balance: string;
  wallets: Wallet[];
  cards?: CardSummary[];
}

export interface MeApi {
  get(): Promise<Profile>;
}

export function createMeApi(http: AxiosInstance): MeApi {
  return {
    async get() {
      try {
        const { data } = await http.get<Profile>('/v1/relay/me');
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}
