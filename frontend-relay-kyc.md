# Relay KYC — Frontend Guide

Relay card **issuance is KYC-gated**: a relay user must have an **APPROVED** KYC
application before `POST /v1/relay/payments/sessions` will issue a card. Until
then that endpoint returns **403 `kyc_required`**. This doc covers the funnel and
the exact data fields.

- **Base path:** `/v1/relay/kyc`
- **Auth:** relay JWT — `Authorization: Bearer <relay access token>` on every call
  (obtained from `POST /v1/relay/auth/privy`).
- The external user id presented to CardsPro is the relay user id; you never send
  it — it's derived from the JWT.

## Funnel (order matters)

| # | Call | Body | Returns |
|---|------|------|---------|
| 1 | `POST /v1/relay/kyc/start` | `{ "sort": "", "callback_url": "" }` (both optional) | `{ "uuid": "...", "urlForUser": "https://verify.photo/..." }` |
| 2 | `POST /v1/relay/kyc/{uuid}/data` | the 18-field JSON below | `{ "success": true }` |
| 3 | `POST /v1/relay/kyc/{uuid}/picture/{type}` | **raw JPEG bytes** | `{ "success": true }` |
| 4 | `POST /v1/relay/kyc/{uuid}/confirm` | _(empty)_ | `{ "success": true }` |
| 5 | `GET /v1/relay/kyc/status-by-uuid/{uuid}` | — | `{ "status": "...", "reason": "", "uuid": "...", "kycExternalUserId": "..." }` |

Notes:
- **Step 1 — `sort`/`callback_url` optional.** Leave `sort` empty: the server
  resolves the account's active KYC sort from the live CardsPro catalog. Leave
  `callback_url` empty: the server uses its own webhook URL. Persist the returned
  `uuid` — every later step needs it. `urlForUser` is a hosted page the user can
  alternatively complete the document capture on.
- **Step 3 — picture upload is raw binary, NOT multipart.** Put the JPEG bytes
  directly in the request body with `Content-Type: application/octet-stream`.
  `{type}` is `document_front` or `document_back`. Use a real photo — 1×1 / empty
  placeholders are rejected downstream.
- **Step 5 — poll status** by `uuid` (the `status/{sort}` route 404s for fresh
  applications; prefer `status-by-uuid`). Status also updates automatically via
  CardsPro webhook, so you mostly poll to drive UI.

## `set-data` fields (step 2)

All 18 fields are **required**. Several are **coded** — send the code string, not
free text. Sending bad/missing values returns **400** with the offending field
named (validated server-side before anything reaches CardsPro).

| Field (JSON key) | Required | Format / allowed values |
|---|---|---|
| `documentCode` | yes | `"1"` = ID card, `"2"` = Passport |
| `documentNumber` | yes | the document's identification number |
| `documentIssuePlace` | yes | where the document was issued |
| `fullName` | yes | full name in the original language |
| `fullNameEn` | yes | full name in English |
| `genderCode` | yes | `"1"` = Male, `"2"` = Female |
| `birthDate` | yes | `YYYY-MM-DD` (e.g. `"1990-05-15"`) |
| `occupationCode` | yes | a string `"1"`–`"13"` (occupation code) |
| `nationality` | yes | ISO 3166-1 **alpha-2**, uppercase (e.g. `"DE"`) |
| `country` | yes | ISO 3166-1 **alpha-2**, uppercase (e.g. `"DE"`) |
| `province` | yes | state / province name |
| `addressLine` | yes | residential address |
| `addressEn` | yes | residential address in English |
| `city` | yes | city name |
| `postalCode` | yes | postal code |
| `areaCode` | yes | phone country calling code (e.g. `"+49"`) |
| `phone` | yes | phone number (without the area code) |
| `email` | yes | **max 29 characters** |

### Example `set-data` body
```json
{
  "documentCode": "2",
  "documentNumber": "P1234567",
  "documentIssuePlace": "Berlin",
  "fullName": "Max Mustermann",
  "fullNameEn": "Max Mustermann",
  "genderCode": "1",
  "birthDate": "1990-05-15",
  "occupationCode": "3",
  "nationality": "DE",
  "country": "DE",
  "province": "Berlin",
  "addressLine": "Musterstrasse 1",
  "addressEn": "Musterstrasse 1",
  "city": "Berlin",
  "postalCode": "10115",
  "areaCode": "+49",
  "phone": "1701234567",
  "email": "max.mustermann@example.com"
}
```

### Validation errors (400)
The server returns `400 { "message": "<reason>" }` for, e.g.:
- `kyc data: missing required fields: city, email`
- `kyc data: documentCode must be 1 (ID card) or 2 (passport), got "PASSPORT"`
- `kyc data: genderCode must be 1 (male) or 2 (female), got "M"`
- `kyc data: occupationCode must be 1-13, got "0"`
- `kyc data: nationality must be an ISO 3166-1 alpha-2 code, got "DEU"`
- `kyc data: birthDate must be formatted year-month-day ... got "15/05/1990"`
- `kyc data: email must be at most 29 characters, got 39`

## Status lifecycle

`status` (from step 5) is one of:

| Status | Meaning | Can issue a card? |
|---|---|---|
| `NEW` | application created | no |
| `COMPLETED` | form fully submitted, awaiting review | no |
| `UNDER_REVIEW` | CardsPro reviewing | no |
| `APPROVED` | verified — ready to use | **yes** |
| `DECLINED` | rejected (`reason` explains) | no — restart the funnel |
| `EXPIRED` | application expired | no — restart |

Typical flow: `NEW → COMPLETED → UNDER_REVIEW → APPROVED`. Only **APPROVED**
unblocks issuance. While not approved, `POST /v1/relay/payments/sessions` for an
issuance returns **403** with body `{ "message": "kyc_required" }` — surface a
"complete KYC" prompt and route the user into this funnel.

> pbank (the consumer app) is **not** KYC-gated and only offers non-KYC cards —
> this funnel is relay-only.
