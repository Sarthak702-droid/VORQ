"""Run real database permission and mutation regressions on the local dev site."""
from pathlib import Path
import json
import subprocess
import sys

# Fixture setup touches shared Frappe metadata: serialize local live suites.
import fcntl
qa_lock=open('/tmp/vorq-local-live-tests.lock','a')
fcntl.flock(qa_lock,fcntl.LOCK_EX)

ROOT=Path(__file__).resolve().parents[1]
workspace=ROOT/'integration-workspace'
compose=['docker','compose','--env-file','deployment/.env','-f','deployment/compose.yaml']
source=(ROOT/'tests/live_modular_cases.py').read_text()
bootstrap="import os\nos.chdir('/home/frappe/frappe-bench/sites')\nimport frappe\nfrappe.init(site='frontend');frappe.connect()\nassert frappe.local.site == 'frontend'\n"
script=bootstrap+source+"\ntry:\n result=run()\n print('VORQ_QA_RESULT='+json.dumps(result))\nfinally:\n frappe.db.rollback()\n frappe.destroy()\n"
result=subprocess.run(compose+['exec','-T','backend','env/bin/python','-'],cwd=workspace,input=script,text=True,capture_output=True)
print(result.stderr)
for line in result.stdout.splitlines():
 if line.startswith('VORQ_QA_RESULT='):
  summary=json.loads(line.split('=',1)[1]);print(json.dumps(summary,indent=2))
  (ROOT/'modular-live-test-results.json').write_text(json.dumps(summary,indent=2)+'\n')
  sys.exit(0 if result.returncode==0 and summary['successful'] else 1)
print(result.stdout[-3000:])
sys.exit(result.returncode or 1)
