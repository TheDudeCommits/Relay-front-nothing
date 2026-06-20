import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { RelayApiError } from '../../api/errors';
import { useCreateApiKey } from './hooks';

export function CreateKeyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateApiKey();
  const [name, setName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const close = () => {
    setName('');
    setCreatedKey(null);
    create.reset();
    onClose();
  };

  const submit = () => {
    if (!name.trim()) return;
    create.mutate({ name: name.trim() }, { onSuccess: (res) => setCreatedKey(res.key) });
  };

  return (
    <Modal open={open} onClose={close} title={createdKey ? 'Save your API key' : 'Create API key'}>
      {createdKey ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-md border border-line-strong bg-surface px-3 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ink" strokeWidth={2} aria-hidden="true" />
            <p className="text-sm text-muted">
              This is the only time you’ll see this key. Copy and store it now.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-line bg-black/40 px-3 py-2.5">
            <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink">{createdKey}</code>
            <CopyButton value={createdKey} label="Copy API key" />
          </div>
          <Button onClick={close} className="self-end">
            Done
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-faint">Key name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="CI deploy bot"
              className="w-full rounded-md border border-line bg-black/40 px-3 py-2.5 text-sm text-ink placeholder:text-faint focus-visible:border-line-strong focus-visible:outline-none"
            />
          </label>
          {create.isError && (
            <p className="text-sm text-muted" role="alert">
              {(create.error as RelayApiError)?.message ?? 'Couldn’t create key.'}
            </p>
          )}
          <Button onClick={submit} disabled={!name.trim() || create.isPending} className="self-end">
            {create.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Create key
          </Button>
        </div>
      )}
    </Modal>
  );
}
