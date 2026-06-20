import { create } from 'zustand';

const STORAGE_KEY = 'relay.access_token';

interface AuthTokenState {
  token: string | null;
  setToken: (token: string | null) => void;
}

function readInitial(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export const useAuthTokenStore = create<AuthTokenState>((set) => ({
  token: readInitial(),
  setToken: (token) => {
    if (typeof sessionStorage !== 'undefined') {
      if (token) sessionStorage.setItem(STORAGE_KEY, token);
      else sessionStorage.removeItem(STORAGE_KEY);
    }
    set({ token });
  },
}));

/** Non-React accessors for the axios bridge. */
export const getAccessToken = (): string | null =>
  useAuthTokenStore.getState().token;

export const setAccessToken = (token: string | null): void =>
  useAuthTokenStore.getState().setToken(token);
