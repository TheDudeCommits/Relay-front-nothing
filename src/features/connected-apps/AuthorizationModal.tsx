import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { RelayApiError } from '../../api/errors';
import type { Authorization, UpdateAuthorizationRequest } from '../../api/authorizations';
import { useAuthorizationMutations } from './hooks';

const inputCls =
  'w-full rounded-md border border-line bg-black/40 px-3 py-2.5 text-sm text-ink placeholder:text-faint focus-visible:border-line-strong focus-visible:outline-none';

export function AuthorizationModal({
  app,
  onClose,
}: {
  app: Authorization | null;
  onClose: () => void;
}) {
  if (!app) return null;
  return <AuthorizationModalInner app={app} onClose={onClose} />;
}

function AuthorizationModalInner({ app, onClose }: { app: Authorization; onClose: () => void }) {
  const { update, revoke } = useAuthorizationMutations(app.id);
  const [name, setName] = useState(app.display_name);
  const [daily, setDaily] = useState(app.daily_limit_usd?.toString() ?? '');
  const [dailyNoLimit, setDailyNoLimit] = useState(app.daily_limit_usd === null);
  const [perTx, setPerTx] = useState(app.per_tx_limit_usd?.toString() ?? '');
  const [perTxNoLimit, setPerTxNoLimit] = useState(app.per_tx_limit_usd === null);

  const save = () => {
    const body: UpdateAuthorizationRequest = { display_name: name };
    if (dailyNoLimit) body.clear_daily_limit = true;
    else if (daily.trim()) body.daily_limit_usd = Number.parseFloat(daily);
    if (perTxNoLimit) body.clear_per_tx_limit = true;
    else if (perTx.trim()) body.per_tx_limit_usd = Number.parseFloat(perTx);
    update.mutate(body, { onSuccess: onClose });
  };

  return (
    <Modal open onClose={onClose} title="Manage app">
      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-faint">Display name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-faint">Daily limit (USD)</span>
            <input
              value={dailyNoLimit ? '' : daily}
              onChange={(e) => setDaily(e.target.value)}
              disabled={dailyNoLimit}
              inputMode="decimal"
              placeholder="50.00"
              className={`${inputCls} disabled:opacity-40`}
            />
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <input type="checkbox" checked={dailyNoLimit} onChange={(e) => setDailyNoLimit(e.target.checked)} />
              No daily limit
            </label>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-faint">Per-transaction (USD)</span>
            <input
              value={perTxNoLimit ? '' : perTx}
              onChange={(e) => setPerTx(e.target.value)}
              disabled={perTxNoLimit}
              inputMode="decimal"
              placeholder="20.00"
              className={`${inputCls} disabled:opacity-40`}
            />
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <input type="checkbox" checked={perTxNoLimit} onChange={(e) => setPerTxNoLimit(e.target.checked)} />
              No per-tx limit
            </label>
          </div>
        </div>

        {(app.allowed_actions.length > 0 || app.blocked_actions.length > 0) && (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-faint">Actions</span>
            <div className="flex flex-wrap gap-1.5">
              {app.allowed_actions.map((a) => (
                <span key={a} className="rounded-sm border border-line-strong bg-surface px-2 py-0.5 font-mono text-[11px] text-ink">
                  {a}
                </span>
              ))}
              {app.blocked_actions.map((a) => (
                <span key={a} className="rounded-sm border border-line px-2 py-0.5 font-mono text-[11px] text-faint line-through">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {(update.isError || revoke.isError) && (
          <p className="text-sm text-muted" role="alert">
            {((update.error || revoke.error) as RelayApiError)?.message ?? 'Action failed.'}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => revoke.mutate(undefined, { onSuccess: onClose })}
            disabled={revoke.isPending}
            className="cursor-pointer text-sm text-muted transition-colors duration-150 hover:text-danger disabled:opacity-50"
          >
            {revoke.isPending ? 'Revoking…' : 'Revoke access'}
          </button>
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
