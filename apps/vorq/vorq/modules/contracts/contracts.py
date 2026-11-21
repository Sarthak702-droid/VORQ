"""Owned record contracts. Upstream DocTypes remain authoritative."""

CATALOG = {'subcontracts': ('Subcontractor Work Order',
                  ['subcontractor', 'date', 'retention_percent', 'lines'],
                  ['Owner', 'Quantity Surveyor']),
 'measurements': ('Measurement Book',
                  ['work_order', 'date', 'entries', 'remarks'],
                  ['Owner', 'Quantity Surveyor', 'Site Engineer']),
 'ra-bills': ('Subcontractor Bill',
              ['work_order',
               'date',
               'supplier_invoice_no',
               'supplier_invoice_date',
               'bill_type',
               'advance_recovery',
               'expense_account',
               'lines'],
              ['Owner', 'Quantity Surveyor'])}

READ_FIELDS = {'subcontracts': ['total_value'],
 'measurements': ['status', 'measured_total', 'certified_by'],
 'ra-bills': ['gross', 'retention_amount', 'net_payable', 'purchase_invoice']}

FINANCIAL = set()
