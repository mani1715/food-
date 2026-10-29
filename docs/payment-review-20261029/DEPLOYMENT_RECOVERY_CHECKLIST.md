# Deployment / recovery checklist — review only

## Before approving any staging execution

- [ ] Select and explicitly confirm a non-production Supabase project. `akublyjmyrcoeemuxugr` is not treated as staging.
- [ ] Confirm Razorpay test mode and verify secret *presence only* in the selected staging project. Never paste or log secret values.
- [ ] Take a recoverable staging backup/snapshot and preserve current Edge Function source/config.
- [ ] Run `preflight_read_only.sql`; inspect base columns/defaults, constraints/FKs, sequences, function signatures/owners/search paths/grants, RLS policies and migration tracking state.
- [ ] Resolve duplicate/malformed payment provider IDs before creating unique indexes; migration intentionally aborts on duplicate IDs.
- [ ] Verify `orders.payment_status` default will be `pending` and confirm `place_order_secure` explicitly writes `pending` for online checkout.
- [ ] Review the migration-history baseline; do not run `db push`, replay old migrations, or edit migration history until approved.
- [ ] Execute candidate only on disposable staging; stop immediately on any schema-preflight mismatch or migration error.
- [ ] Run Node regression tests and full project tests/build, then test Supabase/Razorpay test-mode integration.

## Regression scenarios to pass

- [ ] Razorpay API non-2xx response, invalid JSON, missing order ID, amount mismatch, currency mismatch, unexpected status.
- [ ] RPC transport error before/after commit; same-ID retry succeeds idempotently.
- [ ] RPC returns `success:false`, null/malformed JSON, wrong order ID, or wrong provider order ID; checkout never returns `success:true`.
- [ ] Repeated transport failure returns 503 `PAYMENT_ATTEMPT_NOT_RECORDED`; no second Razorpay order is created automatically.
- [ ] Online UPI/Card orders are `pending` immediately after creation even if old default was `completed`.
- [ ] Duplicate webhook events do not repeat financial effects; stale/expired claim tokens cannot complete events.
- [ ] Refunds are atomic, reservations are counted, cumulative refunds never exceed captured amount, and replayed refund IDs must match payment/order/amount.
- [ ] Cancellation and unpaid-order cleanup release inventory/coupon usage exactly once and never erase financial history.
- [ ] Payment/refund tables deny direct browser writes; customer/staff reads are constrained by RLS.

## Edge Function rollout order (staging only)

1. Apply the reviewed database migration and verify final RPC signatures/grants.
2. Deploy `create-razorpay-order` with `_shared/payment-attempt.js` as a bundled relative dependency.
3. Deploy the matching final `verify-razorpay-payment` and `razorpay-webhook` sources.
4. Deploy `refund-razorpay-payment`, `reconcile-razorpay-payment`, and `cleanup-unpaid-orders` only after their dependencies are present and tested.
5. Run end-to-end Razorpay test-mode checkout, webhook retry, cancellation, refund, reconciliation and cleanup scenarios.
6. Observe logs and verify there are no unresolved payment attempts, duplicate financial records, stale leases, or unauthorized RPC calls.

## Recovery if a Razorpay order was created but its DB attempt cannot be recorded

- The function returns a failure response and does not provide a usable checkout payload.
- Do not create another Razorpay order automatically and do not ask the customer to pay using the orphan provider order.
- Use the provider order ID from server logs to inspect Razorpay test-mode state and the database. Do not log credentials or signatures.
- Retry `record_payment_attempt` with the same provider order ID only after confirming order ID, amount and currency. The candidate RPC accepts exact replays and rejects conflicting replays.
- If the provider order was never paid, it can remain unused; document the orphan and close it operationally. If any payment unexpectedly exists, reconcile/finalize or refund through the audited payment lifecycle, never by manual table edits.
- If migration execution fails, stop; capture the exact error and current schema. Do not run a blind down migration or drop financial tables. Restore the staging snapshot only after assessing whether any test financial data needs preservation.

## Explicit non-actions

This package does not create a project/branch, alter secrets, run SQL remotely, change migration history, deploy Edge Functions, or publish frontend code.

## Consolidated candidate update

Use only the consolidated candidate in this review folder; do not apply the separate checkout draft or previous candidate first. Local execution and rerun now pass on the reported-schema fixture (see LOCAL_VALIDATION.md); this does not replace real Supabase staging. Preserve existing item-ID defaults and use weight-option prices exclusively. Verify unknown INSERT/ALL policies do not allow customer bypass. Sequence setval effects on existing sequences can survive rollback; preserve forward progress and allow gaps.
