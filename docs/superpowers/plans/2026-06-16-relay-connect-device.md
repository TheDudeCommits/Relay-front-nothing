# Relay Connect + Device Authorize — Implementation Plan (Demo)

> **Demo scope:** throwaway demo, minimal ceremony, no automated tests, **no mocks — wired straight to the real API**. Verify via `tsc`/`build` (live browser verification needs real `VITE_PRIVY_APP_ID` + reachable `api.relay.credit`). This is a concise plan (contracts + tasks); full code lands in the inline implementation.

**Goal:** Build the two novel-to-Relay surfaces from the handoff: the **Connect screen** (§1) and the **device sign-in/authorize flow** (§2A), matching the established glassmorphic aesthetic.

**Builds on:** Plan 1 (auth, API client, `useAuth`/`useRelayLogin`, `GlassCard`/`Logo`, `relay-bg`).

**Spec:** `docs/superpowers/specs/2026-06-16-relay-frontend-design.md` (§Screens → Connect, Device flow).

---

## API contracts (from handoff §2A)

```
POST /v1/relay/device/lookup   { user_code }  → 200 { client_name, status, expires_at, is_expired }
POST /v1/relay/device/approve  { user_code }  (Bearer) → 204
POST /v1/relay/device/deny     { user_code }  (Bearer) → 204
```
- `status`: `pending | approved | denied | consumed`.
- Errors: `404` → "No pending request found for `<code>`." · `is_expired` → "That code has expired. Restart the flow in your agent." · `status !== pending` → "That code is already `<status>`."
- Normalize `user_code` to uppercase + trim (backend tolerates dashes/spaces).

## Device flow state machine (§2A)

```
?user_code present? ──yes──► lookup ──► [signed in?] ──no──► sign in (Privy) ──► authorize ─┬─ Approve(204) ─► success
        │no                     │                                  ▲                         └─ Deny(204) ───► denied
        ▼                       │ 404 / expired / non-pending      │ (after login, resume)
   code entry ──submit──────────┘────────► error screen ───────────┘
```
- `/device?user_code=WDJB-MJHT` skips code entry and auto-looks-up.
- Sign-in stage skipped when `useAuth().isAuthenticated`.
- Show `client_name` prominently — the user is authorizing *that* agent.

## Connect screen (§1)

Per-tool copy blocks using `config.mcpUrl`. Tools + commands (verbatim):
- **Claude Code**: `claude mcp add relay <mcp>` · `claude "Show me the available card products"` · `claude "Buy me a $50 USD card"`
- **opencode**: `opencode mcp add relay --url <mcp>` · `opencode run "…"` ×2
- **Codex**: `codex mcp add relay <mcp>` · `codex "…"` ×2
- **Amp**: `amp mcp add relay <mcp>` · `amp -x "…"` ×2
- **ChatGPT**: add a custom connector → `<mcp>`, then chat prompts
- **Headless / CI**: `claude mcp add relay <mcp> --header "Authorization: Bearer pb_live_<key>"` → links to dashboard API keys
- Note: first agent use prints a sign-in link → leads to `/device`.

---

## Files

- Create `src/lib/userCode.ts` — `normalizeUserCode(raw): string`
- Create `src/api/device.ts` — `DeviceLookupResponse`, `DeviceStatus`, `createDeviceApi(http)`
- Modify `src/api/client.ts` — add `device` to `RelayApi`
- Create `src/components/ui/CopyBlock.tsx` — clipboard code block (Lucide copy/check)
- Create `src/features/connect/ConnectPage.tsx` (+ tool data) — `/connect`
- Create `src/features/device/DevicePage.tsx` — `/device` state machine
- Modify `src/routes/router.tsx` — add public `/connect` and `/device`
- Modify `src/routes/Dashboard.tsx` + `src/routes/Login.tsx` — link "Connect an agent" → `/connect`

## Tasks

1. **Device API + userCode util** → wire into `RelayApi`. tsc green.
2. **`CopyBlock` + Connect screen** at `/connect` (public route). Link from dashboard. tsc green.
3. **Device authorize flow** at `/device` (code entry → lookup → sign-in-if-needed → approve/deny → success/denied), reusing `useAuth`/`useRelayLogin`. tsc green.
4. **Build + browser verify** screenshots: `/connect`, `/device?user_code=WDJB-MJHT` (authorize card), success state.

## Acceptance

- `/connect` shows all tool blocks with working copy buttons; MCP URL from config.
- `/device?user_code=WDJB-MJHT` (mock) → shows agent name → (signed out) Privy step → authorize → "approved, return to your agent" success; Deny → denied screen.
- Bad/expired/used codes show the right message. Visuals match the glass aesthetic.
