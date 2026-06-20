interface LogoProps {
  /** Pixel size of the square mark. */
  size?: number;
  /** Show the "Relay" wordmark next to the mark. */
  withWordmark?: boolean;
  className?: string;
}

/**
 * Relay brand mark — a stylized signal/relay glyph (concentric arcs around a
 * core node), monochrome, plus an optional wordmark.
 */
export function Logo({ size = 32, withWordmark = true, className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        role="img"
        aria-label="Relay"
        className="shrink-0"
      >
        <rect x="1" y="1" width="30" height="30" rx="3" fill="#111111" stroke="rgba(255,255,255,0.2)" />
        <circle cx="16" cy="16" r="2.6" fill="#ffffff" />
        <path d="M10.2 21.8a8 8 0 0 1 0-11.6" stroke="#e8e8e8" strokeWidth="2" strokeLinecap="round" />
        <path d="M21.8 10.2a8 8 0 0 1 0 11.6" stroke="#999999" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {withWordmark && (
        <span className="font-display text-[1.3rem] font-semibold leading-none tracking-tight text-ink">
          Relay
        </span>
      )}
    </span>
  );
}
