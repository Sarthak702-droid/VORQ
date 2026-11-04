# VORQ

Construction operations built on Frappe v16, ERPNext v16 and BuildSuite Core, with a single React interface.

This checkout is the implementation workspace. The parent checkout's existing deletions are preserved. The supplied Clinify Authenticator documents describe a different product and do not change this application's requirements.

## Development

Requirements: Docker + Compose, Node 24+, Python 3, approximately 8 GB free disk for the stack. Ports 15173 and 18080 bind to localhost. MariaDB/Redis are private to the Compose network.

```bash
bash scripts/dev-up.sh
npm ci
npm run dev
```

Wait for `create-site` to exit successfully before signing in. Inspect it with:

```bash
docker compose --env-file deployment/.env -f deployment/compose.yaml logs create-site
```

Open http://127.0.0.1:15173. Local administrator: `Administrator`; generated password is stored in ignored `deployment/.env`. This is a development stack, not a production deployment.

Create company/accounting masters through administrator Desk, or run the isolated development acceptance story (creates clearly labeled test records):

```bash
docker compose --env-file deployment/.env -f deployment/compose.yaml exec -T backend bench --site frontend execute vorq.smoke.run
```

Assign ordinary users standard ERPNext/BuildSuite document roles plus explicit **VORQ Company Member** and **VORQ Project Member** records. VORQ membership narrows access; it never grants ERPNext permissions. Keep BuildSuite Project Team assignments aligned. The subcontractor portal is disabled until supplier identity scoping is implemented.

## Validation

```bash
npm run build
python3 -m unittest discover -s tests -v
python3 -m compileall -q apps/vorq
```

These checks alone do not prove real accounting integration. See `docs/integrations/INTEGRATION_TEST_RESULTS.md` for actual runtime evidence and `docs/release/FINAL_GAP_ANALYSIS.md` for unfinished work.

## Architecture

Browser → same-origin versioned VORQ Frappe API → permission-checked ERPNext/BuildSuite documents → MariaDB. Finance and stock posting use upstream controllers. The UI does not fabricate postings or use the previous mock context. Existing prototype files remain as reference and are not imported by the application entry point.

Document drafts are persistent, state transitions use server permissions, requests carry stable idempotency keys and optimistic version checks. RA quantities/rates derive from certified measurements and submitted work orders. Advanced integrations and production controls are gated by the audit and actual test results.

## Sign up and Login

The login page has separate Login and Sign up tabs. Registration asks for name, email and a password of 12–128 characters, with password confirmation. Frappe stores the password using its native credential handling. Passwords are never written to browser storage.

Self-registration creates a Website User without administrative roles, company membership or project membership. After login, an unassigned account sees an access-pending screen. An administrator must independently verify the person's identity and assign the appropriate upstream document roles and explicit VORQ memberships before they can access company records. Registration does not verify ownership of an email address; no verification email is claimed or sent by this local flow.

Existing accounts and passwords are never changed by signing up again. Registration is limited to five requests per IP per ten minutes. Auth regression checks: `npm run test:auth`; real registration/login/isolation checks: `python scripts/verify-signup.py` (creates one synthetic unprivileged test identity).
