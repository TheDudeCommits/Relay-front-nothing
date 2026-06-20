import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../../auth/AuthProvider';
import type { UpdateAuthorizationRequest } from '../../api/authorizations';

const KEY = ['authorizations'] as const;

export function useAuthorizations() {
  const { api } = useAuthContext();
  return useQuery({ queryKey: KEY, queryFn: () => api.authorizations.list() });
}

export function useAuthorizationMutations(id: number) {
  const { api } = useAuthContext();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: KEY });

  const update = useMutation({
    mutationFn: (body: UpdateAuthorizationRequest) => api.authorizations.update(id, body),
    onSuccess: invalidate,
  });
  const revoke = useMutation({
    mutationFn: () => api.authorizations.revoke(id),
    onSuccess: invalidate,
  });

  return { update, revoke };
}
