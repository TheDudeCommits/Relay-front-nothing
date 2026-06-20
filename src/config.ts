export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://api.relay.credit',
  mcpUrl: import.meta.env.VITE_MCP_URL ?? 'https://mcp.relay.credit',
  privyAppId: import.meta.env.VITE_PRIVY_APP_ID ?? '',
  kycSort: import.meta.env.VITE_KYC_SORT ?? '',
} as const;
