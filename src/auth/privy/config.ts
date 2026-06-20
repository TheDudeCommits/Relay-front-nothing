import type { PrivyClientConfig } from '@privy-io/react-auth';

export function buildPrivyConfig(): PrivyClientConfig {
  return {
    loginMethods: ['email', 'wallet', 'google', 'apple'],
    appearance: { theme: 'light', walletChainType: 'ethereum-and-solana' },
    embeddedWallets: {
      ethereum: { createOnLogin: 'users-without-wallets' },
      solana: { createOnLogin: 'users-without-wallets' },
    },
  };
}
