"""Shared finite-decimal validation."""
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
