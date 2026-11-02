# Consolidated candidate: local PostgreSQL validation

Date: October 29, 2026. Result: PASS on PostgreSQL 17 at 127.0.0.1:55439, isolated aishu-stage-c data directory. Final run database: aishu_consolidated_1793268754883 (retained for inspection).

## Reproduce

With the existing isolated cluster running and anon/authenticated/service_role fixture roles present, from the repository root:

```sh
node docs/payment-review-20261029/test/run_local_postgres.mjs
node --test docs/payment-review-20261029/test/*.test.mjs
```

The runner verifies localhost, port and disposable data-directory identity before creating a uniquely named test database. It has no remote host option, does not reset existing databases, and retains results. AISHU_PSQL may specify the local psql executable. Never run the fixture SQL on a real Supabase project.

## Baseline and limits

`test/reported_baseline.sql` uses repository migrations 001 and 002 only to construct base relations and admin helpers. It then models the reported differences: no products.price, 21 synthetic products/49 synthetic weight options, text item IDs with an oitem- UUID default, completed default on unpaid orders, coupons.is_enabled, missing checkout RPC/sequences/session fields/line totals, and absent payment ledgers. It models the two reported customer INSERT policies and admin-only ALL policies. No production data is copied.

Unreported details use repository definitions and are assumptions, including exact types, other constraints/triggers/policies, admin-helper semantics and grants. Test auth helpers simulate JWT claims; this does not test real Supabase authentication, PostgREST cache visibility, Edge deployments, storage, or Razorpay networking/signatures end to end. The reported production catalog must still be compared with a schema export on approved staging. Earlier fixtures with products.price are superseded for this candidate.

## Passed checks

- Baseline assertions confirm no checkout function, payment table, order sequence or products.price and correct synthetic catalog counts.
- Read-only preflight before and after installation; full consolidated migration installation and repeat installation.
- Item-ID default preserved; pending order default; PUBLIC execute denied; authenticated direct order INSERT denied.
- Guest COD, authenticated Card and service-context UPI checkout; authoritative option pricing; matching frontend response; pending status; customer identity; exact retry creates one order.
- Invalid method, empty cart, invalid quantity/weight/product/coupon, insufficient stock and absent price reject checkout.
- Coupon totals, retry usage counted once, and an injected downstream insert failure rolls back order/coupon/stock changes.
- Payment-attempt same-ID retry, mismatched amount/currency rejection, failure-to-capture recovery, capture replay, and delayed failure cannot downgrade capture.
- Unpaid cancellation and timeout cleanup restore stock/coupon use exactly once.
- Reused Stage C SQL assertions: webhook leases and stale tokens, refund reservations, exact/cumulative refund limits, duplicate/conflicting refund IDs, audit-retention FKs, RPC/table grants and NULL role rejection. Legacy overload privilege assertion omitted because that overload does not exist in this baseline.
- Independent concurrent sessions: identical checkout requests create one order and debit stock once; competing 400 and 200 refunds against a captured 548 payment allow only one reservation.
- Checkout and lifecycle transactional assertions pass again after migration rerun.
- 13 Node helper/actual-handler/artifact tests pass; no network payment is made.

Full frontend build and unrelated authentication tests were not rerun; this change edits only review SQL, documentation and local validation files. Prior build evidence is not a claim of production compatibility.

## Remaining deployment gates

Use one candidate, not both old drafts. Reconcile remote migration history and unknown policy/constraint differences before applying to a confirmed non-production Supabase target. Complete actual test-mode payment, webhook, refund and partial-failure recovery validation there. Do not merge the draft PR to main or deploy without separate approval.

Migration DDL is wrapped in a transaction. Existing sequence setval operations are not undone by transaction rollback; harmless gaps may remain. Never promise gapless IDs or reset sequence values during recovery.
