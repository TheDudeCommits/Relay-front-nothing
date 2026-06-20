/** Format a decimal money value (string or number) for display. */
export function formatMoney(amount: string | number, currency = 'USD'): string {
  const n = typeof amount === 'number' ? amount : Number.parseFloat(amount);
  const safe = Number.isFinite(n) ? n : 0;
  const formatted = safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency === 'USD' ? `$${formatted}` : `${formatted} ${currency}`;
}

/** Format an RFC 3339 timestamp as e.g. "Jun 16, 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Truncate a wallet/deposit address for compact display: 0xabcd…wxyz. */
export function shortenAddress(addr: string, head = 6, tail = 4): string {
  if (!addr || addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
