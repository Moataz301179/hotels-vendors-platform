# Authenticated five-role E2E setup

This acceptance suite uses real Clerk sessions created by an operator in a
non-production Clerk instance. It does not create users, accept passwords or
tokens from source control, mint fake cookies, or mutate production data.

## Approved setup

1. Start the app against a disposable/local database and local Clerk
   development credentials. Do not point `DATABASE_URL` at production.
2. Create or obtain five approved non-production identities through the normal
   Clerk sign-in flow: hotel, supplier, carrier, funder, and admin. Each must
   already map to an active application user and its intended tenant.
3. For each identity, use Playwright's storage-state capture on the approved
   local runner and save only these files outside source control:

   ```text
   .auth/hotel.json
   .auth/supplier.json
   .auth/carrier.json
   .auth/funder.json
   .auth/admin.json
   ```

   The files must be Playwright storage states from the real Clerk flow; do not
   hand-edit them or copy a production browser profile.
4. Run the read-only acceptance suite:

   ```sh
   HV_AUTH_ENV=local \
   HV_AUTH_E2E=1 \
   HV_E2E_BASE_URL=http://127.0.0.1:3100 \
   HV_AUTH_STATE_DIR=.auth \
   npm run test:browser:auth
   ```

The preflight rejects missing or malformed states, non-local targets, and
production hostnames. The tests then verify each role's authenticated identity
and probe tenant boundaries without creating or changing records.

## Credential-source boundary

Local acceptance uses local Clerk publishable/secret keys and a disposable
database supplied by the runner. Production keys, production Clerk sessions,
and production database URLs are not valid inputs to this command. The runner
must keep secrets in its environment or secret manager; never add them to
`.env.example`, storage-state files, logs, or a handover.

If a state is missing, the correct result is a blocked preflight. Do not replace
it with a fixture, mocked cookie, API token, or skipped role.
