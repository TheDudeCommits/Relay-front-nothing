# Relay Dashboard Endpoints — Frontend Guide

Response shapes for the JWT-gated relay dashboard endpoints. **All paths are the
relay surface (`/v1/relay/*`)** and require a relay JWT:
`Authorization: Bearer <relay access token>` (from `POST /v1/relay/auth/privy`).

> The `/v1/me/*` paths are the **pbank** mirror of the same handlers; ignore them
> for relay. The only behavioural difference is `/v1/relay/me`, which returns a
> **redacted** user (see below).

## How to get / verify these shapes

There is **no OpenAPI/Swagger** in this repo — the source of truth is the Go
response structs. Two reliable ways to confirm a shape:

1. **Read the struct** (file:line cited per endpoint below). JSON keys come from
   the `json:"..."` tags; that's exactly what serializes.
2. **Hit the live endpoint** with a relay token:
   ```bash
   curl -s https://api.relay.credit/v1/relay/me \
     -H "Authorization: Bearer $RELAY_JWT" | jq
   ```

### Two cross-cutting gotchas
- **Money is usually a string.** `decimal.Decimal` serializes as a JSON string
  (`"1250.50"`). The **one exception** is `GET /v1/relay/cards/:id` where
  `balance` is a JSON **number** (`float64`). Don't assume a uniform type.
- **`omitempty`** fields are dropped entirely when empty — code defensively
  (`tx.merchant ?? ""`), don't assume the key is present.

---

## 1. GET /v1/relay/me
Authenticated relay user profile (redacted vs pbank: **no `id`, `privy_did`,
`referral_code`, and `privy_mirror` wallets are hidden**).
Struct: `PublicUserSummary` — `internal/agent/redactor.go`.

```json
{
  "email": "user@example.com",
  "username": "maxm",
  "avatar_url": "https://api.relay.credit/v1/avatars/abc.png",
  "profile_name": "Max M.",
  "selected_design_id": 3,
  "total_balance": "125.50",
  "wallets": [
    { "address": "0xabc...", "chain_type": "ethereum", "is_primary": true }
  ],
  "cards": [ /* same objects as GET /v1/relay/cards, see §2; omitted if none */ ]
}
```
- `email`, `username`, `avatar_url`, `profile_name`, `selected_design_id`,
  `cards` are `omitempty`. `wallets` and `total_balance` always present.
- **Errors:** 401 (no/invalid token), 500.

## 2. GET /v1/relay/cards
The user's cards (summary view). Returns a **bare JSON array**.
Struct: `[]CardSummary` — `internal/service/card_service.go`.

```json
[
  {
    "card_id": "0a8f…uuid",
    "card_name": "My Card",
    "currency": "USD",
    "status": "active",
    "balance": "42.00",
    "design": null,
    "product": {
      "slug": "visa-debit-sg",
      "name": "Visa Debit",
      "network": "VISA",
      "country": "SG",
      "best_for": ["online", "subscriptions"],
      "wallet_support": ["apple_pay", "google_pay"]
    }
  }
]
```
- `card_id` is the **public UUID** — use it in all `/cards/:card_id` paths (never
  a CardsPro SAN). `balance` is a **string**. `card_name`, `product`,
  `product.wallet_support` are `omitempty`; `design` and `product` may be `null`.
- **Errors:** 500.

## 3. GET /v1/relay/cards/:card_id
Full card detail **including PAN/CVV** — fetched live from CardsPro, so treat as
sensitive and don't cache. `:card_id` is the UUID from §2.
Struct: `CardDetail` — `internal/service/card_service.go`.

```json
{
  "card_id": "0a8f…uuid",
  "card_name": "My Card",
  "card_number": "4111111111111111",
  "exp_year": 2028,
  "exp_month": 7,
  "cvv": "123",
  "status": "active",
  "balance": 42.0,
  "currency": "USD",
  "product": { /* CardProduct, see §2; omitempty */ }
}
```
- ⚠️ Here `balance` is a **number** (float64), unlike the string in §2.
- **Errors:** 404 (card not found or not owned by caller), 500 (CardsPro failure).

## 4. GET /v1/relay/balance
Off-card wallet/ledger balances, one row per currency.
Handler: `RelayHandler.GetBalance` — `internal/handler/relay_handler.go`.

```json
{
  "balances": [
    { "currency": "USD", "balance": "125.50" },
    { "currency": "EUR", "balance": "0" }
  ]
}
```
- `balance` is a **string**. Array order is not guaranteed — key by `currency`.
- **Errors:** 401, 500.

## 5. GET /v1/relay/deposit-addresses
The user's persistent per-chain deposit addresses.
Handler: `RelayHandler.GetDepositAddresses`; struct `UserDepositAddress` —
`internal/service/wallet_provisioning_service.go`.

```json
{
  "addresses": [
    { "chain": "evm",    "address": "0xabc..." },
    { "chain": "solana", "address": "5xz..." },
    { "chain": "tron",   "address": "T..." }
  ]
}
```
- `chain` is one of `evm` (covers all EVM chains), `solana`, `tron`.
- **Errors:** 401, 500.

## 6. GET /v1/relay/transactions
Aggregated activity (top-ups, card spends, withdrawals), paginated.
Struct: `[]AggregatedTransaction` — `internal/service/transaction_service.go`.

**Query params:** `page` (default `1`), `size` (default `20`, max `100`).
Returns a **bare JSON array** (no pagination envelope — page through until a
short/empty page).

```json
[
  {
    "id": 1012,
    "source": "topup",
    "amount": "50.00",
    "currency": "USD",
    "chain": "base",
    "token": "USDC",
    "tx_hash": "0x...",
    "status": "completed",
    "created_at": "2026-06-16T18:30:00Z"
  },
  {
    "id": 1009,
    "source": "card_spend",
    "amount": "12.30",
    "currency": "USD",
    "merchant": "NETFLIX",
    "card_san": "…",
    "created_at": "2026-06-15T09:05:00Z"
  }
]
```
- `source` ∈ `topup` | `card_spend` | `withdrawal`. `amount` is a **string**.
- Conditional (`omitempty`) fields depend on `source`: `chain`/`token`/`tx_hash`
  appear on top-ups; `merchant`/`card_san` on card spends; `status` where known.
- `created_at` is RFC 3339.
- **Errors:** 500.

---

### Auth errors (all endpoints)
- **401** — missing/expired/invalid token, or a **pbank** token used on a relay
  route (platform mismatch is rejected). Refresh via the relay refresh-token
  cookie and retry.
- **403** on issuance (`POST /v1/relay/payments/sessions`) — `kyc_required`; send
  the user through the KYC funnel (see `frontend-relay-kyc.md`).
