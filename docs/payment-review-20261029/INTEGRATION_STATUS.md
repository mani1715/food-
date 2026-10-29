# Payment review integration status

The corrected October 29 package is preserved in this folder, including its checksum manifest. The create-order handler, shared helpers, and behavioral tests are also integrated into the application source tree.

The consolidated SQL stays here as a review candidate, outside the active migration directory. Do not run db push or replay historical migrations: their repeated version prefixes and the remote migration baseline still require reconciliation. The application handler requires the reviewed idempotent record_payment_attempt RPC before deployment.

Local evidence: 11 package checksums verified; 12 package tests passed; candidate preflight, migration execution and repeat execution passed on disposable PostgreSQL fixtures; targeted database assertions passed. These results do not certify the actual remote schema or Supabase/Razorpay integration.

Production deployment is blocked pending a confirmed non-production Supabase target, remote schema comparison, approved migration plan, full Razorpay test-mode lifecycle validation, and a recovery plan. No secrets, remote SQL, Edge deployments, or frontend publication are authorized by this code update.

The source repository publishes production on pushes to main. Keep this work on a review branch until deployment is explicitly approved.

Repository packaging removed trailing SQL whitespace and regenerated the manifest. The original downloaded ZIP remains unchanged. Package bytes are preserved by a local .gitattributes rule.
