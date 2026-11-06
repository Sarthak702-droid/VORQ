"""Authenticated HTTP regression against local VORQ (no financial posting).
Creates a synthetic QA identity/project, then disables the identity and revokes
its memberships and sessions. Draft QA records remain clearly labelled.
"""
import base64
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import hashlib
import hmac
import http.cookiejar
import json
from pathlib import Path
import secrets
import struct
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from zoneinfo import ZoneInfo

# Fixture setup touches shared Frappe metadata: serialize local live suites.
import fcntl
qa_lock=open('/tmp/vorq-local-live-tests.lock','a')
fcntl.flock(qa_lock,fcntl.LOCK_EX)

ROOT=Path(__file__).resolve().parents[1]
BASE='http://127.0.0.1:5173'
COMPOSE=['docker','compose','--env-file','deployment/.env','-f','deployment/compose.yaml']
checks=[]

def bench(code):
    pre="import os,json\nos.chdir('/home/frappe/frappe-bench/sites')\nimport frappe\nfrappe.init(site='frontend');frappe.connect()\nfrappe.set_user('Administrator')\n"
    proc=subprocess.run(COMPOSE+['exec','-T','backend','env/bin/python','-'],cwd=ROOT/'integration-workspace',input=pre+code+'\nfrappe.destroy()\n',capture_output=True,text=True)
    if proc.returncode:raise RuntimeError(proc.stderr[-2000:])
    return json.loads(proc.stdout.splitlines()[-1])

def make_client(cookies=None):
    jar=http.cookiejar.CookieJar()
    if cookies:
        for cookie in cookies:jar.set_cookie(cookie)
    return jar,urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(jar))

jar,client=make_client()
csrf=''
def request(path,args=None,method=None,token=True,opener=None):
    headers={'Content-Type':'application/json'}
    if token and csrf:headers['X-Frappe-CSRF-Token']=csrf
    body=json.dumps(args).encode() if args is not None else None
    req=urllib.request.Request(BASE+path,data=body,headers=headers,method=method)
    try:
        with (opener or client).open(req,timeout=30) as res:return res.status,json.load(res)
    except urllib.error.HTTPError as error:
        try:data=json.load(error)
        except (ValueError,UnicodeError):data={}
        return error.code,data

def call(name,args=None,method=None,token=True,opener=None):
    return request('/api/method/vorq.api.v1.'+name,args,method,token,opener)

def ok(name,condition,detail=''):
    if not condition:raise AssertionError(name+': '+str(detail))
    checks.append(name)

def denied(name,result,kind=None):
    status,data=result
    ok(name,400<=status<500 and (kind is None or data.get('exc_type')==kind),(status,data.get('exc_type')))

def captcha():
    return bench("from vorq.auth_flow import _put,_digest\nimport secrets,time\ntoken=secrets.token_urlsafe(32);answer=secrets.token_hex(3).upper()\n_put('captcha',token,{'digest':_digest(answer),'expires':time.time()+120},120)\nprint(json.dumps({'captcha_id':token,'captcha_answer':answer}))")

def totp(secret):
    digest=hmac.new(base64.b32decode(secret),struct.pack('>Q',int(time.time()//30)),hashlib.sha1).digest();offset=digest[-1]&15
    return str((struct.unpack('>I',digest[offset:offset+4])[0]&0x7fffffff)%1000000).zfill(6)

stamp=secrets.token_hex(5)
email='vorq-http-qa-'+stamp+'@example.invalid'
password=secrets.token_urlsafe(32)
project=None
summary={}
successful=False
try:
    args=dict(full_name='VORQ HTTP QA',username='qa-http-'+stamp,email=email,password=password,requested_role='Project Manager',company_name='VORQ QA',role_details={'experience':'2','project_reference':'VORQ QA'})
    # Derive exact registration detail keys from the published challenge contract.
    status,challenge=call('auth_challenge')
    ok('web_proxy_captcha',status==200 and challenge['message']['image'].startswith('data:image/png;base64,'))
    fields=bench("from vorq.auth_policy import ROLES\nprint(json.dumps(ROLES['Project Manager']))")
    args['role_details']={key:'2' if key=='experience' else 'VORQ QA detail' for key,_ in fields}
    status,pending=call('auth_signup',{**args,**captcha()})
    ok('http_signup_pending_mfa',status==200 and pending['message']['stage']=='enroll',(status,pending.get('exc_type')))
    pending=pending['message']
    denied('no_session_before_mfa',call('session'))
    status,signed=call('auth_finish',{'challenge_token':pending['challenge'],'code':totp(pending['setup_key'])})
    ok('http_totp_authentication',status==200 and signed['message']['authenticated'])
    status,session=call('session');csrf=session['message']['csrf_token']
    ok('no_access_from_requested_role',session['message']['companies']==[])
    fixture=bench(f"""email={email!r}
assert email.startswith('vorq-http-qa-') and email.endswith('@example.invalid')
user=frappe.get_doc('User',email);user.user_type='System User';user.append('roles',{{'role':'BuildSuite PM'}});user.append('roles',{{'role':'Accounts User'}});user.save(ignore_permissions=True)
project=frappe.get_doc({{'doctype':'Project','project_name':'VORQ HTTP QA {stamp}','company':'VORQ Development','status':'Open'}})
team=next(f.fieldname for f in project.meta.get_table_fields() if f.options=='Project Team')
project.append(team,{{'user':email}});project.insert()
frappe.get_doc({{'doctype':'VORQ Company Member','user':email,'company':'VORQ Development','role':'Project Manager'}}).insert()
frappe.get_doc({{'doctype':'VORQ Project Member','user':email,'project':project.name}}).insert()
frappe.clear_cache(user=email);frappe.db.commit()
print(json.dumps({{'project':project.name}}))""")
    project=fixture['project']
    # Frappe revokes sessions when administrator provisioning changes user type/roles.
    # Sign in again using the normal password + one-use recovery-code protocol.
    jar.clear();csrf=''
    status,login=call('auth_start',{'usr':email,'pwd':password,**captcha()})
    ok('login_after_provisioning',status==200 and login['message']['stage']=='totp',(status,login.get('exc_type')))
    status,verified=call('auth_finish',{'challenge_token':login['message']['challenge'],'code':signed['message']['recovery_codes'][0]})
    ok('mfa_after_provisioning',status==200 and verified['message']['authenticated'])
    status,session=call('session');csrf=session['message']['csrf_token']
    status,workspace=call('workspace?'+urllib.parse.urlencode({'company':'VORQ Development'}))
    ok('ordinary_pm_workspace',status==200 and [p['name'] for p in workspace['message']['projects']]==[project],(status,workspace.get('exc_type')))
    ok('finance_hidden_from_pm',not {'payments','sales-invoices','purchase-invoices','expenses'} & {m['id'] for m in workspace['message']['modules']})
    denied('cross_company_denied',call('workspace?company=VORQ%20QA%20Foreign'),'PermissionError')
    denied('cross_project_denied',call('overview?'+urllib.parse.urlencode({'company':'VORQ Development','project':'PROJ-0003'})),'PermissionError')
    for doctype in ['Sales Invoice','Purchase Invoice','Account']:
        denied('financial_lookup_denied_'+doctype,call('lookup?'+urllib.parse.urlencode({'doctype':doctype,'company':'VORQ Development','project':project})),'PermissionError')
    denied('raw_erp_resource_denied',request('/api/resource/User'),'PermissionError')
    denied('internal_service_http_denied',request('/api/method/vorq.application.records.records?company=VORQ%20Development&module=projects'),'PermissionError')
    denied('public_cmd_override_denied',call('auth_challenge?cmd=frappe.client.get_list'),'PermissionError')
    denied('get_on_post_endpoint_denied',call('save?module=site-reports&company=VORQ%20Development&project='+project))
    values={'report_date':time.strftime('%Y-%m-%d'),'progress_notes':'VORQ HTTP QA report '+stamp}
    payload=dict(module='site-reports',company='VORQ Development',project=project,values=values,idempotency_key='http-qa-save-'+stamp)
    denied('missing_csrf_denied',call('save',payload,token=False),'CSRFTokenError')
    status,created=call('save',payload)
    ok('authorized_draft_save',status==200,(status,created.get('exc_type')))
    name=created['message']['name']
    status,replay=call('save',payload)
    ok('sequential_retry_replays',status==200 and replay['message']['replayed'] and replay['message']['name']==name)
    denied('idempotency_payload_conflict_denied',call('save',{**payload,'values':{**values,'progress_notes':'changed'}}),'ValidationError')
    query=urllib.parse.urlencode({'module':'site-reports','company':'VORQ Development','project':project,'name':name})
    status,detail=call('detail?'+query)
    ok('detail_matches_saved_record',status==200 and detail['message']['values']['progress_notes']==values['progress_notes'])
    modified=detail['message']['modified']
    update={**payload,'name':name,'modified':modified,'values':{**values,'progress_notes':'VORQ HTTP QA updated'},'idempotency_key':'http-qa-update-'+stamp}
    status,updated=call('save',update);ok('authorized_update',status==200,(status,updated.get('exc_type')))
    denied('stale_update_rejected',call('save',{**update,'idempotency_key':'http-qa-stale-'+stamp}),'TimestampMismatchError')
    for label,extra in [('company',{'company':'Foreign'}),('status',{'docstatus':1}),('owner',{'owner':'Administrator'})]:
        denied('field_injection_'+label,call('save',{**payload,'values':{**values,**extra},'idempotency_key':'http-qa-inject-'+label+'-'+stamp}),'ValidationError')
    denied('unknown_module_rejected',call('records?'+urllib.parse.urlencode({'module':'User','company':'VORQ Development','project':project})),'ValidationError')
    denied('invalid_pagination_rejected',call('records?'+urllib.parse.urlencode({'module':'projects','company':'VORQ Development','project':project,'start':'bad'})))
    # Two independent cookie clients send the same write simultaneously.
    concurrent_payload={**payload,'values':{**values,'report_date':time.strftime('%Y-%m-%d',time.localtime(time.time()+86400))},'idempotency_key':'http-qa-concurrent-'+stamp}
    def send(_):
        _,opener=make_client(list(jar))
        return call('save',concurrent_payload,opener=opener)
    with ThreadPoolExecutor(max_workers=2) as pool:responses=list(pool.map(send,range(2)))
    ok('concurrent_retry_never_returns_500',all(status in (200,409,417) for status,_ in responses),[(status,data.get('exc_type')) for status,data in responses])
    status,retried=call('save',concurrent_payload)
    ok('concurrent_retry_eventually_replays',status==200 and retried['message']['replayed'])
    dbcheck=bench(f"""import hashlib
project={project!r};email={email!r}
assert project and email.startswith('vorq-http-qa-')
print(json.dumps({{'reports':frappe.db.count('VORQ Site Report',{{'project':project}}),'stale_request_exists':bool(frappe.db.exists('VORQ Request',hashlib.sha256((email+':http-qa-stale-{stamp}').encode()).hexdigest()))}}))""")
    ok('concurrent_write_created_one_record',dbcheck['reports']==2,dbcheck)
    ok('failed_write_rolled_back_request_row',not dbcheck['stale_request_exists'])
    status,_=request('/api/method/logout',{})
    ok('logout_succeeds',status==200)
    denied('logout_revokes_session',call('session'))
    successful=True
finally:
    cleanup=bench(f"""email={email!r}
assert email.startswith('vorq-http-qa-') and email.endswith('@example.invalid')
if frappe.db.exists('User',email):
 frappe.db.set_value('User',email,'enabled',0)
 frappe.db.delete('VORQ Auth Session',{{'user':email}})
 frappe.db.delete('VORQ Company Member',{{'user':email}})
 frappe.db.delete('VORQ Project Member',{{'user':email}})
 frappe.clear_cache(user=email)
 frappe.db.commit()
print(json.dumps({{'test_account_disabled':True,'memberships_revoked':True}}))""")
    summary={'successful':successful,'verified_at':datetime.now(ZoneInfo('Asia/Kolkata')).isoformat(),'checks_passed':checks,'count':len(checks),'project':project,'cleanup':cleanup,'financial_postings':False}
    (ROOT/'modular-http-test-results.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps(summary,indent=2))
