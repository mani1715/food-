# Staging baseline preparation

## Reported target

The user supplied read-only findings for aura-foods-staging, project ref `mjnktiyufvzkibrsdxug`, organization `xpvbpvhxgbihqkgmyucj`, Mumbai, PostgreSQL 17, ACTIVE_HEALTHY. Public application tables/functions and application migration history are reported empty. These are external findings, not independently verified from this workspace. Production remains `akublyjmyrcoeemuxugr` and must not be changed.

## Next artifact required from the connected chat

Prepare a reviewable baseline SQL file from actual schema-only catalog definitions, plus a dependency inventory and provenance. Include the prerequisite tables, ID defaults, constraints, foreign keys, sequences, indexes, triggers and their function dependencies, RLS policies, grants, and application authorization helpers. Include prerequisite dependencies such as profiles if referenced. Preserve the reported text ord-/oitem- ID defaults and option-only pricing. Record any deliberate differences from production and why they are required.

Do not copy production rows, customer data, credentials, secrets or storage objects. Synthetic seed data must be separate from schema installation. Use Supabase's existing auth.users, auth.uid(), auth.role(), roles, and managed schemas; never replace them with local fixtures. In particular, test/reported_baseline.sql is a LOCAL TEST FIXTURE ONLY and must not be installed on Supabase.

Provide the exact supported migration application/tracking strategy and proposed unique baseline version preceding candidate version 20261029110000. No manual history inserts, blind db push from the repository's historical migration directory, or historical 001–013 replay. Prepare the baseline and candidate in an isolated staging migration set for review before execution. The payment candidate is one consolidated file; do not apply the older checkout-only draft too.

## Review and execution gates

1. Independently verify target ref/name before any future write. Prepare baseline SQL and catalog evidence now using read-only access only.
2. Review the SQL locally, check that it creates only expected application objects and preserves managed Auth, and validate candidate prerequisites against the supplied schema definitions.
3. Obtain separate approval for installing the reviewed baseline on staging. After installation, run preflight_read_only.sql and compare schema/grants/policies with the reviewed source.
4. Obtain separate approval for applying the consolidated candidate to staging. Validate exact RPC signatures, grants, RLS and order/payment invariants.
5. Obtain separate approval for required staging Edge Function/configuration work, then run full Razorpay test-mode integration. No real charges/refunds, PR merge, or production deployment.

Local PostgreSQL execution is already documented in LOCAL_VALIDATION.md; the stale contradictory statement in CHANGE_MAP.md has been corrected. A full production schema export has not been supplied here, so an exact staging baseline cannot yet be certified locally.
