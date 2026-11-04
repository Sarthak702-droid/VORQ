"""Site-per-tenant boundary plus explicit company and project membership.
All customer API calls go through the VORQ facade. Administrator retains Desk access.
"""
import frappe


def guard_api():
    path = frappe.request.path if frappe.request else ""
    command = frappe.form_dict.get("cmd") if frappe.form_dict else None
    if frappe.session.user == "Administrator":
        return
    if command and command not in {"login", "logout", "frappe.auth.get_logged_user"} and not command.startswith("vorq.api.v1."):
        frappe.throw("Use the authorized VORQ API.", frappe.PermissionError)
    if not path.startswith("/api/"):
        return
    safe = ("/api/method/vorq.api.v1.",)
    exact = {"/api/method/login", "/api/method/logout", "/api/method/frappe.auth.get_logged_user"}
    if path not in exact and not path.startswith(safe):
        frappe.throw("Use the authorized VORQ API.", frappe.PermissionError)


def member(company):
    if frappe.session.user == "Guest":
        frappe.throw("Sign in to continue.", frappe.AuthenticationError)
    if frappe.session.user == "Administrator":
        return "Owner"
    role = frappe.db.get_value("VORQ Company Member", {"user": frappe.session.user, "company": company}, "role")
    if not role:
        frappe.throw("Company access denied.", frappe.PermissionError)
    return role


def project_access(project, company):
    role = member(company)
    actual = frappe.db.get_value("Project", project, "company")
    if actual != company:
        frappe.throw("Project does not belong to this company.", frappe.PermissionError)
    if frappe.session.user == "Administrator":
        return role
    if not frappe.db.exists("VORQ Project Member", {"user": frappe.session.user, "project": project}):
        frappe.throw("Project access denied.", frappe.PermissionError)
    return role
