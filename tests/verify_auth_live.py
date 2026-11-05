"""Local, non-privileged auth acceptance. Never enrol Administrator or post finance.
Known-answer CAPTCHA fixtures are injected through trusted bench access, NOT an HTTP bypass.
"""
import base64
import hashlib
import hmac
import http.cookiejar
import json
import secrets
import struct
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
COMPOSE = ['docker','compose','--env-file',str(ROOT/'integration-workspace/deployment/.env'),'-f',str(ROOT/'integration-workspace/deployment/compose.yaml')]
BASE='http://127.0.0.1:18080/api/method/'
jar=http.cookiejar.CookieJar(); client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def call(method, args=None):
    request=urllib.request.Request(BASE+method, data=json.dumps(args).encode() if args is not None else None, headers={'Content-Type':'application/json'})
    try:
        with client.open(request,timeout=30) as response: return json.load(response).get('message')
    except urllib.error.HTTPError as error:
        body=json.load(error)
        raise AuthFailure(error.code,body.get('exc_type','Unknown')) from None
class AuthFailure(Exception):
    def __init__(self,status,kind): self.status=status;super().__init__(f'HTTP {status} ({kind})')
def denied(fn):
    try: fn()
    except AuthFailure as error:
        assert error.status in [400,401,403,409,417,429], str(error)
        return
    raise AssertionError('Operation unexpectedly succeeded')
def bench(code):
    pre="import os\nos.chdir('/home/frappe/frappe-bench/sites')\nimport frappe\nfrappe.init(site='frontend');frappe.connect()\n"
    result=subprocess.run(COMPOSE+['exec','-T','backend','env/bin/python','-'],input=pre+code+'\nfrappe.destroy()\n',text=True,capture_output=True,check=False)
    if result.returncode: raise RuntimeError('Bench assertion failed: '+result.stderr.splitlines()[-1])
    return json.loads(result.stdout.splitlines()[-1])
fixtures=bench("""import secrets,time,json
from vorq.auth_flow import _put,_digest
values=[]
for _ in range(16):
 token=secrets.token_urlsafe(32);answer=secrets.token_hex(3).upper()
 _put('captcha',token,{'digest':_digest(answer),'expires':time.time()+120},120)
 values.append({'captcha_id':token,'captcha_answer':answer})
print(json.dumps(values))""")
def captcha(): return fixtures.pop()
def totp(secret):
    raw=base64.b32decode(secret); counter=int(time.time()//30)
    digest=hmac.new(raw,struct.pack('>Q',counter),hashlib.sha1).digest();offset=digest[-1]&15
    return str((struct.unpack('>I',digest[offset:offset+4])[0]&0x7fffffff)%1000000).zfill(6)
stamp=secrets.token_hex(5);email=f'vorq-auth-test-{stamp}@example.invalid';username=f'vorq-auth-test-{stamp}';password=secrets.token_urlsafe(30)
result={}
public=call('vorq.api.v1.auth_challenge');assert public['image'].startswith('data:image/png;base64,') and len(public['roles'])==8 and 'answer' not in public;result['image_captcha']=True
# Legacy paths must not establish an authenticated session.
denied(lambda:call('login',{'usr':email,'pwd':password}));denied(lambda:call('vorq.api.v1.signup',{'full_name':'Unsafe legacy','email':email,'password':password}));result['legacy_bypass_blocked']=True
args={'full_name':'VORQ Auth Verification','username':username,'email':email,'password':password,'requested_role':'Owner','company_name':'Auth Verification Only','role_details':{'company_legal_name':'Synthetic verification company','business_type':'Construction verification'}}
wrong=captcha();denied(lambda:call('vorq.api.v1.auth_signup',{**args,**wrong,'captcha_answer':'WRONG'}));denied(lambda:call('vorq.api.v1.auth_signup',{**args,**wrong}));result['captcha_single_use']=True
denied(lambda:call('vorq.api.v1.auth_signup',{**args,'password':'weak',**captcha()}));result['weak_password_rejected']=True
pending=call('vorq.api.v1.auth_signup',{**args,**captcha()});assert pending['stage']=='enroll' and pending['qr_image'].startswith('data:image/png;base64,');secret=pending['setup_key'];result['qr_enrolment']=True
denied(lambda:call('vorq.api.v1.session'));result['no_session_before_totp']=True
used_code=totp(secret)
signed=call('vorq.api.v1.auth_finish',{'challenge_token':pending['challenge'],'code':used_code});assert signed['authenticated'] and len(signed['recovery_codes'])==8;backups=signed['recovery_codes'];result['totp_enrolment_verified']=True
session=call('vorq.api.v1.session');assert session['user']==email and session['companies']==[];result['role_request_does_not_grant_access']=True
denied(lambda:call('vorq.api.v1.workspace?company=VORQ%20Development'))
denied(lambda:call('vorq.api.v1.auth_finish',{'challenge_token':pending['challenge'],'code':totp(secret)}))
# Use the actual Frappe CSRF token for logout.
def logout(csrf):
    request=urllib.request.Request(BASE+'logout',data=b'{}',headers={'Content-Type':'application/json','X-Frappe-CSRF-Token':csrf})
    with client.open(request,timeout=30): pass
logout(session['csrf_token']);denied(lambda:call('vorq.api.v1.session'));result['logout_revokes_access']=True
again=call('vorq.api.v1.auth_start',{'usr':username,'pwd':password,**captcha()});assert again['stage']=='totp' and 'setup_key' not in again;result['username_login']=True
# An already-used time counter cannot authenticate a second session.
denied(lambda:call('vorq.api.v1.auth_finish',{'challenge_token':again['challenge'],'code':used_code}));result['totp_replay_rejected']=True
signed=call('vorq.api.v1.auth_finish',{'challenge_token':again['challenge'],'code':backups[0]});assert signed['authenticated'] and signed['recovery_codes']==[]
session=call('vorq.api.v1.session');logout(session['csrf_token'])
last=call('vorq.api.v1.auth_start',{'usr':email,'pwd':password,**captcha()});denied(lambda:call('vorq.api.v1.auth_finish',{'challenge_token':last['challenge'],'code':backups[0]}));result['recovery_code_single_use']=True
call('vorq.api.v1.auth_finish',{'challenge_token':last['challenge'],'code':backups[1]});session=call('vorq.api.v1.session');logout(session['csrf_token'])
expired=bench(f"""import secrets,time,json
from vorq.auth_flow import _put
email={email!r};assert email.startswith('vorq-auth-test-') and email.endswith('@example.invalid')
token=secrets.token_urlsafe(32)
_put('pending',token,{{'user':email,'enroll':False,'expires':time.time()-1,'attempts':0}},120)
print(json.dumps(token))""")
denied(lambda:call('vorq.api.v1.auth_finish',{'challenge_token':expired,'code':'INVALID'}));result['expired_challenge_rejected']=True
limited=call('vorq.api.v1.auth_start',{'usr':username,'pwd':password,**captcha()})
for _ in range(5): denied(lambda:call('vorq.api.v1.auth_finish',{'challenge_token':limited['challenge'],'code':'INVALID'}))
new_limited=call('vorq.api.v1.auth_start',{'usr':username,'pwd':password,**captcha()})
denied(lambda:call('vorq.api.v1.auth_finish',{'challenge_token':new_limited['challenge'],'code':backups[2]}));result['factor_lockout_across_challenges']=True
checks=bench(f"""import json
email={email!r}
assert email.startswith('vorq-auth-test-') and email.endswith('@example.invalid')
profile=frappe.get_doc('VORQ Auth Profile',frappe.db.get_value('VORQ Auth Profile',{{'user':email}},'name'))
rows=frappe.db.sql('SELECT password,encrypted FROM __Auth WHERE doctype=%s AND name=%s AND fieldname=%s',('VORQ Auth Profile',profile.name,'totp_secret'),as_dict=True)
assert rows and rows[0].encrypted==1 and rows[0].password!=profile.get_password('totp_secret')
assert profile.requested_role=='Owner' and profile.access_status=='Pending review'
assert len(json.loads(profile.recovery_hashes))==6 and all(len(h)==64 for h in json.loads(profile.recovery_hashes))
assert not frappe.db.exists('VORQ Company Member',{{'user':email}})
assert not frappe.db.exists('VORQ Auth Session',{{'user':email}})
user=frappe.get_doc('User',email);assert user.user_type=='Website User' and not any(r.role in ['System Manager','Accounts Manager','BuildSuite Director'] for r in user.roles)
print(json.dumps({{'encrypted_totp_storage':True,'hashed_recovery_storage':True,'rbac_no_self_promotion':True,'session_records_revoked':True}}))""")
result.update(checks);result['test_identity']=email;result['financial_postings']=False
(ROOT/'auth-verification.json').write_text(json.dumps({'verified_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),**result},indent=2)+'\n')
print(json.dumps(result,indent=2))
