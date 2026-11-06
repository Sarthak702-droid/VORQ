"""Apply to the current invoice-compatible integration workspace. Idempotent; no DB access."""
from pathlib import Path
import ast
import shutil
import subprocess
root=Path(__file__).resolve().parents[2]
source=root/'backend/auth-upgrade'
target=root/'integration-workspace/apps/vorq/vorq'
assert target.is_dir(), 'The existing VORQ integration workspace is required.'
patch=source/'integration.patch'
args=['patch','--batch','--forward','-p1','-i',str(patch)]
# The modular source already includes the security upgrade. Check its stable
# boundary instead of applying a historical line patch to refactored handlers.
if (target/'module_registry.py').exists():
 tree=ast.parse((target/'api/v1.py').read_text())
 functions={n.name:n for n in tree.body if isinstance(n,ast.FunctionDef)}
 expected={'auth_challenge':'GET','auth_start':'POST','auth_signup':'POST','auth_finish':'POST'}
 for name,method in expected.items():
  node=functions.get(name)
  assert node and any(isinstance(d,ast.Call) and any(k.arg=='allow_guest' and isinstance(k.value,ast.Constant) and k.value.value is True for k in d.keywords) and any(k.arg=='methods' and ast.literal_eval(k.value)==[method] for k in d.keywords) for d in node.decorator_list), 'Authentication facade differs; manual review required.'
 session=ast.get_source_segment((target/'api/v1.py').read_text(),functions['session'])
 assert 'require_assurance()' in session, 'Session assurance missing.'
 permissions=(target/'permissions.py').read_text()
 assert permissions.count('require_assurance()')>=2 and 'Unsupported authentication route.' in permissions, 'API assurance missing.'
 hooks=(target/'hooks.py').read_text()
 for hook in ('block_legacy_login','revoke_session','prepare_schema','cleanup_sessions'):
  assert 'vorq.auth_flow.'+hook in hooks, 'Authentication hook missing.'
else:
 check=subprocess.run(args+['--dry-run'],cwd=target,capture_output=True)
 if check.returncode==0:
  subprocess.run(args,cwd=target,check=True)
 else:
  reverse=subprocess.run(['patch','--batch','--reverse','-p1','-i',str(patch),'--dry-run'],cwd=target,capture_output=True)
  if reverse.returncode!=0: raise SystemExit('Backend baseline differs. Review integration.patch before applying; no existing source files were changed.')
for item in (source/'overlay').rglob('*'):
 if item.is_file() and '__pycache__' not in item.parts:
  destination=target/item.relative_to(source/'overlay');destination.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(item,destination)
print('Auth source overlay applied. Rebuild the image and run the site migration before restarting the API.')
