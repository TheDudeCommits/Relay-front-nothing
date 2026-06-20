import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Panel } from './Panel';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <Panel className="relay-rise relative z-10 w-full max-w-md p-6">
        <div className="flex items-center justify-between gap-4">
          {title && (
            <h3 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h3>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto flex size-8 cursor-pointer items-center justify-center rounded-md border border-line text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </Panel>
    </div>
  );
}
