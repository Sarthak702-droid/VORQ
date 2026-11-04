# Integration test results — 4 November 2026

Real isolated Frappe/MariaDB/ERPNext/BuildSuite execution, not mocked API responses.

| Check | Result | Evidence |
|---|---|---|
| TypeScript/Vite production build | PASS | New active UI compiled; previous mock context excluded |
| Dependency audit | PASS | npm reported zero known vulnerabilities at installation |
| Python syntax and 3 static contract safeguards | PASS | compileall + unittest; these alone are not integration proof |
| Compose validation/custom image build | PASS | Pinned official ERPNext image + two custom apps |
| Runtime installation | PASS | Frappe 16.55.0, ERPNext 16.53.0, BuildSuite 0.0.1 pinned source, VORQ 0.1.0 |
| Real project persistence/idempotency | PASS | PROJ-0001; same key replay returned same ID; changed payload rejected |
| Purchase order / receipt / issue | PASS | PUR-ORD-2026-00001 → MAT-PRE-2026-00001 → MAT-STE-2026-00001 |
| Stock movement reconciliation | PASS | SLE delta: 10 received − 3 issued = 7 |
| Supplier invoice / GL | PASS | ACC-PINV-2026-00001; nonempty real GL and debit/credit balance within 0.01 |
| BOQ baseline/amount/immutability | PASS | BOQ-00001; 10.25 × 100.40 = 1029.10; approved baseline mutation rejected |
| Work order / measurement / RA bill | PASS | SWO-2026-00001 → MB-2026-00001 → SB-2026-00001 |
| Contract retention / actual RA invoice | PASS | Gross 800; retention 40; submitted PI ACC-PINV-2026-00002 |
| Duplicate certified-quantity billing | PASS | Second bill with no unbilled certified quantity rejected |
| Company nonmember denial | PASS | Existing test nonmember denied despite upstream broad role; no new broad role is granted by current smoke script |
| HTTP login / CSRF / logout | PASS | scripts/verify-http.py; missing CSRF denied; logged-out session denied |
| HTTP persistence and retry | PASS | PROJ-0002 visible in authenticated workspace; same key replay reused record |
| Browser login screen | PASS | Live same-origin backend; fields visible, no backend-unreachable warning after startup |
| Supplier payment reconciliation | NOT RUN | Extended test action rejected by automatic approval review; no payment was posted |
| Full authorization/concurrency/security matrix | INCOMPLETE | One company denial is not complete tenant/project/security coverage |
| Development DB/files backup | PASS | 20261104_105209 archive; SQL.gz 1.1 MiB plus public/private files and config |
| Advanced service integrations/mobile/restore/UAT | NOT RUN | Restore drill remains unverified |

Structured persistent IDs: [acceptance-evidence.json](acceptance-evidence.json).

## Failures found and corrected

- First image pull: connection reset; retry succeeded.
- Original dependency lock did not match package.json; regenerated lock and successful build.
- Workers started before custom app installation and held MariaDB metadata locks; runtime services now depend on successful create-site completion. Stopping early workers released the lock.
- Fresh ERPNext site lacked standard setup fixtures (Transit warehouse type). Development initialization now seeds official fixtures before BuildSuite.
- Existing BuildSuite supplier tree conflicted with later ERPNext fixture insertion during the first smoke setup. Standard tree rebuild repaired the disposable dev tree; future initialization seeds ERP fixtures before BuildSuite. The initial warning is preserved in .test-output/story.log, not hidden as a clean install.
- Acceptance fixture used root customer/item groups; switched to valid leaf masters.
- Tree-rebuild call initially used an obsolete signature; corrected against actual v16 source.
- Early smoke invocation preceded VORQ installation and correctly failed; final real scenario completed successfully.

No tax/GST correctness, complete monetary rounding policy, payment flow, complete concurrency guarantee or production readiness is inferred from this one acceptance story.

## Signup + Login follow-up

Real HTTP test through localhost:15173 passed: registration; rejection of a short password; repeated registration preserving the original password; login with the new account; empty company membership; rejection of company access and raw ERP resource access; logout. The default registration creates no administrative roles or memberships and posts no financial documents. Browser inspection confirmed Login/Sign up tabs, name/email/password/confirmation inputs and clear access-assignment guidance. Production build, Python compilation, static contract checks and auth API regression checks passed.

Browser end-to-end also passed: Create account → registration response → Login with the new password → Your account is ready/access-pending screen → Sign out. The disposable browser identity had no company/project access. The browser was left on an empty Sign up form for the user.
