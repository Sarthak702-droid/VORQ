"""Scoped lookup composition for forms across domain contracts."""
import frappe
from vorq.application.access import _scope
from vorq.module_registry import CATALOG, FINANCIAL
from vorq.modules.identity.service import member, project_access


def lookup(doctype, company, project=None, query=""):
    role = member(company)
    masters = {"Customer", "Supplier", "Item", "Warehouse", "UOM", "Item Group", "Supplier Group", "Customer Group", "Territory", "Employee", "Account", "Cost Center", "Stock Entry Type", "Price List"}
    scoped = {"Task", "BOQ", "BOQ Group", "Subcontractor Work Order", "Purchase Order", "Purchase Receipt", "Material Request", "Sales Invoice", "Purchase Invoice"}
    if doctype not in masters | scoped:
        frappe.throw("Lookup is not available for this field.", frappe.PermissionError)
    financial_doctypes = {CATALOG[key][0] for key in FINANCIAL} | {"Account"}
    if doctype in financial_doctypes and role not in {"Owner", "Accountant"}:
        frappe.throw("Financial lookup denied.", frappe.PermissionError)
    filters = {}
    meta = frappe.get_meta(doctype)
    if meta.has_field("company"):
        filters["company"] = company
    if doctype == "Price List":
        filters["enabled"] = 1
    if doctype in scoped:
        project_access(project, company)
        if meta.has_field("project"):
            filters["project"] = project
    filters["name"] = ["like", "%" + str(query)[:100] + "%"]
    names = frappe.get_list(doctype, filters=filters, pluck="name", limit_page_length=20)
    if doctype in scoped:
        safe = []
        for name in names:
            try:
                _scope(frappe.get_doc(doctype, name), company, project)
                safe.append(name)
            except frappe.PermissionError:
                continue
        return safe
    return names

