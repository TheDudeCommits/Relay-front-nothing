import type { HTMLAttributes, ReactNode } from 'react';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Flat elevated surface: solid fill, hairline border, sharp corners. */
export function Panel({ children, className, ...rest }: PanelProps) {
  return (
    <div
      className={['rounded-md border border-line bg-surface', className ?? ''].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
