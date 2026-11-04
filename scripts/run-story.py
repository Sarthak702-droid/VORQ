#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys
root=Path(__file__).resolve().parents[1]
result=subprocess.run(['docker','compose','--env-file','deployment/.env','-f','deployment/compose.yaml','exec','-T','backend','bench','--site','frontend','execute','vorq.smoke.run'],cwd=root,capture_output=True,text=True)
output=result.stdout+result.stderr
(root/'.test-output').mkdir(exist_ok=True)
(root/'.test-output/story.log').write_text(output)
if result.returncode:
    lines=output.splitlines()
    print('\n'.join(l for l in lines if l.startswith(('frappe.exceptions.', 'TypeError:', 'AssertionError:', 'AttributeError:','pymysql.'))))
    print('Full log: .test-output/story.log')
else:
    print("\n".join(line for line in output.splitlines() if line.startswith('{"company"'))[-4000:])
sys.exit(result.returncode)
