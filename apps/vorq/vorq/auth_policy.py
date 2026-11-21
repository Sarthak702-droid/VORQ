"""Pure validation primitives; no access rights are granted by registration."""
import re
ROLES = {
    'Owner': [('company_legal_name', 'Company legal name'), ('business_type', 'Business type')],
    'Project Manager': [('designation', 'Designation'), ('project_reference', 'Project / site reference')],
    'Quantity Surveyor': [('qualification', 'Qualification'), ('experience', 'Experience in years')],
    'Site Engineer': [('qualification', 'Qualification'), ('project_reference', 'Project / site reference')],
    'Storekeeper': [('store_reference', 'Store / warehouse reference')],
    'Procurement Officer': [('department', 'Department / purchasing scope')],
    'Accountant': [('qualification', 'Accounting qualification'), ('department', 'Finance department / scope')],
    'Subcontractor': [('trade', 'Trade / work scope'), ('business_name', 'Business / proprietor name')],
}
def clean_registration(full_name, username, email, password, requested_role, company_name, role_details):
    if not all(isinstance(v, str) for v in [full_name, username, email, password, requested_role, company_name]):
        raise ValueError('Complete all required registration fields.')
    full_name, username, email, company_name = full_name.strip(), username.strip().lower(), email.strip().lower(), company_name.strip()
    if not 2 <= len(full_name) <= 100 or any(c in full_name for c in '<>\r\n'): raise ValueError('Enter a valid full name (2–100 characters).')
    if not re.fullmatch(r'[a-z][a-z0-9._-]{2,39}', username): raise ValueError('Username: 3–40 characters; start with a letter and use letters, numbers, dots, underscores or hyphens.')
    if not 12 <= len(password) <= 128: raise ValueError('Use a strong password of 12–128 characters.')
    if not 2 <= len(company_name) <= 140 or any(c in company_name for c in '<>\r\n'): raise ValueError('Enter your company / organisation name.')
    if requested_role not in ROLES or not isinstance(role_details, dict): raise ValueError('Choose a valid requested role.')
    expected = {key for key, _ in ROLES[requested_role]}
    if set(role_details) != expected: raise ValueError('Complete the details for your requested role.')
    details = {}
    for key, label in ROLES[requested_role]:
        value = role_details[key]
        if not isinstance(value, str) or not 1 <= len(value.strip()) <= 200 or any(c in value for c in '<>\r\n'): raise ValueError(f'Enter a valid {label.lower()}.')
        if key == 'experience' and (not value.strip().isdigit() or not 0 <= int(value) <= 80): raise ValueError('Experience must be a whole number from 0 to 80.')
        details[key] = value.strip()
    return dict(full_name=full_name, username=username, email=email, password=password, requested_role=requested_role, company_name=company_name, role_details=details)
