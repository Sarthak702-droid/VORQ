# BuildSuite integration

Pinned MIT source is fetched into ignored `vendor/buildsuite_core` and copied into the backend image. Its DocTypes/controllers provide BOQ, schedule, labour, measurements and subcontract billing. `vorq.validation` adds baseline immutability, work-order locking and server-derived RA lines. Neither Vue components nor business controllers were forked. Full installation/regression evidence is pending; do not call declared v16 compatibility tested compatibility.

Source commit and license evidence: SOURCE_CODE_AUDIT.md, source-lock.json and LICENSING_REPORT.md. Runtime/test status: INTEGRATION_TEST_RESULTS.md. Production-ready: **No**.

Runtime update: the Frappe/ERPNext/BuildSuite/VORQ stack installed successfully. Real persistent procurement/stock/GL, BOQ baseline and measurement/RA/retention checks passed. See INTEGRATION_TEST_RESULTS.md and acceptance-evidence.json for exact coverage; payment/concurrency/security/UAT gates remain open.
