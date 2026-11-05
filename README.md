# VORQ

Construction operations and billing on Frappe v16, ERPNext v16 and BuildSuite, with a React web client and a React Native mobile app.

The main web entry now loads the real ERP client, not the archived persona-switching demo. Both clients use the same backend accounts, company/project membership and server permissions.

## Run

Start the existing backend in `integration-workspace/` using its deployment instructions. Apply the [authentication upgrade](backend/auth-upgrade/README.md) and migrate the site before using the new login flow.

```bash
npm ci
npm run dev
```

Web: `http://localhost:5173`. Its `/api` routes proxy to the local VORQ backend at `http://127.0.0.1:18080`.

```bash
cd mobile
npm ci
npm start -- --web --port 8082 --localhost
```

Mobile browser preview: `http://localhost:8082`. Native-device connection and HTTPS configuration are documented in [mobile/README.md](mobile/README.md).

## Authentication

- Shared signup/login with email, unique username, strong password, requested role/company and role-specific details.
- One-use image CAPTCHA on signup and password login.
- Authenticator QR enrolment, TOTP confirmation, subsequent code login and one-use recovery codes.
- Server-side session assurance, expiry, replay protection and rate limits.
- Signup requests do not grant Owner/Accountant or other ERP access. An administrator must verify identity and assign company/project membership and upstream roles.

Authentication uses revocable Frappe sessions and CSRF; it does **not** use JWT. Browser cookies are HttpOnly; native session IDs use SecureStore. The [auth guide](backend/auth-upgrade/README.md) describes the protocol, database models, deployment and limits. Email addresses are collected; automated ownership verification/delivery is not implemented.

## Application data

The web ERP workspace loads authorised planning, procurement, stock, contract and finance modules. Mobile supports assigned projects, server-backed document entry, site reports, labour attendance and billing modules according to backend permissions. Taxes, certification and financial posting remain server responsibilities.

The old mock components remain as reference and are not loaded by the web or mobile entry points. Earlier local-only mobile records are not automatically imported into server accounts.

## Checks

```bash
npm run build
npm run test:auth
npm run test:auth:policy
```

See `auth-verification.json` for local live-auth evidence. The live suite uses an unprivileged synthetic identity, posts no financial transactions, and never enrols a real administrator. The backend and mobile guides document remaining physical-device and production deployment checks.
