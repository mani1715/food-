# Aishu Foods payment hardening — review map

**Status:** candidate artifacts only. No remote DDL, migration-history writes, secret changes, function deployment, resource creation, or frontend publication was performed.

**Candidate migration:** `supabase/migrations/20261029110000_aishu_payment_lifecycle_hardening.sql`

**Target boundary:** `akublyjmyrcoeemuxugr` is the production project referenced by the handoff, not an approved staging target. Do not apply this migration there.

## Reported remote findings → proposed changes

The mapping below is based on the read-only inspection summarized in the handoff context and the supplied source ZIP. It is not a claim that this candidate has been executed against a live staging database.

| Reported finding | Proposed change | Why / safety gate |
|---|---|---|
| Reported `products.price` absent; pricing is in weight options | Use option prices exclusively; reject missing options | One consolidated checkout definition; no fabricated base-price column |
| Reported `order_items.id` defaults to an `oitem-` UUID string | Preserve existing column type and default | No swallowed ALTER DEFAULT failures |
| Customer insert policies permit bypassing authoritative checkout | Remove the two reported and two historical checkout INSERT policy names; retain admin policies | Verify all actual policies on staging; unknown permissive policies are not automatically removed |
| `public.orders` and `public.order_items` exist; the remote order table has `order_number NOT NULL` without a default | Create `order_number_seq` and `tracking_code_seq` if missing; synchronize forward only; `place_order_secure` explicitly supplies both identifiers | Sequence sync never moves backwards; unique versioned migration; order number is not left to a missing default |
| Remote `orders` already has `id` default, delivery fields, coupon scope and stock-history fields in partial form | Add only absent columns with `ADD COLUMN IF NOT EXISTS`; preserve existing IDs and unrelated data | Candidate is additive and reconciles known partial convergence rather than replaying 001–011 |
| Missing remote order columns: `payment_session_token`, `payment_token_expires_at`, `idempotency_key`, `idempotency_payload_hash`, `applied_coupon_code` | Add these columns and indexes | Required by guest payment authorization, order idempotency and coupon restoration |
| Remote `order_items.line_total` is missing | Add `line_total NUMERIC DEFAULT 0`; keep existing item snapshot and ID defaults | Checkout inserts explicit item details; existing rows are not deleted |
| Remote `orders.payment_status` default is `completed` | Set column default to `pending`, and `place_order_secure` explicitly writes `v_payment_status='pending'` for COD, UPI and Card | This is the explicit guard against accidental online checkout completion. Finalization is the only payment lifecycle path that marks paid/completed |
| Payment tables are absent: `payments`, `payment_refunds`, `payment_webhook_events`, `payment_refund_operations` | Create the tables, constraints, indexes and RLS policies | Refund and webhook operations need durable ledgers; foreign keys on financial history use `ON DELETE RESTRICT` |
| Payment RPCs were absent: `place_order_secure(JSONB)`, `record_payment_attempt`, `finalize_payment_success`, `record_payment_failure`, `record_refund_success`, `cancel_order_secure`, `cleanup_expired_unpaid_orders`, webhook claim/complete, refund-operation RPCs | Install one final definition for each intended signature and apply least-privilege grants | No intermediate legacy implementation is created and then replaced; old unsafe overloads are dropped where specified, without `CASCADE` |
| Remote `orders.customer_id` uses `ON DELETE SET NULL`; `order_items.order_id` uses `ON DELETE CASCADE` | Preserve those existing baseline relationships; use `RESTRICT` for payment/refund history and order relationships | Financial records should not disappear through order deletion; candidate does not rewrite the existing customer/order-item relationships |
| `pgcrypto` is already installed under `extensions`; Supabase auth helpers and `auth.users` exist | Use the existing `extensions` schema and fail-fast checks for `auth.uid()`, `auth.role()`, `auth.users` | No test auth stubs are installed. Migration aborts if required Supabase auth infrastructure is missing |
| The payment attempt RPC in local source inserted without idempotent replay semantics | Replace it with final `record_payment_attempt(text,text,numeric,text)` that validates authoritative amount and treats an identical provider-order replay as success | A network timeout can happen after a DB commit; one retry is safe only with this exact idempotency behavior and unique provider order ID |
| Local 013 has the hardened webhook lease token and refund reservation ledger | Use final `claim_webhook_event(text,text,text,integer)`, `complete_webhook_event(text,text,uuid,text)`, `initiate_refund_operation(text,text,numeric,text,uuid)`, `force_fail_refund_operation(uuid,text,text,boolean)`, and six-argument `record_refund_success` | Completion requires the matching unexpired lease; refund reservations and cumulative refund accounting are performed through trusted RPCs |
| The remote CLI migration list was empty and `supabase_migrations` schema was absent; existing local files share repeated date prefixes (`20260918_*`, `20261023_*`) | Candidate uses a unique 14-digit version; do not `db push`, replay, rename history, or insert tracking rows until baseline reconciliation is approved | Empty migration history does not prove an empty database. This is the highest-priority deployment blocker |

## Checkout and order lifecycle dependencies

`place_order_secure(JSONB)` uses these existing baseline objects and columns. The read-only preflight script must be run on the approved staging target to reconfirm them before any migration is approved:

- `auth.uid()` and `auth.role()` plus `auth.users`.
- `public.orders`: `id`, `order_number`, `tracking_code`, `customer_id`, customer name/phone/email, `delivery_address_json`, subtotal, delivery fee, discount amount, grand total, payment method/status, order status, timestamps, delivery days, cancel reason, admin notes, `applied_coupon_code`, idempotency fields, guest payment token fields.
- `public.order_items`: `order_id`, `product_id`, `product_name_snapshot`, `selected_weight`, `unit_price`, `quantity`, `line_total`.
- `public.products`: product identifier, inventory count, out-of-stock flag, updated timestamp, no base price column. `public.product_weight_options` supplies product_id, weight_label and price.
- `public.coupons`: code, usage count, limits/validity fields, discount configuration, and scope columns (`applies_to`, `target_category`, `target_product_id`).
- `public.stock_history_logs`: id, product id/name, type, quantity, note, admin name, created timestamp.
- `public.admin_roles`: user id, status (used by refund-operation staff read policy and Edge Function staff authorization).
- `public.payments`, `public.payment_refunds`, `public.payment_webhook_events`, `public.payment_refund_operations` created by this migration.

The candidate's preflight block checks the most critical base relations/columns/auth helpers and aborts on drift. The separate `preflight_read_only.sql` captures full columns, defaults, constraints, indexes, function definitions/search paths/owners, RLS policies and grants. Existing policy/grant state on baseline business tables was not exhaustively asserted in the prior read-only summary, so it must be reviewed from that output rather than assumed.

## Final RPC signatures intended

Only these final signatures are created by the candidate:

- `public.place_order_secure(jsonb)`
- `public.record_payment_attempt(text, text, numeric, text)`
- `public.finalize_payment_success(text, text, text, numeric, text, text, boolean, jsonb)`
- `public.record_payment_failure(text, text, text, text)`
- `public.record_refund_success(text, text, numeric, text, text, uuid)`
- `public.cancel_order_secure(text, text, text, boolean)`
- `public.cleanup_expired_unpaid_orders(integer)`
- `public.claim_webhook_event(text, text, text, integer)`
- `public.complete_webhook_event(text, text, uuid, text)`
- `public.initiate_refund_operation(text, text, numeric, text, uuid)`
- `public.force_fail_refund_operation(uuid, text, text, boolean)`

The candidate revokes browser-role writes to financial tables and grants mutation privileges to `service_role`; customer/staff SELECT policies remain scoped by order ownership or active admin role. Do not approve until preflight output confirms the target's existing role/policy state and the candidate passes on a disposable staging database.

## Payment-attempt recovery contract

1. Validate the Razorpay API response: a nonempty `order_...` ID, exact expected integer paise, `INR`, and an allowed `created` status if status is present.
2. Call `record_payment_attempt` and require `{ success: true, order_id: expected, provider_order_id: expected }`.
3. A business rejection (`success:false`) or malformed result never returns checkout success.
4. On a transport error, retry the database RPC exactly once with the same Razorpay order ID. The proposed RPC is idempotent for the same provider order/order/amount/currency tuple.
5. If the second attempt is still unresolved, return HTTP 503 with `success:false` and `PAYMENT_ATTEMPT_NOT_RECORDED`. Do not return a usable checkout payload, do not create a second Razorpay order automatically, and do not tell the customer to pay using the orphan order.
6. Reconcile the existing provider order by `provider_order_id` and retry recording only after verifying order ID, amount, and currency. Alert/support logs must avoid secrets and payment credentials.

## Migration-history strategy (no history changes in this package)

1. **Do not run `supabase db push` against production or an unconfirmed target.** The live schema is partially converged while the CLI history table/schema was absent. Replaying the historical migration set could fail, duplicate objects, or alter existing behavior.
2. On the selected staging database, first export schema-only state and run `preflight_read_only.sql`. Compare that output with the handoff and candidate assumptions.
3. Resolve duplicate version prefixes in source control separately: Supabase CLI migration versions are the numeric prefix before the first underscore, so the repeated `20260918_*` and `20261023_*` files collide as versions. Do not mass-rename and replay them.
4. Build a reviewed baseline snapshot representing the actual staging schema (not a guess from local files). Decide which prior schema changes are already represented in that baseline. Only after that review, use supported Supabase CLI migration-repair/baseline procedures for validated versions; never hand-insert into `supabase_migrations.schema_migrations` and never mark unverified migrations applied.
5. Test this candidate as a new forward migration on the isolated staging baseline, compare the resulting schema/function signatures/policies/grants with the expected state, and run all regression and integration tests.
6. Production rollout is a separate approval and separate plan. No production migration or history repair is authorized by these artifacts.

## Known review limitations

- Candidate SQL has not been executed against PostgreSQL/Supabase for this corrected snapshot because a local PostgreSQL client/server is unavailable in this environment. The Node suite now includes direct execution of the injected create-razorpay-order handler using fake dependencies; it does not prove SQL execution or live Razorpay/Supabase integration.
- Local source handoff reported 78 historical tests and a build passed on October 25, 2026; those historical results were not rerun for this artifact package.
- Full validation requires a selected staging project and Razorpay test mode. No secret values are included or requested.
