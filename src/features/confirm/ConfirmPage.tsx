import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Check, Loader2, Mail } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useAuthContext } from '../../auth/AuthProvider';
import { useRelayLogin } from '../../auth/useRelayLogin';
import { RelayApiError } from '../../api/errors';
import { Logo } from '../../components/brand/Logo';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';

export function ConfirmPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { isAuthenticated, isLoading } = useAuth();
  const { startLogin, exchanging } = useRelayLogin();
  const { api } = useAuthContext();

  const confirm = useMutation({
    mutationFn: () => api.confirmations.confirm(token),
  });

  return (
    <div className="relay-bg flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-5xl px-6 py-6">
        <Logo size={28} />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-8">
        <Panel className="relay-rise w-full max-w-md p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            {!token ? (
              <>
                <Crest tone="error">
                  <AlertTriangle className="size-6" strokeWidth={2} aria-hidden="true" />
                </Crest>
                <h1 className="font-display text-xl font-semibold text-ink">Invalid link</h1>
                <p className="max-w-xs text-sm text-muted">This confirmation link is missing its token.</p>
              </>
            ) : confirm.isSuccess ? (
              <>
                <Crest>
                  <Check className="size-7" strokeWidth={2.25} aria-hidden="true" />
                </Crest>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                  Email confirmed
                </h1>
                <p className="max-w-xs text-sm leading-relaxed text-muted">
                  You can close this tab and return to your agent.
                </p>
              </>
            ) : isLoading ? (
              <Loader2 className="size-6 animate-spin text-muted" aria-hidden="true" />
            ) : !isAuthenticated ? (
              <>
                <Crest>
                  <Mail className="size-6" strokeWidth={1.75} aria-hidden="true" />
                </Crest>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                  Confirm your email
                </h1>
                <p className="max-w-xs text-sm leading-relaxed text-muted">
                  Verify it’s you to confirm this email for your agent.
                </p>
                <Button onClick={startLogin} disabled={exchanging} className="mt-2 w-full">
                  {exchanging ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Continue with Privy
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Crest>
                  <Mail className="size-6" strokeWidth={1.75} aria-hidden="true" />
                </Crest>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                  Confirm your email
                </h1>
                <p className="max-w-xs text-sm leading-relaxed text-muted">
                  Confirm to let your agent continue.
                </p>
                <Button
                  onClick={() => confirm.mutate()}
                  disabled={confirm.isPending}
                  className="mt-2 w-full"
                >
                  {confirm.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Confirm email
                </Button>
                {confirm.isError && (
                  <p className="text-sm text-muted" role="alert">
                    {(confirm.error as RelayApiError)?.message ?? 'Couldn’t confirm. The link may have expired.'}
                  </p>
                )}
              </>
            )}
          </div>
        </Panel>
      </main>
    </div>
  );
}

function Crest({ children, tone }: { children: React.ReactNode; tone?: 'error' }) {
  return (
    <span
      className={`mb-2 flex size-14 items-center justify-center rounded-full border bg-surface text-ink ${
        tone === 'error' ? 'border-line-strong' : 'border-line'
      }`}
    >
      {children}
    </span>
  );
}
