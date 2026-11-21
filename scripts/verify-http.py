#!/usr/bin/env python3
"""Real HTTP session/CSRF/persistence check against the isolated VORQ stack."""
from pathlib import Path
import http.cookiejar
import json
import urllib.request
import urllib.error
import uuid
root = Path(__file__).resolve().parents[1]
config = dict(line.split('=', 1) for line in (root / 'deployment/.env').read_text().splitlines() if '=' in line)
base = 'http://127.0.0.1:18080/api/method/'
jar = http.cookiejar.CookieJar()
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

def call(method, body=None, csrf=None):
    headers = {'Content-Type': 'application/json'}
    if csrf:
        headers['X-Frappe-CSRF-Token'] = csrf
    req = urllib.request.Request(base + method, data=json.dumps(body).encode() if body is not None else None, headers=headers)
    with client.open(req, timeout=45) as response:
        return json.load(response).get('message')

call('login', {'usr': 'Administrator', 'pwd': config['ADMIN_PASSWORD']})
session = call('vorq.api.v1.session')
assert session['user'] == 'Administrator'
csrf = session['csrf_token']
args = {'module': 'projects', 'company': 'VORQ Development', 'project': '', 'values': {'project_name': 'HTTP acceptance ' + uuid.uuid4().hex[:8], 'status': 'Open'}, 'idempotency_key': str(uuid.uuid4())}
try:
    call('vorq.api.v1.save', args)
    raise AssertionError('Missing CSRF token was accepted')
except urllib.error.HTTPError as exc:
    assert exc.code in (400, 403), exc.code
first = call('vorq.api.v1.save', args, csrf)
second = call('vorq.api.v1.save', args, csrf)
assert first['name'] == second['name'] and second['replayed']
workspace = call('vorq.api.v1.workspace?company=VORQ%20Development')
assert any(p['name'] == first['name'] for p in workspace['projects'])
call('logout', {}, csrf)
try:
    call('vorq.api.v1.session')
    raise AssertionError('Logged-out session still authorized')
except urllib.error.HTTPError as exc:
    assert exc.code in (401, 403), exc.code
print(json.dumps({'http_login': True, 'missing_csrf_denied': True, 'persistent_project': first['name'], 'http_idempotency': True, 'logout_denied': True}))
