#!/usr/bin/env python3
"""Real unprivileged registration/login regression; no ERP postings or elevated grants."""
import http.cookiejar
import json
import secrets
import urllib.error
import urllib.request
import uuid

base = 'http://127.0.0.1:15173'
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

def call(method, body=None, csrf=None):
    headers = {'Content-Type': 'application/json'}
    if csrf:
        headers['X-Frappe-CSRF-Token'] = csrf
    request = urllib.request.Request(base + '/api/method/' + method, data=json.dumps(body).encode() if body is not None else None, headers=headers)
    with client.open(request, timeout=30) as response:
        return json.load(response)['message']

email = 'vorq-signup-' + uuid.uuid4().hex[:10] + '@example.invalid'
password = secrets.token_urlsafe(24)
args = {'full_name': 'Signup Verification', 'email': email, 'password': password}
try:
    call('vorq.api.v1.signup', {**args, 'password': 'short'})
    raise AssertionError('Weak password accepted')
except urllib.error.HTTPError as exc:
    assert exc.code in (400, 417), exc.code
result = call('vorq.api.v1.signup', args)
assert result['access'] == 'pending_verification'
# Re-registration may not replace an existing identity or its password.
assert call('vorq.api.v1.signup', {**args, 'password': secrets.token_urlsafe(24)}) == result
call('login', {'usr': email, 'pwd': password})
session = call('vorq.api.v1.session')
assert session['user'] == email and session['companies'] == [], session.get('companies')
try:
    call('vorq.api.v1.workspace?company=VORQ%20Development')
    raise AssertionError('Signup gained company access')
except urllib.error.HTTPError as exc:
    assert exc.code == 403, exc.code
try:
    client.open(base + '/api/resource/Project', timeout=30)
    raise AssertionError('Raw ERP access was allowed')
except urllib.error.HTTPError as exc:
    assert exc.code == 403, exc.code
call('logout', {}, session['csrf_token'])
print(json.dumps({'signup': True, 'weak_password_denied': True, 'existing_password_preserved': True, 'login': True, 'company_access_denied': True, 'raw_erp_access_denied': True, 'logout': True}))
