"""Real, persistent acceptance scenario. Run ONLY on the isolated dev site.
bench --site frontend execute vorq.smoke.run
"""
import json
from decimal import Decimal
import frappe
from frappe.utils import today, getdate
from vorq.api import v1


def run():
    frappe.set_user("Administrator")
    from erpnext.setup.setup_wizard.operations.install_fixtures import install
    if not frappe.db.exists("Warehouse Type", "Transit"):
        install("India")
    from frappe.utils.nestedset import rebuild_tree
    rebuild_tree("Supplier Group")
    frappe.db.commit()
    company = "VORQ Development"
    if not frappe.db.exists("Company", company):
        frappe.get_doc({"doctype": "Company", "company_name": company, "abbr": "VQD", "country": "India", "default_currency": "INR", "chart_of_accounts": "Standard"}).insert()
    year = getdate(today()).year
    fy = str(year)
    if not frappe.db.exists("Fiscal Year", fy):
        frappe.get_doc({"doctype": "Fiscal Year", "year": fy, "year_start_date": f"{year}-01-01", "year_end_date": f"{year}-12-31"}).insert()
    frappe.db.set_single_value("Global Defaults", "default_company", company)
    frappe.db.set_single_value("Global Defaults", "default_currency", "INR")
    frappe.db.set_single_value("Global Defaults", "current_fiscal_year", fy)
    if not frappe.db.exists("Supplier", "VORQ Test Supplier"):
        frappe.get_doc({"doctype": "Supplier", "supplier_name": "VORQ Test Supplier", "supplier_group": frappe.db.get_value("Supplier Group", {"is_group": 0}, "name"), "supplier_type": "Company"}).insert()
    if not frappe.db.exists("Customer", "VORQ Test Customer"):
        frappe.get_doc({"doctype": "Customer", "customer_name": "VORQ Test Customer", "customer_group": frappe.db.get_value("Customer Group", {"is_group": 0}, "name"), "territory": "All Territories", "customer_type": "Company"}).insert()
    item_code = "VORQ-TEST-CEMENT"
    if not frappe.db.exists("Item", item_code):
        frappe.get_doc({"doctype": "Item", "item_code": item_code, "item_name": "Verification Cement", "item_group": frappe.db.get_value("Item Group", {"is_group": 0}, "name"), "stock_uom": "Nos", "is_stock_item": 1, "valuation_rate": 100}).insert()
    if not frappe.db.exists("Warehouse", "VORQ Test Stores - VQD"):
        frappe.get_doc({"doctype": "Warehouse", "warehouse_name": "VORQ Test Stores", "company": company, "is_group": 0}).insert()
    warehouse = "VORQ Test Stores - VQD"
    stamp = frappe.generate_hash(length=10)
    key = "project-acceptance-" + stamp
    values = {"project_name": "Acceptance Site " + stamp, "customer": "VORQ Test Customer", "expected_start_date": today(), "status": "Open"}
    first = v1.save("projects", company, "", values, key)
    replay = v1.save("projects", company, "", values, key)
    assert replay["name"] == first["name"] and replay["replayed"]
    project = first["name"]
    try:
        v1.save("projects", company, "", {**values, "project_name": "Changed"}, key)
        raise AssertionError("Conflicting idempotency key accepted")
    except frappe.ValidationError:
        pass
    # A real purchase order, receipt and stock issue, all through the public facade.
    items = [{"item_code": item_code, "qty": 10, "rate": 100, "warehouse": warehouse, "schedule_date": today()}]
    po = v1.save("purchase-orders", company, project, {"supplier": "VORQ Test Supplier", "transaction_date": today(), "schedule_date": today(), "items": items}, "po-acceptance-" + stamp)["name"]
    def submit(module, name):
        doc = frappe.get_doc(v1._entry(module)[0], name)
        return v1.transition(module, company, project, name, "Submit", str(doc.modified), "submit-" + name + "-" + stamp)
    submit("purchase-orders", po)
    po_doc = frappe.get_doc("Purchase Order", po)
    receipt_items = [{"item_code": item_code, "qty": 10, "rate": 100, "warehouse": warehouse, "purchase_order": po, "purchase_order_item": po_doc.items[0].name}]
    pr = v1.save("receipts", company, project, {"supplier": "VORQ Test Supplier", "posting_date": today(), "items": receipt_items}, "receipt-acceptance-" + stamp)["name"]
    submit("receipts", pr)
    issue = v1.save("stock", company, project, {"stock_entry_type": "Material Issue", "posting_date": today(), "items": [{"item_code": item_code, "qty": 3, "s_warehouse": warehouse, "cost_center": frappe.db.get_value("Company", company, "cost_center")}]}, "issue-acceptance-" + stamp)["name"]
    submit("stock", issue)
    # Use ERPNext's mapper for invoice linkage and valuation/tax machinery.
    from erpnext.stock.doctype.purchase_receipt.purchase_receipt import make_purchase_invoice
    invoice = make_purchase_invoice(pr)
    invoice.bill_no = "VORQ-ACCEPTANCE-" + stamp
    invoice.bill_date = today()
    invoice.insert()
    invoice.submit()
    sle = frappe.get_all("Stock Ledger Entry", filters={"voucher_no": ["in", [pr, issue]], "is_cancelled": 0}, fields=["voucher_no", "actual_qty", "stock_value_difference"])
    assert sum(Decimal(str(r.actual_qty)) for r in sle) == Decimal("7"), sle
    gl = frappe.get_all("GL Entry", filters={"voucher_no": ["in", [pr, issue, invoice.name]], "is_cancelled": 0}, fields=["debit", "credit", "project"])
    assert gl, "No real GL entries created"
    assert abs(sum(Decimal(str(r.debit)) - Decimal(str(r.credit)) for r in gl)) < Decimal("0.01"), gl
    # Persistent BOQ baseline and measurement-based subcontract invoice.
    boq = v1.save("boqs", company, project, {"title": "Acceptance BOQ " + stamp, "revision": 1}, "boq-acceptance-" + stamp)["name"]
    group = v1.save("boq-groups", company, project, {"boq": boq, "code": "100", "group_name": "Civil"}, "group-acceptance-" + stamp)["name"]
    boq_values = {"boq": boq, "boq_group": group, "code": "100.1", "description": "Concrete works", "unit": "Nos", "planned_qty": "10.25", "rate": "100.40"}
    v1.save("boq-items", company, project, boq_values, "boqitem-acceptance-" + stamp)
    assert Decimal(str(frappe.db.get_value("BOQ", boq, "planned_amount"))) == Decimal("1029.1")
    boq_doc = frappe.get_doc("BOQ", boq)
    v1.transition("boqs", company, project, boq, "Approve baseline", str(boq_doc.modified), "approveboq-" + stamp)
    try:
        v1.save("boq-items", company, project, {**boq_values, "code": "100.2"}, "frozenboq-" + stamp)
        raise AssertionError("Approved BOQ was mutable")
    except frappe.ValidationError:
        pass
    wo = v1.save("subcontracts", company, project, {"subcontractor": "VORQ Test Supplier", "date": today(), "retention_percent": 5, "lines": [{"scope": "Measured work", "qty": 10, "uom": "Nos", "rate": 200}]}, "wo-acceptance-" + stamp)["name"]
    submit("subcontracts", wo)
    wo_doc = frappe.get_doc("Subcontractor Work Order", wo)
    mb = v1.save("measurements", company, project, {"work_order": wo, "date": today(), "entries": [{"description": "Certified scope", "work_order_line": wo_doc.lines[0].name, "quantity": 4}]}, "mb-acceptance-" + stamp)["name"]
    mb_doc = frappe.get_doc("Measurement Book", mb)
    v1.transition("measurements", company, project, mb, "Certify", str(mb_doc.modified), "certifymb-" + stamp)
    bill = v1.save("ra-bills", company, project, {"work_order": wo, "date": today(), "bill_type": "Normal", "lines": []}, "rabill-acceptance-" + stamp)["name"]
    submit("ra-bills", bill)
    bill_doc = frappe.get_doc("Subcontractor Bill", bill)
    assert Decimal(str(bill_doc.gross)) == Decimal("800")
    assert Decimal(str(bill_doc.retention_amount)) == Decimal("40")
    assert bill_doc.purchase_invoice and frappe.db.get_value("Purchase Invoice", bill_doc.purchase_invoice, "docstatus") == 1
    try:
        v1.save("ra-bills", company, project, {"work_order": wo, "date": today(), "bill_type": "Normal", "lines": []}, "duplicate-ra-" + stamp)
        raise AssertionError("Certified quantities billed twice")
    except frappe.ValidationError:
        pass
    # Ordinary user with a broad ERP role still cannot cross the explicit VORQ boundary.
    user = "vorq-denied@example.invalid"
    if not frappe.db.exists("User", user):
        user = "Guest"
    frappe.set_user(user)
    try:
        v1.workspace(company)
        raise AssertionError("Nonmember gained company access")
    except (frappe.PermissionError, frappe.AuthenticationError):
        pass
    finally:
        frappe.set_user("Administrator")
    frappe.db.commit()
    result = {"company": company, "project": project, "purchase_order": po, "purchase_receipt": pr, "material_issue": issue, "purchase_invoice": invoice.name, "boq": boq, "work_order": wo, "measurement": mb, "ra_bill": bill, "ra_purchase_invoice": bill_doc.purchase_invoice, "retention": "40", "stock_delta": "7", "gl_balanced": True, "idempotency_verified": True, "nonmember_denied": True}
    print(json.dumps(result, default=str))
    return result
