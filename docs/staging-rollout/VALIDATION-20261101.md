# Staging integration results — 2026-11-01

This report supersedes the credential and provider-test blockers in STATUS.md. Production remains unchanged. Staging project: `mjnktiyufvzkibrsdxug`. Do not treat this report as production deployment approval.

## Verified with actual services

- Runtime confirms all three Razorpay secrets present and the key uses test mode. No secret values are in this report or repository.
- Localhost browser harness created an order through the real staging checkout RPC and deployed create-order Edge Function, then opened Razorpay Test Mode checkout.
- Test capture succeeded: store order `ord-0ce1cd5f-df05-491f-af69-e29e38098d08`, provider order `order_Tus9M9hSX1KD9N`, payment `pay_TusA4BcLrmCc44`, INR 548.00 simulated funds. Callback verification returned success.
- Actual Razorpay `payment.captured` event `TusAIWA1xNR2Zf` and `order.paid` event `TusAInjsWFSBaX` were signature-verified and processed. The database confirmed captured payment and confirmed order before refund testing.
- Admin reconciliation fetched the actual test payment from Razorpay and returned successful idempotent synchronization.
- Missing and invalid webhook signatures both returned HTTP 400. Signed replay of the captured payment returned HTTP 200; repeating the same event ID returned `already_processed` with no duplicate financial row.
- Refund inputs with zero value, sub-paise precision, and amount above capture were rejected with HTTP 400.
- The explicitly approved INR 1.01 test refund was accepted as pending; exact retry returned the same refund ID `rfnd_TusE3QPDusvgKp`.
- Requesting INR 547 while INR 1.01 was reserved was rejected: the available amount was INR 546.99.
- Razorpay later confirmed the INR 1.01 refund as processed. Its real `refund.processed` webhook reached staging and was processed.

## Bug found and fixed

The refund webhook omitted `refund.notes.operation_id` when calling `record_refund_success`. This recorded the refund but left its originating operation in `initiated`, incorrectly retaining the reservation.

The webhook now passes the operation ID, which the database validates against order/payment/amount. External refunds without that note still pass null. Twenty-three targeted actual-webhook-handler tests pass, including the two added reservation-link scenarios. The corrected webhook is deployed to staging (returned version 4).

After replaying the actual processed refund through the corrected handler with a fresh diagnostic event ID, the operation became `completed`. Repeating that event returned `already_processed`. Final payment status is `partially_refunded`, refund ledger total is INR 1.01, and no duplicate refund was created.

## Unresolved result — full refund not certified

The exact remaining INR 546.99 refund is rejected by Razorpay with HTTP 400:

```json
{"code":"BAD_REQUEST_ERROR","description":"invalid request sent","metadata":{},"reason":"NA","source":"NA","step":"NA"}
```

The same idempotency key was retained throughout diagnosis (`staging-remainder-20261101`). The request used integer amount 54699 paise and the recorded operation ID. The provider returned the same error after the first refund had processed. No alternative idempotency key was used to circumvent the rejection. The operation remains `failed`; no remainder refund was recorded or reported as successful.

Inspect this specific test request in Razorpay's dashboard/support before further retries. The response does not establish whether the cause is a test-account restriction, provider validation, or another provider issue. Full-refund completion and completed-full-refund retry behavior remain unverified.

## Cleanup and limits

- Automatic approval review initially rejected the temporary validation helper. The user then explicitly approved refunds only for the named INR 548 test payment; the helper enforced the staging URL, `rzp_test_` key, exact payment ID, a private validation token, and expiry.
- Temporary staff sessions were used for the normal authenticated refund/reconciliation endpoints. Test staff authorizations were revoked and their Auth users removed. Verified remaining test staff and test Auth user counts: zero. Audit/financial history was retained.
- The temporary `staging-payment-validation` function was removed after testing. No production secrets or live-payment resources were accessed for these tests.
- The localhost harness exercises the actual backend and Razorpay widget, not the complete storefront React UI. Full storefront UI validation remains a separate gate.
- Earlier database tests cover lease expiry/stale workers, atomic refund bounds, checkout idempotency, cancellation, cleanup, and partial-failure recovery; these were not redundantly rerun.
- No production migration, main-branch merge, frontend publication, real charge, or real refund was performed.

Screenshot: `test-payment-success-20261101.png`. The screenshot records capture before the later partial-refund test.
