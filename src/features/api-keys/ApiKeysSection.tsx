import { useState } from 'react';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/format';
import type { ApiKeySummary } from '../../api/api-keys';
import { useApiKeys, useDeleteApiKey } from './hooks';
import { CreateKeyModal } from './CreateKeyModal';

function maskHint(key: ApiKeySummary): string {
  return key.masked ?? (key.prefix ? `${key.prefix}…` : 'pb_live_••••••••');
}

function KeyRow({ apiKey }: { apiKey: ApiKeySummary }) {
  const del = useDeleteApiKey();
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line text-muted">
          <KeyRound className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-ink">{apiKey.name}</p>
          <p className="font-mono text-xs text-faint">
            {maskHint(apiKey)}
            {apiKey.created_at && ` · ${formatDate(apiKey.created_at)}`}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => del.mutate(apiKey.id)}
        disabled={del.isPending}
        aria-label="Revoke key"
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line text-muted transition-colors duration-150 hover:border-danger/40 hover:text-danger disabled:opacity-50"
      >
        <Trash2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}

export function ApiKeysSection() {
  const keys = useApiKeys();
  const [creating, setCreating] = useState(false);

  return (
    <section className="mt-9">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-faint">API keys</h2>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
          Create key
        </Button>
      </div>

      <Panel className="px-6 py-2">
        {keys.isPending && (
          <div className="flex flex-col gap-2 py-3">
            <div className="h-12 animate-pulse rounded-sm bg-surface-2" />
            <div className="h-12 animate-pulse rounded-sm bg-surface-2" />
          </div>
        )}
        {keys.isError && <p className="py-6 text-sm text-muted">Couldn’t load API keys.</p>}
        {keys.data && keys.data.length === 0 && (
          <p className="py-6 text-sm text-muted">
            No API keys. Create one for headless / CI connections.
          </p>
        )}
        {keys.data?.map((k) => (
          <KeyRow key={String(k.id)} apiKey={k} />
        ))}
      </Panel>

      <CreateKeyModal open={creating} onClose={() => setCreating(false)} />
    </section>
  );
}
