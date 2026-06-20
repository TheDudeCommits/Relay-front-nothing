import { useState } from 'react';
import { Eye, EyeOff, Loader2, Snowflake, Sun } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { Logo } from '../../components/brand/Logo';
import { formatMoney } from '../../lib/format';
import { RelayApiError } from '../../api/errors';
import { useCardDetail, useCardMutations } from './hooks';

function maskedPan(cardNumber: string): string {
  return `•••• •••• •••• ${cardNumber.slice(-4)}`;
}

function groupedPan(cardNumber: string): string {
  return cardNumber.replace(/(.{4})/g, '$1 ').trim();
}

export function CardDetailModal({ cardId, onClose }: { cardId: string | null; onClose: () => void }) {
  const detail = useCardDetail(cardId);
  const { freeze, unfreeze } = useCardMutations(cardId);
  const [revealed, setRevealed] = useState(false);

  const card = detail.data;
  const isFrozen = card?.status?.toLowerCase() === 'frozen';
  const expLabel = card
    ? `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}`
    : '';

  const handleClose = () => {
    setRevealed(false);
    onClose();
  };

  return (
    <Modal open={Boolean(cardId)} onClose={handleClose} title="Card details">
      {detail.isPending && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="size-6 animate-spin text-muted" aria-hidden="true" />
          <p className="text-sm text-muted">Loading card…</p>
        </div>
      )}

      {detail.isError && (
        <p className="py-6 text-center text-sm text-muted" role="alert">
          {(detail.error as RelayApiError)?.status === 404
            ? 'Card not found, or it isn’t yours.'
            : 'Couldn’t load this card.'}
        </p>
      )}

      {card && (
        <div className="flex flex-col gap-5">
          {/* card visual */}
          <div className="rounded-md border border-line bg-surface-2 p-5">
            <div className="flex items-center justify-between">
              <Logo size={20} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-faint">
                {card.product?.network ?? 'Virtual'}
              </span>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <p className="font-mono text-base tracking-[0.16em] text-ink">
                {revealed ? groupedPan(card.card_number) : maskedPan(card.card_number)}
              </p>
              {revealed && <CopyButton value={card.card_number} label="Copy card number" />}
            </div>
            <div className="mt-4 flex items-center gap-6 font-mono text-[11px] uppercase tracking-widest text-faint">
              <span>
                <span className="block text-[9px]">Exp</span>
                {expLabel}
              </span>
              <span>
                <span className="block text-[9px]">CVV</span>
                {revealed ? card.cvv : '•••'}
              </span>
              <span className="ml-auto normal-case tracking-normal">
                {card.card_name ?? 'Virtual card'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="flex w-fit cursor-pointer items-center gap-1.5 text-sm text-muted transition-colors duration-150 hover:text-ink"
          >
            {revealed ? (
              <>
                <EyeOff className="size-4" strokeWidth={1.75} aria-hidden="true" /> Hide details
              </>
            ) : (
              <>
                <Eye className="size-4" strokeWidth={1.75} aria-hidden="true" /> Reveal card number &amp; CVV
              </>
            )}
          </button>

          {/* balance + status */}
          <div className="flex items-center justify-between border-t border-line pt-4">
            <div>
              <p className="text-xs text-faint">Balance</p>
              <p className="mt-0.5 font-display text-2xl font-semibold text-ink">
                {formatMoney(card.balance, card.currency)}
              </p>
            </div>
            <span className="rounded-sm border border-line px-2.5 py-1 text-xs capitalize text-muted">
              {card.status}
            </span>
          </div>

          {/* actions */}
          <div className="flex flex-col gap-3 border-t border-line pt-4">
            <Button
              variant="secondary"
              onClick={() => (isFrozen ? unfreeze.mutate() : freeze.mutate())}
              disabled={freeze.isPending || unfreeze.isPending}
              className="w-full"
            >
              {freeze.isPending || unfreeze.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : isFrozen ? (
                <Sun className="size-4" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Snowflake className="size-4" strokeWidth={1.75} aria-hidden="true" />
              )}
              {isFrozen ? 'Unfreeze card' : 'Freeze card'}
            </Button>

            {(freeze.isError || unfreeze.isError) && (
              <p className="text-sm text-muted" role="alert">
                {((freeze.error || unfreeze.error) as RelayApiError)?.message ?? 'Action failed.'}
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
