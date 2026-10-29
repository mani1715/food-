# Aishu Foods — payment lifecycle review artifacts

This is a **review-only patch package** prepared from the October 29, 2026 source handoff. It is not a deployment bundle and does not include credentials or `.env` files.

## Contents

- `supabase/migrations/20261029110000_aishu_payment_lifecycle_hardening.sql` — candidate forward migration, unique version, final RPC signatures only.
- `supabase/functions/create-razorpay-order/index.ts` — proposed Edge Function patch.
- `supabase/functions/_shared/payment-attempt.js` — validation and idempotent recording/recovery helper used by the Edge Function and tests.
- `supabase/functions/_shared/create-razorpay-order-handler.js` — dependency-injected handler implementation used by the deployed Edge Function and executed directly by Node regression tests.
- `test/payment_attempt.test.mjs` — helper and response-gating regression tests.
- `test/create_razorpay_order_handler.test.mjs` — handler-level tests for HTTP 503, withholding checkout details, same-provider-order-ID database retry, and exactly one Razorpay order-create request.
- `preflight_read_only.sql` — read-only target inventory queries.
- `CHANGE_MAP.md` — verified remote finding → proposed change mapping and migration-history strategy.
- `DEPLOYMENT_RECOVERY_CHECKLIST.md` — concise rollout and recovery checklist.

## Test

From this directory run:

```sh
node --test test/*.test.mjs
```

Result for the corrected artifact snapshot: **12 tests passed** across the helper and the actual injected handler implementation. Handler tests use fake Supabase/Razorpay dependencies; they verify response status and payload behavior but are not a live Supabase/Razorpay integration test. SQL execution against the target schema and full application suite remain unverified.

## Important

No remote changes were performed. `akublyjmyrcoeemuxugr` is not approved as staging. Do not run the candidate migration until a non-production target is explicitly selected, the migration-history baseline is reconciled, and the candidate passes SQL/integration testing on that target.
