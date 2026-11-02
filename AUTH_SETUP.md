# Supabase Auth setup

The app continues to use project `akublyjmyrcoeemuxugr` from `.env`.
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (the existing
`VITE_SUPABASE_ANON_KEY` remains supported). Never use a service-role key in Vite.

## Project settings to verify

The connected Supabase account does not have access to this project, so these
settings and live database policies could not be inspected or changed:

1. In Authentication → Providers, enable Email/password and email confirmation.
2. In Authentication → URL Configuration, set Site URL to the deployed origin.
   Allow the exact deployed `/login` and `/auth/reset-password` URLs, plus
   `http://localhost:5173/login` and `http://localhost:5173/auth/reset-password`
   for development.
3. Verify the existing schema migrations and RLS policies are deployed. Customer
   orders and order items must be limited to their `customer_id = auth.uid()`;
   customer profiles and addresses must be limited to their owner. Staff access
   must come from the existing database role checks. Client route guards alone
   do not secure database access. Confirm new-user profile provisioning if needed;
   signup itself works without a profile row using Auth metadata for display.

## Routes and behavior

- `/login`: email/password sign-in, registration, and reset email requests.
- `/auth/reset-password`: completes a recovery link and signs out after updating.
- `/profile`, `/orders`, `/wishlist`: wait for session validation, then redirect
  signed-out visitors to login, retaining a local return destination.
- `/admin`: retains its existing database-backed staff authorization and login UI.
- Browsing, cart, guest checkout, order confirmation, and guest tracking remain public.

Session work runs outside the Auth callback lock. Stale results are discarded
after account changes/sign-out; private order state is cleared and reloaded.

## Verification

Run `npm run build` and `npm test`. After connecting the project account, test
signup → confirmation → login, reload a protected URL, sign out in another tab,
password recovery, and rejected customer access to admin/data belonging to another
customer. These live flows require the project settings above and a test account.
