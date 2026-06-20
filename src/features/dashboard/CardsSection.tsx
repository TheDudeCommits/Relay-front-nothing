import { useState } from 'react';
import { Logo } from '../../components/brand/Logo';
import { Panel } from '../../components/ui/Panel';
import { formatMoney } from '../../lib/format';
import type { CardSummary } from '../../api/cards';
import { useCards } from './hooks';
import { CardDetailModal } from './CardDetailModal';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-2 ${className ?? ''}`} />;
}

function CardTile({ card, onClick }: { card: CardSummary; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relay-hover-lift cursor-pointer rounded-md border border-line bg-surface-2 p-5 text-left"
    >
      <div className="flex items-center justify-between">
        <Logo size={18} withWordmark={false} />
        <span className="rounded-sm border border-line px-2 py-0.5 text-[11px] capitalize text-muted">
          {card.status}
        </span>
      </div>
      <p className="mt-6 font-mono text-sm tracking-[0.16em] text-ink/80">•••• •••• •••• ••••</p>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] text-faint">{card.card_name ?? 'Virtual card'}</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-ink">
            {formatMoney(card.balance, card.currency)}
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-faint">
          {card.product?.network ?? card.currency}
        </span>
      </div>
    </button>
  );
}

export function CardsSection() {
  const cards = useCards();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="mt-9">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-faint">Cards</h2>

      {cards.isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      )}

      {cards.isError && (
        <Panel className="p-6">
          <p className="text-sm text-muted">Couldn’t load your cards.</p>
        </Panel>
      )}

      {cards.data && cards.data.length === 0 && (
        <Panel className="p-8 text-center">
          <p className="text-sm text-muted">
            No cards yet. Ask your agent to buy one, or use “Buy a card” above.
          </p>
        </Panel>
      )}

      {cards.data && cards.data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.data.map((card) => (
            <CardTile key={card.card_id} card={card} onClick={() => setSelected(card.card_id)} />
          ))}
        </div>
      )}

      <CardDetailModal cardId={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
