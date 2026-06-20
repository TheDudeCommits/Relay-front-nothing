import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, CreditCard, type LucideIcon } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { formatDate, formatMoney } from '../../lib/format';
import type { Transaction, TransactionSource } from '../../api/transactions';
import { useTransactions } from './hooks';

const PAGE_SIZE = 10;

const SOURCE_META: Record<TransactionSource, { icon: LucideIcon; label: string; sign: string }> = {
  topup: { icon: ArrowDownLeft, label: 'Top-up', sign: '+' },
  card_spend: { icon: CreditCard, label: 'Card spend', sign: '−' },
  withdrawal: { icon: ArrowUpRight, label: 'Withdrawal', sign: '−' },
};

function subtitle(tx: Transaction): string {
  if (tx.source === 'card_spend') return tx.merchant ?? 'Card transaction';
  if (tx.source === 'topup') {
    return [tx.token, tx.chain].filter(Boolean).join(' · ') || 'Deposit';
  }
  return tx.status ?? 'Withdrawal';
}

function Row({ tx }: { tx: Transaction }) {
  const meta = SOURCE_META[tx.source] ?? { icon: CreditCard, label: tx.source, sign: '' };
  const Icon = meta.icon;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line text-muted">
          <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-ink">{meta.label}</p>
          <p className="truncate text-xs text-muted">{subtitle(tx)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm text-ink">
          {meta.sign}
          {formatMoney(tx.amount, tx.currency)}
        </p>
        <p className="text-xs text-faint">{formatDate(tx.created_at)}</p>
      </div>
    </div>
  );
}

export function ActivitySection() {
  const [page, setPage] = useState(1);
  const txns = useTransactions(page, PAGE_SIZE);
  const rows = txns.data ?? [];
  const hasNext = rows.length === PAGE_SIZE;

  return (
    <section className="mt-9">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-faint">Activity</h2>
      <Panel className="px-6 py-2">
        {txns.isPending && (
          <div className="flex flex-col gap-2 py-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-sm bg-surface-2" />
            ))}
          </div>
        )}
        {txns.isError && <p className="py-6 text-sm text-muted">Couldn’t load activity.</p>}
        {txns.data && rows.length === 0 && page === 1 && (
          <p className="py-6 text-sm text-muted">No activity yet.</p>
        )}
        {rows.map((tx) => (
          <Row key={tx.id} tx={tx} />
        ))}
      </Panel>

      {(page > 1 || hasNext) && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || txns.isPending}
          >
            <ChevronLeft className="size-4" strokeWidth={2} aria-hidden="true" />
            Previous
          </Button>
          <span className="text-xs text-faint">Page {page}</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || txns.isPending}
          >
            Next
            <ChevronRight className="size-4" strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      )}
    </section>
  );
}
