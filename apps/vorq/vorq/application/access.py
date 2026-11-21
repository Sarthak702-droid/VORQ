"""Company, project and linked-document scope for application use cases."""
import frappe
from vorq.module_registry import CATALOG, FINANCIAL
from vorq.modules.identity.service import member, project_access


def _entry(module):
    if not isinstance(module, str) or module not in CATALOG:
        frappe.throw("Unknown module.", frappe.ValidationError)
    return CATALOG[module]



def _allowed(module, company, write=False):
    role = member(company)
    _entry(module)
    if module in FINANCIAL and role not in {"Owner", "Accountant"}:
        frappe.throw("Financial access denied.", frappe.PermissionError)
    if write and role not in _entry(module)[2]:
        frappe.throw("This role cannot change these records.", frappe.PermissionError)
    if role == "Subcontractor":
        # Supplier identity binding and own-scope portal are a separate release gate.
        frappe.throw("Subcontractor portal is not enabled.", frappe.PermissionError)
    return role



def _project_names(company):
    if frappe.session.user == "Administrator":
        return frappe.get_all("Project", filters={"company": company}, pluck="name")
    return frappe.get_all("VORQ Project Member", filters={"user": frappe.session.user}, pluck="project")



def _scope(doc, company, project):
    if doc.doctype in {"Customer", "Supplier", "Item"}:
        member(company)
        return
    if doc.doctype == "Warehouse":
        member(company)
        if doc.company != company:
            frappe.throw("Warehouse company mismatch.", frappe.PermissionError)
        return
    if doc.doctype in {"BOQ Group", "BOQ Item"}:
        parent = frappe.get_doc("BOQ", doc.boq)
        parent.check_permission("read")
        _scope(parent, company, project)
        return
    if doc.doctype == "Project":
        project_access(doc.name, company)
        return
    project_access(project, company)
    if doc.meta.has_field("company") and doc.company != company:
        frappe.throw("Record company mismatch.", frappe.PermissionError)
    has_project = doc.meta.has_field("project")
    if has_project and doc.project != project:
        frappe.throw("Record project mismatch.", frappe.PermissionError)
    if doc.doctype == "Payment Entry":
        references = doc.get("references") or []
        if not references:
            frappe.throw("Payments must reference project invoices.", frappe.ValidationError)
        for row in references:
            if row.reference_doctype not in {"Sales Invoice", "Purchase Invoice"}:
                frappe.throw("Only invoice settlements are supported.", frappe.ValidationError)
            invoice = frappe.get_doc(row.reference_doctype, row.reference_name)
            invoice.check_permission("read")
            _scope(invoice, company, project)
    elif not has_project:
        rows = list(doc.get("items") or doc.get("accounts") or [])
        if not rows or any(row.get("project") != project for row in rows):
            frappe.throw("Every transaction line must belong to this project.", frappe.PermissionError)
    # Cross-project links cannot smuggle quantities/measurements into another project.
    for field in doc.meta.fields:
        if field.fieldtype == "Link" and field.options in {"BOQ", "BOQ Group", "Subcontractor Work Order", "Task", "Purchase Order", "Purchase Receipt", "Material Request"} and doc.get(field.fieldname):
            linked = frappe.get_doc(field.options, doc.get(field.fieldname))
            linked.check_permission("read")
            _scope(linked, company, project)
    for table in doc.meta.get_table_fields():
        for row in doc.get(table.fieldname) or []:
            for key, target in (("purchase_order", "Purchase Order"), ("purchase_receipt", "Purchase Receipt"), ("material_request", "Material Request"), ("task", "Task")):
                if row.get(key):
                    linked = frappe.get_doc(target, row.get(key))
                    linked.check_permission("read")
                    _scope(linked, company, project)
