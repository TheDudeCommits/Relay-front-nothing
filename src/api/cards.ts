import type { AxiosInstance } from 'axios';
import { normalizeError } from './errors';

export interface CardProduct {
  slug: string;
  name: string;
  network: string;
  country: string;
  best_for?: string[];
  wallet_support?: string[];
}

/** Summary card (GET /cards, GET /me.cards). `balance` is a decimal STRING. */
export interface CardSummary {
  card_id: string;
  card_name?: string;
  currency: string;
  status: string;
  balance: string;
  design?: unknown | null;
  product?: CardProduct | null;
}

/** Full detail (GET /cards/:id) — includes PAN/CVV. `balance` is a NUMBER here. */
export interface CardDetail {
  card_id: string;
  card_name?: string;
  card_number: string;
  exp_year: number;
  exp_month: number;
  cvv: string;
  status: string;
  balance: number;
  currency: string;
  product?: CardProduct;
}

export interface CardsApi {
  list(): Promise<CardSummary[]>;
  get(cardId: string): Promise<CardDetail>;
  freeze(cardId: string): Promise<void>;
  unfreeze(cardId: string): Promise<void>;
}

export function createCardsApi(http: AxiosInstance): CardsApi {
  return {
    async list() {
      try {
        const { data } = await http.get<CardSummary[]>('/v1/relay/cards');
        return data ?? [];
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async get(cardId) {
      try {
        const { data } = await http.get<CardDetail>(`/v1/relay/cards/${cardId}`);
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async freeze(cardId) {
      try {
        await http.post(`/v1/relay/cards/${cardId}/freeze`);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async unfreeze(cardId) {
      try {
        await http.post(`/v1/relay/cards/${cardId}/unfreeze`);
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}
