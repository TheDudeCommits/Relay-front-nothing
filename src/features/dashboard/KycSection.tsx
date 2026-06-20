import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { getStoredKycUuid } from '../../lib/kycStorage';
import { useKycStatus } from '../kyc/hooks';

/**
 * Prominent dashboard entry point to the KYC funnel. Always rendered for
 * un-approved users (including fresh sessions with no stored application) so the
 * verification flow is discoverable — approved users see the "Identity verified"
 * chip in Overview instead. Reflects the async submit pipeline (submitted /
 * processing / failed) so a stuck push surfaces here, not just inside /kyc.
 */
export function KycSection() {
  const navigate = useNavigate();
  const uuid = getStoredKycUuid();
  const kyc = useKycStatus(uuid, Boolean(uuid));
  const data = kyc.data;

  if (data?.status === 'APPROVED') return null; // shown as a chip in Overview

  const submitFailed = data?.submitStatus === 'failed';
  const declined = data?.status === 'DECLINED' || data?.status === 'EXPIRED';
  const pushing = data?.submitStatus === 'submitted' || data?.submitStatus === 'processing';
  const inReview =
    Boolean(data) &&
    !submitFailed &&
    !declined &&
    (pushing || data?.status === 'UNDER_REVIEW' || data?.status === 'COMPLETED');

  let Icon = ShieldCheck;
  let title = 'Verify your identity';
  let body = 'Relay requires an approved identity check before you can issue a card.';
  let cta = 'Start verification';

  if (submitFailed) {
    Icon = AlertTriangle;
    title = 'Verification needs attention';
    body = data?.submitReason || 'Your submission couldn’t be sent. Open it to try again.';
    cta = 'Resume';
  } else if (declined) {
    Icon = AlertTriangle;
    title = 'Verification declined';
    body = data?.reason || 'Start a new verification to try again.';
    cta = 'Start over';
  } else if (inReview) {
    Icon = Loader2;
    title = 'Verification in progress';
    body = 'We’re reviewing your verification — this updates automatically.';
    cta = 'View status';
  }

  return (
    <Panel
      className="relay-rise mt-5 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
      style={{ animationDelay: '75ms' }}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-line text-ink">
          <Icon
            className={`size-5 ${inReview ? 'animate-spin' : ''}`}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </span>
        <div>
          <h3 className="text-sm font-medium text-ink">{title}</h3>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">{body}</p>
        </div>
      </div>
      <Button onClick={() => navigate('/kyc')} className="shrink-0">
        {cta}
      </Button>
    </Panel>
  );
}
