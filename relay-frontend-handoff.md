# Relay Frontend — Implementation Handoff

**Audience:** Frontend team building the Relay web surface at **relay.credit**.

**You're building three things:**
1. **Connect screen** — the copy-paste commands users run to add the Relay MCP server to their AI agent.
2. **Sign-in / Authorize page** — where a user lands when they click the sign-in link an agent prints. If they're already logged in they just **Authorize**; if not, they **log in** first, then **Authorize**.
3. **Dashboard** — account overview + session / connected-app management.

---

## 0. Hosts

| Role | URL | Serves |
|---|---|---|
| Web app | `https://relay.credit` | **What you build:** sign-in, authorize, **dashboard at `relay.credit/dashboard`**, email-confirm. |
| REST API | `https://api.relay.credit` | All the `/v1/relay/*` JSON endpoints in this doc. |
| MCP server | `https://mcp.relay.credit` | What AI agents connect to. OAuth + device flow live here — **backend owns it, you don't build it.** |

`SKILL.md`, `llms.txt`, and `.well-known/*` are served by the backend on `relay.credit` — you don't build those either.

---

## 1. Connect — adding Relay to an agent

The "Connect an agent" screen shows one block per tool: **add the MCP server, open the agent, ask it something.** Render each in its own copy-widget. On first use the agent prints a sign-in link (that's Part 2).

**Claude Code**
```bash
# 1. Add the Relay MCP server
claude mcp add relay https://mcp.relay.credit

# 2. Open Claude and ask it something
claude "Show me the available card products"
claude "Buy me a $50 USD card"
```

**opencode**
```bash
opencode mcp add relay --url https://mcp.relay.credit
opencode run "Show me the available card products"
opencode run "Buy me a $50 USD card"
```

**Codex**
```bash
codex mcp add relay https://mcp.relay.credit
codex "Show me the available card products"
codex "Buy me a $50 USD card"
```

**Amp**
```bash
amp mcp add relay https://mcp.relay.credit
amp -x "Show me the available card products"
amp -x "Buy me a $50 USD card"
```

**ChatGPT** — add a custom app/connector pointing at `https://mcp.relay.credit`, then in chat:
```
Show me the available card products
Buy me a $50 USD card
```

**First-use auth.** The first time an agent calls Relay it has no token, so it prints a sign-in link (e.g. *"Open https://relay.credit/device?user_code=WDJB-MJHT to authorize"*) or opens the browser to sign in. The user completes Part 2, and the agent picks up its token automatically.

**Headless / CI** users can skip the browser by passing a long-lived API key minted from the dashboard (§3.4):
```bash
claude mcp add relay https://mcp.relay.credit --header "Authorization: Bearer pb_live_<key>"
```

---

## 2. Sign-in & Authorize page

The page a user reaches from the link an agent prints. The job: **prove who the user is, then let them approve (or deny) the specific agent that printed the code.** All API calls go to `https://api.relay.credit`.

Two entry flows share the same login + authorize UI — build both.

### 2A. Device flow (primary)

URL the agent prints:
```
https://relay.credit/device?user_code=WDJB-MJHT
```
`user_code` is optional — if present, skip the code-entry step and auto-advance.

**Stages:**
```
┌─────────────┐   user_code present?    ┌──────────────┐
│ 1. Enter    │ ──────────yes─────────► │ 2. Sign in    │
│    code     │ ◄──────── no (prompt) ─ │  (if not      │
└─────────────┘                          │   logged in)  │
                                         └──────┬────────┘
                                                │ logged in
                                                ▼
                                         ┌──────────────┐
                                         │ 3. Authorize │ ── Approve ─► 4. Success
                                         │  this agent? │ ── Deny ────► 5. Denied
                                         └──────────────┘
```

Stage 2 (sign-in) is **skipped if the user already has a valid relay session** — go straight to Authorize. Only signed-out users see the login step.

#### Stage 1 — Look up the code (public)

Normalize input (uppercase; the backend tolerates dashes/spaces) and call:
```http
POST https://api.relay.credit/v1/relay/device/lookup
Content-Type: application/json

{ "user_code": "WDJB-MJHT" }
```
```json
200 OK
{
  "client_name": "Claude Code",
  "status": "pending",            // pending | approved | denied | consumed
  "expires_at": "2026-06-15T12:05:00Z",
  "is_expired": false
}
```
- `404` → "No pending request found for `<code>`."
- `is_expired: true` → "That code has expired. Restart the flow in your agent."
- `status !== "pending"` → "That code is already `<status>`."

Show `client_name` prominently — the user is authorizing *that* agent.

#### Stage 2 — Sign in (only if no session)

Both methods yield a **relay JWT** to hold in memory for Stage 3.

**(a) Privy — primary.** Default path for the consumer UI (email / passkey / social). Use the Privy React SDK, then exchange the Privy token:
```http
POST https://api.relay.credit/v1/relay/auth/privy
{ "privy_token": "<token from privy.getAccessToken()>" }   // ⚠ field is `privy_token`
→ 200 { "access_token": "<relay JWT>", "expires_in": 604800, "user": { … } }
```
Sets a `refresh_token` HttpOnly cookie. Uses the **relay** Privy project — embed the relay Privy app ID (get it from backend ops).

**(b) Wallet — secondary / no-Privy fallback** (MetaMask/Phantom/Coinbase). Nonce + signature:
```http
POST https://api.relay.credit/v1/relay/auth/wallet/nonce
{ "address": "0x…", "chain": "evm" }      // chain: "evm" | "solana"
→ 200 { "nonce": "…", "message": "…", "expires_at": "…" }   // sign `message` verbatim

POST https://api.relay.credit/v1/relay/auth/wallet/verify
{ "address": "0x…", "chain": "evm", "signature": "0x…", "nonce": "…" }
→ 200 {
    "access_token": "<relay JWT>",
    "expires_in": 604800,
    "is_new_user": true,
    "api_key": "pb_live_…"     // present ONLY on first sign-in
  }
```
Sets a `relay_refresh_token` HttpOnly cookie.

> **Lead with Privy.** Wallet is a secondary "Sign in with a wallet" option. Both produce the same relay JWT, so Stage 3 is identical.

#### Stage 3 — Authorize (needs the JWT from Stage 2 or an existing session)

**Approve:**
```http
POST https://api.relay.credit/v1/relay/device/approve
Authorization: Bearer <relay JWT>
{ "user_code": "WDJB-MJHT" }
→ 204 No Content
```
**Deny** (same shape) → `POST /v1/relay/device/deny` → `204`.

On `204` from approve, show success ("You can close this tab and return to your agent"). The polling agent picks up its token within ~5s.

### 2B. OAuth consent (browser flow)

When an agent supports full OAuth, `mcp.relay.credit/authorize` redirects the browser to your login page with the original `/authorize` URL as `return_to`. After login, mint the consent code:
```http
POST https://api.relay.credit/v1/relay/oauth/issue-code
Authorization: Bearer <relay JWT>
{
  "client_id":             "<from the /authorize query params>",
  "redirect_uri":          "<from the /authorize query params>",
  "code_challenge":        "<PKCE challenge from the agent>",
  "code_challenge_method": "S256"
}
→ 200 { "code": "<authorization code>" }
```
Then `302` the browser to `redirect_uri?code=<code>&state=<state>`. The agent exchanges it at `mcp.relay.credit/token`. (Cross-subdomain cookie note in §4.)

### 2C. Email-confirmation page (optional)

Agents that need a human to confirm an email print `https://relay.credit/confirm?token=…`. After re-authenticating the human with Privy:
```http
POST https://api.relay.credit/v1/relay/confirmations/<token>/confirm   // NOT JWT-gated; the page is the trust boundary
→ 200 { "status": "confirmed" }
```

---

## 3. Dashboard

The signed-in home at `relay.credit/dashboard`. Every call sends `Authorization: Bearer <access_token>`; the JWT must carry `platform: "relay"` (cross-platform tokens are rejected).

### 3.1 Overview

| Widget | Endpoint | Notes |
|---|---|---|
| Profile (name, email, avatar, referral code, wallets, cards, total balance) | `GET /v1/relay/me` | One-shot for header + summary. |
| Balance per currency | `GET /v1/relay/balance` | `[{ currency, balance }]` |
| Deposit addresses (EVM/Solana/Tron) | `GET /v1/relay/deposit-addresses` | Static per user. |
| Cards list | `GET /v1/relay/cards` | Use `card_id` (UUID) — **never** a SAN/PAN in list views. |
| Card detail (PAN/expiry/CVV) | `GET /v1/relay/cards/:card_id` | Owner-checked. Reveal on demand. |
| Card transactions | `GET /v1/relay/cards/:card_id/transactions?page=&size=` | |
| Unified activity (top-ups, withdrawals, card spend) | `GET /v1/relay/transactions?page=&size=` | |
| Token holdings for a wallet | `GET /v1/relay/tokens?wallet=0x…` | |
| Products & pricing | `GET /v1/relay/products` | Badge-discounted when authenticated. |
| Badges & fee discount | `GET /v1/relay/badges/me`, `GET /v1/relay/badges/discount` | |

Card actions: `POST …/freeze`, `POST …/unfreeze`, `POST …/withdraw` `{amount,currency}`, `POST …/update-email`, `PUT …/design`.

### 3.2 Payment sessions (crypto deposits)

A payment session is a single crypto deposit intent (one-time address, 15-min expiry).
```
POST   /v1/relay/payments/sessions             create (returns payment_address + wallet_payment payload)
GET    /v1/relay/payments/sessions?page=&size= list
GET    /v1/relay/payments/sessions/:id         detail (poll status: pending → detected → confirmed)
```
The `wallet_payment` object is a ready-to-sign transaction (chain id, token contract, decimals, base-unit amount, recipient) — feed it straight to a connected wallet's `sendTransaction`.

> **KYC gate on card issuance.** Creating a session that **issues a new card** (i.e. with a `product_slug`/`product_code`) requires an **approved KYC** on relay. If the user isn't verified, this returns **`403`** with `{ "message": "kyc_required: complete identity verification before issuing a card" }`. Catch it and route the user into the KYC flow (§3.5). Top-ups of an existing card are **not** gated.

### 3.3 Session / connected-app management

Each connected agent (OAuth client or API key) is an "authorization" with a spending policy. Let users view usage, tune limits, and **revoke**.
```
GET    /v1/relay/authorizations            list connected apps + spending caps + usage
GET    /v1/relay/authorizations/:id        single
PATCH  /v1/relay/authorizations/:id        update { display_name, daily_limit_usd, per_tx_limit_usd,
                                                     allowed_actions[], blocked_actions[],
                                                     clear_daily_limit, clear_per_tx_limit }
POST   /v1/relay/authorizations/:id/revoke disconnect the app
```
List item shape:
```json
{
  "id": 42, "display_name": "Claude Code",
  "daily_limit_usd": 50.00, "per_tx_limit_usd": 20.00,
  "allowed_actions": ["create_payment_session","withdraw_card"], "blocked_actions": [],
  "today_usd": 8.00, "today_tx_count": 2,
  "lifetime_usd": 150.00, "lifetime_tx_count": 10,
  "revoked_at": null, "created_at": "…", "updated_at": "…"
}
```
Defaults are **$50/day, $20/tx**. Show live `today_usd` against `daily_limit_usd` as a progress bar — the most useful at-a-glance trust signal.

### 3.4 API keys

For headless/CI connection (the `--header` path in §1):
```
POST   /v1/relay/api-keys      { name, scopes? }  → 201 { "key": "pb_live_…" }   // shown ONCE
GET    /v1/relay/api-keys      list (masked)
DELETE /v1/relay/api-keys/:id  revoke
```
The full key is returned only on create — show it in a copy widget with a "this is the only time you'll see this" warning.

### 3.5 KYC / identity verification

On relay, **issuing a new card requires an approved KYC** (top-ups don't). The dashboard needs a "Verify your identity" surface so users can complete KYC before — or right after hitting the `403` from §3.2.

CardsPro hosts the actual verification funnel. The frontend's job is: **start → send the user to the hosted URL → poll status.** You do **not** build the ID/biometric forms.

**`sort`** is the CardsPro KYC funnel identifier (e.g. `S00`). Use the value backend ops gives you — keep it in config, don't hard-code blindly.

**Step 1 — Start (or resume) the application:**
```http
POST https://api.relay.credit/v1/relay/kyc/start
Authorization: Bearer <relay JWT>
{ "sort": "S00", "callback_url": "https://relay.credit/dashboard?kyc=done" }   // callback_url optional
→ 200 { "uuid": "<cardspro uuid>", "urlForUser": "https://…hosted funnel…" }
```
Open `urlForUser` (redirect or new tab). The user completes verification there. One application per user per `sort` — calling start again resumes/replaces it.

**Step 2 — Poll status** (by sort or by uuid):
```http
GET https://api.relay.credit/v1/relay/kyc/status/S00
GET https://api.relay.credit/v1/relay/kyc/status-by-uuid/<uuid>
Authorization: Bearer <relay JWT>
→ 200 {
    "status": "APPROVED",        // see lifecycle below
    "reason": "",                // populated on DECLINED
    "uuid": "<cardspro uuid>",
    "kycExternalUserId": "…"
  }
```

**Status lifecycle:**
```
NEW ──► UNDER_REVIEW ──► COMPLETED ──► APPROVED   ✅ issuance unlocked
                          │
                          ├──► DECLINED   ❌ show `reason`, let user restart
                          └──► EXPIRED    ⌛ let user restart (POST /start again)
```
Treat **`APPROVED` as the only state that unlocks card issuance.** Show everything else as "in progress" (NEW/UNDER_REVIEW/COMPLETED), "declined" (with `reason`), or "expired". Poll while the page is open, or refresh on the `callback_url` return — the backend gets the final result via a CardsPro webhook, so a verified user flips to `APPROVED` without any further action from you.

**Recommended UX:**
- A KYC status card on the dashboard (Not started / In review / Approved / Declined).
- Gate the "Buy a card" button on `APPROVED`; otherwise its click starts the KYC flow.
- If a card-issuance call returns `403 kyc_required`, surface the KYC start flow inline.

> **Fallback endpoints (most integrations won't need these).** Some KYC sorts collect data through the backend instead of the hosted funnel: `POST /v1/relay/kyc/:uuid/data` (JSON form), `POST /v1/relay/kyc/:uuid/picture/:type` (`type` = `document_front`|`document_back`, raw JPEG body), `POST /v1/relay/kyc/:uuid/confirm`. Only build these if backend ops tells you your `sort` requires them; otherwise the hosted `urlForUser` covers everything.

---

## 4. Auth, tokens & cookies

- **Access token (JWT, RS256):** returned in auth response bodies. Hold in memory / `sessionStorage`. Send as `Authorization: Bearer <token>` on every `/v1/relay/*` call. Carries `platform: "relay"`. TTL ~7 days.
- **Refresh token:** delivered **only** as an HttpOnly cookie. Refresh via `POST /v1/relay/auth/refresh`; logout via `POST /v1/relay/auth/logout`.
- **Cross-subdomain session (OAuth flow only):** set the session cookie on `Domain=.relay.credit` with `Secure; SameSite=Lax` so `mcp.relay.credit/authorize` can read it.
- **Card data:** only ever use `card_id` (the UUID). CardsPro SAN/BIN/`product_code` are never returned — don't build against them.
- **Errors:** standard HTTP status + `{ "message": "…" }` body.

---

## 5. Build checklist

- [ ] **Connect screen** — per-tool blocks (add MCP + open + sample prompt) from §1.
- [ ] **Sign-in/Authorize page** at `/device`: code lookup → conditional login (Privy primary, wallet secondary) → approve/deny, with `?user_code=` auto-advance. Skip login when a session already exists.
- [ ] **OAuth consent** at `/login` + `/authorize` bridge: handle `return_to`, mint code via `/v1/relay/oauth/issue-code`, redirect back.
- [ ] **Email-confirm page** at `/confirm`.
- [ ] **Dashboard** at `/dashboard`: overview (§3.1), payment sessions (§3.2), connected apps (§3.3), API keys (§3.4), **KYC / identity verification (§3.5)**.
- [ ] **KYC gate:** show verification status, gate "Buy a card" on `APPROVED`, and handle the `403 kyc_required` response by starting the KYC flow.
- [ ] Get from backend ops: the **relay** Privy app ID, the KYC **`sort`** value, and confirm `relay.credit` is in the API CORS allowlist.

---

## 6. Endpoint quick reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/v1/relay/auth/privy` | – | Privy sign-in (`{privy_token}`) |
| POST | `/v1/relay/auth/wallet/nonce` | – | Wallet sign-in step 1 |
| POST | `/v1/relay/auth/wallet/verify` | – | Wallet sign-in step 2 → JWT (+api_key on first) |
| POST | `/v1/relay/auth/refresh` | cookie | Refresh access token |
| POST | `/v1/relay/auth/logout` | – | Clear refresh cookie |
| POST | `/v1/relay/device/lookup` | – | Look up device user_code |
| POST | `/v1/relay/device/approve` | JWT | Approve device |
| POST | `/v1/relay/device/deny` | JWT | Deny device |
| POST | `/v1/relay/oauth/issue-code` | JWT | Mint OAuth code after consent |
| GET | `/v1/relay/me` | JWT | Profile |
| POST | `/v1/relay/me/sync-privy` | JWT | Re-sync email/wallets (`{privy_access_token}`) |
| GET | `/v1/relay/balance` | JWT | Balance per currency |
| GET | `/v1/relay/deposit-addresses` | JWT | Deposit addresses |
| GET | `/v1/relay/cards` | JWT | List cards |
| GET | `/v1/relay/cards/:id` | JWT | Card detail (PAN/CVV) |
| GET | `/v1/relay/cards/:id/transactions` | JWT | Card txns |
| POST | `/v1/relay/cards/:id/freeze` \| `/unfreeze` \| `/withdraw` | JWT | Card actions |
| GET | `/v1/relay/transactions` | JWT | Unified activity |
| GET | `/v1/relay/tokens?wallet=` | JWT | Token holdings |
| POST/GET | `/v1/relay/payments/sessions` | JWT | Create / list sessions |
| GET | `/v1/relay/payments/sessions/:id` | JWT | Session detail |
| GET | `/v1/relay/products` \| `/products/search` | optional | Products + pricing |
| GET | `/v1/relay/badges` \| `/badges/me` \| `/badges/discount` | mixed | Badges & fees |
| GET | `/v1/relay/authorizations` | JWT | List connected apps |
| GET/PATCH | `/v1/relay/authorizations/:id` | JWT | Get / update policy |
| POST | `/v1/relay/authorizations/:id/revoke` | JWT | Revoke app |
| POST/GET | `/v1/relay/api-keys` | JWT | Create / list keys |
| DELETE | `/v1/relay/api-keys/:id` | JWT | Revoke key |
| POST | `/v1/relay/kyc/start` | JWT | Start/resume KYC → `{uuid, urlForUser}` |
| GET | `/v1/relay/kyc/status/:sort` | JWT | KYC status by sort |
| GET | `/v1/relay/kyc/status-by-uuid/:uuid` | JWT | KYC status by uuid |
| POST | `/v1/relay/kyc/:uuid/data` \| `/picture/:type` \| `/confirm` | JWT | Fallback funnel (sort-dependent) |
| POST | `/v1/relay/me/email/link` | JWT | Request email link |
| GET | `/v1/relay/confirmations/:token` | JWT | Confirmation status |
| POST | `/v1/relay/confirmations/:token/confirm` | – | Confirm email link |
</content>
