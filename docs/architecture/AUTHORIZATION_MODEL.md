# Authorization model

Frappe sessions authenticate users. Administrator retains backend Desk access for setup. Ordinary customers may call only VORQ facade methods and login/logout. The guard also inspects legacy `cmd` RPC paths, so alternative RPC routing does not intentionally bypass the facade.

Every facade request checks VORQ Company Member. Every project record checks Project.company and VORQ Project Member. A company Owner still needs explicit project assignment. Frappe native DocPerm checks remain required; membership cannot elevate document rights. BuildSuite Project Team assignments must be aligned with VORQ memberships. Read lists are scope-filtered; detail and write checks run again. Unknown module/fields are rejected.

Owner, PM, QS, Site Engineer, Storekeeper, Procurement Officer and Accountant are explicit server roles. Module writers are cataloged in `vorq/catalog.py`; financial modules/GL require Owner or Accountant plus upstream rights. Supplier-bound subcontractor access is not implemented and is fail-closed. No frontend role picker grants authority.

Required security verification: anonymous denial, expired sessions, missing CSRF, cross-company/project access, nested parent/child links, raw RPC/resource bypass, stale versions, concurrent idempotency, role revocation and attachment URLs. These have not all been runtime tested. Audit stores Frappe document Version records, server identities and request-target links; raw passwords/tokens are excluded from app logs.
