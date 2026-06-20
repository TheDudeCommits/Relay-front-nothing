import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthContext } from '../../auth/AuthProvider';
import { KYC_TERMINAL, type KycData, type KycPictureType } from '../../api/kyc';
import { setStoredKycUuid } from '../../lib/kycStorage';

/** Canonical reference data (occupations, countries, …) for the funnel dropdowns. */
export function useKycReferences() {
  const { api } = useAuthContext();
  return useQuery({
    queryKey: ['kyc', 'references'],
    queryFn: () => api.kyc.references(),
    staleTime: 24 * 60 * 60 * 1000, // reference data is effectively static
  });
}

export function useKycStart() {
  const { api } = useAuthContext();
  return useMutation({
    mutationFn: () => api.kyc.start(),
    onSuccess: (res) => setStoredKycUuid(res.uuid),
  });
}

export function useKycSetData(uuid: string | null) {
  const { api } = useAuthContext();
  return useMutation({
    mutationFn: (data: KycData) => api.kyc.setData(uuid as string, data),
  });
}

export function useKycUploadPicture(uuid: string | null) {
  const { api } = useAuthContext();
  return useMutation({
    mutationFn: ({ type, file }: { type: KycPictureType; file: Blob }) =>
      api.kyc.uploadPicture(uuid as string, type, file),
  });
}

export function useKycConfirm(uuid: string | null) {
  const { api } = useAuthContext();
  return useMutation({
    mutationFn: () => api.kyc.confirm(uuid as string),
  });
}

/** Polls status while the application is non-terminal (NEW/COMPLETED/UNDER_REVIEW). */
export function useKycStatus(uuid: string | null, enabled = true) {
  const { api } = useAuthContext();
  return useQuery({
    queryKey: ['kyc', 'status', uuid],
    queryFn: () => api.kyc.statusByUuid(uuid as string),
    enabled: Boolean(uuid) && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling once verification is terminal or the async push failed
      // (a failed push won't advance on its own — the user must re-submit).
      if (data?.status && KYC_TERMINAL.includes(data.status)) return false;
      if (data?.submitStatus === 'failed') return false;
      return 5000;
    },
  });
}
