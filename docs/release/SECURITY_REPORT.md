# Security report

Status: implementation review in progress; no completed penetration/security certification.

Implemented: same-origin cookie/CSRF client, method-restricted versioned APIs, role/company/project checks, native document permissions, explicit payload allowlists, immutable baseline checks, server-derived bill quantities, finite-decimal validation, optimistic record versions, durable idempotency records and local-only service ports. Secrets remain in ignored development environment file.

Reviewed risks: original app had client-selected roles and mock financial posting; the active application no longer imports that context. Raw resource/RPC APIs are blocked for ordinary users through the Frappe request hook, including legacy cmd dispatch. This control requires negative runtime tests across all routing forms. Administrator is intentionally exempt and must never be a customer identity.

Unverified/high priority: nested transaction link/warehouse/account company ownership, record enumeration via Frappe non-API routes, private files, session fixation/revocation/MFA, CSRF, rate limits, XSS/CSP, upstream hooks with ignore_permissions, concurrent RA/deduplication guarantees, audit retention and backup encryption. Site-per-tenant isolation and privilege administration need deployment tests. Subcontractor portal is fail-closed until supplier identity scoping exists.

No backend secret is embedded in React. Do not expose development stack publicly. Source licensing review is separate from security approval.

Executed evidence: real HTTP login/CSRF/logout tests passed; a company nonmember with existing upstream rights was denied; certified-quantity double billing and approved-BOQ mutation were rejected. These checks do not constitute the full negative/security/concurrency matrix. A DB/files backup succeeded; restore has not been tested.
