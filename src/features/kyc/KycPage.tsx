import { useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { Logo } from '../../components/brand/Logo';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { RelayApiError } from '../../api/errors';
import type { KycData, KycPictureType, KycStatus } from '../../api/kyc';
import { clearStoredKycUuid, getStoredKycUuid } from '../../lib/kycStorage';
import { useProfile } from '../dashboard/hooks';
import {
  useKycConfirm,
  useKycSetData,
  useKycStart,
  useKycStatus,
  useKycUploadPicture,
} from './hooks';
import { KycDataForm } from './KycDataForm';

type Step = 'intro' | 'data' | 'photos' | 'confirm' | 'status';

const STEPS: { key: Step; label: string }[] = [
  { key: 'data', label: 'Details' },
  { key: 'photos', label: 'Documents' },
  { key: 'confirm', label: 'Confirm' },
  { key: 'status', label: 'Status' },
];

const STATUS_COPY: Record<KycStatus, { title: string; body: string }> = {
  NEW: { title: 'Application created', body: 'Submit your details and documents to continue.' },
  COMPLETED: { title: 'Submitted', body: 'Your application is complete and awaiting review.' },
  UNDER_REVIEW: { title: 'Under review', body: 'CardsPro is reviewing your verification. This updates automatically.' },
  APPROVED: { title: 'Verified', body: 'You’re approved — you can now issue cards.' },
  DECLINED: { title: 'Declined', body: 'Your verification was declined.' },
  EXPIRED: { title: 'Expired', body: 'This application expired. Start a new one.' },
};

export function KycPage() {
  const profile = useProfile();
  const stored = getStoredKycUuid();
  const [uuid, setUuid] = useState<string | null>(stored);
  const [step, setStep] = useState<Step>(stored ? 'status' : 'intro');

  const start = useKycStart();
  const setData = useKycSetData(uuid);
  const confirm = useKycConfirm(uuid);

  const beginStart = () => {
    start.mutate(undefined, {
      onSuccess: (res) => {
        setUuid(res.uuid);
        setStep('data');
      },
    });
  };

  const restart = () => {
    clearStoredKycUuid();
    setUuid(null);
    setStep('intro');
  };

  const submitData = (data: KycData) => {
    setData.mutate(data, { onSuccess: () => setStep('photos') });
  };

  const doConfirm = () => {
    confirm.mutate(undefined, { onSuccess: () => setStep('status') });
  };

  return (
    <div className="relay-bg min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Logo size={28} />
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted transition-colors duration-150 hover:text-ink"
          >
            <ArrowLeft className="size-4" strokeWidth={2} aria-hidden="true" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16 pt-10">
        <div className="relay-rise">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Identity verification
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Relay requires an approved identity check before issuing a card.
          </p>
        </div>

        {/* stepper */}
        {step !== 'intro' && (
          <div className="relay-rise mt-7 flex items-center gap-2">
            {STEPS.map((s, i) => {
              const active = s.key === step;
              const done = STEPS.findIndex((x) => x.key === step) > i;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-2 rounded-sm border px-2.5 py-1 text-xs ${
                      active
                        ? 'border-line-strong bg-surface text-ink'
                        : 'border-line text-faint'
                    }`}
                  >
                    {done ? (
                      <Check className="size-3.5 text-ink" strokeWidth={2.5} aria-hidden="true" />
                    ) : (
                      <span className="font-mono">{i + 1}</span>
                    )}
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="relay-rise mt-6" style={{ animationDelay: '60ms' }}>
          {step === 'intro' && (
            <Panel className="p-8">
              <span className="flex size-12 items-center justify-center rounded-md border border-line text-ink">
                <ShieldCheck className="size-6" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-display text-xl font-semibold text-ink">Verify your identity</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                Takes a few minutes. You’ll enter your details, upload a photo ID,
                and submit for review.
              </p>
              <Button onClick={beginStart} disabled={start.isPending} className="mt-6">
                {start.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Start verification
              </Button>
              {start.isError && (
                <p className="mt-3 text-sm text-muted" role="alert">
                  {(start.error as RelayApiError)?.message ?? 'Couldn’t start verification.'}
                </p>
              )}
            </Panel>
          )}

          {step === 'data' && (
            <Panel className="p-8">
              <KycDataForm
                defaultEmail={profile.data?.email}
                pending={setData.isPending}
                error={setData.isError ? (setData.error as RelayApiError)?.message : null}
                onSubmit={submitData}
              />
            </Panel>
          )}

          {step === 'photos' && uuid && (
            <Panel className="p-8">
              <h2 className="font-display text-xl font-semibold text-ink">Upload your document</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Clear JPEG photos of the front and back of your ID. Avoid glare and crop to the document.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PhotoUpload uuid={uuid} type="document_front" label="Document front" />
                <PhotoUpload uuid={uuid} type="document_back" label="Document back" />
              </div>
              <Button onClick={() => setStep('confirm')} className="mt-7">
                Continue
              </Button>
            </Panel>
          )}

          {step === 'confirm' && (
            <Panel className="p-8 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-md border border-line text-ink">
                <FileText className="size-6" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-display text-xl font-semibold text-ink">Submit for review</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                Confirm to send your details and documents to CardsPro for verification.
              </p>
              <Button onClick={doConfirm} disabled={confirm.isPending} className="mt-6">
                {confirm.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Submit application
              </Button>
              {confirm.isError && (
                <p className="mt-3 text-sm text-muted" role="alert">
                  {(confirm.error as RelayApiError)?.message ?? 'Couldn’t submit.'}
                </p>
              )}
            </Panel>
          )}

          {step === 'status' && uuid && (
            <StatusView uuid={uuid} onRestart={restart} onRetry={doConfirm} retrying={confirm.isPending} />
          )}
        </div>
      </main>
    </div>
  );
}

function PhotoUpload({ uuid, type, label }: { uuid: string; type: KycPictureType; label: string }) {
  const upload = useKycUploadPicture(uuid);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const done = upload.isSuccess;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setFileName(f.name);
          upload.mutate({ type, file: f });
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex w-full cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed px-4 py-7 text-center transition-colors duration-150 ${
          done ? 'border-line-strong bg-surface' : 'border-line hover:bg-surface'
        }`}
      >
        {upload.isPending ? (
          <Loader2 className="size-6 animate-spin text-muted" aria-hidden="true" />
        ) : done ? (
          <Check className="size-6 text-ink" strokeWidth={2} aria-hidden="true" />
        ) : (
          <Upload className="size-6 text-muted" strokeWidth={1.75} aria-hidden="true" />
        )}
        <span className="text-sm text-ink">{label}</span>
        <span className="max-w-full truncate text-xs text-faint">
          {done ? (fileName ?? 'Uploaded') : upload.isPending ? 'Uploading…' : 'Choose JPEG'}
        </span>
      </button>
      {upload.isError && (
        <p className="mt-1.5 text-xs text-muted" role="alert">
          {(upload.error as RelayApiError)?.message ?? 'Upload failed.'}
        </p>
      )}
    </div>
  );
}

function StatusView({
  uuid,
  onRestart,
  onRetry,
  retrying,
}: {
  uuid: string;
  onRestart: () => void;
  onRetry: () => void;
  retrying: boolean;
}) {
  const status = useKycStatus(uuid);
  const data = status.data;

  // The async push to CardsPro failed after retries — surface the reason and let
  // the user re-submit (their details + photos are still buffered).
  const submitFailed = data?.submitStatus === 'failed';
  // The worker is still pushing the buffered application; CardsPro status reads
  // NEW until it confirms, so key the "in progress" copy off submitStatus.
  const pushing = data?.submitStatus === 'submitted' || data?.submitStatus === 'processing';

  const approved = data?.status === 'APPROVED';
  const failed = data?.status === 'DECLINED' || data?.status === 'EXPIRED';

  // Derive the card from the most specific state first.
  const copy: { title: string; body: string } | null = data
    ? submitFailed
      ? { title: 'Submission failed', body: 'We couldn’t send your verification to CardsPro. Review the reason below and try again.' }
      : pushing && !approved && !failed
        ? { title: 'Submitted', body: 'We’re sending your verification to CardsPro. This updates automatically.' }
        : STATUS_COPY[data.status]
    : null;

  const showError = submitFailed || failed;
  const reason = submitFailed ? data?.submitReason : data?.reason;
  const inReview = data && !approved && !showError;

  return (
    <Panel className="p-8 text-center">
      {status.isPending && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="size-6 animate-spin text-muted" aria-hidden="true" />
          <p className="text-sm text-muted">Checking status…</p>
        </div>
      )}
      {data && copy && (
        <>
          <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-line-strong bg-surface text-ink">
            {approved ? (
              <Check className="size-7" strokeWidth={2.25} aria-hidden="true" />
            ) : showError ? (
              <AlertTriangle className="size-6" strokeWidth={2} aria-hidden="true" />
            ) : (
              <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            )}
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold text-ink">{copy.title}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{copy.body}</p>
          {showError && reason && (
            <p className="mx-auto mt-3 max-w-sm rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink">
              {reason}
            </p>
          )}
          <div className="mt-6 flex items-center justify-center gap-3">
            {approved ? (
              <Link to="/dashboard" className="text-sm font-medium text-ink underline-offset-4 hover:underline">
                Back to dashboard →
              </Link>
            ) : submitFailed ? (
              <Button onClick={onRetry} disabled={retrying}>
                {retrying && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Try again
              </Button>
            ) : failed ? (
              <Button onClick={onRestart}>Start over</Button>
            ) : (
              <span className="flex items-center gap-2 text-xs text-faint">
                <ExternalLink className="size-3.5" aria-hidden="true" />
                Updates automatically — you can close this tab.
              </span>
            )}
          </div>
          {inReview && (
            <button
              type="button"
              onClick={onRestart}
              className="mt-4 cursor-pointer text-xs text-faint underline-offset-4 hover:text-muted hover:underline"
            >
              Start a new application
            </button>
          )}
        </>
      )}
    </Panel>
  );
}
