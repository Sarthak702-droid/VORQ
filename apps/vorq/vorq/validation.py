"""Stable Frappe hook paths; implementations belong to business modules."""
from vorq.shared.numbers import decimal
from vorq.modules.planning.validation import require_editable_boq
from vorq.modules.contracts.validation import validate_measurement, prepare_ra_bill
