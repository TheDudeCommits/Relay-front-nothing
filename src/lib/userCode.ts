/**
 * Normalize a device user_code for lookup. The backend tolerates dashes and
 * spaces, so we just trim and uppercase (e.g. " wdjb-mjht " → "WDJB-MJHT").
 */
export function normalizeUserCode(raw: string): string {
  return raw.trim().toUpperCase();
}
