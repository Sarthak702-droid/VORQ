import frappe

def register(*args, **kwargs):
    frappe.throw("Use VORQ signup with CAPTCHA and authenticator setup.", frappe.AuthenticationError)
