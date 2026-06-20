import { useState } from 'react';
import { Plug } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { formatMoney } from '../../lib/format';
import type { Authorization } from '../../api/authorizations';
import { useAuthorizations } from './hooks';
import { AuthorizationModal } from './AuthorizationModal';

function UsageBar({ used, limit }: { used: number; limit: number | null }) {
  if (limit === null) {
    return <p className="mt-2 text-xs text-faint">No daily limit</p>;
  }
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">Today</span>
        <span className="font-mono text-ink/80">
          {formatMoney(used)} / {formatMoney(limit)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-ink/70" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AppCard({ app, onManage }: { app: Authorization; onManage: () => void }) {
  const revoked = app.revoked_at !== null;
  return (
    <Panel className={`p-5 ${revoked ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-ink">{app.display_name}</p>
          <p className="mt-0.5 text-xs text-faint">
            {revoked ? 'Revoked' : `${app.lifetime_tx_count} txns · ${formatMoney(app.lifetime_usd)} lifetime`}
          </p>
        </div>
        {!revoked && (
          <Button variant="secondary" size="sm" onClick={onManage}>
            Manage
          </Button>
        )}
      </div>
      {!revoked && <UsageBar used={app.today_usd} limit={app.daily_limit_usd} />}
      {!revoked && (
        <p className="mt-3 text-xs text-faint">
          Per-tx limit: {app.per_tx_limit_usd === null ? 'none' : formatMoney(app.per_tx_limit_usd)}
        </p>
      )}
    </Panel>
  );
}

export function ConnectedAppsSection() {
  const apps = useAuthorizations();
  const [selected, setSelected] = useState<Authorization | null>(null);

  return (
    <section className="mt-9">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-faint">
        Connected apps
      </h2>

      {apps.isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-28 animate-pulse rounded-md bg-surface-2" />
          <div className="h-28 animate-pulse rounded-md bg-surface-2" />
        </div>
      )}
      {apps.isError && (
        <Panel className="p-6">
          <p className="text-sm text-muted">Couldn’t load connected apps.</p>
        </Panel>
      )}
      {apps.data && apps.data.length === 0 && (
        <Panel className="flex flex-col items-center gap-2 p-8 text-center">
          <Plug className="size-5 text-muted" strokeWidth={1.75} aria-hidden="true" />
          <p className="text-sm text-muted">No connected apps yet. Authorize an agent to see it here.</p>
        </Panel>
      )}
      {apps.data && apps.data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {apps.data.map((app) => (
            <AppCard key={app.id} app={app} onManage={() => setSelected(app)} />
          ))}
        </div>
      )}

      <AuthorizationModal app={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
