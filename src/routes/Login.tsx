import { Navigate, useSearchParams } from 'react-router';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { useRelayLogin } from '../auth/useRelayLogin';
import { Logo } from '../components/brand/Logo';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { ConnectSection } from '../features/connect/ConnectSection';

function AgentPreview() {
  return (
    <Panel className="overflow-hidden">
      {/* terminal header — first dot is the lone red "live" signal */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-signal" />
          <span className="size-2.5 rounded-full border border-line" />
          <span className="size-2.5 rounded-full border border-line" />
        </span>
        <span className="ml-1 font-mono text-xs text-faint">relay — agent</span>
      </div>

      <div className="p-5">
        <p className="font-mono text-[12.5px] leading-relaxed text-ink/85">
          <span className="text-faint">$ </span>
          claude &quot;Buy me a $50 USD card&quot;
        </p>

        {/* virtual card — flat surface, no gradient */}
        <div className="mt-5 rounded-md border border-line bg-surface-2 p-4">
          <div className="flex items-center justify-between">
            <Logo size={20} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-faint">Virtual</span>
          </div>
          <p className="mt-6 font-mono text-base tracking-[0.18em] text-display">
            •••• •••• •••• 4242
          </p>
          <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-faint">
            <span>R. Agent</span>
            <span>VISA</span>
          </div>
        </div>

        {/* limit meter — segmented instrument gauge (4 of 25 = $8 / $50) */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono uppercase tracking-widest text-muted">Daily limit</span>
            <span className="font-mono text-ink/80">
              $8.00 <span className="text-faint">/ $50.00</span>
            </span>
          </div>
          <div
            className="relay-seg mt-2.5"
            style={{ gridTemplateColumns: 'repeat(25, 1fr)' }}
            aria-hidden="true"
          >
            {Array.from({ length: 25 }, (_, i) => (
              <i key={i} data-on={i < 4 ? 1 : 0} />
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-line pt-4 font-mono text-xs text-muted">
          <Check className="size-3.5 text-success" strokeWidth={2.5} aria-hidden="true" />
          Card issued · funded $50.00 · just now
        </div>
      </div>
    </Panel>
  );
}

export function Login() {
  const { isAuthenticated } = useAuth();
  const { startLogin, exchanging, error } = useRelayLogin();
  const [params] = useSearchParams();

  if (isAuthenticated) {
    // Honor an OAuth-bridge return_to, but only same-app relative paths.
    // Reject protocol-relative ("//host") and backslash ("/\\host") forms,
    // which browsers resolve as cross-origin (open-redirect).
    const returnTo = params.get('return_to');
    const isSafe =
      !!returnTo &&
      returnTo.startsWith('/') &&
      !returnTo.startsWith('//') &&
      !returnTo.startsWith('/\\');
    return <Navigate to={isSafe ? returnTo : '/dashboard'} replace />;
  }

  return (
    <div className="relay-bg flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-6xl px-6 py-6">
        <Logo size={28} />
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-14 px-6 pb-16 pt-8 lg:grid-cols-2 lg:gap-16 lg:pt-20">
        {/* Left — headline + sign in */}
        <section className="relay-rise">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
            Agent wallet
          </p>
          {/* The one dot-matrix moment — Doto, the Nothing signature */}
          <h1 className="mt-5 font-dot text-[2.9rem] font-medium leading-[0.98] tracking-[0.01em] text-display sm:text-6xl">
            Spending power for your agents.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
            Relay gives your AI agents crypto-funded cards with hard spending
            limits you control. Connect in one command, revoke anytime.
          </p>

          <div className="mt-8 flex flex-col items-start gap-3">
            <Button onClick={startLogin} disabled={exchanging} className="group min-w-56">
              {exchanging ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  Continue with Privy
                  <ArrowRight
                    className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </Button>
            <p className="text-xs text-faint">Email, passkey, social, or wallet.</p>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 max-w-md rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              {error.message}
            </p>
          )}
        </section>

        {/* Right — product preview */}
        <section className="relay-rise lg:pl-6" style={{ animationDelay: '80ms' }}>
          <AgentPreview />
        </section>
      </main>

      {/* Connect an agent — full section, moved here from the standalone page */}
      <ConnectSection />

      <footer className="mx-auto w-full max-w-6xl border-t border-line px-6 py-6">
        <p className="text-xs text-faint">Spending power for your agents.</p>
      </footer>
    </div>
  );
}
