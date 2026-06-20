import { useCallback, useState } from 'react';
import { usePrivy, useLogin as usePrivyLogin } from '@privy-io/react-auth';
import { useAuthContext } from './AuthProvider';
import { RelayApiError } from '../api/errors';

export interface UseRelayLoginResult {
  /** Opens the Privy modal; the relay token exchange runs on completion. */
  startLogin: () => void;
  exchanging: boolean;
  error: RelayApiError | null;
}

/** Primary login: open Privy, then exchange the Privy token for a relay JWT. */
export function useRelayLogin(onSuccess?: () => void): UseRelayLoginResult {
  const { getAccessToken } = usePrivy();
  const { api, setAuthenticated } = useAuthContext();
  const [exchanging, setExchanging] = useState(false);
  const [error, setError] = useState<RelayApiError | null>(null);

  const exchange = useCallback(
    async (privyToken: string) => {
      setExchanging(true);
      setError(null);
      try {
        const res = await api.auth.exchangePrivy(privyToken);
        setAuthenticated(res.access_token);
        onSuccess?.();
      } catch (e) {
        setError(e instanceof RelayApiError ? e : new RelayApiError('Login failed', 0));
      } finally {
        setExchanging(false);
      }
    },
    [api, setAuthenticated, onSuccess],
  );

  const { login } = usePrivyLogin({
    onComplete: () => {
      void (async () => {
        const privyToken = await getAccessToken();
        if (!privyToken) {
          setError(new RelayApiError('No Privy token returned', 0));
          return;
        }
        await exchange(privyToken);
      })();
    },
  });

  const startLogin = useCallback(() => login(), [login]);

  return { startLogin, exchanging, error };
}
