# Payment review integration status

The candidate in `supabase/migrations/20261029110000_aishu_payment_lifecycle_hardening.sql` under this review folder now consolidates the reported-schema checkout correction and the complete payment lifecycle. It is the single candidate for staging review; it supersedes the separate checkout-only draft and earlier candidate contents. It is not installed remotely.

Checkout uses weight-option prices only and preserves the existing item ID default. The migration includes payment/refund/webhook ledgers, all lifecycle RPCs, grants, customer INSERT-policy removal, and a transaction boundary. Existing active historical migrations are not a production deployment plan and must not be replayed.

The production handler and regression tests were already integrated into the source tree. Deployment still requires the matching database RPCs first. The new local database tests and their evidence are documented in LOCAL_VALIDATION.md.

The reported catalog came from the user's other chat. This workspace has not independently connected to the production catalog. Local fixtures cover the supplied findings; they are not a complete production export or full Supabase runtime.

Keep the GitHub PR in draft: a separate Supabase staging target, remote schema/history reconciliation, real Razorpay test-mode lifecycle validation, recoverable production rollout, and explicit deployment approval remain required. A push to main triggers frontend production publishing.

No remote SQL, migration-history edits, secrets, Edge deployments or frontend publication were performed. SHA256SUMS.txt covers the current review package except itself and .gitattributes. Original downloaded ZIPs remain unchanged.
