import { useCallback } from 'react';
import { useLogout as usePrivyLogout } from '@privy-io/react-auth';
import { useAuthContext } from './AuthProvider';

export function useLogout(): () => Promise<void> {
  const { logout: relayLogout } = useAuthContext();
  const { logout: privyLogout } = usePrivyLogout();

  return useCallback(async () => {
    await relayLogout();
    await privyLogout();
  }, [relayLogout, privyLogout]);
}
