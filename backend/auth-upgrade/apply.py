"""Apply to the current invoice-compatible integration workspace. Idempotent; no DB access."""
from pathlib import Path
import shutil
import subprocess
root=Path(__file__).resolve().parents[2]
source=root/'backend/auth-upgrade'
target=root/'integration-workspace/apps/vorq/vorq'
assert target.is_dir(), 'The existing VORQ integration workspace is required.'
patch=source/'integration.patch'
args=['patch','--batch','--forward','-p1','-i',str(patch)]
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
