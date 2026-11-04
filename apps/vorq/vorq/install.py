import frappe

def after_install():
    # System Manager administers memberships; ordinary roles receive DocType permissions
    # through their standard ERPNext roles and the BuildSuite installation.
    for doctype, fields in (("VORQ Company Member", ["user", "company"]), ("VORQ Project Member", ["user", "project"])):
        frappe.db.add_unique(doctype, fields)
    frappe.db.add_unique("VORQ Site Report", ["project", "report_date"])
