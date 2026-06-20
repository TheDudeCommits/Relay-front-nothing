import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyBlockProps {
  code: string;
  /** Optional caption shown above the code. */
  label?: string;
}

/** A terminal-style code line with a copy-to-clipboard button. */
export function CopyBlock({ code, label }: CopyBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div>
      {label && <p className="mb-1.5 text-xs text-faint">{label}</p>}
      <div className="group relative overflow-hidden rounded-md border border-line bg-black/40">
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy command'}
          className="absolute right-1.5 top-1.5 flex size-7 cursor-pointer items-center justify-center rounded-sm border border-line text-faint transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
        >
          {copied ? (
            <Check className="relay-pop size-3.5 text-ink" strokeWidth={2.25} aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" strokeWidth={2} aria-hidden="true" />
          )}
        </button>
        <pre className="overflow-x-auto px-3.5 py-3 pr-11 font-mono text-[12.5px] leading-relaxed text-ink/85">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
