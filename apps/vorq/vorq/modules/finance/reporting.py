"""Authorised project financial read model over the ERPNext ledger."""
import frappe
from vorq.permissions import project_access


def overview(company, project):
    role = project_access(project, company)
    doc = frappe.get_doc("Project", project)
    doc.check_permission("read")
    result = {"progress": doc.percent_complete, "status": doc.status, "financials": None}
    if role in {"Owner", "Accountant"}:
        frappe.has_permission("GL Entry", "read", throw=True)
        ledger = frappe.db.sql("""SELECT a.root_type, SUM(g.debit - g.credit) amount
            FROM `tabGL Entry` g JOIN `tabAccount` a ON a.name = g.account
            WHERE g.company = %s AND g.project = %s AND g.is_cancelled = 0
            AND a.root_type IN ('Expense', 'Income') GROUP BY a.root_type""", (company, project), as_dict=True)
        totals = {r.root_type: str(r.amount) for r in ledger}
        result["financials"] = {"expense": totals.get("Expense", "0"), "income_balance": totals.get("Income", "0")}
    return result
