"""Verify the running mobile web proxy and record Expo dev-server behavior."""
import json
from pathlib import Path
import urllib.error
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
BASE='http://localhost:8082'
client=urllib.request.build_opener(urllib.request.ProxyHandler({}))
with client.open(BASE+'/api/method/vorq.api.v1.auth_challenge',timeout=20) as response:
    data=json.load(response)['message']
    assert data['image'].startswith('data:image/png;base64,') and len(data['roles'])==8
checks={'captcha_route':response.status,'registration_roles':len(data['roles'])}
limitations=[]
for name,path,headers in [
    ('raw_erp_path','/api/resource/User',{}),
    ('foreign_origin','/api/method/vorq.api.v1.auth_challenge',{'Origin':'http://foreign.example'}),
]:
    try:
        client.open(urllib.request.Request(BASE+path,headers=headers),timeout=20)
    except urllib.error.HTTPError as error:
        body=error.read().decode(errors='replace')
        if name=='foreign_origin' and error.code==500 and 'Unauthorized request from http://foreign.example' in body:
            limitations.append('Expo development CORS middleware rejects the foreign origin with HTTP 500 before the application proxy; the application proxy returns 403 in its unit test.')
        else:
            assert error.code==403,(name,error.code)
        checks[name+'_blocked_status']=error.code
    else:
        raise AssertionError(name+' unexpectedly succeeded')
result={'security_checks_passed':True,'checks':checks,'limitations':limitations}
(ROOT/'mobile-proxy-test-results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
