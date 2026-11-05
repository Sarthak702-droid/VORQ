# VORQ mobile

React Native + Expo client for the existing VORQ Frappe / ERPNext / BuildSuite backend. Sign in with a VORQ account to load company membership, assigned projects and server-authorised modules. The application no longer reads the former local demo workspace or treats local drafts as server records.

## Run locally

Start the existing backend in `../integration-workspace` using that workspace's development instructions. Its API is exposed on `http://127.0.0.1:18080`.

```bash
cd mobile
npm ci
npm start -- --web --port 8082 --localhost
```

Open `http://localhost:8082`. Browser requests go through the Expo API route at `/api/method/...`, which proxies only the approved VORQ facade and login/logout methods to the fixed upstream. The upstream defaults to `http://127.0.0.1:18080`; override it with server-only `VORQ_BACKEND_URL`. The Expo server runtime is required for this web build; static-only hosting will not serve the API route.

Use the same account as VORQ desktop. Existing local development administrator credentials remain in the ignored `integration-workspace/deployment/.env`; no password is embedded in this mobile app. Accounts without company membership see access pending.

## Android / iOS

Native clients call Frappe directly. Set `EXPO_PUBLIC_API_URL` to the reachable VORQ API origin. Development defaults are Android emulator `http://10.0.2.2:18080` and iOS simulator `http://localhost:18080`. A physical phone needs a reachable HTTPS backend; the existing Docker endpoint is bound to computer loopback and is not reachable from another device. Release builds require an HTTPS origin and fail clearly if it is missing.

Session cookies are stored by the browser as HttpOnly cookies. Native session IDs use Expo SecureStore, scoped by backend origin. Passwords are never persisted. Two-factor logins stop with an explicit verification-required message; a native 2FA/OAuth flow is not implemented. No CORS or CSRF protection is disabled.

## Connected workflows

- Company switching and assigned-project selection.
- Project status and progress; permission-controlled expense/income figures from the backend's General Ledger overview. Income retains the ledger's debit-minus-credit sign.
- Project record creation/editing through VORQ permissions.
- Client invoices, supplier invoices, subcontractor RA bills and expense journals, according to server role/module visibility.
- Site reports and labour attendance records.
- Schema-backed document forms, actual master-record searches, nested item rows, server-calculated totals, draft saves, document detail and server-offered workflow actions.
- Submitting/cancelling requires an explicit confirmation in the app. The backend remains responsible for permissions, version conflicts, tax calculation, certification and accounting/stock posting.

Lists paginate in batches of 50. Write retries within the open form reuse an idempotency key for the unchanged payload. Existing documents carry the server's `modified` value for optimistic concurrency checks. Keys are not a durable offline outbox: this version requires connectivity for server records, and an unsaved form does not survive app termination. Previous local-only records are preserved in their old device storage key and are not automatically imported into company accounts.

## Backend compatibility patch

The existing facade needed invoice defaulting and price-list fields to support clients that do not run ERPNext Desk's onchange handlers. The local integration source and running API have been updated. Because `integration-workspace/` is ignored by the parent repository, the portable source patch is tracked at `backend/invoice-defaults.patch`.

For a separate clean copy of the same backend baseline:

```bash
cd integration-workspace
patch -p1 < ../mobile/backend/invoice-defaults.patch
docker build -f deployment/Dockerfile -t vorq/erpnext:dev .
docker compose --env-file deployment/.env -f deployment/compose.yaml up -d --no-deps backend
docker compose --env-file deployment/.env -f deployment/compose.yaml restart frontend
```

Do not apply the patch twice. Invoice defaults come from ERPNext controllers and an enabled price list selected in the form. Configure real customer/item/UOM/account/cost-centre and price-list masters before entering business records. No tax rate, exchange rate or financial total is fabricated by the mobile client.

## Brand and icons

`assets/vorq-logo.svg` is an editable vector trace of the user-supplied VORQ mark. The supplied raster reference is retained in `assets/vorq-logo-reference.png`. `npm run assets:brand` deterministically renders launcher/favicons and generates the native SVG component from that source. The SVG preserves the mark's shape and colour treatment; its lighting is a vector approximation, not a pixel-identical copy of the raster.

Every interface icon is an unmodified component from the official `lucide-react-native` package. There are no custom-generated interface icon paths. See `THIRD_PARTY_NOTICES.md` for attribution. The UI uses standard rows, compact forms, neutral surfaces and restrained colour.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npx expo export --platform web --platform android --platform ios
```

`npm run test:backend` runs the real API client through the Expo server against the isolated **VORQ Development** company. It reads the existing local development password without printing it. It creates/updates one clearly labelled site report and saves one synthetic ₹1 **unsubmitted invoice draft**. It checks CSRF, project scope, persistence, idempotent retries, key reuse rejection and logout. It never submits an invoice, posts a payment, or creates privileged users. See `backend-verification.json` for evidence.

The local development site initially had no enabled price lists. A named `VORQ Mobile Verification` price-list master was created solely for these checks; `backend/verify_fixture.py` documents that local-only setup. It is not a production default.

Native JavaScript bundle checks are not a signed APK/IPA or physical-device test. Physical-phone authentication, SecureStore restoration, network loss and final deployment configuration still require device testing before release. Camera/attachments, offline sync, dedicated GST reporting and app-store delivery are not implemented by this change.
