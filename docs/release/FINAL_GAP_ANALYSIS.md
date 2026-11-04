# Actual release gaps

Release readiness: **NOT production-ready**. The full software request remains incomplete.

Verified: backend installation, HTTP login/CSRF/logout, persistent project creation, procurement/stock/invoice/GL, BOQ baseline immutability, measurement-based RA invoicing, retention and duplicate certified-quantity denial. Exact records are in integrations/acceptance-evidence.json.

P0: prove cross-company/project/nested-link isolation, raw API bypass prevention, CSRF/session expiry and concurrent request/bill behavior. Financial precision, cumulative certification, period/scope uniqueness, retention postings, supplier advance recovery and payments need actual reconciled test records.

P1: advanced scheduling/Gantt interactions, work packages and task progress (a basic persisted-task timeline is implemented); detailed estimation/BOQ revision/import/export UI; stock balances; full supplier/customer/item onboarding (basic document forms exist); bank reconciliation/GST/reporting surfaces; document attachments/photos; proper workflow-action inbox; supplier-bound subcontractor portal; dedicated dashboards for each role. Schema-driven forms cover document entry but do not establish complete domain usability.

P1: OpenConstructionERP CAD/BIM/takeoff integration is unimplemented pending AGPL/distribution review and accuracy/data-contract proof. Cepho is excluded because of missing license evidence, v15 assumptions and empty billing logic; BuildSuite's alternative must still be validated. OpenProject remains conditional; no external scheduling synchronization is claimed.

P1: installable PWA, account-scoped offline draft queue, durable retry/conflict handling, accessibility audit, small-screen usability and session-expiry recovery.

P0 before public release: legal sign-off, production deployment/TLS/secrets, complete audit trail, rate limits/security headers, monitoring/alerts, vulnerability review, performance/load tests, backup/restore and migration rollback rehearsal, disaster recovery runbooks, customer documentation, UAT approval and all required regression tests.

No required capability was silently approved for deferral. No external service integration, legal approval or production readiness is claimed from source inspection alone.

Automatic approval review rejected an extended test that would create an additional System Manager user and post a payment entry. That action was not executed. The current default smoke script creates no privileged users or payments; supplier-payment acceptance remains pending approval.

Concrete proposed payment check: apps/vorq/vorq/payment_acceptance.py, run for ACC-PINV-2026-00001 only after approval. It posts INR 1,000 to the isolated VORQ Development company via ERPNext, checks invoice outstanding is zero and GL balances, creates no users, and calls no bank. It has not been executed.
