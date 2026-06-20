import { useNavigate } from 'react-router-dom';
import { Check, ShieldCheck } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { formatMoney } from '../../lib/format';
import { getStoredKycUuid } from '../../lib/kycStorage';
import { useBalance, useProfile } from './hooks';
import { useKycStatus } from '../kyc/hooks';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-sm bg-surface-2 ${className ?? ''}`} />;
}

export function Overview() {
  const navigate = useNavigate();
  const profile = useProfile();
  const balance = useBalance();

  const kycUuid = getStoredKycUuid();
  const kyc = useKycStatus(kycUuid, Boolean(kycUuid));
  const approved = kyc.data?.status === 'APPROVED';

  return (
    <>
      {/* Balance hero */}
      <Panel className="relay-rise mt-6 p-7 sm:p-8" style={{ animationDelay: '60ms' }}>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm text-muted">Total balance</p>
            {profile.isPending ? (
              <Skeleton className="mt-3 h-11 w-44" />
            ) : (
              <p className="mt-2 font-display text-5xl font-semibold tracking-tight text-ink">
                {formatMoney(profile.data?.total_balance ?? '0')}
              </p>
            )}

            {balance.data && balance.data.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {balance.data.map((row) => (
                  <span
                    key={row.currency}
                    className="rounded-sm border border-line px-2.5 py-1 font-mono text-xs text-muted"
                  >
                    {formatMoney(row.balance, row.currency)}
                  </span>
                ))}
              </div>
            )}

            {approved ? (
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-sm border border-line-strong bg-surface px-2.5 py-1 text-xs text-ink">
                <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                Identity verified
              </span>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/kyc')}
                className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-line px-2.5 py-1 text-xs text-muted transition-colors duration-150 hover:bg-surface hover:text-ink"
              >
                <ShieldCheck className="size-3.5" strokeWidth={2} aria-hidden="true" />
                Verify your identity
              </button>
            )}
          </div>
        </div>
      </Panel>
    </>
  );
}
