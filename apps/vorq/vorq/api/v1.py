"""Stable v1 HTTP facade and session adapter for the modular monolith."""
import frappe


@frappe.whitelist(methods=["GET"])
def session():
    from vorq.auth_flow import require_assurance
    require_assurance()
    if frappe.session.user == "Guest":
        frappe.throw("Sign in to continue.", frappe.AuthenticationError)
    companies = frappe.get_all("Company", pluck="name") if frappe.session.user == "Administrator" else frappe.get_all("VORQ Company Member", filters={"user": frappe.session.user}, pluck="company")
    return {"user": frappe.session.user, "full_name": frappe.db.get_value("User", frappe.session.user, "full_name"), "companies": companies, "csrf_token": frappe.sessions.get_csrf_token()}


@frappe.whitelist(methods=["GET"])
def workspace(company):
    from vorq.application.workspace import workspace as execute
    return execute(company=company)


@frappe.whitelist(methods=["GET"])
def records(module, company, project=None, start=0):
    from vorq.application.records import records as execute
    return execute(module=module, company=company, project=project, start=start)


@frappe.whitelist(methods=["GET"])
def detail(module, name, company, project):
    from vorq.application.records import detail as execute
    return execute(module=module, name=name, company=company, project=project)


@frappe.whitelist(methods=["POST"])
def save(module, company, project, values, idempotency_key, name=None, modified=None):
    from vorq.application.records import save as execute
    return execute(module=module, company=company, project=project, values=values, idempotency_key=idempotency_key, name=name, modified=modified)


@frappe.whitelist(methods=["POST"])
def transition(module, company, project, name, action, modified, idempotency_key):
    from vorq.application.records import transition as execute
    return execute(module=module, company=company, project=project, name=name, action=action, modified=modified, idempotency_key=idempotency_key)


@frappe.whitelist(methods=["GET"])
def overview(company, project):
    from vorq.modules.finance.reporting import overview as execute
    return execute(company=company, project=project)


@frappe.whitelist(methods=["GET"])
def lookup(doctype, company, project=None, query=""):
    from vorq.application.lookups import lookup as execute
    return execute(doctype=doctype, company=company, project=project, query=query)


@frappe.whitelist(allow_guest=True, methods=["POST"])
def signup(full_name, email, password):
    """Reject legacy registration. Use auth_signup to enrol an authenticator."""
    from vorq.registration import register
    return register(full_name, email, password)


@frappe.whitelist(allow_guest=True, methods=["GET"])
def auth_challenge():
    from vorq.auth_flow import challenge
    return challenge()


@frappe.whitelist(allow_guest=True, methods=["POST"])
def auth_start(usr, pwd, captcha_id, captcha_answer):
    from vorq.auth_flow import start
    return start(usr, pwd, captcha_id, captcha_answer)


@frappe.whitelist(allow_guest=True, methods=["POST"])
def auth_signup(full_name, username, email, password, requested_role, company_name, role_details, captcha_id, captcha_answer):
    from vorq.auth_flow import signup
    return signup(full_name, username, email, password, requested_role, company_name, role_details, captcha_id, captcha_answer)


@frappe.whitelist(allow_guest=True, methods=["POST"])
def auth_finish(challenge_token, code):
    from vorq.auth_flow import finish
    return finish(challenge_token, code)
