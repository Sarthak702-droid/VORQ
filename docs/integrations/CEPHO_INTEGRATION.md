# Cepho integration

The inspected v15 app lacks an authoritative root license and its RunningBill controller is empty. No source copied or application installed. The alternative is BuildSuite Work Order → Measurement Book → Subcontractor Bill → ERPNext PI. This is an alternative candidate, not evidence that Cepho was integrated. Advance recovery, full period/scope uniqueness and payment reconciliation remain release gates.

Source commit and license evidence: SOURCE_CODE_AUDIT.md, source-lock.json and LICENSING_REPORT.md. Runtime/test status: INTEGRATION_TEST_RESULTS.md. Production-ready: **No**.

Runtime update: the Frappe/ERPNext/BuildSuite/VORQ stack installed successfully. Real persistent procurement/stock/GL, BOQ baseline and measurement/RA/retention checks passed. See INTEGRATION_TEST_RESULTS.md and acceptance-evidence.json for exact coverage; payment/concurrency/security/UAT gates remain open.
