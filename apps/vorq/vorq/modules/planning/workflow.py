"""Planning lifecycle policy and upstream BOQ commands."""
import frappe


def editable(doc):
    if doc.status != "Draft":
        frappe.throw("Only draft BOQs can be edited.", frappe.ValidationError)


def actions(doc, role):
    if role not in {"Owner", "Quantity Surveyor"}:
        return []
    return ["Submit"] if doc.status == "Draft" else ["Approve baseline"] if doc.status == "Submitted" else []


def transition(doc, action, role):
    if role not in {"Owner", "Quantity Surveyor"}:
        frappe.throw("BOQ approval permission required.", frappe.PermissionError)
    if action == "Approve baseline":
        from buildsuite_core.api.boq import approve_boq
        approve_boq(doc.name)
    elif action == "Submit":
        from buildsuite_core.api.boq import submit_boq
        submit_boq(doc.name)
    else:
        frappe.throw("Unsupported BOQ action.", frappe.ValidationError)
