import frappe
from frappe.rate_limiter import rate_limit
from frappe.utils import validate_email_address


@rate_limit(limit=5, seconds=600, methods=["POST"], ip_based=True)
def register(full_name, email, password):
    if frappe.session.user != "Guest":
        frappe.throw("Sign out before registering a new account.", frappe.PermissionError)
    if not all(isinstance(value, str) for value in (full_name, email, password)):
        frappe.throw("Name, email and password are required.", frappe.ValidationError)
    full_name = full_name.strip()
    email = email.strip().lower()
    if not 2 <= len(full_name) <= 100 or any(c in full_name for c in '<>\r\n'):
        frappe.throw("Enter your name using 2 to 100 characters.", frappe.ValidationError)
    if len(email) > 140 or validate_email_address(email, throw=False) != email:
        frappe.throw("Enter a valid email address.", frappe.ValidationError)
    if not 12 <= len(password) <= 128:
        frappe.throw("Use a password with 12 to 128 characters.", frappe.ValidationError)
    response = {"message": "Registration received. Sign in with your credentials. New accounts need administrator verification and workspace access.", "access": "pending_verification"}
    # Never change a pre-existing identity or password, or infer company from an email domain.
    if frappe.db.exists("User", email):
        return response
    user = frappe.get_doc({
        "doctype": "User", "email": email, "first_name": full_name,
        "enabled": 1, "user_type": "Website User", "new_password": password,
        "send_welcome_email": 0, "roles": [],
    })
    user.flags.no_welcome_mail = True
    user.insert(ignore_permissions=True)  # Only fixed, unprivileged fields above; no caller-controlled roles.
    return response
