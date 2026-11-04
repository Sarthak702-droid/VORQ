# Authoritative ownership

| Entity/workflow | Authority | Implementation surface |
|---|---|---|
| Identity, session, users, document permissions | Frappe | Login/session APIs; no browser service credentials |
| Company and project master | ERPNext Company / Project | Explicit VORQ company and project membership narrow document permissions |
| BOQ/revisions/cost codes/estimation | BuildSuite BOQ / BOQ Group / BOQ Item | One database; no OpenConstructionERP shadow quantities |
| Schedule/tasks/dependencies/milestones | ERPNext Task + BuildSuite validation | OpenProject disabled; external authority switch requires migration contract |
| Suppliers/customers/items/warehouses | ERPNext masters | Shared identities, no duplicate external masters |
| Procurement/receipts/inventory | ERPNext | Material Request, Purchase Order, Purchase Receipt, Stock Entry |
| Site reports | VORQ Site Report | Unique project/date; audited Frappe document |
| Attendance | BuildSuite Labour Attendance Register | Financial payout integration remains a gate |
| Subcontract/measurements/RA bills | BuildSuite | Work Order, Measurement Book, Subcontractor Bill |
| Invoices/payments/journals/ledger/tax | ERPNext | Upstream submit/cancel controllers exclusively |
| Request deduplication | VORQ Request | User/key unique primary name; payload digest; same transaction as target write |
| Dashboards | Authoritative Project and GL queries | No seed financial figures; finance visible only to finance roles |

No extra authoritative ledger, stock balance or BOQ engine is introduced. Single-site-per-tenant deployment is the intended tenant isolation boundary; multiple company access within a site requires both explicit membership and upstream permissions.
