"""Workspace composition across registered domains."""
import frappe
from vorq.module_registry import CATALOG, FINANCIAL
from vorq.application.access import _project_names
from vorq.modules.identity.service import member


def workspace(company):
    role = member(company)
    names = _project_names(company)
    projects = frappe.get_list("Project", filters={"name": ["in", names], "company": company}, fields=["name", "project_name", "status", "percent_complete", "expected_end_date"], limit_page_length=500) if names else []
    modules = []
    for key, (doctype, _, writers) in CATALOG.items():
        if key in FINANCIAL and role not in {"Owner", "Accountant"}:
            continue
        if frappe.has_permission(doctype, "read"):
            modules.append({"id": key, "doctype": doctype, "can_create": role in writers and frappe.has_permission(doctype, "create")})
    return {"role": role, "projects": projects, "modules": modules}
