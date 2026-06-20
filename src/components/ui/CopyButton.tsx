import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  value: string;
  label?: string;
}

/** Icon-only copy-to-clipboard button. */
export function CopyButton({ value, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : label}
      className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-line text-faint transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
    >
      {copied ? (
        <Check className="relay-pop size-3.5 text-ink" strokeWidth={2.25} aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  );
}
