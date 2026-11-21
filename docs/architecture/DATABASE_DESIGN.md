# Database design

Use existing ERPNext/BuildSuite DocTypes; no parallel GL/SLE/stock balance or BOQ tables.

New standard DocTypes in `apps/vorq/vorq/vorq/doctype`:

| DocType | Important fields | Constraint |
|---|---|---|
| VORQ Company Member | user,company,role | unique user/company |
| VORQ Project Member | user,project | unique user/project |
| VORQ Request | primary name = SHA256(user:key), request_hash, reference_doctype/name | unique primary name; internal permission bypass only for bookkeeping |
| VORQ Site Report | project,company,report_date,weather,progress_notes,blockers | unique project/date; track changes |

Request hashes identify payloads; they are not account secrets. All new records enable Frappe track_changes. Migrations use normal app install/migrate. Unique constraints install in after_install; upgrade migrations will need explicit patch entries as schemas evolve. No direct financial-table mutation is allowed. Backups must capture DB, public/private files and encryption/site configuration together.
