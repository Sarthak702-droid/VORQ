"""Owned record contracts. Upstream DocTypes remain authoritative."""

CATALOG = {'customers': ('Customer',
               ['customer_name', 'customer_type', 'customer_group', 'territory'],
               ['Owner', 'Accountant']),
 'suppliers': ('Supplier',
               ['supplier_name', 'supplier_type', 'supplier_group'],
               ['Owner', 'Procurement Officer', 'Accountant']),
 'items': ('Item',
           ['item_code', 'item_name', 'item_group', 'stock_uom', 'is_stock_item'],
           ['Owner', 'Procurement Officer', 'Storekeeper']),
 'warehouses': ('Warehouse',
                ['warehouse_name', 'parent_warehouse', 'is_group'],
                ['Owner', 'Storekeeper'])}

READ_FIELDS = {}

FINANCIAL = set()
