# Versioned API contracts

Prefix `/api/method/vorq.api.v1.`. JSON envelope is Frappe `{message: ...}`. Authentication: same-origin HttpOnly Frappe session cookie. Mutations require `X-Frappe-CSRF-Token`; frontend obtains it from `session`. Login/logout use standard Frappe method endpoints. No service token enters React.

| Method | Endpoint | Contract |
|---|---|---|
| GET | session | User/full name, assigned company names, CSRF token |
| GET | workspace(company) | Server role, permission-filtered modules, explicitly assigned projects |
| GET | records(module,company,project,start) | Up to 50 candidate rows, authorized records only, form schema and pagination cursor |
| GET | detail(module,name,company,project) | Authorized values, document version and current state |
| POST | save(module,company,project,values,idempotency_key,name?,modified?) | Allowlisted fields only; native record identity; new or version-checked update |
| POST | transition(module,company,project,name,action,modified,idempotency_key) | Upstream submit/cancel/workflow; BOQ approval; measurement certification |
| GET | overview(company,project) | Project progress/status; permission-gated posted expense/income GL balances |

`modified` must exactly match current server version. Stable idempotency keys are 16–128 characters, namespaced by authenticated user; payload hash mismatch fails. Unique request insert and target mutation commit in the same transaction. A simultaneous duplicate may receive a conflict/error and should retry the same key after the first transaction finishes. Lost successful responses can be retried without duplicate documents. Workflow transitions must also retry a stable key; the UI retains the same per-document/action key while the form remains open. Cross-reload retry persistence still needs hardening.

No arbitrary DocType or arbitrary upstream RPC proxy exists. Read/write permission failures must not be transformed into success. Frappe exceptions return safe messages in the UI; stack traces/HTML are not rendered. Bulk operations, files, webhooks, rate-limit response handling and mobile queue contracts are not implemented yet.

### Self-registration

`POST signup(full_name,email,password)` is available to guests. It validates name/email, enforces 12–128 password characters and native Frappe password policy, and rate-limits five attempts/IP/ten minutes. Only fixed Website User fields are inserted. No requested role/company/project fields are accepted or mapped. Existing identities/passwords remain unchanged. The response directs the user to Login and explains that workspace access requires administrator verification. No outbound email is sent. Email ownership verification remains manual before membership assignment.
