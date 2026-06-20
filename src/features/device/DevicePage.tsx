import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Check, Loader2, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useAuthContext } from '../../auth/AuthProvider';
import { useRelayLogin } from '../../auth/useRelayLogin';
import { normalizeUserCode } from '../../lib/userCode';
import { RelayApiError } from '../../api/errors';
import type { DeviceLookupResponse } from '../../api/device';
import { Logo } from '../../components/brand/Logo';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';

type Phase =
  | 'enter'
  | 'looking'
  | 'ready'
  | 'approving'
  | 'denying'
  | 'approved'
  | 'denied'
  | 'error';

export function DevicePage() {
  const [params] = useSearchParams();
  const initialCode = params.get('user_code') ?? '';

  const { isAuthenticated } = useAuth();
  const { api } = useAuthContext();
  const { startLogin, exchanging } = useRelayLogin();

  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>(initialCode ? 'looking' : 'enter');
  const [lookup, setLookup] = useState<DeviceLookupResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const runLookup = useCallback(
    async (raw: string) => {
      const c = normalizeUserCode(raw);
      if (!c) return;
      setCode(c);
      setPhase('looking');
      setMessage(null);
      try {
        const res = await api.device.lookup(c);
        if (res.is_expired) {
          setMessage('That code has expired. Restart the flow in your agent.');
          setPhase('error');
        } else if (res.status !== 'pending') {
          setMessage(`That code is already ${res.status}.`);
          setPhase('error');
        } else {
          setLookup(res);
          setPhase('ready');
        }
      } catch (e) {
        const err = e instanceof RelayApiError ? e : null;
        setMessage(
          err?.status === 404
            ? `No pending request found for ${c}.`
            : (err?.message ?? 'Something went wrong looking up that code.'),
        );
        setPhase('error');
      }
    },
    [api],
  );

  const auto = useRef(false);
  useEffect(() => {
    if (auto.current) return;
    auto.current = true;
    if (initialCode) void runLookup(initialCode);
  }, [initialCode, runLookup]);

  const approve = async () => {
    setPhase('approving');
    try {
      await api.device.approve(code);
      setPhase('approved');
    } catch (e) {
      setMessage(e instanceof RelayApiError ? e.message : 'Approval failed.');
      setPhase('error');
    }
  };

  const deny = async () => {
    setPhase('denying');
    try {
      await api.device.deny(code);
      setPhase('denied');
    } catch (e) {
      setMessage(e instanceof RelayApiError ? e.message : 'Denial failed.');
      setPhase('error');
    }
  };

  const reset = () => {
    setPhase('enter');
    setInput('');
    setMessage(null);
    setLookup(null);
  };

  return (
    <div className="relay-bg flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-5xl px-6 py-6">
        <Logo size={28} />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-8">
        <Panel className="relay-rise w-full max-w-md p-8">
          {phase === 'enter' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runLookup(input);
              }}
            >
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                Authorize a device
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Enter the code your agent displayed to connect it to your Relay
                account.
              </p>
              <label htmlFor="user_code" className="mt-6 block text-xs text-faint">
                Device code
              </label>
              <input
                id="user_code"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
                autoFocus
                placeholder="WDJB-MJHT"
                className="mt-1.5 w-full rounded-md border border-line bg-black/40 px-4 py-3 text-center font-mono text-lg uppercase tracking-[0.3em] text-ink placeholder:tracking-normal placeholder:text-faint focus-visible:border-line-strong focus-visible:outline-none"
              />
              <Button type="submit" disabled={!input.trim()} className="mt-5 w-full">
                Look up code
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </form>
          )}

          {phase === 'looking' && (
            <Centered>
              <Loader2 className="size-6 animate-spin text-muted" aria-hidden="true" />
              <p className="text-sm text-muted" role="status">
                Looking up your code…
              </p>
            </Centered>
          )}

          {phase === 'ready' && lookup && (
            <div className="text-center">
              <Crest />
              <p className="mt-5 text-sm text-muted">Authorize this agent</p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
                {lookup.client_name}
              </h1>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">
                It will be able to act on your Relay account within the spending
                limits you set. You can revoke access anytime.
              </p>

              {isAuthenticated ? (
                <div className="mt-7 flex flex-col gap-2.5">
                  <Button onClick={() => void approve()} className="w-full">
                    <ShieldCheck className="size-4" strokeWidth={2} aria-hidden="true" />
                    Approve {lookup.client_name}
                  </Button>
                  <Button variant="secondary" onClick={() => void deny()} className="w-full">
                    Deny
                  </Button>
                </div>
              ) : (
                <div className="mt-7">
                  <Button onClick={startLogin} disabled={exchanging} className="w-full">
                    {exchanging ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        Sign in to continue
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                  <p className="mt-3 text-xs text-faint">
                    Sign in to review and approve this request.
                  </p>
                </div>
              )}
            </div>
          )}

          {(phase === 'approving' || phase === 'denying') && (
            <Centered>
              <Loader2 className="size-6 animate-spin text-muted" aria-hidden="true" />
              <p className="text-sm text-muted" role="status">
                {phase === 'approving' ? 'Approving…' : 'Denying…'}
              </p>
            </Centered>
          )}

          {phase === 'approved' && (
            <Centered>
              <StatusIcon>
                <Check className="size-7" strokeWidth={2.25} aria-hidden="true" />
              </StatusIcon>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                You’re all set
              </h1>
              <p className="max-w-xs text-sm leading-relaxed text-muted">
                {lookup ? `${lookup.client_name} is authorized. ` : ''}You can
                close this tab and return to your agent.
              </p>
            </Centered>
          )}

          {phase === 'denied' && (
            <Centered>
              <StatusIcon>
                <X className="size-7" strokeWidth={2.25} aria-hidden="true" />
              </StatusIcon>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                Request denied
              </h1>
              <p className="max-w-xs text-sm leading-relaxed text-muted">
                No access was granted. You can close this tab.
              </p>
            </Centered>
          )}

          {phase === 'error' && (
            <Centered>
              <StatusIcon>
                <AlertTriangle className="size-6" strokeWidth={2} aria-hidden="true" />
              </StatusIcon>
              <p className="max-w-xs text-sm leading-relaxed text-muted" role="alert">
                {message}
              </p>
              <Button variant="secondary" onClick={reset}>
                Enter another code
              </Button>
            </Centered>
          )}
        </Panel>
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-center gap-4 py-2 text-center">{children}</div>;
}

function StatusIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-14 items-center justify-center rounded-full border border-line-strong bg-surface text-ink">
      {children}
    </span>
  );
}

function Crest() {
  return (
    <div className="relative mx-auto flex size-20 items-center justify-center">
      <span
        className="relay-spin absolute inset-0 rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.55), transparent 35%)',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))',
          WebkitMask:
            'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))',
        }}
        aria-hidden="true"
      />
      <span className="flex size-14 items-center justify-center rounded-full border border-line bg-surface">
        <Logo size={28} withWordmark={false} />
      </span>
    </div>
  );
}
