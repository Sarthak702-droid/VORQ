import importlib.util
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('auth_policy',ROOT/'backend/auth-upgrade/overlay/auth_policy.py')
policy=importlib.util.module_from_spec(spec);spec.loader.exec_module(policy)
class AuthPolicyTests(unittest.TestCase):
 def valid(self,role='Owner'):
  return dict(full_name='Test Person',username='test.person',email='test@example.invalid',password='a unique example passphrase 2026',requested_role=role,company_name='Test Company',role_details={key:'2' if key=='experience' else 'Test detail' for key,_ in policy.ROLES[role]})
 def test_all_roles_require_their_declared_fields(self):
  for role in policy.ROLES:
   args=self.valid(role);self.assertEqual(policy.clean_registration(**args)['requested_role'],role)
   args['role_details']={}
   with self.assertRaises(ValueError):policy.clean_registration(**args)
 def test_rejects_role_and_detail_injection(self):
  args=self.valid();args['requested_role']='System Manager'
  with self.assertRaises(ValueError):policy.clean_registration(**args)
  args=self.valid();args['role_details']['roles']=['System Manager']
  with self.assertRaises(ValueError):policy.clean_registration(**args)
 def test_username_and_password_bounds(self):
  for username in ['ab','<script>','with spaces','1notallowed','a'*41]:
   args=self.valid();args['username']=username
   with self.assertRaises(ValueError):policy.clean_registration(**args)
  args=self.valid();args['password']='short'
  with self.assertRaises(ValueError):policy.clean_registration(**args)
if __name__=='__main__':unittest.main()
