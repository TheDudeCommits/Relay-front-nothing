import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../../auth/AuthProvider';
import type { CreateApiKeyRequest } from '../../api/api-keys';

const KEY = ['api-keys'] as const;

export function useApiKeys() {
  const { api } = useAuthContext();
  return useQuery({ queryKey: KEY, queryFn: () => api.apiKeys.list() });
}

export function useCreateApiKey() {
  const { api } = useAuthContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateApiKeyRequest) => api.apiKeys.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteApiKey() {
  const { api } = useAuthContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.apiKeys.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
