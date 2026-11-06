"""Domain invariants around upstream controllers."""
from decimal import Decimal
import frappe
from vorq.shared.numbers import decimal


def require_editable_boq(doc, method=None):
    boq = frappe.get_doc("BOQ", doc.boq, for_update=True)
    if boq.status not in {"Draft"}:
        frappe.throw("Only draft BOQ revisions can be edited.", frappe.ValidationError)
    if doc.doctype == "BOQ Item":
        if decimal(doc.planned_qty) < 0 or decimal(doc.rate) < 0:
            frappe.throw("BOQ quantities and rates cannot be negative.", frappe.ValidationError)
        if frappe.db.get_value("BOQ Group", doc.boq_group, "boq") != doc.boq:
            frappe.throw("BOQ group belongs to another revision.", frappe.ValidationError)

