"""Owned record contracts. Upstream DocTypes remain authoritative."""

CATALOG = {'receipts': ('Purchase Receipt', ['supplier', 'posting_date', 'items'], ['Owner', 'Storekeeper']),
 'stock': ('Stock Entry', ['stock_entry_type', 'posting_date', 'items'], ['Owner', 'Storekeeper'])}

READ_FIELDS = {'receipts': ['status', 'grand_total']}

FINANCIAL = set()
