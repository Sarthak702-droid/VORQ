"""PROPOSED, NOT EXECUTED. Requires user approval after automatic review rejection.
Only records a local ERP payment; it does not call a bank or transfer funds.
"""
from decimal import Decimal
import frappe
from frappe.utils import today


def run(invoice_name="ACC-PINV-2026-00001"):
    if frappe.local.site != "frontend" or frappe.session.user != "Administrator":
        frappe.throw("This acceptance action is restricted to the isolated local administrator.")
    invoice = frappe.get_doc("Purchase Invoice", invoice_name)
    if invoice.company != "VORQ Development" or invoice.docstatus != 1:
        frappe.throw("Only a submitted VORQ development invoice is allowed.")
    if Decimal(str(invoice.outstanding_amount)) != Decimal("1000"):
        frappe.throw("The approved test requires exactly INR 1000 outstanding.")
    from erpnext.accounts.doctype.payment_entry.payment_entry import get_payment_entry
    cash = frappe.db.get_value("Account", {"company": invoice.company, "account_type": "Cash", "is_group": 0}, "name")
    if not cash:
        frappe.throw("Development cash account is missing.")
    payment = get_payment_entry("Purchase Invoice", invoice.name, bank_account=cash)
    payment.reference_no = "VORQ-DEV-ACCEPTANCE-" + invoice.name
    payment.reference_date = today()
    payment.insert()
    payment.submit()
    if Decimal(str(frappe.db.get_value("Purchase Invoice", invoice.name, "outstanding_amount"))) != 0:
        frappe.throw("Invoice did not reconcile to zero outstanding.")
    rows = frappe.get_all("GL Entry", filters={"voucher_no": payment.name, "is_cancelled": 0}, fields=["debit", "credit"])
    if not rows or abs(sum(Decimal(str(r.debit))-Decimal(str(r.credit)) for r in rows)) >= Decimal("0.01"):
        frappe.throw("Payment ledger did not balance.")
    frappe.db.commit()
    return {"payment_entry": payment.name, "invoice": invoice.name, "amount": "1000", "outstanding": "0", "ledger_balanced": True}
