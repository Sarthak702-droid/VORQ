"""Owned record contracts. Upstream DocTypes remain authoritative."""

CATALOG = {'sales-invoices': ('Sales Invoice',
                    ['customer', 'selling_price_list', 'posting_date', 'due_date', 'items'],
                    ['Owner', 'Accountant']),
 'purchase-invoices': ('Purchase Invoice',
                       ['supplier',
                        'buying_price_list',
                        'posting_date',
                        'bill_no',
                        'bill_date',
                        'items'],
                       ['Owner', 'Accountant']),
 'payments': ('Payment Entry',
              ['payment_type',
               'party_type',
               'party',
               'posting_date',
               'paid_from',
               'paid_to',
               'paid_amount',
               'received_amount',
               'reference_no',
               'reference_date',
               'references'],
              ['Owner', 'Accountant']),
 'expenses': ('Journal Entry',
              ['voucher_type', 'posting_date', 'user_remark', 'accounts'],
              ['Owner', 'Accountant'])}

READ_FIELDS = {'sales-invoices': ['status', 'grand_total', 'outstanding_amount'],
 'purchase-invoices': ['status', 'grand_total', 'outstanding_amount']}

FINANCIAL = {'expenses', 'sales-invoices', 'payments', 'purchase-invoices'}
