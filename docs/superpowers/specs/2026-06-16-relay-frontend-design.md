# Relay Frontend — Design Spec

**Date:** 2026-06-16
**Source:** `relay-frontend-handoff.md` (the authoritative API/behavior contract; section refs below cite it as §N)
**Status:** Approved for planning

## Summary

Relay is the consumer web surface at `relay.credit` for an AI-agent-authorized crypto card product. This spec covers the **entire handoff document**: the Connect screen, the Sign-in/Authorize flows, and the Dashboard. More handoff docs will follow and extend the product, so the architecture must let a new doc drop in as a new feature slice without disturbing what exists.

We build a **clean-slate Vite + React SPA** — fresh code, not lifted from sibling apps (`pbank-frontend`, `@vpay/core`), but using the same proven library set.

### What we build (this doc)
1. **Connect screen** (§1) — per-tool copy-paste blocks to add the Relay MCP server to an agent.
2. **Sign-in / Authorize** (§2) — device flow (primary), OAuth consent bridge, email-confirm page.
3. **Dashboard** (§3) — overview, cards, activity, crypto deposit sessions, connected-app management, API keys, KYC.

### Explicitly out of scope (handoff §0, §2C, §3.5, §4)
- MCP server (`mcp.relay.credit`), OAuth/device backend — backend owns it.
- `SKILL.md`, `llms.txt`, `.well-known/*` — served by backend.
- KYC ID/biometric capture forms — hosted by CardsPro via `urlForUser`. We only start → redirect → poll. (Fallback funnel endpoints built only if backend ops says our `sort` needs them.)
- Any use of CardsPro SAN / BIN / `product_code`. Cards are referenced by `card_id` (UUID) only.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Codebase origin | Clean-slate in `relay-new-demo/` | User directive; write Relay's own code. |
| Framework | Vite + React 19 + TypeScript SPA | Fully auth-gated client app with heavy wallet libs; no SSR/SEO need. Matches workspace ecosystem. |
| Routing | React Router 7 | SPA routing for `/connect`, `/device`, `/login`, `/authorize`, `/confirm`, `/dashboard/*`. |
| Styling | Tailwind v4 | Per global conventions; standard Tailwind values only. |
| Server state | TanStack Query | Caching + the polling the doc requires (device lookup, payment session, KYC). |
| Client/auth state | zustand | In-memory relay JWT + session status. |
| Primary login | `@privy-io/react-auth` | §2 leads with Privy (email/passkey/social). |
| Secondary login | wagmi/viem (EVM) + Solana web3 | §2 wallet fallback (nonce + signature). |
| HTTP | axios with interceptors | Bearer attach + 401→refresh→retry (§4). |
| Validation | zod | Validate/normalize API responses at the client boundary. |
| Data strategy | Live API by default + dev-only mock layer behind the same interface | Privy app ID & KYC `sort` come from backend ops (§5) and may not be in hand; mocks keep the whole UI demoable and swap to live when creds land. |

## Architecture

Feature-sliced SPA over a typed API-client layer. The API client centralizes the cross-cutting concerns the doc is full of (bearer-token + refresh, error normalization, polling) so pages stay thin and the next doc adds a slice rather than re-plumbing.

```
relay-new-demo/
  index.html
  vite.config.ts          # + dev proxy / SSL as needed
  .env.example            # VITE_API_BASE_URL, VITE_MCP_URL, VITE_PRIVY_APP_ID, VITE_KYC_SORT, VITE_USE_MOCKS
  src/
    main.tsx              # provider tree: Privy > QueryClient > Router > Auth
    config.ts             # reads env, single source of hosts/ids
    router.tsx            # route table
    api/
      http.ts             # axios instance + request/response interceptors
      errors.ts           # normalize { message } + status -> RelayApiError
      mocks/              # dev-only mock layer (toggled by VITE_USE_MOCKS), same fn signatures
      auth.ts device.ts oauth.ts confirmations.ts
      me.ts balance.ts deposit-addresses.ts
      cards.ts transactions.ts tokens.ts
      products.ts badges.ts
      payments.ts          # payment sessions
      authorizations.ts api-keys.ts
      kyc.ts
      types.ts             # shared response/request types (zod schemas + inferred TS)
    auth/
      AuthProvider.tsx     # holds relay JWT, exposes status
      useAuth.ts useLogin.ts useLogout.ts useSession.ts
      privy/               # Privy config + token exchange
      wallet/              # EVM + Solana nonce/sign secondary login
    features/
      connect/             # /connect screen (§1)
      device/              # /device state machine (§2A)
      oauth-consent/       # /login + /authorize bridge (§2B)
      confirm/             # /confirm (§2C)
      dashboard/
        DashboardShell.tsx
        overview/          # profile, balance, deposit addresses (§3.1)
        cards/             # list, detail+reveal, freeze/unfreeze/withdraw (§3.1)
        activity/          # unified transactions (§3.1)
        deposits/          # payment sessions create+poll (§3.2)
        connected-apps/    # authorizations (§3.3)
        api-keys/          # (§3.4)
        kyc/               # status + start + poll + gate (§3.5)
    components/ui/         # shared primitives (copy widget, status pill, progress bar, dialog…)
    lib/                   # formatting, clipboard, user_code normalize, polling helpers
```

## Auth & token model (§4)

- **Access token** (relay JWT, RS256, `platform: "relay"`, ~7-day TTL): returned in auth response bodies. Held in memory (zustand) and mirrored to `sessionStorage`. Attached as `Authorization: Bearer <token>` on every `/v1/relay/*` call by the axios request interceptor.
- **Refresh token**: HttpOnly cookie only. Response interceptor: on `401`, call `POST /v1/relay/auth/refresh` once (cookie-based), update the access token, retry the original request; on failure clear session and route to login. Logout → `POST /v1/relay/auth/logout`.
- **Existing-session detection:** on load, attempt a silent refresh; if it yields a token, the user is "logged in" and both the device and OAuth flows skip the login stage (§2A stage 2 is skipped, §2B goes straight to consent).
- **Cross-subdomain (OAuth only, §4):** session cookie semantics are backend-owned; the frontend only needs to be aware that after login the OAuth `/authorize` continuation can proceed.

### Login methods
- **Privy (primary, §2(a)):** Privy React SDK → `privy.getAccessToken()` → `POST /v1/relay/auth/privy { privy_token }` (⚠ field name is `privy_token`) → `{ access_token, expires_in, user }`. Uses the **relay** Privy project (`VITE_PRIVY_APP_ID`).
- **Wallet (secondary, §2(b)):** `POST /auth/wallet/nonce { address, chain }` → sign `message` verbatim → `POST /auth/wallet/verify { address, chain, signature, nonce }` → `{ access_token, expires_in, is_new_user, api_key? }`. `api_key` present **only on first sign-in** → surface in show-once widget. `chain ∈ {"evm","solana"}`.

Both methods yield the same relay JWT, so the authorize step is identical regardless of method.

## API-client layer (§6)

One module per resource group; each function takes typed args and returns typed/zod-validated data; all errors normalized to `RelayApiError { status, message }`. Endpoint→module map:

- **auth.ts** — `POST /auth/privy`, `/auth/wallet/nonce`, `/auth/wallet/verify`, `/auth/refresh`, `/auth/logout`.
- **device.ts** — `POST /device/lookup`, `/device/approve`, `/device/deny`.
- **oauth.ts** — `POST /oauth/issue-code`.
- **confirmations.ts** — `GET /confirmations/:token`, `POST /confirmations/:token/confirm` (not JWT-gated), `POST /me/email/link`.
- **me.ts** — `GET /me`, `POST /me/sync-privy`.
- **balance.ts** — `GET /balance`. **deposit-addresses.ts** — `GET /deposit-addresses`.
- **cards.ts** — `GET /cards`, `GET /cards/:id`, `GET /cards/:id/transactions`, `POST /cards/:id/{freeze,unfreeze,withdraw,update-email}`, `PUT /cards/:id/design`.
- **transactions.ts** — `GET /transactions?page=&size=`. **tokens.ts** — `GET /tokens?wallet=`.
- **products.ts** — `GET /products`, `/products/search`. **badges.ts** — `GET /badges`, `/badges/me`, `/badges/discount`.
- **payments.ts** — `POST/GET /payments/sessions`, `GET /payments/sessions/:id`.
- **authorizations.ts** — `GET /authorizations`, `GET/PATCH /authorizations/:id`, `POST /authorizations/:id/revoke`.
- **api-keys.ts** — `POST/GET /api-keys`, `DELETE /api-keys/:id`.
- **kyc.ts** — `POST /kyc/start`, `GET /kyc/status/:sort`, `GET /kyc/status-by-uuid/:uuid`, (fallback) `POST /kyc/:uuid/{data,picture/:type,confirm}`.

## Screens & flows

### Connect (§1) — `/connect`
A copy-widget block per tool: **add MCP server → open agent → sample prompt.** Tools: Claude Code, opencode, Codex, Amp, ChatGPT (custom connector + chat prompts). Plus a **Headless / CI** variant showing the `--header "Authorization: Bearer pb_live_<key>"` form, linking to dashboard API-keys (§3.4). Note that first agent use prints a sign-in link → leads into `/device`.

### Device flow (§2A) — `/device?user_code=WDJB-MJHT`
State machine: **1 Enter code → 2 Sign in (if no session) → 3 Authorize → 4 Success / 5 Denied.**
- `user_code` present → normalize (uppercase; backend tolerates dashes/spaces) and skip to lookup.
- **Lookup (public):** `POST /device/lookup { user_code }` → `{ client_name, status, expires_at, is_expired }`. Error copy: `404` → "No pending request found for `<code>`."; `is_expired` → "That code has expired. Restart the flow in your agent."; `status !== "pending"` → "That code is already `<status>`." Show `client_name` prominently.
- **Sign in:** skipped if a valid relay session exists; else Privy primary / wallet secondary (above).
- **Authorize:** `POST /device/approve { user_code }` (Bearer) → `204` → success ("close this tab; agent picks up token in ~5s"). **Deny:** `POST /device/deny` → `204` → denied screen.

### OAuth consent (§2B) — `/login` + `/authorize`
`mcp.relay.credit/authorize` redirects here with the original `/authorize` URL as `return_to`. After login: `POST /oauth/issue-code { client_id, redirect_uri, code_challenge, code_challenge_method:"S256" }` (Bearer) → `{ code }`; then `302` to `redirect_uri?code=<code>&state=<state>`. `client_id`/`redirect_uri`/PKCE challenge/`state` come from the `/authorize` query params.

### Email confirm (§2C) — `/confirm?token=…`
Re-authenticate the human (Privy), then `POST /confirmations/:token/confirm` (not JWT-gated — the page is the trust boundary) → `{ status: "confirmed" }`. `GET /confirmations/:token` for status display.

### Dashboard (§3) — `/dashboard`
Shell with sections. Every call sends Bearer; JWT must carry `platform:"relay"`.
- **Overview (§3.1):** `GET /me` (header + summary: name, email, avatar, referral code, wallets, cards, total balance); `GET /balance` (per currency); `GET /deposit-addresses` (EVM/Solana/Tron).
- **Cards (§3.1):** `GET /cards` (list by `card_id`, never SAN/PAN). Detail `GET /cards/:id` reveals PAN/expiry/CVV **on demand**. `GET /cards/:id/transactions?page=&size=`. Actions: freeze/unfreeze/withdraw `{amount,currency}`/update-email/design.
- **Activity (§3.1):** `GET /transactions?page=&size=` unified (top-ups, withdrawals, card spend). `GET /tokens?wallet=` for holdings.
- **Deposits / payment sessions (§3.2):** `POST /payments/sessions` (returns `payment_address` + `wallet_payment` ready-to-sign payload: chain id, token contract, decimals, base-unit amount, recipient) → optionally feed to connected wallet `sendTransaction`. `GET /payments/sessions/:id` poll `pending → detected → confirmed` (one-time address, 15-min expiry). **KYC gate:** creating a session that issues a new card (with `product_slug`/`product_code`) requires approved KYC → on `403 { message: "kyc_required…" }` route into KYC (§3.5). Top-ups are not gated.
- **Connected apps / authorizations (§3.3):** `GET /authorizations` (list with caps + usage). Per item: `display_name`, `daily_limit_usd`, `per_tx_limit_usd`, `allowed_actions[]`, `blocked_actions[]`, `today_usd`/`today_tx_count`, `lifetime_*`, `revoked_at`. Show **`today_usd` vs `daily_limit_usd` as a progress bar** (primary trust signal). `PATCH /authorizations/:id` to tune limits/actions (incl. `clear_daily_limit`/`clear_per_tx_limit`). `POST /authorizations/:id/revoke`. Defaults $50/day, $20/tx.
- **API keys (§3.4):** `POST /api-keys { name, scopes? }` → `201 { key: "pb_live_…" }` shown **once** in a copy widget with "only time you'll see this" warning. `GET /api-keys` (masked list). `DELETE /api-keys/:id`.
- **KYC (§3.5):** Status card (Not started / In review / Approved / Declined / Expired). `POST /kyc/start { sort, callback_url? }` → `{ uuid, urlForUser }` → open hosted funnel (new tab/redirect). Poll `GET /kyc/status/:sort` (or `…/status-by-uuid/:uuid`) → `{ status, reason, uuid, kycExternalUserId }`. Lifecycle: `NEW → UNDER_REVIEW → COMPLETED → APPROVED` (only `APPROVED` unlocks issuance); `DECLINED` (show `reason`, allow restart); `EXPIRED` (allow restart). One application per user per `sort`; calling start again resumes/replaces. Backend gets the final result via CardsPro webhook, so refresh on `callback_url` return flips to `APPROVED` without further action. **Gate "Buy a card" on `APPROVED`**; otherwise the click starts KYC.

## Cross-cutting behavior
- **KYC gate handler:** a shared interceptor/helper recognizes `403 kyc_required` and surfaces the KYC start flow inline wherever card issuance is attempted.
- **Polling:** TanStack Query `refetchInterval` for device lookup, payment session status, and KYC status; stop on terminal states; respect 15-min/expiry windows.
- **Show-once secrets:** create-API-key `key` and first-sign-in `api_key` rendered only in the copy widget with the explicit warning; never persisted or re-fetchable.
- **Card data security:** lists/detail use `card_id` (UUID); PAN/expiry/CVV only via reveal-on-demand; no SAN/BIN/`product_code` anywhere.
- **Errors:** uniform surfacing of `{ message }` + HTTP status via `RelayApiError`.

## Data / creds strategy
- `config.ts` reads all hosts/ids from env. Defaults: API `https://api.relay.credit`, MCP `https://mcp.relay.credit`.
- `VITE_USE_MOCKS=true` swaps the API modules for `src/api/mocks/*` with identical signatures, so the full UI (including device flow, dashboard, KYC states) is clickable before backend creds exist.
- **Pending from backend ops (§5):** relay Privy app ID (`VITE_PRIVY_APP_ID`), KYC `sort` (`VITE_KYC_SORT`), and confirmation that `relay.credit` is in the API CORS allowlist. Tracked as blockers for going live, not for building.

## Testing
Vitest + React Testing Library on the logic that carries risk:
- Device-flow state machine (code present/absent, expired/non-pending/404, session present/absent, approve/deny).
- Token attach + 401→refresh→retry→fail-to-login interceptor.
- KYC `403 kyc_required` gate routing.
- API-client response normalization / zod parsing and error mapping.
- `user_code` normalization, show-once secret rendering, authorization progress-bar math.

## Build sequence (for the implementation plan)
1. Scaffold (Vite/TS/Tailwind/Router) + `config.ts` + provider tree + `.env.example`.
2. API layer: `http.ts`, `errors.ts`, `types.ts`, mock toggle.
3. Auth: Privy + wallet login, token store, refresh interceptor, session detection.
4. Device flow `/device`.
5. Connect `/connect`.
6. Dashboard shell + Overview + Cards + Activity.
7. Deposits (payment sessions) + KYC + the KYC gate.
8. Connected apps + API keys.
9. OAuth consent `/login` + `/authorize`, Email confirm `/confirm`.
10. Tests alongside each slice; final pass on the high-risk logic above.
