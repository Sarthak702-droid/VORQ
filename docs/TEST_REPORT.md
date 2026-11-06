# VORQ verification — 6 November 2026

The final local backend image is `sha256:4ac020a7b987e74a29f3411cf1c068ce26a70c8c938bceb282f5bf8e1f13a42c`. Backend, gateway, both workers and scheduler were confirmed on this same image with zero container restarts. All nine long-running Compose services were up and MariaDB was healthy.

The tested flow is web/mobile client → approved VORQ HTTP facade → company/project and upstream document permissions → Frappe transaction → response. Authenticated HTTP checks use the real Vite proxy at `http://127.0.0.1:5173`, with cookies, CSRF and MFA. They use a synthetic ordinary Project Manager, not Administrator.

| Verification | Result | Evidence |
| --- | --- | --- |
| Live database regressions | 15 cases passed | [Database results](../modular-live-test-results.json), [cases](../tests/live_modular_cases.py) |
| Authenticated HTTP regressions | 36 checks passed | [HTTP results](../modular-http-test-results.json), [runner](../tests/verify_modular_http.py) |
| Architecture/auth policy/deployment unit tests | 14 passed | `python3 -m unittest discover -s tests -v` |
| Integration API/client contracts | 3 passed | `python3 -m unittest discover -s integration-workspace/tests -v` |
| Web auth client tests | 6 passed | `npm run test:auth` |
| Web production build | Passed | `npm run build` |
| Mobile client/proxy/domain tests | 13 passed | `cd mobile && npm test` |
| Mobile TypeScript and lint | Passed | `npm run typecheck`, `npm run lint` |
| Mobile web/Android/iOS bundles | Passed | Expo export in `/tmp/vorq-qa-mobile-export` |
| Browser public forms | Passed | [Web screenshot](../browser-login-verification.png), [mobile screenshot](../browser-mobile-verification.png) |
| Running mobile web proxy | CAPTCHA/role response and restricted-path rejection verified | [Actual statuses and caveat](../mobile-proxy-test-results.json) |

## Defects found and fixed

1. Invoice lookup did not apply the finance-role gate. A non-finance VORQ role with broader upstream ERP permissions could query invoice identifiers. Lookup now derives restricted DocTypes from the finance module registry and rejects non-finance roles. Both database and authenticated HTTP regressions verify the denial.
2. The disabled Subcontractor portal was blocked in record use cases but could still reach workspace, overview and lookup. The company membership boundary now rejects that role consistently. Live regression cases cover all three entry points.
3. Invalid pagination offsets and unhashable module identifiers raised Python exceptions. They now raise Frappe validation errors. Database cases cover strings, null, list/dict values and nonfinite offsets; authenticated HTTP verifies malformed pagination returns a client error.

The fixed code is in `integration-workspace/apps/vorq/vorq/permissions.py`, `application/lookups.py`, `application/access.py` and `application/records.py`. The backend is a nested repository; these source changes are in that checkout.

## Coverage details

Database cases verify company and assigned-project isolation, cross-project linked-document rejection, guest denial, missing upstream document permission despite VORQ Owner membership, all eight declared write-role contracts across all 22 record types, hidden finance modules, disabled subcontractor access, allowed draft creation/editing, version conflicts, stable-key replay, conflicting keys, unsupported fields, child-row injection/limits, nonfinite numeric values, invalid keys, BOQ approval roles and invalid/stale actions. The eight-role matrix checks VORQ policy using a synthetic user with broad upstream permissions; it is not a complete ERPNext persona-permission audit.

Authenticated HTTP cases verify signup → TOTP enrollment, no session before MFA, no access from a requested role, normal MFA re-login after administrator fixture provisioning, ordinary-user workspace, hidden finance, company/project boundaries, financial lookup denial, raw ERP/internal-method denial, command override denial, HTTP method restrictions, missing CSRF rejection, persistent draft save/detail/update, stale-write rejection, payload injection, sequential/concurrent retries, exactly one record for a concurrent key, rollback of the request row after a failed write, and logout revocation. Concurrent retries may replay immediately or return a retryable conflict; retrying the unchanged request must resolve to the same record. This is a two-request correctness check, not a capacity benchmark.

Browser checks verified desktop login/signup rendering, all eight role-specific signup forms, required-field validation, mobile login/signup rendering and no console warnings/errors in the observed screens. CAPTCHA was not solved in browser automation. Authenticated workspace and mutation flows were verified over HTTP through the web proxy, not by browser clicks after login.

The earlier ERP procurement → receipt → stock issue → BOQ → certified measurement → RA-invoice scenario passed with balanced ledger entries, stock delta 7 and retention 40; its records and original image are documented in [earlier runtime evidence](../modular-monolith-verification.json). New regression tests perform no financial posting or bank transfer.

## Fixture behavior and limits

Transactional database fixtures are rolled back, and the absence of the synthetic User and Company is asserted afterwards. HTTP test identities are disabled, all their VORQ memberships and session-assurance records are revoked, and clearly labelled QA draft projects/reports remain in the local development site. No Administrator MFA enrollment or real-account credential changes were made.

Live suites share a local lock because their fixture provisioning touches shared Frappe metadata. Repeated auth testing reached the genuine signup rate limit; the quota was allowed to expire naturally. No CAPTCHA, rate limit, CSRF or MFA protection was disabled. Changing test user type/roles correctly revoked the pre-provisioning session, so the HTTP suite signs in again with password and a one-use recovery code.

Expo's development CORS middleware rejects a foreign Origin before the application proxy, but returns HTTP **500** rather than **403**. No backend data is returned. The proxy itself returns 403 in its unit test, and the running mobile preview returns 403 for raw ERP paths. This framework development-server status behavior remains a caveat; it is not reported as an all-green HTTP-status check.

Physical Android/iOS devices, native SecureStore behavior on hardware, authenticated browser-click workflows, load/soak behavior, and production infrastructure were not verified. Exporting Android/iOS bundles does not establish physical-device acceptance.

## Reproduce

Keep the local backend running. For HTTP checks, start the web client with `npm run dev`; for mobile proxy checks, run `npm start -- --web --port 8082 --localhost` from `mobile/`.

```bash
npm run build
npm run test:auth
python3 -m unittest discover -s tests -v
python3 -m unittest discover -s integration-workspace/tests -v
npm run test:backend:live
npm run test:http:live
npm run test:mobile-proxy:live
```

Run `npm run typecheck`, `npm run lint` and `npm test` inside `mobile/`. The live commands are local development tests; frequent HTTP suite reruns can legitimately hit auth rate limits.
