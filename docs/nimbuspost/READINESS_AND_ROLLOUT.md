# NimbusPost readiness and rollout

## Current safeguards

- Shipping defaults to disabled and test mode in migration `20260918_011_shipping_and_nimbuspost_foundation.sql`.
- The migration does not invent a pickup address. An operator must configure and verify the actual pickup location.
- Shipment creation requires an active staff permission, enabled provider settings, a paid or COD order, complete stored parcel data, a valid delivery address, and a configured pickup location.
- One durable shipment reservation is created before the external booking request. Provider timeouts and database failures hold the reservation for manual reconciliation; they do not automatically create another booking.
- Webhooks require `NIMBUSPOST_WEBHOOK_SECRET` in `x-nimbuspost-webhook-secret`, then validate the reported AWB/status through authenticated NimbusPost tracking. Database deduplication and shipment/order updates run through one transaction.
- Unknown status values, unsupported transitions, unverified tracking, missing secrets, and missing credentials fail closed.
- Browser roles have read-only shipment/event policies; state changes use controlled RPCs or service-role Edge Functions.

## Required Edge Function configuration

Use Supabase Edge Function secrets. Never put these values in frontend variables or commit them:

- `NIMBUSPOST_API_KEY`
- `NIMBUSPOST_EMAIL`
- `NIMBUSPOST_PASSWORD`
- `NIMBUSPOST_WEBHOOK_SECRET`
- `NIMBUSPOST_SHIPMENT_CONTRACT_VERIFIED=true` only after the provider's exact shipment request/response contract and test-mode behavior have been confirmed. This is a safety gate, not a secret.

An existing bearer token may be used as `NIMBUSPOST_TOKEN` in place of the account login fields if NimbusPost confirms the token's scope and lifecycle. Do not configure both authentication methods casually; the code prefers the supplied standing token.

## External contract gates before enabling live booking

The official NimbusPost SDK confirms the V1 base URL, bearer-token requests, login payload fields (`key`, `email`, `password`), the `/shipments` create endpoint, and `/shipments/track/{awb}` tracking path. The public API material available here does not expose the full create-shipment request schema or explain how NimbusPost transmits its optional webhook secret. The linked Postman collection timed out during review.

Before booking is enabled, NimbusPost support/account documentation must confirm:

1. Exact request and response schemas for serviceability and shipment creation, including weight units, item fields, warehouse/pickup identifier, COD amount, and the provider's idempotency support.
2. Whether a true sandbox/test account or endpoint exists. The local `test_mode` setting is not proof of provider-side simulation; the handler blocks bookings while it is true.
3. Exact webhook authentication transport/header or signature algorithm and retry behavior. The handler currently requires the explicit shared-secret header contract above and independently confirms status using the provider API.

Do not set `NIMBUSPOST_SHIPMENT_CONTRACT_VERIFIED=true`, enable `shipping_settings.enabled`, or set `test_mode = false` until those contracts are validated with a non-production account and the staging checklist passes. The current endpoint uses NimbusPost's production API host; no live shipment has been created as part of this code review.

## Staging rollout order

1. Review the migration against the selected staging schema and migration history. The migration assumes the application's core tables, `audit_logs`, `stock_history_logs`, `admin_roles`, `has_admin_permission`, and Supabase Auth are present.
2. Apply the shipping migration only to staging after reviewing any duplicate webhook hashes, existing shipping objects, constraints, and grants.
3. Deploy the three NimbusPost Edge Functions with their shared dependencies. Keep `shipping_settings.enabled = false` and `test_mode = true`.
4. Configure the four required secrets directly in the staging Supabase dashboard; verify presence only.
5. Configure a NimbusPost test webhook using the confirmed authentication contract. Test invalid secret, valid event, duplicate delivery, stale/out-of-order update, unknown AWB, provider lookup failure, and database failure.
6. Run serviceability and a provider-approved test booking only if NimbusPost confirms that the account/API is non-billing test mode. Verify the provider booking and local shipment/event/order rows reconcile.
7. Keep production deployment and production settings as separate approvals.

## Recovery for an uncertain booking

An active reservation without a provider shipment ID or AWB is intentionally not retried by the function. An operator must search NimbusPost by the stable `order_number`/provider order reference and reconcile it with the reservation. Only cancel/close the reservation after NimbusPost confirms that no shipment was created. Never delete the shipment audit row to force another booking.
