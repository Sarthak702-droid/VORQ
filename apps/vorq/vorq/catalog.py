"""Explicit public contracts; never permit arbitrary DocTypes or payload fields."""
CATALOG = {
 "customers": ("Customer", ["customer_name", "customer_type", "customer_group", "territory"], ["Owner", "Accountant"]),
 "suppliers": ("Supplier", ["supplier_name", "supplier_type", "supplier_group"], ["Owner", "Procurement Officer", "Accountant"]),
 "items": ("Item", ["item_code", "item_name", "item_group", "stock_uom", "is_stock_item"], ["Owner", "Procurement Officer", "Storekeeper"]),
 "warehouses": ("Warehouse", ["warehouse_name", "parent_warehouse", "is_group"], ["Owner", "Storekeeper"]),
 "projects": ("Project", ["project_name", "customer", "expected_start_date", "expected_end_date", "estimated_costing", "status"], ["Owner", "Project Manager"]),
 "tasks": ("Task", ["subject", "exp_start_date", "exp_end_date", "progress", "status", "is_milestone", "depends_on"], ["Owner", "Project Manager"]),
 "boqs": ("BOQ", ["title", "revision", "margin_rate", "tax_rate"], ["Owner", "Quantity Surveyor"]),
 "boq-groups": ("BOQ Group", ["boq", "code", "group_name"], ["Owner", "Quantity Surveyor"]),
 "boq-items": ("BOQ Item", ["boq", "boq_group", "code", "description", "unit", "planned_qty", "rate", "cost_head"], ["Owner", "Quantity Surveyor"]),
 "site-reports": ("VORQ Site Report", ["report_date", "weather", "progress_notes", "blockers"], ["Owner", "Project Manager", "Site Engineer"]),
 "labour": ("Labour Attendance Register", ["employee", "attendance_date", "status", "wage_rate", "task", "comments"], ["Owner", "Project Manager", "Site Engineer"]),
 "requests": ("Material Request", ["material_request_type", "schedule_date", "items"], ["Owner", "Project Manager", "Site Engineer", "Procurement Officer"]),
 "purchase-orders": ("Purchase Order", ["supplier", "transaction_date", "schedule_date", "items"], ["Owner", "Procurement Officer"]),
 "receipts": ("Purchase Receipt", ["supplier", "posting_date", "items"], ["Owner", "Storekeeper"]),
 "stock": ("Stock Entry", ["stock_entry_type", "posting_date", "items"], ["Owner", "Storekeeper"]),
 "subcontracts": ("Subcontractor Work Order", ["subcontractor", "date", "retention_percent", "lines"], ["Owner", "Quantity Surveyor"]),
 "measurements": ("Measurement Book", ["work_order", "date", "entries", "remarks"], ["Owner", "Quantity Surveyor", "Site Engineer"]),
 "ra-bills": ("Subcontractor Bill", ["work_order", "date", "supplier_invoice_no", "supplier_invoice_date", "bill_type", "advance_recovery", "expense_account", "lines"], ["Owner", "Quantity Surveyor"]),
 "sales-invoices": ("Sales Invoice", ["customer", "selling_price_list", "posting_date", "due_date", "items"], ["Owner", "Accountant"]),
 "purchase-invoices": ("Purchase Invoice", ["supplier", "buying_price_list", "posting_date", "bill_no", "bill_date", "items"], ["Owner", "Accountant"]),
 "payments": ("Payment Entry", ["payment_type", "party_type", "party", "posting_date", "paid_from", "paid_to", "paid_amount", "received_amount", "reference_no", "reference_date", "references"], ["Owner", "Accountant"]),
 "expenses": ("Journal Entry", ["voucher_type", "posting_date", "user_remark", "accounts"], ["Owner", "Accountant"]),
}
CHILD_FIELDS = {"item_code", "qty", "rate", "uom", "schedule_date", "warehouse", "s_warehouse", "t_warehouse", "expense_account", "cost_center", "purchase_order", "purchase_order_item", "purchase_receipt", "pr_detail", "material_request", "material_request_item", "subject", "task", "scope", "work_order_line", "quantity", "length", "breadth", "height", "depth", "is_deduction", "nos", "measured_qty", "this_period_qty", "description", "account", "debit_in_account_currency", "credit_in_account_currency", "party_type", "party", "reference_doctype", "reference_name", "total_amount", "outstanding_amount", "allocated_amount"}
FINANCIAL = {"sales-invoices", "purchase-invoices", "payments", "expenses"}
READ_FIELDS = {
 "boqs": ["status", "planned_amount", "margin_amount", "tax_amount", "total", "approved_by", "approved_date"],
 "boq-items": ["planned_amount"],
 "subcontracts": ["total_value"],
 "measurements": ["status", "measured_total", "certified_by"],
 "ra-bills": ["gross", "retention_amount", "net_payable", "purchase_invoice"],
 "purchase-orders": ["status", "grand_total", "per_received", "per_billed"],
 "receipts": ["status", "grand_total"],
 "sales-invoices": ["status", "grand_total", "outstanding_amount"],
 "purchase-invoices": ["status", "grand_total", "outstanding_amount"],
 "labour": ["daily_wage_calculated"],
}
