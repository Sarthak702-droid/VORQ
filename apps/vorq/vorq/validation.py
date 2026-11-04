"""Additional construction invariants around upstream business controllers."""
from decimal import Decimal, InvalidOperation
import frappe


def decimal(value):
    try:
        result = Decimal(str(value or 0))
        if not result.is_finite():
            raise InvalidOperation
        return result
    except (InvalidOperation, ValueError):
        frappe.throw("A finite decimal value is required.", frappe.ValidationError)


def require_editable_boq(doc, method=None):
    boq = frappe.get_doc("BOQ", doc.boq, for_update=True)
    if boq.status not in {"Draft"}:
        frappe.throw("Only draft BOQ revisions can be edited.", frappe.ValidationError)
    if doc.doctype == "BOQ Item":
        if decimal(doc.planned_qty) < 0 or decimal(doc.rate) < 0:
            frappe.throw("BOQ quantities and rates cannot be negative.", frappe.ValidationError)
        if frappe.db.get_value("BOQ Group", doc.boq_group, "boq") != doc.boq:
            frappe.throw("BOQ group belongs to another revision.", frappe.ValidationError)


def validate_measurement(doc, method=None):
    wo = frappe.get_doc("Subcontractor Work Order", doc.work_order, for_update=True)
    if wo.project != doc.project or wo.docstatus != 1:
        frappe.throw("Measurements require a submitted work order in this project.", frappe.ValidationError)
    lines = {r.name: r for r in wo.lines}
    for row in doc.entries:
        if row.work_order_line not in lines:
            frappe.throw("Every measurement must reference a work-order line.", frappe.ValidationError)
        if decimal(row.quantity) < 0 or any(decimal(row.get(k)) < 0 for k in ("nos", "length", "breadth", "depth")):
            frappe.throw("Use a deduction entry for negative measurements.", frappe.ValidationError)
    old = doc.get_doc_before_save()
    if old and old.status == "Certified" and doc.status == "Certified" and doc.has_value_changed("entries"):
        frappe.throw("Certified measurements cannot be edited.", frappe.ValidationError)


def prepare_ra_bill(doc, method=None):
    if not doc.work_order or doc.is_direct:
        frappe.throw("VORQ RA billing requires a submitted measurement-based work order.", frappe.ValidationError)
    wo = frappe.get_doc("Subcontractor Work Order", doc.work_order, for_update=True)
    if wo.docstatus != 1 or wo.project != doc.project:
        frappe.throw("Work order is not submitted in this project.", frappe.ValidationError)
    if decimal(doc.advance_recovery) != 0:
        frappe.throw("Advance recovery requires the pending advance-reconciliation workflow.", frappe.ValidationError)
    # Always derive quantities, contracted rates and retention on the server. The WO row
    # lock serializes concurrent drafts/submissions; posted bills define previous quantity.
    doc.retention_percent = wo.retention_percent
    if not Decimal(0) <= decimal(doc.retention_percent) <= Decimal(100):
        frappe.throw("Retention must be between 0 and 100 percent.", frappe.ValidationError)
    doc.fetch_lines()
    limits = {r.name: decimal(r.qty) for r in wo.lines}
    for row in doc.lines:
        if decimal(row.measured_qty_to_date) > limits[row.work_order_line]:
            frappe.throw("Certified quantity exceeds the contracted quantity. Amend the contract first.", frappe.ValidationError)
    if not any(decimal(r.this_period_qty) > 0 for r in doc.lines):
        frappe.throw("No unbilled certified measurements remain.", frappe.ValidationError)
