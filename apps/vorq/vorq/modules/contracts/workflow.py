"""Measurement lifecycle policy and upstream certification commands."""
import frappe


def editable(doc):
    if doc.status == "Certified":
        frappe.throw("Certified measurements are immutable.", frappe.ValidationError)


def actions(doc, role):
    return ["Certify"] if role in {"Owner", "Quantity Surveyor"} and doc.status == "Draft" else []


def certify(doc, role):
    if role not in {"Owner", "Quantity Surveyor"}:
        frappe.throw("QS certification required.", frappe.PermissionError)
    from buildsuite_core.api.subcontract import certify_measurement_book
    certify_measurement_book(doc.name)
