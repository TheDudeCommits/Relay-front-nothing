import { Navigate, useSearchParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useAuthContext } from '../../auth/AuthProvider';
import { RelayApiError } from '../../api/errors';
import { Logo } from '../../components/brand/Logo';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';

function buildRedirect(redirectUri: string, params: Record<string, string>): string | null {
  try {
    const url = new URL(redirectUri);
    // Only http(s) (http allowed for localhost dev). Blocks javascript:/data: XSS
    // and other schemes from a malicious redirect_uri query param.
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) return null;
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url.toString();
  } catch {
    return null;
  }
}

export function AuthorizePage() {
  const [params] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { api } = useAuthContext();

  const clientId = params.get('client_id') ?? '';
  const redirectUri = params.get('redirect_uri') ?? '';
  const codeChallenge = params.get('code_challenge') ?? '';
  const codeChallengeMethod = params.get('code_challenge_method') ?? 'S256';
  const state = params.get('state') ?? '';

  const issue = useMutation({
    mutationFn: () =>
      api.oauth.issueCode({
        client_id: clientId,
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod,
      }),
    onSuccess: ({ code }) => {
      const url = buildRedirect(redirectUri, state ? { code, state } : { code });
      if (url) window.location.href = url;
    },
  });

  const deny = () => {
    const url = buildRedirect(
      redirectUri,
      state ? { error: 'access_denied', state } : { error: 'access_denied' },
    );
    if (url) window.location.href = url;
  };

  // Missing required params → can't proceed.
  if (!clientId || !redirectUri) {
    return (
      <Shell>
        <Centered>
          <Crest tone="error">
            <AlertTriangle className="size-6" strokeWidth={2} aria-hidden="true" />
          </Crest>
          <h1 className="font-display text-xl font-semibold text-ink">Invalid request</h1>
          <p className="max-w-xs text-sm text-muted">
            This authorization link is missing required parameters.
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

  if (!isAuthenticated) {
    const returnTo = `/authorize?${params.toString()}`;
    return <Navigate to={`/login?return_to=${encodeURIComponent(returnTo)}`} replace />;
  }

  let redirectHost = redirectUri;
  try {
    redirectHost = new URL(redirectUri).host;
  } catch {
    /* keep raw */
  }

  return (
    <Shell>
      <Centered>
        <Crest>
          <ShieldCheck className="size-6" strokeWidth={1.75} aria-hidden="true" />
        </Crest>
        <p className="text-sm text-muted">Authorize access</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{clientId}</h1>
        <p className="max-w-xs text-sm leading-relaxed text-muted">
          This app will be able to act on your Relay account within your spending
          limits. You can revoke it anytime from your dashboard.
        </p>
        <p className="font-mono text-xs text-faint">redirects to {redirectHost}</p>

        <div className="mt-3 flex w-full flex-col gap-2.5">
          <Button onClick={() => issue.mutate()} disabled={issue.isPending} className="w-full">
            {issue.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Allow access
          </Button>
          <Button variant="secondary" onClick={deny} disabled={issue.isPending} className="w-full">
            Deny
          </Button>
        </div>

        {issue.isError && (
          <p className="text-sm text-muted" role="alert">
            {(issue.error as RelayApiError)?.message ?? 'Authorization failed.'}
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
