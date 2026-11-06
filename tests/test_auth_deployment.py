"""Regression for the observed patch auto-reversal bug; isolated temporary source tree."""
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class DeploymentTests(unittest.TestCase):
 def test_repeated_apply_cannot_reverse_an_applied_security_patch(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);source=root/'backend/auth-upgrade';target=root/'integration-workspace/apps/vorq/vorq'
   source.mkdir(parents=True);target.mkdir(parents=True);(source/'overlay').mkdir()
   shutil.copy2(ROOT/'backend/auth-upgrade/apply.py',source/'apply.py')
   (target/'permissions.py').write_text('mfa = False\n')
   (source/'integration.patch').write_text('--- a/permissions.py\n+++ b/permissions.py\n@@ -1 +1 @@\n-mfa = False\n+mfa = True\n')
   (source/'overlay/auth_flow.py').write_text('# verified source overlay\n')
   for _ in range(2):
    run=subprocess.run(['python3',str(source/'apply.py')],capture_output=True,text=True)
    self.assertEqual(run.returncode,0,run.stderr)
    self.assertEqual((target/'permissions.py').read_text(),'mfa = True\n')
    self.assertTrue((target/'auth_flow.py').exists())
 def modular_fixture(self, directory):
  root=Path(directory);source=root/'backend/auth-upgrade';target=root/'integration-workspace/apps/vorq/vorq'
  shutil.copytree(ROOT/'backend/auth-upgrade',source,ignore=shutil.ignore_patterns('__pycache__'))
  shutil.copytree(ROOT/'integration-workspace/apps/vorq/vorq',target,ignore=shutil.ignore_patterns('__pycache__'))
  return source,target
 def test_repeated_apply_supports_modular_source_without_rewriting_facade(self):
  with tempfile.TemporaryDirectory() as directory:
   source,target=self.modular_fixture(directory)
   facade=(target/'api/v1.py').read_text()
   for _ in range(2):
    run=subprocess.run(['python3',str(source/'apply.py')],capture_output=True,text=True)
    self.assertEqual(run.returncode,0,run.stderr)
    self.assertEqual((target/'api/v1.py').read_text(),facade)
 def test_modular_apply_rejects_missing_assurance_before_copying_overlay(self):
  with tempfile.TemporaryDirectory() as directory:
   source,target=self.modular_fixture(directory)
   facade=target/'api/v1.py'
   facade.write_text(facade.read_text().replace('    require_assurance()','    pass'))
   (source/'overlay/auth_flow.py').write_text('# must not be copied')
   before=(target/'auth_flow.py').read_text()
   run=subprocess.run(['python3',str(source/'apply.py')],capture_output=True,text=True)
   self.assertNotEqual(run.returncode,0)
   self.assertIn('Session assurance missing',run.stderr)
   self.assertEqual((target/'auth_flow.py').read_text(),before)
if __name__=='__main__':unittest.main()
