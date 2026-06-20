import type { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { config } from '../../config';
import { buildPrivyConfig } from './config';

export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  // Privy needs the real relay app ID (from backend ops). Show a clear config
  // message rather than crashing when it isn't set.
  if (!config.privyAppId) {
    return (
      <div className="relay-bg flex min-h-dvh items-center justify-center p-6 text-center">
        <p className="max-w-md text-sm leading-relaxed text-muted">
          Set <code className="text-accent">VITE_PRIVY_APP_ID</code> (the relay
          Privy app ID from backend ops) in{' '}
          <code className="text-accent">.env.local</code> to start the app.
        </p>
      </div>
    );
  }

  return (
    <PrivyProvider appId={config.privyAppId} config={buildPrivyConfig()}>
      {children}
    </PrivyProvider>
  );
}
