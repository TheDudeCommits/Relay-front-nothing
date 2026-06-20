# Relay — buy crypto-funded debit cards over Virtuals ACP

relay.credit issues real Visa/Mastercard virtual cards funded with USDC, sold to
AI agents over the Virtuals Agent Commerce Protocol (ACP). This file tells an AI
agent (e.g. Claude Code) how to onboard a user and buy/manage Relay cards.
Pair it with https://os.virtuals.io (which installs the `acp` CLI): the user
typically says "install os.virtuals.io and relay.credit".

## Prerequisites
- The Virtuals `acp` CLI, installed + authenticated via os.virtuals.io. You drive
  it as `acp <command>` (run `acp skill print` once to load its operating rules;
  authenticate with the split flow: `acp configure start` → relay the URL to the
  human → `acp configure complete`, never bare `acp configure`).
- A buyer agent that is configured, has a signer, and is funded with USDC on Base.
  REUSE an existing one: run `acp agent list` first and, if the user already has a
  buyer agent, ask which to use rather than creating a duplicate. Its wallet
  address is the BUYER_WALLET used throughout.
- A buyer under the SAME Virtuals account as Relay may be blocked by ACP — use a
  separate account if `client create-job` refuses.

## Seller identity
- Provider (EVM wallet): 0x6c0b29c91496880729167f8dce4df1951d1e1a71
- Chain: Base mainnet, chainId 8453, settled in USDC
- Discover: `acp browse "Relay"` (the provider address above is canonical)

## Step 1 — Discover products (free read-only resources; fetch with curl)
- Catalog:  curl -s https://api.relay.credit/v1/relay/products
  → array of {slug, price, currencies, issue_min_amount, top_up_min_amount}.
  Use `slug` as product_id. Cheapest to test: gaming-sg (Singapore).
- Find a card for a merchant/brand:
  curl -s "https://api.relay.credit/v1/relay/products/search?merchant=<name>"   (e.g. merchant=netflix)
- Per-merchant FX/processing rates: curl -s https://api.relay.credit/v1/relay/products/merchant-rates

## Step 2 — Onboard the user (REQUIRED before any purchase)
Relay cards are owned by a real relay.credit account; link the buyer wallet to one:
1. curl -s "https://api.relay.credit/v1/relay/acp/link?wallet=<BUYER_WALLET>"
   → {"url": "https://relay.credit/link?token=..."}
2. Give the user that `url` and tell them to OPEN IT IN A BROWSER. There they
   sign up / sign in (email or wallet) and complete KYC — which binds BUYER_WALLET
   to their relay.credit account (where the cards live + show on a dashboard).
3. WAIT for the user to confirm they've signed up + finished KYC before buying.

## Money model
You send a total; the card receives that total minus the card price (purchase
only) and a 4% fee charged on the load. fee_rate = 0.04.
- purchase: send = card_price + load × 1.04   (card_price = product issuance price)
- top-up:   send = load × 1.04                (no card price)
Minimums are Relay's (issue_min_amount / top_up_min_amount from the catalog). If
you send too little, the job is rejected with the exact minimum to send.

## Step 3 — Buy / manage cards (paid offerings; `client create-job` + `client fund`)
purchase_card — issue + load a new card:
  acp client create-job --provider 0x6c0b29c91496880729167f8dce4df1951d1e1a71 \
    --offering-name purchase_card --chain-id 8453 \
    --requirements '{"service_type":"purchase_card","wallet_address":"<BUYER_WALLET>","product_id":"<slug>","amount":<total>}'
  acp client fund --job-id <id> --amount <total> --chain-id 8453
  → deliverable carries {card_id, load_usd, ...}
topup_card    — offering-name topup_card; requirements add "card_id"; amount = top-up total.
balance_check — offering-name balance_check (flat $0.01); requirements {service_type, wallet_address}.
freeze_card / unfreeze_card — flat $0.01; requirements {service_type, wallet_address, card_id}.

## Resuming mid-flow / common rejections
- Buyer agent already exists → `acp agent list`, reuse it (don't create a new one).
- "account_not_linked" → run Step 2 (onboard) first, then retry.
- "kyc_required" → the user must finish KYC at relay.credit, then retry.
- below-minimum → the reason states the exact minimum; resend with that amount.

## Human touchpoints (only these need a browser)
1. Virtuals sign-in (`acp configure`) — once.
2. Funding the buyer wallet with USDC on Base.
3. The relay.credit account-link URL + KYC (Step 2).
Everything else is CLI/curl driven by you, the agent.
