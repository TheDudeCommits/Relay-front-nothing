/**
 * The relay backend has one KYC application per user, but the status endpoints
 * key off the application uuid (status-by-sort 404s for fresh applications). We
 * persist the uuid from `start` so the dashboard can show status across reloads.
 */
const KEY = 'relay.kyc.uuid';

export function getStoredKycUuid(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(KEY);
}

export function setStoredKycUuid(uuid: string): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, uuid);
}

export function clearStoredKycUuid(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY);
}
