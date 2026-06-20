# Relay Foundation & Auth — Implementation Plan (Demo)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Demo scope:** This is a throwaway demo. No automated tests, minimal tooling, simplest-thing-that-works. Verification is `npm run build` + a manual boot. Privy is the only auth method.

**Goal:** Stand up a clean-slate Vite + React SPA for Relay with a small typed API-client base, axios bearer+refresh interceptors, Privy login, and an in-memory relay-JWT session — runnable end-to-end (mocked or live).

**Architecture:** Feature-sliced SPA. A `config` module holds hosts/ids from env. A thin API layer (`src/api/`) wraps one axios instance whose interceptors attach the bearer token and do a one-shot `401 → /auth/refresh → retry`. Auth state lives in a zustand token store + an `AuthProvider` that bootstraps via silent refresh on load and exposes Privy login/logout. A dev-only mock toggle lets the app run before backend creds exist.

**Tech Stack:** npm · Vite 6 · React 19 + TypeScript ~5.7 · React Router 7 · Tailwind v4 (`@tailwindcss/vite`) · TanStack Query 5 · zustand 5 · `@privy-io/react-auth` 3 · axios 1.7. (No test libs — demo.)

**Spec:** `docs/superpowers/specs/2026-06-16-relay-frontend-design.md`. This plan implements the scaffold, auth/token model (Privy path only), and the base of the API-client layer. Later plans build the screens.

**Conventions:** Work at the `relay-new-demo/` root. Commit messages must not mention any AI tool. One commit per task.

---

## File Structure (this plan)

```
relay-new-demo/
  package.json  tsconfig.json  tsconfig.node.json  vite.config.ts  index.html
  .env.example  .gitignore
  src/
    main.tsx                 # provider tree + router mount
    App.tsx                  # RouterProvider
    index.css                # @import "tailwindcss";
    vite-env.d.ts            # ImportMetaEnv typing
    config.ts                # env-derived hosts/ids/flags
    api/
      errors.ts              # RelayApiError + normalizeError
      http.ts                # createHttp(bridge): axios instance + interceptors
      auth.ts                # createAuthApi(http) + refreshAccessToken() + auth types
      client.ts              # createRelayApi(): live-vs-mock selector
      mocks/auth.ts          # dev-only auth mock
    auth/
      token-store.ts         # zustand token store + getAccessToken/setAccessToken
      AuthProvider.tsx       # context: status, api, setAuthenticated, logout, bootstrap
      useAuth.ts             # status/isAuthenticated/isLoading
      useRelayLogin.ts       # Privy login -> exchange -> session
      useLogout.ts
      privy/
        config.ts            # buildPrivyConfig()
        PrivyAuthProvider.tsx
    routes/
      router.tsx             # createBrowserRouter table
      ProtectedRoute.tsx     # gate on auth status
      Login.tsx              # placeholder login page (real UI later)
      Dashboard.tsx          # placeholder authed page
```

---

## Task 1: Scaffold project

**Files:** Create `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/index.css`, `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "relay-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@privy-io/react-auth": "^3.18.0",
    "@tanstack/react-query": "^5.96.0",
    "axios": "^1.7.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "typescript": "~5.7.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Relay</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `.gitignore`**

```gitignore
node_modules
dist
.env
.env.local
*.local
.DS_Store
```

- [ ] **Step 7: Create `src/index.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 8: Create `src/App.tsx`** (temporary; replaced in Task 6)

```tsx
export default function App() {
  return <div className="p-6 text-lg">Relay — booting…</div>;
}
```

- [ ] **Step 9: Create `src/main.tsx`** (temporary; replaced in Task 6)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 10: Install dependencies**

Run: `npm install`
Expected: completes without error; `node_modules/` created.

- [ ] **Step 11: Verify it builds and boots**

Run: `npm run build`
Expected: PASS — `tsc -b` reports no errors and `dist/` is produced. (Optional: `npm run dev` shows "Relay — booting…".)

- [ ] **Step 12: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold relay vite+react+ts app"
```

---

## Task 2: Config & environment

**Files:** Create `src/config.ts`, `src/vite-env.d.ts`, `.env.example`

- [ ] **Step 1: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_MCP_URL?: string;
  readonly VITE_PRIVY_APP_ID?: string;
  readonly VITE_KYC_SORT?: string;
  readonly VITE_USE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 2: Create `src/config.ts`**

```ts
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://api.relay.credit',
  mcpUrl: import.meta.env.VITE_MCP_URL ?? 'https://mcp.relay.credit',
  privyAppId: import.meta.env.VITE_PRIVY_APP_ID ?? '',
  kycSort: import.meta.env.VITE_KYC_SORT ?? '',
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
} as const;
```

- [ ] **Step 3: Create `.env.example`**

```bash
# Hosts (defaults applied in config.ts if unset)
VITE_API_BASE_URL=https://api.relay.credit
VITE_MCP_URL=https://mcp.relay.credit

# From backend ops (§5) — required to run against the live backend:
VITE_PRIVY_APP_ID=
VITE_KYC_SORT=S00

# Set true to run the whole UI against the in-repo mock layer (no backend needed):
VITE_USE_MOCKS=true
```

- [ ] **Step 4: Type-check**

Run: `npx tsc -b`
Expected: PASS (no type errors).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add env-driven config module"
```

---

## Task 3: API base (errors + http client)

**Files:** Create `src/api/errors.ts`, `src/api/http.ts`

- [ ] **Step 1: Create `src/api/errors.ts`**

```ts
import { AxiosError } from 'axios';

/** Uniform error for all /v1/relay/* calls — carries the HTTP status and the backend `{ message }`. */
export class RelayApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'RelayApiError';
    this.status = status;
  }
}

export function normalizeError(error: unknown): RelayApiError {
  if (error instanceof RelayApiError) return error;

  const axiosErr = error as AxiosError<{ message?: string }>;
  if (axiosErr?.isAxiosError) {
    const status = axiosErr.response?.status ?? 0;
    const message =
      axiosErr.response?.data?.message ?? axiosErr.message ?? 'Request failed';
    return new RelayApiError(message, status);
  }

  return new RelayApiError(
    error instanceof Error ? error.message : 'Unknown error',
    0,
  );
}
```

- [ ] **Step 2: Create `src/api/http.ts`**

```ts
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { config } from '../config';
import { normalizeError } from './errors';

/** Wiring the HTTP layer needs from the auth layer. */
export interface AuthBridge {
  getToken: () => string | null;
  setToken: (token: string | null) => void;
  /** Resolves to a fresh access token, or null if refresh failed. Must NOT use this instance. */
  refresh: () => Promise<string | null>;
  onAuthFailure: () => void;
}

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export function createHttp(bridge: AuthBridge): AxiosInstance {
  const instance = axios.create({
    baseURL: config.apiBaseUrl,
    withCredentials: true, // send/receive the HttpOnly refresh cookie
  });

  instance.interceptors.request.use((req) => {
    const token = bridge.getToken();
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  });

  let refreshing: Promise<string | null> | null = null;

  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as RetryableConfig | undefined;

      if (error.response?.status === 401 && original && !original._retried) {
        original._retried = true;
        try {
          refreshing = refreshing ?? bridge.refresh();
          const newToken = await refreshing;
          refreshing = null;
          if (newToken) {
            bridge.setToken(newToken);
            original.headers.Authorization = `Bearer ${newToken}`;
            return instance(original);
          }
        } catch {
          refreshing = null;
        }
        bridge.onAuthFailure();
      }

      return Promise.reject(normalizeError(error));
    },
  );

  return instance;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add http client with bearer + 401-refresh interceptors"
```

---

## Task 4: Auth data layer (token store, auth API, mock selector)

**Files:** Create `src/auth/token-store.ts`, `src/api/auth.ts`, `src/api/mocks/auth.ts`, `src/api/client.ts`

- [ ] **Step 1: Create `src/auth/token-store.ts`**

```ts
import { create } from 'zustand';

const STORAGE_KEY = 'relay.access_token';

interface AuthTokenState {
  token: string | null;
  setToken: (token: string | null) => void;
}

function readInitial(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export const useAuthTokenStore = create<AuthTokenState>((set) => ({
  token: readInitial(),
  setToken: (token) => {
    if (typeof sessionStorage !== 'undefined') {
      if (token) sessionStorage.setItem(STORAGE_KEY, token);
      else sessionStorage.removeItem(STORAGE_KEY);
    }
    set({ token });
  },
}));

/** Non-React accessors for the axios bridge. */
export const getAccessToken = (): string | null =>
  useAuthTokenStore.getState().token;

export const setAccessToken = (token: string | null): void =>
  useAuthTokenStore.getState().setToken(token);
```

- [ ] **Step 2: Create `src/api/auth.ts`** (Privy path only)

```ts
import axios, { type AxiosInstance } from 'axios';
import { config } from '../config';
import { normalizeError } from './errors';

export interface ExchangeUser {
  id: string;
  email?: string | null;
  [key: string]: unknown;
}

export interface AuthResponse {
  access_token: string;
  expires_in: number;
  user?: ExchangeUser;
}

export interface AuthApi {
  exchangePrivy(privyToken: string): Promise<AuthResponse>;
  logout(): Promise<void>;
}

export function createAuthApi(http: AxiosInstance): AuthApi {
  return {
    async exchangePrivy(privyToken) {
      try {
        const { data } = await http.post<AuthResponse>('/v1/relay/auth/privy', {
          privy_token: privyToken, // ⚠ backend field name is privy_token
        });
        return data;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    async logout() {
      try {
        await http.post('/v1/relay/auth/logout');
      } catch (e) {
        throw normalizeError(e);
      }
    },
  };
}

/**
 * Refresh the access token via the HttpOnly cookie.
 * Uses a BARE axios client (no interceptors) so a 401 here cannot recurse.
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ access_token?: string }>(
      '/v1/relay/auth/refresh',
      undefined,
      { baseURL: config.apiBaseUrl, withCredentials: true },
    );
    return data?.access_token ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Create `src/api/mocks/auth.ts`**

```ts
import type { AuthApi, AuthResponse } from '../auth';

const MOCK_JWT = 'mock.relay.jwt';

function ok(): AuthResponse {
  return {
    access_token: MOCK_JWT,
    expires_in: 604800,
    user: { id: 'mock-user', email: 'demo@relay.credit' },
  };
}

/** Dev-only auth that never touches the network. */
export function createMockAuthApi(): AuthApi {
  return {
    async exchangePrivy() {
      return ok();
    },
    async logout() {
      /* no-op */
    },
  };
}
```

- [ ] **Step 4: Create `src/api/client.ts`**

```ts
import type { AxiosInstance } from 'axios';
import { config } from '../config';
import { createAuthApi, type AuthApi } from './auth';
import { createMockAuthApi } from './mocks/auth';

export interface RelayApi {
  auth: AuthApi;
  // Later plans add: device, oauth, me, cards, payments, authorizations, apiKeys, kyc…
}

interface CreateRelayApiOptions {
  useMocks?: boolean;
}

export function createRelayApi(
  http: AxiosInstance,
  options: CreateRelayApiOptions = {},
): RelayApi {
  const useMocks = options.useMocks ?? config.useMocks;
  return {
    auth: useMocks ? createMockAuthApi() : createAuthApi(http),
  };
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add auth data layer (token store, privy auth api, mock selector)"
```

---

## Task 5: Auth provider & hooks (Privy)

**Files:** Create `src/auth/privy/config.ts`, `src/auth/privy/PrivyAuthProvider.tsx`, `src/auth/AuthProvider.tsx`, `src/auth/useAuth.ts`, `src/auth/useRelayLogin.ts`, `src/auth/useLogout.ts`

> Confirm the Privy v3 config shape and the `usePrivy().getAccessToken` / `useLogin({ onComplete })` callbacks against the installed `@privy-io/react-auth` types while implementing.

- [ ] **Step 1: Create `src/auth/privy/config.ts`**

```ts
import type { PrivyClientConfig } from '@privy-io/react-auth';

export function buildPrivyConfig(): PrivyClientConfig {
  return {
    loginMethods: ['email', 'wallet', 'google', 'apple'],
    appearance: { theme: 'light', walletChainType: 'ethereum-and-solana' },
    embeddedWallets: { createOnLogin: 'users-without-wallets' },
  };
}
```

- [ ] **Step 2: Create `src/auth/privy/PrivyAuthProvider.tsx`**

```tsx
import type { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { config } from '../../config';
import { buildPrivyConfig } from './config';

export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider appId={config.privyAppId} config={buildPrivyConfig()}>
      {children}
    </PrivyProvider>
  );
}
```

- [ ] **Step 3: Create `src/auth/AuthProvider.tsx`**

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { config } from '../config';
import { createHttp } from '../api/http';
import { refreshAccessToken } from '../api/auth';
import { createRelayApi, type RelayApi } from '../api/client';
import { getAccessToken, setAccessToken, useAuthTokenStore } from './token-store';

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  api: RelayApi;
  /** Call after a successful login exchange. */
  setAuthenticated: (accessToken: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useAuthTokenStore((s) => s.token);
  const [bootStatus, setBootStatus] = useState<AuthStatus>('bootstrapping');

  const api = useMemo<RelayApi>(() => {
    const http = createHttp({
      getToken: getAccessToken,
      setToken: setAccessToken,
      refresh: refreshAccessToken,
      onAuthFailure: () => {
        setAccessToken(null);
        setBootStatus('unauthenticated');
      },
    });
    return createRelayApi(http, { useMocks: config.useMocks });
  }, []);

  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void (async () => {
      if (getAccessToken()) {
        setBootStatus('authenticated');
        return;
      }
      const fresh = await refreshAccessToken();
      if (fresh) {
        setAccessToken(fresh);
        setBootStatus('authenticated');
      } else {
        setBootStatus('unauthenticated');
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const status: AuthStatus =
      bootStatus === 'bootstrapping'
        ? 'bootstrapping'
        : token
          ? 'authenticated'
          : 'unauthenticated';
    return {
      status,
      api,
      setAuthenticated: (accessToken) => {
        setAccessToken(accessToken);
        setBootStatus('authenticated');
      },
      logout: async () => {
        try {
          await api.auth.logout();
        } finally {
          setAccessToken(null);
          setBootStatus('unauthenticated');
        }
      },
    };
  }, [bootStatus, token, api]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
}
```

- [ ] **Step 4: Create `src/auth/useAuth.ts`**

```ts
import { useAuthContext, type AuthStatus } from './AuthProvider';

export interface UseAuthResult {
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth(): UseAuthResult {
  const { status } = useAuthContext();
  return {
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'bootstrapping',
  };
}
```

- [ ] **Step 5: Create `src/auth/useRelayLogin.ts`**

```ts
import { useCallback, useState } from 'react';
import { usePrivy, useLogin as usePrivyLogin } from '@privy-io/react-auth';
import { useAuthContext } from './AuthProvider';
import { RelayApiError } from '../api/errors';

export interface UseRelayLoginResult {
  /** Opens the Privy modal; the relay exchange runs automatically on completion. */
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

  const exchange = useCallback(async () => {
    setExchanging(true);
    setError(null);
    try {
      const privyToken = await getAccessToken();
      if (!privyToken) throw new RelayApiError('No Privy token returned', 0);
      const res = await api.auth.exchangePrivy(privyToken);
      setAuthenticated(res.access_token);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof RelayApiError ? e : new RelayApiError('Login failed', 0));
    } finally {
      setExchanging(false);
    }
  }, [getAccessToken, api, setAuthenticated, onSuccess]);

  const { login } = usePrivyLogin({ onComplete: () => void exchange() });

  return { startLogin: () => login(), exchanging, error };
}
```

- [ ] **Step 6: Create `src/auth/useLogout.ts`**

```ts
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
```

- [ ] **Step 7: Type-check**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add privy auth provider, useAuth, login + logout hooks"
```

---

## Task 6: Router, protected route & provider tree

**Files:** Create `src/routes/ProtectedRoute.tsx`, `src/routes/Login.tsx`, `src/routes/Dashboard.tsx`, `src/routes/router.tsx`. Replace `src/App.tsx`, `src/main.tsx`.

- [ ] **Step 1: Create `src/routes/ProtectedRoute.tsx`**

```tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="p-6">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 2: Create `src/routes/Login.tsx`** (placeholder UI; real screen later)

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useRelayLogin } from '../auth/useRelayLogin';

export function Login() {
  const { isAuthenticated } = useAuth();
  const { startLogin, exchanging, error } = useRelayLogin();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto mt-24 flex max-w-sm flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Sign in to Relay</h1>
      <button
        type="button"
        onClick={startLogin}
        disabled={exchanging}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {exchanging ? 'Signing in…' : 'Continue with Privy'}
      </button>
      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/routes/Dashboard.tsx`** (placeholder authed page)

```tsx
import { useLogout } from '../auth/useLogout';

export function Dashboard() {
  const logout = useLogout();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Relay dashboard</h1>
      <p className="mt-2 text-gray-600">You are signed in.</p>
      <button
        type="button"
        onClick={() => void logout()}
        className="mt-4 rounded-md border px-4 py-2"
      >
        Log out
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/routes/router.tsx`**

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from './Login';
import { Dashboard } from './Dashboard';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <Login /> },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
```

- [ ] **Step 5: Replace `src/App.tsx`**

```tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router';

export default function App() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 6: Replace `src/main.tsx`** (provider tree: Privy > Query > Auth > App)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { PrivyAuthProvider } from './auth/privy/PrivyAuthProvider';
import { AuthProvider } from './auth/AuthProvider';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyAuthProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </PrivyAuthProvider>
  </StrictMode>,
);
```

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: PASS — no type errors, `dist/` produced.

- [ ] **Step 8: Manual boot check**

Create `.env.local` with `VITE_USE_MOCKS=true` and `VITE_PRIVY_APP_ID=test`, then `npm run dev`.
Expected: `/` redirects to `/dashboard`; with no session it redirects to `/login` showing the "Continue with Privy" button. (Real Privy login needs the live `VITE_PRIVY_APP_ID` from backend ops.)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: wire router, protected route, and provider tree"
```

---

## Self-Review

**Spec coverage (this slice):** scaffold → Task 1; env/config + mock toggle → Task 2; error normalization + http bearer/refresh → Task 3; token store + Privy auth API + mock selector → Task 4; Privy provider + session bootstrap + login/logout → Task 5; routing + provider tree → Task 6.

**Demo simplifications (intentional):** no automated tests/test tooling; wallet secondary login dropped (Privy only); zod dropped; verification via `tsc -b`/`build` + manual boot.

**Type consistency:** `AuthBridge` (Task 3) ↔ `AuthProvider` wiring (Task 5) match. `AuthApi`/`AuthResponse` (Task 4) ↔ mock (Task 4) ↔ `useRelayLogin` (Task 5) match. `RelayApi.auth` (Task 4) ↔ `useAuthContext().api.auth` (Tasks 5/6) match. `AuthStatus` values consistent (Tasks 5/6).
