"""Request deduplication within the caller's Frappe transaction."""
import hashlib
import json
import frappe


def _request(key, body):
    if not isinstance(key, str) or not 16 <= len(key) <= 128:
        frappe.throw("A stable idempotency key is required.", frappe.ValidationError)
    name = hashlib.sha256((frappe.session.user + ":" + key).encode()).hexdigest()
    digest = hashlib.sha256(json.dumps(body, sort_keys=True, default=str).encode()).hexdigest()
    existing = frappe.db.get_value("VORQ Request", name, ["request_hash", "reference_doctype", "reference_name"], as_dict=True)
    if existing:
        if existing.request_hash != digest:
            frappe.throw("Idempotency key was used for a different request.", frappe.ValidationError)
        doc = frappe.get_doc(existing.reference_doctype, existing.reference_name)
        doc.check_permission("read")
        return None, doc
    request = frappe.get_doc({"doctype": "VORQ Request", "name": name, "request_hash": digest})
    request.insert(ignore_permissions=True, set_name=name)  # Internal record only; unique PK arbitrates concurrent retries.
    return request, None

