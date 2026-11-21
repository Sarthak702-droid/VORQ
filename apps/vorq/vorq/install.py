import frappe


def ensure_unique_constraints():
    constraints = (
        ("VORQ Company Member", ["user", "company"]),
        ("VORQ Project Member", ["user", "project"]),
        ("VORQ Site Report", ["project", "report_date"]),
    )
    for doctype, fields in constraints:
        frappe.db.add_unique(doctype, fields)
