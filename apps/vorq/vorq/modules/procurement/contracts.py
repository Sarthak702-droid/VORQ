"""Owned record contracts. Upstream DocTypes remain authoritative."""

CATALOG = {'requests': ('Material Request',
              ['material_request_type', 'schedule_date', 'items'],
              ['Owner', 'Project Manager', 'Site Engineer', 'Procurement Officer']),
 'purchase-orders': ('Purchase Order',
                     ['supplier', 'transaction_date', 'schedule_date', 'items'],
                     ['Owner', 'Procurement Officer'])}

READ_FIELDS = {'purchase-orders': ['status', 'grand_total', 'per_received', 'per_billed']}

FINANCIAL = set()
