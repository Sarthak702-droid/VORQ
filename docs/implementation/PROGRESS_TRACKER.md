# Progress tracker

| Work | Evidence | Status |
|---|---|---|
| Preserve parent workspace | Separate nested clone on codex/unified-erp | Done |
| Six upstream source checkouts | Source SHAs/inventory/audit | Initial inspection done |
| Architecture/ownership/contracts | docs/integrations + docs/architecture | Implemented design; runtime validation open |
| New unified browser interface | src/erp; production build passed | Implemented; login screen browser inspected |
| Remove prototype from active app | src/App.tsx imports ERPApp | Done |
| Versioned Frappe API/custom DocTypes | apps/vorq | Implemented; core persistent acceptance passed |
| Construction validation hooks | baseline freeze, RA derivation and locking | Core BOQ/RA checks passed; concurrency tests pending |
| Reproducible local stack | deployment/Dockerfile + compose + scripts | Running; initializer and all runtime apps installed |
| Full procurement acceptance script | vorq.smoke.run | Passed against real persistent records |
| Lightweight contract checks | 3 tests passed | Passed; not a substitute for integration tests |
| Advanced services/mobile/release | FINAL_GAP_ANALYSIS.md | Incomplete |

Do not interpret “implemented” as production-ready or user-accepted. See runtime results for measured evidence.

Runtime evidence: integrations/INTEGRATION_TEST_RESULTS.md and acceptance-evidence.json. HTTP session/CSRF/persistence/logout checks passed. Payment and expanded privilege-grant testing were rejected by automatic approval review and remain unexecuted.
