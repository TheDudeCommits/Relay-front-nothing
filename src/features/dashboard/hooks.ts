import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../../auth/AuthProvider';

export const qk = {
  profile: ['me'] as const,
  balance: ['balance'] as const,
  depositAddresses: ['deposit-addresses'] as const,
  cards: ['cards'] as const,
  card: (id: string) => ['cards', id] as const,
  transactions: (page: number, size: number) => ['transactions', page, size] as const,
};

export function useProfile() {
  const { api } = useAuthContext();
  return useQuery({ queryKey: qk.profile, queryFn: () => api.me.get() });
}

export function useBalance() {
  const { api } = useAuthContext();
  return useQuery({ queryKey: qk.balance, queryFn: () => api.balance.list() });
}

export function useDepositAddresses() {
  const { api } = useAuthContext();
  return useQuery({ queryKey: qk.depositAddresses, queryFn: () => api.depositAddresses.list() });
}

export function useCards() {
  const { api } = useAuthContext();
  return useQuery({ queryKey: qk.cards, queryFn: () => api.cards.list() });
}

/** Card detail includes PAN/CVV — sensitive, so don't keep it cached. */
export function useCardDetail(cardId: string | null) {
  const { api } = useAuthContext();
  return useQuery({
    queryKey: cardId ? qk.card(cardId) : ['cards', 'none'],
    queryFn: () => api.cards.get(cardId as string),
    enabled: Boolean(cardId),
    gcTime: 0,
    staleTime: 0,
  });
}

export function useTransactions(page: number, size = 20) {
  const { api } = useAuthContext();
  return useQuery({
    queryKey: qk.transactions(page, size),
    queryFn: () => api.transactions.list({ page, size }),
  });
}

export function useCardMutations(cardId: string | null) {
  const { api } = useAuthContext();
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: qk.cards });
    if (cardId) void queryClient.invalidateQueries({ queryKey: qk.card(cardId) });
    void queryClient.invalidateQueries({ queryKey: qk.profile });
  };

  const freeze = useMutation({
    mutationFn: () => api.cards.freeze(cardId as string),
    onSuccess: invalidate,
  });
  const unfreeze = useMutation({
    mutationFn: () => api.cards.unfreeze(cardId as string),
    onSuccess: invalidate,
  });

  return { freeze, unfreeze };
}
