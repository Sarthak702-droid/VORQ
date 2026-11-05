# VORQ mobile

A separate React Native + Expo + TypeScript application for capturing construction billing drafts and daily site records. The desktop application is unchanged.

## Run

```bash
cd mobile
npm ci
npm start
```

Open on a supported Android/iOS development client or emulator. `npm run android` opens an Android emulator; `npm run ios` requires macOS and Xcode. `npm run web` provides a browser preview. Use a compatible Expo development build if your installed Expo Go does not support the pinned SDK/native modules. Native device builds have not yet been tested.

## First workflow

1. Open **Projects**, add your project and client.
2. Open **Billing**, select the project and choose Client claim, Subcontract bill, or Site expense.
3. Enter measured quantities, units, rates, deductions and references. Save the local draft.
4. Share its plain-text summary for review. Shared summaries explicitly say they are drafts, not tax invoices.
5. Open **Site diary**, record work, worker count, material notes and blockers. One record per project/date prevents accidental duplicate days.
6. Restart the app to reload saved records. Overview totals derive only from saved client claim drafts.

Records are saved to device AsyncStorage without a network requirement; saves only report success after storage completes. Storage failures leave the current screen intact. Malformed/unsupported stored data is preserved and the workspace is blocked to avoid overwriting it. This is local persistence, not a backend synchronization queue. Clearing app data or uninstalling can lose these records. There is no login or encrypted database; use non-sensitive evaluation data until production security is implemented. A shared summary is not a restorable backup.

## Scope

Implemented: empty workspace, projects, multi-item billing drafts, quantities/rates, paise rounding, manual deductions, input validation, draft sharing/deletion, daily site diary, worker counts, local persistence and explicit local-only status.

Not implemented: authentication, server permissions, shared projects, attachments/camera, item-level labour muster, tax computation, PDF tax invoices, invoice numbering, payment collection, approvals, RA certification, push notifications or backend sync. No financial posting or bank reconciliation is claimed.

## Backend path

The repository's ignored `integration-workspace/` contains a separate implementation with `vorq.api.v1.session`, `workspace`, `records`, `detail`, `save` and `transition` endpoints. Connect mobile to that application rather than the parent prototype's mock context. Do not assume those endpoints are deployed or mobile-ready.

Before enabling writes: implement native session/token handling using secure storage, validate company/project membership on the server, load authorized module schemas, map drafts to upstream documents, persist stable idempotency keys, and handle optimistic version conflicts. Keep local drafts separate from server acknowledgements; certification, invoice taxes and accounting posting remain server responsibilities. Plain-text sharing is currently a manual handoff.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npx expo export --platform web
```

Financial domain checks cover fractional quantities, paise rounding, invalid values, deductions, calendar dates, storage validation and draft disclaimers. Browser preview verification does not establish native-device compatibility.

Verified on 5 November 2026: lint, TypeScript, five domain tests, web export, Android/iOS JavaScript bundle exports, and the existing parent web build passed. In the browser preview, a demo project and measured bill were saved; the ₹2,877.04 draft persisted after reload; a site diary record was saved and a duplicate project/date entry was rejected. These are synthetic verification records, not live business data. No signed native binary, physical-device test, backend write or store release was performed.
