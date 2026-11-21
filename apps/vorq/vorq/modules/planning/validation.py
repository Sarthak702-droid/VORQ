"""Domain invariants around upstream controllers."""
import frappe
from vorq.shared.numbers import decimal


def require_editable_boq(doc, method=None):
    if not doc.boq:
        frappe.throw("A BOQ revision is required.", frappe.ValidationError)
    previous = doc.get_doc_before_save()
    revisions = {doc.boq}
    if previous and previous.boq:
        revisions.add(previous.boq)
    for revision in sorted(revisions):
        boq = frappe.get_doc("BOQ", revision, for_update=True)
        if boq.status != "Draft":
            frappe.throw("Only draft BOQ revisions can be edited.", frappe.ValidationError)
    if doc.doctype == "BOQ Item":
        if decimal(doc.planned_qty) < 0 or decimal(doc.rate) < 0:
            frappe.throw("BOQ quantities and rates cannot be negative.", frappe.ValidationError)
        if frappe.db.get_value("BOQ Group", doc.boq_group, "boq") != doc.boq:
            frappe.throw("BOQ group belongs to another revision.", frappe.ValidationError)
