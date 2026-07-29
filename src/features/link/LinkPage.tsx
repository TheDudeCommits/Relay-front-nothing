import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Link2, Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useAuthContext } from '../../auth/AuthProvider';
import { RelayApiError } from '../../api/errors';
import { Logo } from '../../components/brand/Logo';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';

// LinkPage handles the ACP → relay account-link flow. An ACP buyer agent reads
// the `account_link` resource, which returns https://relay.credit/link?token=…;
// the human opens it, signs in/up, and confirms — binding the agent's wallet to
// this relay account so its purchases issue cards here (with KYC + dashboard).
export function LinkPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { api } = useAuthContext();

  const token = params.get('token') ?? '';

  const confirm = useMutation({
    mutationFn: () => api.acp.confirmLink(token),
  });

  // Missing token → can't proceed.
  if (!token) {
    return (
      <Shell>
        <Centered>
          <Crest tone="error">
            <AlertTriangle className="size-6" strokeWidth={2} aria-hidden="true" />
          </Crest>
          <h1 className="font-display text-xl font-semibold text-ink">Invalid link</h1>
          <p className="max-w-xs text-sm text-muted">
            This account-link is missing its token. Re-open the link your agent gave you.
          </p>
        </Centered>
      </Shell>
    );
  }

  if (isLoading) {
    return (
      <Shell>
        <Centered>
          <Loader2 className="size-6 animate-spin text-muted" aria-hidden="true" />
        </Centered>
      </Shell>
    );
  }

  // Not signed in → bounce through login (sign in OR sign up), returning here.
  if (!isAuthenticated) {
    const returnTo = `/link?${params.toString()}`;
    return <Navigate to={`/login?return_to=${encodeURIComponent(returnTo)}`} replace />;
  }

  // Linked → success state with next steps.
  if (confirm.isSuccess) {
    return (
      <Shell>
        <Centered>
          <Crest tone="ok">
            <CheckCircle2 className="size-6" strokeWidth={1.75} aria-hidden="true" />
          </Crest>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Agent linked
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Your ACP agent is now connected to this Relay account. Open your dashboard to see
            your cards and verification status — if you still need to verify, you'll be prompted
            there.
          </p>
          <div className="mt-3 flex w-full flex-col gap-2.5">
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to dashboard
            </Button>
          </div>
        </Centered>
      </Shell>
    );
  }

  return (
    <Shell>
      <Centered>
        <Crest>
          <Link2 className="size-6" strokeWidth={1.75} aria-hidden="true" />
        </Crest>
        <p className="text-sm text-muted">Link your agent</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Relay</h1>
        <p className="max-w-xs text-sm leading-relaxed text-muted">
          Connect your ACP buyer agent to this Relay account. Once linked, the agent can buy and
          top up cards on your behalf — funded over ACP, owned by you here, with KYC and a
          dashboard.
        </p>

        <div className="mt-3 flex w-full flex-col gap-2.5">
          <Button onClick={() => confirm.mutate()} disabled={confirm.isPending} className="w-full">
            {confirm.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Link my agent
          </Button>
        </div>

        {confirm.isError && (
          <p className="text-sm text-muted" role="alert">
            {(confirm.error as RelayApiError)?.message ?? 'Linking failed.'}
          </p>
        )}
      </Centered>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relay-bg flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-5xl px-6 py-6">
        <Logo size={28} />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-8">
        <Panel className="relay-rise w-full max-w-md p-8">{children}</Panel>
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-center gap-3 text-center">{children}</div>;
}

function Crest({ children, tone }: { children: React.ReactNode; tone?: 'error' | 'ok' }) {
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
