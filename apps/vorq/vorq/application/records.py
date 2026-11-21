"""Record use cases. Frappe owns transaction commit/rollback and ERP posting."""
import frappe
from vorq.modules.planning import workflow as planning
from vorq.modules.contracts import workflow as contracts
from vorq.module_registry import READ_FIELDS, FINANCIAL
from vorq.shared.fields import CHILD_FIELDS
from vorq.shared.idempotency import _request
from vorq.application.access import _entry, _allowed, _project_names, _scope
from vorq.modules.identity.service import member, project_access


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
    try:
        start = max(0, min(int(start), 1000000))
    except (TypeError, ValueError, OverflowError):
        frappe.throw("Provide a valid pagination offset.", frappe.ValidationError)
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



def detail(module, name, company, project):
    _allowed(module, company)
    doc = frappe.get_doc(_entry(module)[0], name)
    doc.check_permission("read")
    _scope(doc, company, project)
    actions = []
    role = member(company)
    if role in {"Owner", "Project Manager", "Accountant", "Quantity Surveyor"}:
        if module == "boqs" and role in {"Owner", "Quantity Surveyor"}:
            actions = planning.actions(doc, role)
        elif module == "measurements" and role in {"Owner", "Quantity Surveyor"}:
            actions = contracts.actions(doc, role)
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
    from vorq.shared.numbers import decimal
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
        if module == "boqs":
            planning.editable(doc)
        if module == "measurements":
            contracts.editable(doc)
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
        planning.transition(doc, action, role)
    elif module == "measurements" and action == "Certify":
        contracts.certify(doc, role)
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
