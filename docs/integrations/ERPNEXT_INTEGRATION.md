# ERPNext integration

The facade constructs real ERPNext documents and calls insert/save/submit/cancel. It never writes GL/SLE directly. The acceptance script creates Project → Purchase Order → Purchase Receipt → Stock Entry → Purchase Invoice, then verifies stock quantity delta and balanced GL. Invoice/payment/bank/tax configuration remains authoritative upstream; payment and reconciliation story coverage is still incomplete.

Source commit and license evidence: SOURCE_CODE_AUDIT.md, source-lock.json and LICENSING_REPORT.md. Runtime/test status: INTEGRATION_TEST_RESULTS.md. Production-ready: **No**.

Runtime update: the Frappe/ERPNext/BuildSuite/VORQ stack installed successfully. Real persistent procurement/stock/GL, BOQ baseline and measurement/RA/retention checks passed. See INTEGRATION_TEST_RESULTS.md and acceptance-evidence.json for exact coverage; payment/concurrency/security/UAT gates remain open.
