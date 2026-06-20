/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_MCP_URL?: string;
  readonly VITE_PRIVY_APP_ID?: string;
  readonly VITE_KYC_SORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
