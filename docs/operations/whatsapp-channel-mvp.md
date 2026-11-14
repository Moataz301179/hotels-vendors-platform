# WhatsApp channel MVP

Status: **implemented on branch, not production-deployed**. Follows the existing
Meta-default outbound gateway in `lib/notifications/whatsapp.ts` (Twilio fallback).

## What shipped

| Surface | Path | Notes |
| --- | --- | --- |
| Outbound send | `sendWhatsApp()` | Meta Cloud API default; Twilio fallback |
| Unified notify | `notify({ channel: "WHATSAPP" })` | Persists first; sends only when configured + phone present |
| Order transitions | `lib/orders/notify.ts` | Hotel WhatsApp when `allowExternal`; supplier stays in-app |
| Channel readiness | `GET /api/v2/notifications` | `channels.whatsapp` reflects env configuration |
| Inbound webhook | `GET\|POST /api/webhooks/whatsapp` | Meta verify + HMAC; public via `/api/webhooks` prefix |
| Commands | `HELP` / `STATUS` / `STOP` | Linked phones only for STATUS; buyer-safe copy |

## Product boundaries

- Does **not** create orders, approve credit lines, or pay POs.
- Credit-line legibility and funder invoice acceptance remain on the desk/funder path.
- Buyer-facing STATUS returns **order number + status only** — no supplier identity,
  source URLs, stock, or commercial terms.
- Supplier external WhatsApp remains suppressed until final release (existing gate).

## Env vars (never commit values)

```
WHATSAPP_PROVIDER=meta
WHATSAPP_BEARER_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
# optional Twilio fallback
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
```

Webhook callback URL for Meta: `https://<host>/api/webhooks/whatsapp`

## Launch gaps

1. Meta Business verification + approved message templates for cold outreach windows.
2. Production secrets on the host (not in repo).
3. Phone-verified user population large enough for STATUS to be useful.
4. Twilio inbound signature path (outbound-only fallback today).
5. Owner approval before merge/deploy.
