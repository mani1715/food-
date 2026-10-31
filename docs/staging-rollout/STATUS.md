# Staging verification — 2026-10-31

Target: `aura-foods-staging`, `mjnktiyufvzkibrsdxug`. Production `akublyjmyrcoeemuxugr` was read only. No production deployment, Git merge, or frontend publication.

## Installed and verified

Supabase recorded these migrations through its migration API. Local filenames below were aligned with the returned versions; no migration-history rows were edited manually.

| Version | Migration |
| --- | --- |
| 20261031022420 | staging_baseline_authorization |
| 20261031022547 | aishu_payment_lifecycle_hardening |
| 20261031023054 | trusted_staff_provisioning |

The baseline was generated from production catalog metadata: 19 tables, 163 columns, 67 constraints, non-constraint indexes, seven public triggers, and the Auth signup trigger. No production rows were copied. Production metadata snapshots are in `../payment-review-20261029/production-catalog-20261030.json` and `production-columns-exact-20261030.json`.

Intentional deviations: authorization comes exclusively from active `admin_roles`; `admin_profiles` is metadata. Sub-admins require exact permissions and do not satisfy `is_admin()`. Browser writes to authorization tables are revoked. Profile updates are limited to name, phone, and avatar. All exposed tables have RLS, with explicit operation grants. Helper search paths are pinned. Signup always creates a customer, regardless of user-editable metadata. Staff provisioning is audited and restricted to active super-admins or trusted service calls.

The payment migration changes payment status to pending and installs four financial tables and the hardened checkout/payment/refund/webhook/cancellation/cleanup RPCs. The staff migration adds one audit table. Final catalog: **24 tables, all with RLS**. Zero orders, payments, or staff authorizations remain after rolled-back tests.

## Evidence

- Local PostgreSQL: 36 authorization scenario batches passed under clean and broad initial grants, before and after payment migration. Independent minimal Auth simulation; no production data or legacy fixture installed.
- Actual staging SQL: checkout totals, weight prices, duplicate checkout, malformed checkout rejection, authenticated identity, direct order-insert rejection, pending Card/UPI, exact payment-attempt retry, failure/capture recovery, cancellation and cleanup passed. Synthetic test rows rolled back.
- Actual staging SQL: webhook leases and stale-worker rejection, duplicate delivery, refund reservations and cumulative bounds, conflicting replay and service-only RPC authorization passed. Synthetic rows rolled back.
- Actual Supabase signup trigger: forged metadata role ignored; self-enrollment and profile-role mutation rejected; permitted profile mutation succeeds.
- Trusted staff provisioning passed locally and on staging: customer/sub-admin escalation denied, last-super-admin removal denied, suspension removes permissions, audit records created. All synthetic identities rolled back.
- REST call to `place_order_secure(p_order_payload)` returns the expected HTTP 400 for an empty payload, **not** a missing-function/schema-cache error. This verifies discovery on staging only.
- Six payment Edge Functions deployed and ACTIVE (cleanup version 2; other functions version 1). Webhook JWT verification disabled for HMAC authentication; other functions retain JWT verification. Refund, reconciliation, and cleanup reject anon tokens with HTTP 401. Cleanup additionally requires admin/super-admin or explicit sub-admin `orders.cleanup` permission.
- Six targeted client/actual cleanup-handler regressions passed; `git diff --check` passed. Earlier complete project checks were reused rather than repeated.

Security advisors report intentional SECURITY DEFINER API exposure warnings for guest checkout and authenticated authorization/checkout/cancellation/staff functions. These are not a clean-advisor claim: bodies must retain their explicit ownership, role, permission, and input checks. No missing-RLS findings were reported.

## Remaining blockers — not production ready

A staging-only `staging-payment-health` function checked environment presence without returning values. Runtime result: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` **all absent**. This conflicts with the earlier user report that they were configured. Configure them in this exact project's Edge Function secrets; use `rzp_test_` credentials only. No secret values were requested, copied, or logged.

Provider checkout/capture, real test webhook HMAC delivery/retry, provider refunds, and browser end-to-end flow remain unverified. Database simulations do not establish provider integration success. Production's original missing-RPC failure remains unmodified.

No real staff account was provisioned. Trusted provisioning requires an existing verified Auth user; bootstrap the first super-admin through a server-side service-role call to `manage_staff_account`, then use active super-admin sessions. Do not expose service credentials in the browser or authorize through profile metadata. Legacy profile-only identities have no admin authority until explicitly provisioned.

Staging has schema only and no persistent product catalog or test users. Before browser testing, seed synthetic catalog/users and run a frontend configured solely for this staging URL. A frontend deployment and production rollout still need their own verified configuration and approval.

## Next validation

1. Recheck credential presence and `rzp_test_` mode after secrets are saved.
2. Seed synthetic catalog/test identities; execute actual browser checkout and Razorpay test capture.
3. Verify signed webhook success, duplicate/retry behavior, invalid signatures, payment failure/recovery, and provider refunds, including exact and cumulative limits.
4. Reconcile provider IDs, ledger rows, stock/coupon effects, and partial failures. Check logs without exposing credentials/signatures.
5. Review production-specific migration risks, recovery/backup plan, and rollout; seek explicit production approval. Do not replay the staging baseline into production.

## Recovery and tracking

Do not run the repository's historical 001–013 migrations against this staging database. The isolated migration directory here records only the actually installed sequence. The consolidated SQL's original review-only header is preserved for provenance; this status file records its later staging execution. No blind down migration or deletion of financial records is an approved recovery action.

The staging health endpoint returns only configuration booleans and requires a valid project JWT. It does not perform payment operations. It may be removed after integration validation.
