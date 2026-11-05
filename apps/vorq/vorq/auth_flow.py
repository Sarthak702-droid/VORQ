"""Password + one-use CAPTCHA -> short-lived challenge -> TOTP -> Frappe session.
Never return a session after the password step or grant the requested signup role.
"""
import base64
import hashlib
import hmac
import io
import json
import re
import secrets
import time
from contextlib import contextmanager

import frappe
import pyotp
import pyqrcode
from PIL import Image, ImageDraw, ImageFont
from frappe.rate_limiter import rate_limit
from frappe.utils import add_to_date, now_datetime, validate_email_address
from frappe.utils.password import encrypt, decrypt, get_encryption_key
from vorq.auth_policy import ROLES, clean_registration

PREFIX = 'vorq_auth_v1:'

def _hash(value):
    return hashlib.sha256(value.encode()).hexdigest()

def _digest(value):
    return hmac.new(get_encryption_key().encode(), value.encode(), hashlib.sha256).hexdigest()

@contextmanager
def _locked(key):
    with frappe.cache.lock(PREFIX + 'lock:' + _hash(key), timeout=15, blocking_timeout=5):
        yield

def _put(kind, token, value, seconds):
    frappe.cache.set_value(PREFIX + kind + ':' + _hash(token), value, expires_in_sec=seconds)

def _take(kind, token):
    if not isinstance(token, str) or not 32 <= len(token) <= 128:
        frappe.throw('Security challenge expired. Start again.', frappe.AuthenticationError)
    key = PREFIX + kind + ':' + _hash(token)
    value = frappe.cache.get_value(key)
    frappe.cache.delete_value(key)
    return value

def _guest():
    if frappe.session.user != 'Guest':
        try:
            require_assurance()
        except frappe.AuthenticationError:
            frappe.local.login_manager.logout()
        else:
            frappe.throw('Sign out before starting another sign-in or registration.', frappe.PermissionError)

def block_legacy_login(login_manager=None):
    # Runs BEFORE Frappe authenticates /api/method/login, not just in before_request.
    frappe.throw('Use VORQ sign-in with CAPTCHA and authenticator verification.', frappe.AuthenticationError)

def require_assurance():
    if not getattr(frappe.local, 'request', None):
        return  # Trusted bench/jobs remain governed by their own permissions.
    if frappe.session.user == 'Guest':
        frappe.throw('Sign in to continue.', frappe.AuthenticationError)
    name = _hash(str(frappe.session.sid))
    record = frappe.db.get_value('VORQ Auth Session', name, ['user', 'expires_at'], as_dict=True)
    if not record or record.user != frappe.session.user or record.expires_at <= now_datetime():
        frappe.throw('Authenticator verification is required. Sign in again.', frappe.AuthenticationError)

def revoke_session(login_manager=None):
    if getattr(frappe.session, 'sid', None):
        name = _hash(str(frappe.session.sid))
        if frappe.db.exists('VORQ Auth Session', name): frappe.db.delete('VORQ Auth Session', {'name': name})

def _profile(user):
    found = frappe.db.get_value('VORQ Auth Profile', {'user': user}, 'name')
    return frappe.get_doc('VORQ Auth Profile', found) if found else None

def _pending(user):
    profile = _profile(user)
    enroll = not profile or not profile.totp_enabled
    token = secrets.token_urlsafe(32)
    payload = {'user': user, 'enroll': enroll, 'expires': time.time() + 300, 'attempts': 0}
    result = {'challenge': token, 'stage': 'enroll' if enroll else 'totp', 'expires_in': 300}
    if enroll:
        secret = pyotp.random_base32()
        payload['secret'] = encrypt(secret)
        uri = pyotp.TOTP(secret).provisioning_uri(name=user, issuer_name='VORQ')
        stream = io.BytesIO()
        pyqrcode.create(uri).png(stream, scale=5, quiet_zone=4)
        result.update({'qr_image': 'data:image/png;base64,' + base64.b64encode(stream.getvalue()).decode(), 'setup_key': secret})
    _put('pending', token, payload, 300)
    return result

@rate_limit(limit=30, seconds=600, methods=['GET'], ip_based=True)
def challenge():
    _guest()
    answer = ''.join(secrets.choice('ABCDEFGHJKLMNPQRSTUVWXYZ23456789') for _ in range(6))
    image = Image.new('RGB', (280, 100), '#f1f4fa')
    draw = ImageDraw.Draw(image)
    for _ in range(12):
        draw.line([(secrets.randbelow(280), secrets.randbelow(100)), (secrets.randbelow(280), secrets.randbelow(100))], fill=(140+secrets.randbelow(80), 140+secrets.randbelow(80), 140+secrets.randbelow(80)), width=2)
    try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 38)
    except OSError: font = ImageFont.load_default(size=38)
    for i, letter in enumerate(answer):
        tile = Image.new('RGBA', (48, 65), (0,0,0,0)); ImageDraw.Draw(tile).text((4,4), letter, font=font, fill=(25+secrets.randbelow(60), 30+secrets.randbelow(60), 60+secrets.randbelow(60)))
        tile = tile.rotate(secrets.randbelow(31)-15, Image.Resampling.BICUBIC)
        image.paste(tile, (10+i*43, 18+secrets.randbelow(10)), tile)
    for _ in range(150):
        x,y=secrets.randbelow(280),secrets.randbelow(100); draw.point((x,y), fill='#768297')
    stream = io.BytesIO(); image.save(stream, 'PNG')
    token = secrets.token_urlsafe(32)
    _put('captcha', token, {'digest': _digest(answer), 'expires': time.time()+120}, 120)
    return {'id': token, 'image': 'data:image/png;base64,'+base64.b64encode(stream.getvalue()).decode(), 'expires_in': 120, 'roles': {role: [{'name': key, 'label': label} for key,label in fields] for role,fields in ROLES.items()}}

def _captcha(token, answer):
    with _locked(str(token)):
        saved = _take('captcha', token)
    if not saved or saved['expires'] < time.time() or not isinstance(answer,str) or len(answer.strip()) != 6 or not hmac.compare_digest(saved['digest'], _digest(answer.strip().upper())):
        frappe.throw('Security image is incorrect or expired. Refresh it and try again.', frappe.AuthenticationError)

@rate_limit(limit=10, seconds=600, methods=['POST'], ip_based=True)
def start(usr, pwd, captcha_id, captcha_answer):
    _guest(); _captcha(captcha_id, captcha_answer)
    if not isinstance(usr,str) or not isinstance(pwd,str) or len(usr)>140 or len(pwd)>128:
        frappe.throw('Invalid sign-in details.', frappe.AuthenticationError)
    if frappe.get_system_settings('disable_user_pass_login'):
        frappe.throw('Password sign-in is disabled by your administrator.', frappe.AuthenticationError)
    manager = frappe.local.login_manager
    identifier = usr.strip()
    if '@' not in identifier and identifier != 'Administrator':
        identifier = frappe.db.get_value('User', {'username': identifier.lower()}, 'name') or identifier
    manager.authenticate(user=identifier, pwd=pwd)
    if manager.force_user_to_reset_password():
        frappe.throw('Your password must be reset. Contact your administrator before signing in.', frappe.AuthenticationError)
    return _pending(manager.user)

@rate_limit(limit=5, seconds=600, methods=['POST'], ip_based=True)
def signup(full_name, username, email, password, requested_role, company_name, role_details, captcha_id, captcha_answer):
    _guest(); _captcha(captcha_id, captcha_answer)
    try: values = clean_registration(full_name, username, email, password, requested_role, company_name, frappe.parse_json(role_details))
    except (ValueError, TypeError): frappe.throw('Check your registration fields and role details.', frappe.ValidationError)
    if len(values['email'])>140 or validate_email_address(values['email'], throw=False) != values['email']:
        frappe.throw('Enter a valid email address.', frappe.ValidationError)
    from frappe.utils.password_strength import test_password_strength
    if test_password_strength(password, [values['full_name'],values['username'],values['email'],values['company_name']])['score'] < 3:
        frappe.throw('Choose a less predictable password. Use a long unique passphrase.', frappe.ValidationError)
    if frappe.db.exists('User', values['email']) or frappe.db.exists('User', {'username': values['username']}):
        frappe.throw('Cannot register with these details. Sign in or contact your administrator.', frappe.ValidationError)
    user = frappe.get_doc({'doctype':'User','email':values['email'],'username':values['username'],'first_name':values['full_name'],'enabled':1,'user_type':'Website User','new_password':password,'send_welcome_email':0,'roles':[]})
    user.flags.no_welcome_mail = True; user.insert(ignore_permissions=True)
    # These are declared profile details, NEVER User.roles or membership grants.
    frappe.get_doc({'doctype':'VORQ Auth Profile','user':user.name,'requested_role':values['requested_role'],'company_name':values['company_name'],'role_details':json.dumps(values['role_details']),'access_status':'Pending review','totp_enabled':0}).insert(ignore_permissions=True)
    return _pending(user.name)

@rate_limit(limit=20, seconds=600, methods=['POST'], ip_based=True)
def finish(challenge_token, code):
    _guest()
    if not isinstance(code,str) or not 6 <= len(code.strip()) <= 40:
        frappe.throw('Enter the code from your authenticator app.', frappe.AuthenticationError)
    recovery_codes = []
    with _locked(str(challenge_token)):
        pending = _take('pending', challenge_token)
        if not pending or pending['expires'] < time.time() or pending['attempts'] >= 5:
            frappe.throw('Verification expired. Start sign-in again.', frappe.AuthenticationError)
        user = pending['user']
        if user != 'Administrator' and not frappe.db.get_value('User',user,'enabled'):
            frappe.throw('Account is disabled.', frappe.AuthenticationError)
        profile = _profile(user)
        if not profile:
            profile = frappe.get_doc({'doctype':'VORQ Auth Profile','user':user,'access_status':'Existing account','totp_enabled':0})
            profile.insert(ignore_permissions=True)
        # Serialise OTP counter and backup-code consumption across different login challenges.
        frappe.db.sql('SELECT name FROM `tabVORQ Auth Profile` WHERE name=%s FOR UPDATE', profile.name)
        profile.reload()
        failure_key = PREFIX + 'otp_fail:' + _hash(user)
        failures = frappe.cache.get_value(failure_key) or {'count': 0, 'expires': time.time()+600}
        if failures['expires'] <= time.time(): failures = {'count': 0, 'expires': time.time()+600}
        if failures['count'] >= 5:
            frappe.throw('Too many authenticator attempts. Wait 10 minutes before trying again.', frappe.AuthenticationError)
        secret = decrypt(pending['secret']) if pending['enroll'] else profile.get_password('totp_secret')
        if pending['enroll'] and profile.totp_enabled:
            frappe.throw('Authenticator was already configured. Start sign-in again.', frappe.AuthenticationError)
        matched = None
        if re.fullmatch(r'[0-9]{6}',code.strip()):
            current=int(time.time()//30)
            for counter in [current-1,current,current+1]:
                if counter > int(profile.last_counter or 0) and hmac.compare_digest(pyotp.TOTP(secret).at(counter*30),code.strip()): matched=counter; break
        hashes = json.loads(profile.recovery_hashes or '[]')
        backup_digest = _digest(code.strip().replace('-','').lower())
        backup_index = next((i for i,digest in enumerate(hashes) if hmac.compare_digest(digest,backup_digest)),None) if not pending['enroll'] else None
        if matched is None and backup_index is None:
            failures['count'] += 1
            frappe.cache.set_value(failure_key, failures, expires_in_sec=max(1,int(failures['expires']-time.time())))
            pending['attempts']+=1
            if pending['attempts']<5: _put('pending',challenge_token,pending,max(1,int(pending['expires']-time.time())))
            frappe.throw('Code is incorrect, expired or already used.', frappe.AuthenticationError)
        if pending['enroll']:
            profile.totp_secret=secret; profile.totp_enabled=1
            recovery_codes=[secrets.token_hex(10) for _ in range(8)]
            profile.recovery_hashes=json.dumps([_digest(value) for value in recovery_codes])
        elif backup_index is not None:
            hashes.pop(backup_index); profile.recovery_hashes=json.dumps(hashes)
        if matched is not None: profile.last_counter=matched
        profile.save(ignore_permissions=True)
        frappe.cache.delete_value(failure_key)
        frappe.db.commit()
        # Frappe issues/rotates the actual session only AFTER factor verification.
        frappe.local.login_manager.login_as(user)
        sid_hash=_hash(str(frappe.session.sid))
        frappe.get_doc({'doctype':'VORQ Auth Session','name':sid_hash,'user':user,'expires_at':add_to_date(now_datetime(),hours=12)}).insert(ignore_permissions=True,set_name=sid_hash)
        frappe.db.commit()
    return {'authenticated':True,'recovery_codes':recovery_codes,'access':'pending_review' if profile.access_status=='Pending review' else 'existing_membership','expires_in':43200}

def prepare_schema():
    get_encryption_key()  # Initialise the site key once during migration, never in client code.

def cleanup_sessions():
    frappe.db.delete("VORQ Auth Session", {"expires_at": ("<", now_datetime())})
