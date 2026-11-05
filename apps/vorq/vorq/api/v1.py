"""Versioned facade. Mutations use Frappe transactions and ERPNext controllers."""
import hashlib
import json

import frappe
from vorq.catalog import CATALOG, CHILD_FIELDS, FINANCIAL, READ_FIELDS
from vorq.permissions import member, project_access


def _entry(module):
    if module not in CATALOG:
        frappe.throw("Unknown module.", frappe.ValidationError)
    return CATALOG[module]


def _allowed(module, company, write=False):
    role = member(company)
    if module in FINANCIAL and role not in {"Owner", "Accountant"}:
        frappe.throw("Financial access denied.", frappe.PermissionError)
    if write and role not in _entry(module)[2]:
        frappe.throw("This role cannot change these records.", frappe.PermissionError)
    if role == "Subcontractor":
        # Supplier identity binding and own-scope portal are a separate release gate.
        frappe.throw("Subcontractor portal is not enabled.", frappe.PermissionError)
    return role


def _project_names(company):
    if frappe.session.user == "Administrator":
        return frappe.get_all("Project", filters={"company": company}, pluck="name")
    return frappe.get_all("VORQ Project Member", filters={"user": frappe.session.user}, pluck="project")


def _scope(doc, company, project):
    if doc.doctype in {"Customer", "Supplier", "Item"}:
        member(company)
        return
    if doc.doctype == "Warehouse":
        member(company)
        if doc.company != company:
            frappe.throw("Warehouse company mismatch.", frappe.PermissionError)
        return
    if doc.doctype in {"BOQ Group", "BOQ Item"}:
        parent = frappe.get_doc("BOQ", doc.boq)
        parent.check_permission("read")
        _scope(parent, company, project)
        return
    if doc.doctype == "Project":
        project_access(doc.name, company)
        return
    project_access(project, company)
    if doc.meta.has_field("company") and doc.company != company:
        frappe.throw("Record company mismatch.", frappe.PermissionError)
    if doc.meta.has_field("project"):
        if doc.project != project:
            frappe.throw("Record project mismatch.", frappe.PermissionError)
    else:
        rows = list(doc.get("items") or doc.get("accounts") or [])
        if doc.doctype == "Payment Entry":
            rows = list(doc.get("references") or [])
            if not rows:
                frappe.throw("Payments must reference project invoices.", frappe.ValidationError)
            for row in rows:
                if row.reference_doctype not in {"Sales Invoice", "Purchase Invoice"}:
                    frappe.throw("Only invoice settlements are supported.", frappe.ValidationError)
                ref = frappe.get_doc(row.reference_doctype, row.reference_name)
                ref.check_permission("read")
                _scope(ref, company, project)
        elif not rows or any(r.get("project") != project for r in rows):
            frappe.throw("Every transaction line must belong to this project.", frappe.PermissionError)
    # Cross-project links cannot smuggle quantities/measurements into another project.
    for field in doc.meta.fields:
        if field.fieldtype == "Link" and field.options in {"BOQ", "BOQ Group", "Subcontractor Work Order", "Task", "Purchase Order", "Purchase Receipt", "Material Request"} and doc.get(field.fieldname):
            linked = frappe.get_doc(field.options, doc.get(field.fieldname))
            linked.check_permission("read")
            _scope(linked, company, project)
    for table in doc.meta.get_table_fields():
        for row in doc.get(table.fieldname) or []:
            for key, target in (("purchase_order", "Purchase Order"), ("purchase_receipt", "Purchase Receipt"), ("material_request", "Material Request"), ("task", "Task")):
                if row.get(key):
                    linked = frappe.get_doc(target, row.get(key))
                    linked.check_permission("read")
                    _scope(linked, company, project)


def _field(field):
    return {"name": field.fieldname, "label": field.label, "type": field.fieldtype, "required": bool(field.reqd), "options": field.options, "default": field.default}


def _schema(module):
    doctype, allowed, _ = _entry(module)
    meta = frappe.get_meta(doctype)
    result = []
    for key in allowed:
        field = meta.get_field(key)
        if not field or field.read_only:
            continue
        info = _field(field)
        if field.fieldtype == "Table":
            info["children"] = [_field(f) for f in frappe.get_meta(field.options).fields if f.fieldname in CHILD_FIELDS and not f.read_only]
        result.append(info)
    return result


@frappe.whitelist(methods=["GET"])
def session():
    from vorq.auth_flow import require_assurance
    require_assurance()
    if frappe.session.user == "Guest":
        frappe.throw("Sign in to continue.", frappe.AuthenticationError)
    companies = frappe.get_all("Company", pluck="name") if frappe.session.user == "Administrator" else frappe.get_all("VORQ Company Member", filters={"user": frappe.session.user}, pluck="company")
    return {"user": frappe.session.user, "full_name": frappe.db.get_value("User", frappe.session.user, "full_name"), "companies": companies, "csrf_token": frappe.sessions.get_csrf_token()}


@frappe.whitelist(methods=["GET"])
def workspace(company):
    role = member(company)
    names = _project_names(company)
    projects = frappe.get_list("Project", filters={"name": ["in", names], "company": company}, fields=["name", "project_name", "status", "percent_complete", "expected_end_date"], limit_page_length=500) if names else []
    modules = []
    for key, (doctype, _, writers) in CATALOG.items():
        if key in FINANCIAL and role not in {"Owner", "Accountant"}:
            continue
        if frappe.has_permission(doctype, "read"):
            modules.append({"id": key, "doctype": doctype, "can_create": role in writers and frappe.has_permission(doctype, "create")})
    return {"role": role, "projects": projects, "modules": modules}


@frappe.whitelist(methods=["GET"])
def records(module, company, project=None, start=0):
    _allowed(module, company)
    doctype, _, _ = _entry(module)
    if module != "projects":
        project_access(project, company)
    meta = frappe.get_meta(doctype)
    filters = {}
    if meta.has_field("company"):
        filters["company"] = company
    if module == "projects":
        filters["name"] = ["in", _project_names(company)]
    elif meta.has_field("project"):
        filters["project"] = project
    start = max(0, min(int(start), 1000000))
    names = frappe.get_list(doctype, filters=filters, fields=["name"], order_by="modified desc", limit_start=start, limit_page_length=50)
    result = []
    for row in names:
        doc = frappe.get_doc(doctype, row.name)
        doc.check_permission("read")
        try:
            _scope(doc, company, project)
        except frappe.PermissionError:
            continue
        result.append({"name": doc.name, "docstatus": doc.docstatus, "modified": doc.modified, **{key: doc.get(key) for key in _entry(module)[1] if not isinstance(doc.get(key), list)}})
    return {"records": result, "fields": _schema(module), "submittable": bool(meta.is_submittable) or module in {"boqs", "measurements"}, "next_start": start + 50 if len(names) == 50 else None}


@frappe.whitelist(methods=["GET"])
def detail(module, name, company, project):
    _allowed(module, company)
    doc = frappe.get_doc(_entry(module)[0], name)
    doc.check_permission("read")
    _scope(doc, company, project)
    actions = []
    role = member(company)
    if role in {"Owner", "Project Manager", "Accountant", "Quantity Surveyor"}:
        if module == "boqs" and role in {"Owner", "Quantity Surveyor"}:
            actions = ["Submit"] if doc.status == "Draft" else ["Approve baseline"] if doc.status == "Submitted" else []
        elif module == "measurements" and role in {"Owner", "Quantity Surveyor"}:
            actions = ["Certify"] if doc.status == "Draft" else []
        elif doc.get("workflow_state"):
            from frappe.model.workflow import get_transitions
            actions = [t.action for t in get_transitions(doc)]
        elif doc.meta.is_submittable:
            actions = ["Submit"] if doc.docstatus == 0 and frappe.has_permission(doc.doctype, "submit", doc=doc) else ["Cancel"] if doc.docstatus == 1 and frappe.has_permission(doc.doctype, "cancel", doc=doc) else []
    computed = {key: doc.get(key) for key in READ_FIELDS.get(module, []) if doc.meta.has_field(key)}
    return {"computed": computed, "actions": actions, "name": doc.name, "docstatus": doc.docstatus, "modified": doc.modified, "state": doc.get("status"), "values": {key: ([{k: row.get(k) for k in CHILD_FIELDS if row.meta.has_field(k)} for row in doc.get(key)] if isinstance(doc.get(key), list) else doc.get(key)) for key in _entry(module)[1]}, "workflow_state": doc.get("workflow_state")}


def _clean(module, values, company, project):
    allowed = set(_entry(module)[1])
    if not isinstance(values, dict) or set(values) - allowed:
        frappe.throw("Unsupported record fields.", frappe.ValidationError)
    from vorq.validation import decimal
    clean = dict(values)
    meta = frappe.get_meta(_entry(module)[0])
    if meta.has_field("company"):
        clean["company"] = company
    if module != "projects" and meta.has_field("project"):
        clean["project"] = project
    for key, value in clean.items():
        field = meta.get_field(key)
        if field and field.fieldtype in {"Int", "Float", "Currency", "Percent"}:
            decimal(value)
    for field in meta.get_table_fields():
        if field.fieldname not in clean:
            continue
        rows = clean[field.fieldname]
        if not isinstance(rows, list) or len(rows) > 500:
            frappe.throw("Provide at most 500 transaction lines.", frappe.ValidationError)
        child_meta = frappe.get_meta(field.options)
        for row in rows:
            if not isinstance(row, dict) or set(row) - CHILD_FIELDS:
                frappe.throw("Unsupported transaction line fields.", frappe.ValidationError)
            for key, value in row.items():
                child_field = child_meta.get_field(key)
                if child_field and child_field.fieldtype in {"Int", "Float", "Currency", "Percent"}:
                    decimal(value)
            if child_meta.has_field("project"):
                row["project"] = project
    return clean


def _request(key, body):
    if not isinstance(key, str) or not 16 <= len(key) <= 128:
        frappe.throw("A stable idempotency key is required.", frappe.ValidationError)
    name = hashlib.sha256((frappe.session.user + ":" + key).encode()).hexdigest()
    digest = hashlib.sha256(json.dumps(body, sort_keys=True, default=str).encode()).hexdigest()
    existing = frappe.db.get_value("VORQ Request", name, ["request_hash", "reference_doctype", "reference_name"], as_dict=True)
    if existing:
        if existing.request_hash != digest:
            frappe.throw("Idempotency key was used for a different request.", frappe.ValidationError)
        doc = frappe.get_doc(existing.reference_doctype, existing.reference_name)
        doc.check_permission("read")
        return None, doc
    request = frappe.get_doc({"doctype": "VORQ Request", "name": name, "request_hash": digest})
    request.insert(ignore_permissions=True, set_name=name)  # Internal record only; unique PK arbitrates concurrent retries.
    return request, None


@frappe.whitelist(methods=["POST"])
def save(module, company, project, values, idempotency_key, name=None, modified=None):
    _allowed(module, company, write=True)
    if module != "projects":
        project_access(project, company)
    values = frappe.parse_json(values)
    clean = _clean(module, values, company, project)
    request, previous = _request(idempotency_key, [module, company, project, name, modified, clean])
    if previous:
        _scope(previous, company, project)
        return {"name": previous.name, "replayed": True}
    if name:
        doc = frappe.get_doc(_entry(module)[0], name, for_update=True)
        doc.check_permission("write")
        _scope(doc, company, project)
        if str(doc.modified) != str(modified):
            frappe.throw("Record changed. Refresh before saving.", frappe.TimestampMismatchError)
        if module == "boqs" and doc.status != "Draft":
            frappe.throw("Only draft BOQs can be edited.", frappe.ValidationError)
        if module == "measurements" and doc.status == "Certified":
            frappe.throw("Certified measurements are immutable.", frappe.ValidationError)
        doc.update(clean)
        _scope(doc, company, project)
        doc.save()
    else:
        doc = frappe.get_doc({"doctype": _entry(module)[0], **clean})
        if module in {"sales-invoices", "purchase-invoices"}:
            # Native clients do not execute Desk's customer/item onchange calls.
            # Derive currency, exchange-rate, party and item defaults upstream.
            doc.check_permission("create")
            doc.run_method("set_missing_values")
        if module != "projects":
            _scope(doc, company, project)
        doc.insert()
        if module == "projects" and frappe.session.user != "Administrator":
            frappe.get_doc({"doctype": "VORQ Project Member", "user": frappe.session.user, "project": doc.name}).insert(ignore_permissions=True)
    request.db_set({"reference_doctype": doc.doctype, "reference_name": doc.name})
    return {"name": doc.name, "replayed": False}


@frappe.whitelist(methods=["POST"])
def transition(module, company, project, name, action, modified, idempotency_key):
    role = _allowed(module, company)
    if role not in {"Owner", "Project Manager", "Accountant", "Quantity Surveyor"}:
        frappe.throw("Approval permission required.", frappe.PermissionError)
    if module in FINANCIAL and role not in {"Owner", "Accountant"}:
        frappe.throw("Accountant approval required.", frappe.PermissionError)
    request, previous = _request(idempotency_key, [module, company, project, name, action, modified])
    if previous:
        _scope(previous, company, project)
        return {"name": previous.name, "replayed": True}
    doc = frappe.get_doc(_entry(module)[0], name, for_update=True)
    _scope(doc, company, project)
    doc.check_permission("write")
    if str(doc.modified) != str(modified):
        frappe.throw("Record changed. Refresh before approval.", frappe.TimestampMismatchError)
    if module == "boqs":
        if role not in {"Owner", "Quantity Surveyor"}:
            frappe.throw("BOQ approval permission required.", frappe.PermissionError)
        if action == "Approve baseline":
            from buildsuite_core.api.boq import approve_boq
            approve_boq(doc.name)
        elif action == "Submit":
            from buildsuite_core.api.boq import submit_boq
            submit_boq(doc.name)
        else:
            frappe.throw("Unsupported BOQ action.", frappe.ValidationError)
    elif module == "measurements" and action == "Certify":
        if role not in {"Owner", "Quantity Surveyor"}:
            frappe.throw("QS certification required.", frappe.PermissionError)
        from buildsuite_core.api.subcontract import certify_measurement_book
        certify_measurement_book(doc.name)
    elif doc.get("workflow_state"):
        from frappe.model.workflow import apply_workflow
        doc = apply_workflow(doc, action)
    elif action == "Submit":
        doc.submit()
    elif action == "Cancel":
        doc.cancel()
    else:
        frappe.throw("Unsupported action.", frappe.ValidationError)
    request.db_set({"reference_doctype": doc.doctype, "reference_name": doc.name})
    return {"name": doc.name, "docstatus": doc.docstatus}


@frappe.whitelist(methods=["GET"])
def overview(company, project):
    role = project_access(project, company)
    doc = frappe.get_doc("Project", project)
    doc.check_permission("read")
    result = {"progress": doc.percent_complete, "status": doc.status, "financials": None}
    if role in {"Owner", "Accountant"}:
        frappe.has_permission("GL Entry", "read", throw=True)
        ledger = frappe.db.sql("""SELECT a.root_type, SUM(g.debit - g.credit) amount
            FROM `tabGL Entry` g JOIN `tabAccount` a ON a.name = g.account
            WHERE g.company = %s AND g.project = %s AND g.is_cancelled = 0
            AND a.root_type IN ('Expense', 'Income') GROUP BY a.root_type""", (company, project), as_dict=True)
        totals = {r.root_type: str(r.amount) for r in ledger}
        result["financials"] = {"expense": totals.get("Expense", "0"), "income_balance": totals.get("Income", "0")}
    return result


@frappe.whitelist(methods=["GET"])
def lookup(doctype, company, project=None, query=""):
    role = member(company)
    masters = {"Customer", "Supplier", "Item", "Warehouse", "UOM", "Item Group", "Supplier Group", "Customer Group", "Territory", "Employee", "Account", "Cost Center", "Stock Entry Type", "Price List"}
    scoped = {"Task", "BOQ", "BOQ Group", "Subcontractor Work Order", "Purchase Order", "Purchase Receipt", "Material Request", "Sales Invoice", "Purchase Invoice"}
    if doctype not in masters | scoped:
        frappe.throw("Lookup is not available for this field.", frappe.PermissionError)
    if doctype == "Account" and role not in {"Owner", "Accountant"}:
        frappe.throw("Account lookup denied.", frappe.PermissionError)
    filters = {}
    meta = frappe.get_meta(doctype)
    if meta.has_field("company"):
        filters["company"] = company
    if doctype == "Price List":
        filters["enabled"] = 1
    if doctype in scoped:
        project_access(project, company)
        if meta.has_field("project"):
            filters["project"] = project
    filters["name"] = ["like", "%" + str(query)[:100] + "%"]
    names = frappe.get_list(doctype, filters=filters, pluck="name", limit_page_length=20)
    if doctype in scoped:
        safe = []
        for name in names:
            try:
                _scope(frappe.get_doc(doctype, name), company, project)
                safe.append(name)
            except frappe.PermissionError:
                continue
        return safe
    return names


@frappe.whitelist(allow_guest=True, methods=["POST"])
def signup(full_name, email, password):
    """Register an unprivileged identity; workspace access requires verified membership."""
    from vorq.registration import register
    return register(full_name, email, password)


@frappe.whitelist(allow_guest=True, methods=["GET"])
def auth_challenge():
    from vorq.auth_flow import challenge
    return challenge()

@frappe.whitelist(allow_guest=True, methods=["POST"])
def auth_start(usr, pwd, captcha_id, captcha_answer):
    from vorq.auth_flow import start
    return start(usr, pwd, captcha_id, captcha_answer)

@frappe.whitelist(allow_guest=True, methods=["POST"])
def auth_signup(full_name, username, email, password, requested_role, company_name, role_details, captcha_id, captcha_answer):
    from vorq.auth_flow import signup
    return signup(full_name, username, email, password, requested_role, company_name, role_details, captcha_id, captcha_answer)

@frappe.whitelist(allow_guest=True, methods=["POST"])
def auth_finish(challenge_token, code):
    from vorq.auth_flow import finish
    return finish(challenge_token, code)
