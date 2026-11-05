# VORQ authentication upgrade

This is the durable source overlay for the existing Frappe v16 VORQ backend in the ignored `integration-workspace/`. The main web client is now tracked under the repository's `src/erp/`; mobile uses the same server account and MFA endpoints.

## Audit result

The previous system used Frappe session IDs and CSRF, not JWT. It had company/project RBAC, basic unprivileged email/password signup, no native TOTP enrolment, and no image CAPTCHA. This change keeps revocable Frappe sessions and adds server-enforced MFA. No JWT access/refresh token system is claimed or required by this implementation.

## Protocol

1. `auth_challenge` returns a six-character PNG challenge and the role-specific signup schema. Redis stores only a keyed answer digest and 120-second expiry. The challenge is consumed on the first attempt, including an incorrect answer.
2. `auth_start` validates CAPTCHA and the existing password using Frappe's credential verifier and login-attempt controls. Email or a unique username is accepted. Password-disabled and forced-reset policies are honoured. No authenticated session is issued.
3. `auth_signup` validates a 3–40-character username, email, full name, a 12–128-character password with zxcvbn score at least 3, company name, and the exact fields required for a requested role. It creates a Website User with no caller-selected ERP roles or memberships. Existing accounts are never overwritten.
4. Unenrolled accounts receive a five-minute challenge, authenticator QR image, and manual setup key. The pending secret is encrypted in Redis. Enrolled accounts get a code prompt without re-exposing their secret.
5. `auth_finish` confirms a six-digit, 30-second TOTP with a ±1-step allowance. Used counters cannot authenticate again. Only then does Frappe create/rotate a real session. Eight 80-bit recovery codes are shown once on enrolment; only keyed hashes are stored. Each backup code can be used once.
6. All VORQ data APIs require a matching verified-session record, bound to the user and SHA-256 of the session ID, for up to 12 hours. Frappe logout invalidates the underlying session and removes the assurance record. Expired assurance rows are cleaned daily.

The legacy password-only login is blocked with a Frappe `before_login` hook (before a session can be minted), and the old signup endpoint is closed. Company/project membership and upstream ERP permissions still control data access; CAPTCHA/TOTP do not grant any business role. `Owner` in a signup form is only a request.

## Database

- `VORQ Auth Profile`: unique User link, encrypted Password-field TOTP seed in Frappe's `__Auth` storage, enabled flag, last accepted counter, recovery-code digests, requested role/company/details, and pending-review status.
- `VORQ Auth Session`: hashed SID, user and expiry. No plaintext session ID is stored here.

Only System Manager has read metadata permission; public APIs do not expose profile documents. Actual membership and ERP-role approval use the existing administrator-controlled workflow. This release does not add a public MFA-reset endpoint. A user without their authenticator and all recovery codes must use an authorised administrator-assisted recovery process.

Email is required and validated syntactically. This change does **not** send an email-ownership verification link or claim that an email has been verified. Company administrators must independently verify identity before granting memberships. SMTP/email-verification delivery would be a separate configured integration.

## Abuse controls

The image includes random placement, rotation, lines and noise; it is server-generated, short-lived and one-use. Image CAPTCHAs are a secondary abuse control and are not bot-proof. The server also limits challenge issuance, password/signup attempts and factor attempts. Five failed factor checks lock that account's factor verification for 10 minutes, across challenges, in addition to a five-attempt challenge limit. Failed attempts persist even when the SQL transaction rolls back. Counter/backup consumption uses database row locks and Redis challenge locks.

Native SIDs stay in Expo SecureStore; browser SIDs stay in HttpOnly cookies. Passwords, pending challenges, QR keys and displayed recovery codes are not put in application storage. Serve both clients and API over HTTPS before public deployment. Configure trusted-proxy client IP attribution at the gateway: untrusted forwarded-IP headers must never be accepted as rate-limit identity. The local development proxies currently share an IP budget, so repeated automated tests can correctly hit the limits.

## Apply and migrate

Start the existing local MariaDB and Redis services first. The invoice-compatible backend baseline from the earlier mobile integration must be present.

```bash
python3 backend/auth-upgrade/apply.py
docker build -f backend/auth-upgrade/Dockerfile -t vorq/erpnext:dev integration-workspace
docker compose --env-file integration-workspace/deployment/.env -f integration-workspace/deployment/compose.yaml run --rm --no-deps backend bench --site frontend migrate
docker compose --env-file integration-workspace/deployment/.env -f integration-workspace/deployment/compose.yaml up -d --no-deps backend queue-long queue-short scheduler
docker compose --env-file integration-workspace/deployment/.env -f integration-workspace/deployment/compose.yaml restart frontend
```

The apply helper checks forward and reverse applicability without auto-reversing already-applied patches. A regression test exercises two consecutive applications. Database migration adds the two DocTypes, initialises the existing site encryption key if needed, and registers session cleanup. Preserve the site configuration/encryption key in protected backups; losing it makes encrypted MFA seeds unrecoverable.

Existing passwords and memberships are preserved. Previously unassured sessions cannot access VORQ data. At the next sign-in, existing users—including Administrator—enrol their **own** authenticator and retain their own recovery codes. No real administrator authenticator was automatically enrolled during development.

## Verification

```bash
npm run build
npm run test:auth
npm run test:auth:policy
cd mobile
npm run lint
npm run typecheck
npm test
npx expo export --platform web --platform android --platform ios
```

`npm run test:auth:live` runs against the local development site and creates only an unprivileged `vorq-auth-test-...@example.invalid` identity. Known-answer CAPTCHA fixtures are seeded through trusted local bench access; there is no HTTP test bypass or production CAPTCHA switch. Checks cover image generation, one-use CAPTCHA, weak-password denial, QR enrolment, absence of a session before TOTP, code/backup replay denial, encrypted seeds, hashed recovery codes, no self-promotion, and logout. It makes no financial postings and does not configure a real user's authenticator. Evidence is written to `auth-verification.json`.

Image CAPTCHA accessibility alternatives, automatic email verification/delivery, production ingress configuration and physical-device validation remain deployment work. Passing local checks does not establish a public security certification.
