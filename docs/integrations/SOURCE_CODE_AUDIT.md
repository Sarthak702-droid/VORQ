# Source audit — 4 November 2026

Status: initial source inspection completed; exhaustive runtime/security audit is not complete.

All six requested upstreams were shallow-cloned separately in `/tmp/vorq-source-audit`. The remote VORQ clone returned `Repository not found`; the available local committed snapshot `01fb2d1` was cloned into `integration-workspace` without restoring the parent working tree's deletions. No remote push occurred.

| Source | Inspected commit | Tracked files | Test-shaped paths* | License source |
|---|---|---:|---:|---|
| erpnext | `35a71243ff341ae579930727da2f2c58f58ad117` | 5919 | 605 | license.txt |
| frappe_docker | `fbf76edcf5791b1d9743955b85caf0a19974d5a6` | 159 | 11 | LICENSE |
| buildsuite_core | `b93246cd4e9bc365ff2eafd8f6b6a72999134502` | 979 | 76 | license.txt |
| openproject | `3fb88148cee9329911cb8bdd2e9cdae88a97dae3` | 25807 | 448 | LICENSE |
| frappe | `7660724bec3ecd41e3c6f4d88638afdb227aee9c` | 5511 | 827 | LICENSE |
| construction_management_suite | `758a29cbfa894b20caeac4730ec95db6d0ff3b01` | 319 | 0 | No license file found |
| OpenConstructionERP | `2d27b866937ea3bd66d3878707b357a3099ba7fa` | 15554 | 4994 | LICENSE |

*Path-based inventory, not test counts or passing results. Complete commit inventory: `source-lock.json`.

## Existing VORQ

React 19, TypeScript, Vite, Tailwind. Nine construction/financial views share `src/context/AppContext.tsx`. There is no server, database migration, real authentication or API integration in the committed prototype. `src/data/mockDatabase.ts` initializes business data; mutations use React state. `approveSubcontractBill` invents a purchase-invoice ID and labels it “Posted in ERPNext GL”. `syncOfflineQueue` generates local records without contacting a server. Role switching is client controlled. These are prototype behaviors, not validated ERP integrations.

The new entry point imports `src/erp/ERPApp.tsx`; the prototype remains as reference and is excluded from the active dependency graph. Existing Tailwind design tokens, React/Vite toolchain and asset paths are retained. The new interface provides real server error handling, empty states, project selection and server-derived roles.

## Frappe / ERPNext

Frappe Python framework uses DocType metadata, MariaDB, Redis, session authentication, whitelisted RPC and REST. Inspect `frappe/auth.py`, `frappe/permissions.py`, `frappe/model/document.py`, `frappe/app.py`. ERPNext owns `accounts/general_ledger.py`, `stock/stock_ledger.py` and document controllers under `buying/doctype`, `stock/doctype`, `accounts/doctype`. Extensive upstream test sources exist; they have not all been executed here. Default branches require development v17, incompatible with BuildSuite's declared v16 range. Runtime selection uses official ERPNext v16.53.0 Docker image.

## BuildSuite

Python Frappe app, Vue frontend. `pyproject.toml` declares Frappe >=16,<17 and Python >=3.14; `hooks.py` requires ERPNext. Its Project/Task/Employee controller overrides and installation custom fields are significant compatibility surfaces. Actual BOQ, scheduling, attendance, measurements and subcontract bill controllers exist; the bill controller calls `generate_purchase_invoice`. See `api/boq.py`, `api/schedule.py`, `api/subcontract.py`, `api/subcontractor_bill.py`, `utils/subcontract_billing.py`. BuildSuite is beta per its README. Source inspection identified that bill line quantities can otherwise be client supplied; the VORQ hook always rebuilds them from certified measurements under a work-order row lock.

## OpenConstructionERP

Python 3.12+ modular API service with separate React frontend; source declares version 19.0.0 and AGPL-3.0-or-later. Actual editor code exists at `frontend/src/features/boq/BOQEditorPage.tsx`, `BOQGrid.tsx`, `BOQSummaryPanel.tsx`; PDF viewer at `frontend/src/modules/pdf-takeoff/TakeoffViewerModule.tsx`; backend modules include `dwg_takeoff`, `estimate_rollup`, `projects`, `resources`. This is not a drop-in Frappe extension. No code copied; no service deployed. CAD/BIM accuracy, bundled dependencies, AGPL compliance and compatibility need separate validation.

## OpenProject

Ruby/Rails service with Angular frontend and PostgreSQL; inspected `.ruby-version` is 4.0.9 and Angular dependency ^22.2.3. Actual APIs: `lib/api/v3/work_packages/work_packages_api.rb`, `lib/api/v3/relations/relations_api.rb`; scheduling model `app/models/work_package.rb`. API docs describe `lockVersion` optimistic locking. GPL-3.0 license text exists. Do not merge Ruby/Angular into Frappe. Basic scheduling authority remains ERPNext Task + BuildSuite; external advanced scheduling is not enabled until a demonstrated capability gap justifies replacing that authority.

## Cepho

Frappe app; README targets v15. `requirements.txt` lists unbounded `frappe` and `erpnext`; no pinned compatibility. The inspected tree has no root license file despite an MIT README badge. `progress_billing/doctype/running_bill/running_bill.py` is a class with `pass`; no test-shaped paths were found. This cannot substantiate production RA billing claims. No code copied or installed. BuildSuite measurement/billing is the selected candidate implementation.

## Limits

Recent commit timestamps demonstrate recent changes, not maintenance quality. No independent vulnerability database review, complete upstream issue triage, exhaustive code audit or legal sign-off has been completed. Each unresolved item is a release gate rather than a production-ready claim.
