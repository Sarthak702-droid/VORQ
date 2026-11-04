# Frappe integration

The custom app lives in `apps/vorq`. Hooks define request guards, construction invariants and installation constraints. Session cookies and CSRF remain Frappe-owned. New DocTypes track company/project membership, idempotency and site reports. No Frappe core code was modified. APIs are method restricted. Runtime installation, MFA, expiry/revocation and backup tests remain gates.

Source commit and license evidence: SOURCE_CODE_AUDIT.md, source-lock.json and LICENSING_REPORT.md. Runtime/test status: INTEGRATION_TEST_RESULTS.md. Production-ready: **No**.

Runtime update: the Frappe/ERPNext/BuildSuite/VORQ stack installed successfully. Real persistent procurement/stock/GL, BOQ baseline and measurement/RA/retention checks passed. See INTEGRATION_TEST_RESULTS.md and acceptance-evidence.json for exact coverage; payment/concurrency/security/UAT gates remain open.
