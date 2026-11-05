"""Local verification fixture only. Creates a named price-list master, no postings/users."""
import os
os.chdir('/home/frappe/frappe-bench/sites')
import frappe
frappe.init(site='frontend')
frappe.connect()
try:
    assert frappe.db.exists('Company', 'VORQ Development'), 'Only the existing local verification company is supported.'
    frappe.set_user('Administrator')
    name = 'VORQ Mobile Verification'
    if not frappe.db.exists('Price List', name):
        currency = frappe.db.get_value('Company', 'VORQ Development', 'default_currency')
        assert currency, 'Configure company currency first.'
        frappe.get_doc({'doctype': 'Price List', 'price_list_name': name, 'currency': currency, 'selling': 1, 'buying': 1, 'enabled': 1}).insert()
        frappe.db.commit()
    print('Local non-posting verification price list ready.')
finally:
    frappe.destroy()
