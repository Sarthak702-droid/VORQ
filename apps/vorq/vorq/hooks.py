app_name = "vorq"
app_title = "VORQ"
app_publisher = "VORQ"
app_description = "Construction operations with authoritative ERPNext accounting"
app_email = "engineering@vorq.local"
app_license = "GPL-3.0-or-later"
required_apps = ["erpnext", "buildsuite_core"]
after_install = "vorq.install.after_install"
before_request = ["vorq.permissions.guard_api"]
doc_events = {
    "BOQ Item": {"before_validate": "vorq.validation.require_editable_boq"},
    "BOQ Group": {"before_validate": "vorq.validation.require_editable_boq"},
    "Measurement Book": {"before_validate": "vorq.validation.validate_measurement"},
    "Subcontractor Bill": {"before_validate": "vorq.validation.prepare_ra_bill"},
}

before_login = "vorq.auth_flow.block_legacy_login"
on_logout = "vorq.auth_flow.revoke_session"

after_migrate = ["vorq.auth_flow.prepare_schema"]

scheduler_events = {"daily": ["vorq.auth_flow.cleanup_sessions"]}
