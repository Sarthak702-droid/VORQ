"""Real Frappe/database regression suite. Loaded only by verify_modular_live.py.
All fixtures and business mutations are rolled back; no financial posting occurs.
"""
import json
import secrets
import unittest
from decimal import Decimal
import frappe
from vorq.api import v1
from vorq.application.access import _allowed
from vorq.module_registry import CATALOG, FINANCIAL


class ModularLiveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        frappe.set_user('Administrator')
        cls.stamp = secrets.token_hex(5)
        cls.company = 'VORQ Development'
        cls.foreign_company = 'VORQ QA Isolation ' + cls.stamp
        frappe.get_doc({'doctype':'Company','company_name':cls.foreign_company,'abbr':'Q'+cls.stamp[:4],'country':'India','default_currency':'INR','chart_of_accounts':'Standard'}).insert()
        def project(company, suffix):
            return frappe.get_doc({'doctype':'Project','project_name':'VORQ QA '+cls.stamp+suffix,'company':company,'status':'Open'}).insert().name
        cls.project = project(cls.company, ' assigned')
        cls.other_project = project(cls.company, ' unassigned')
        cls.foreign_project = project(cls.foreign_company, ' foreign')
        cls.user = 'vorq-qa-'+cls.stamp+'@example.invalid'
        user = frappe.get_doc({'doctype':'User','email':cls.user,'first_name':'VORQ QA Synthetic','enabled':1,'user_type':'System User','send_welcome_email':0,'roles':[{'role':r} for r in ['BuildSuite Director','Projects User','Accounts User','Stock User']]})
        user.flags.no_welcome_mail = True
        user.insert(ignore_permissions=True)
        cls.no_upstream_user = 'vorq-qa-limited-'+cls.stamp+'@example.invalid'
        limited=frappe.get_doc({'doctype':'User','email':cls.no_upstream_user,'first_name':'VORQ QA No Upstream Role','send_welcome_email':0,'user_type':'Website User','roles':[]})
        limited.flags.no_welcome_mail=True
        limited.insert(ignore_permissions=True)
        frappe.get_doc({'doctype':'VORQ Company Member','user':cls.no_upstream_user,'company':cls.company,'role':'Owner'}).insert()
        frappe.get_doc({'doctype':'VORQ Project Member','user':cls.no_upstream_user,'project':cls.project}).insert()
        cls.membership = frappe.get_doc({'doctype':'VORQ Company Member','user':cls.user,'company':cls.company,'role':'Site Engineer'}).insert().name
        frappe.get_doc({'doctype':'VORQ Project Member','user':cls.user,'project':cls.project}).insert()
        cls.report = frappe.get_doc({'doctype':'VORQ Site Report','company':cls.company,'project':cls.project,'report_date':frappe.utils.today(),'progress_notes':'VORQ QA owned report'}).insert().name
        cls.other_report = frappe.get_doc({'doctype':'VORQ Site Report','company':cls.company,'project':cls.other_project,'report_date':frappe.utils.today(),'progress_notes':'VORQ QA hidden report'}).insert().name
        cls.boq = v1.save('boqs',cls.company,cls.project,{'title':'VORQ QA BOQ '+cls.stamp,'revision':1},'qa-boq-'+cls.stamp)['name']
        cls.task = frappe.get_doc({'doctype':'Task','subject':'VORQ QA task '+cls.stamp,'company':cls.company,'project':cls.other_project}).insert().name
        cls.base_request_count = frappe.db.count('VORQ Request')

    def setUp(self):
        frappe.set_user('Administrator')
        frappe.db.savepoint('qa_case')

    def tearDown(self):
        frappe.set_user('Administrator')
        frappe.db.rollback(save_point='qa_case')

    def as_role(self, role='Site Engineer'):
        frappe.db.set_value('VORQ Company Member',self.membership,'role',role,update_modified=False)
        frappe.set_user(self.user)

    def save_report(self, **overrides):
        args=dict(module='site-reports',company=self.company,project=self.project,values={'report_date':frappe.utils.add_days(frappe.utils.today(),1),'progress_notes':'VORQ QA save'},idempotency_key='qa-report-'+secrets.token_hex(12))
        args.update(overrides)
        return v1.save(**args)

    def test_ordinary_site_engineer_reads_only_assigned_workspace(self):
        self.as_role()
        result=v1.workspace(self.company)
        self.assertEqual([p.name for p in result['projects']],[self.project])
        self.assertFalse(FINANCIAL & {m['id'] for m in result['modules']})
        self.assertNotIn(self.other_report,[r['name'] for r in v1.records('site-reports',self.company,self.project)['records']])
        self.assertIsNone(v1.overview(self.company,self.project)['financials'])

    def test_company_and_project_isolation(self):
        self.as_role()
        for action in [lambda:v1.workspace(self.foreign_company),lambda:v1.overview(self.company,self.other_project),lambda:v1.overview(self.company,self.foreign_project),lambda:v1.records('site-reports',self.company,self.other_project),lambda:v1.detail('site-reports',self.other_report,self.company,self.project),lambda:self.save_report(project=self.other_project)]:
            with self.assertRaises(frappe.PermissionError):action()

    def test_guest_cannot_read_or_write(self):
        frappe.set_user('Guest')
        for action in [lambda:v1.workspace(self.company),lambda:v1.records('projects',self.company),lambda:self.save_report()]:
            with self.assertRaises(frappe.AuthenticationError):action()

    def test_financial_reads_and_lookup_require_financial_role(self):
        self.as_role()
        for module in FINANCIAL:
            with self.assertRaises(frappe.PermissionError):v1.records(module,self.company,self.project)
        for doctype in ['Account','Sales Invoice','Purchase Invoice']:
            with self.subTest(doctype=doctype):
                with self.assertRaises(frappe.PermissionError):v1.lookup(doctype,self.company,self.project)

    def test_disabled_subcontractor_cannot_use_workspace_lookup_or_overview(self):
        self.as_role('Subcontractor')
        for endpoint,action in [('workspace',lambda:v1.workspace(self.company)),('overview',lambda:v1.overview(self.company,self.project)),('lookup',lambda:v1.lookup('Supplier',self.company,self.project))]:
            with self.subTest(endpoint=endpoint):
                with self.assertRaises(frappe.PermissionError):action()

    def test_all_eight_roles_match_declared_write_contract(self):
        roles=['Owner','Project Manager','Quantity Surveyor','Site Engineer','Storekeeper','Procurement Officer','Accountant','Subcontractor']
        for role in roles:
            self.as_role(role)
            for module,(_,_,writers) in CATALOG.items():
                with self.subTest(role=role,module=module):
                    if role in writers and role != 'Subcontractor':
                        self.assertEqual(_allowed(module,self.company,write=True),role)
                    else:
                        with self.assertRaises(frappe.PermissionError):_allowed(module,self.company,write=True)

    def test_membership_does_not_grant_missing_upstream_create_permission(self):
        frappe.set_user(self.no_upstream_user)
        with self.assertRaises(frappe.PermissionError):self.save_report()
        self.as_role('Owner')
        # Supplier Group is not a VORQ public module, despite upstream roles.
        with self.assertRaises(frappe.ValidationError):v1.save('Supplier Group',self.company,self.project,{},'qa-invalid-module-'+self.stamp)
        self.as_role()
        with self.assertRaises(frappe.PermissionError):v1.save('projects',self.company,self.project,{'project_name':'forbidden'},'qa-forbidden-project-'+self.stamp)

    def test_valid_create_replay_update_and_stale_version(self):
        self.as_role()
        key='qa-idempotency-'+self.stamp
        values={'report_date':frappe.utils.add_days(frappe.utils.today(),1),'progress_notes':'VORQ QA initial'}
        first=self.save_report(values=values,idempotency_key=key)
        replay=self.save_report(values=values,idempotency_key=key)
        self.assertEqual(first['name'],replay['name']);self.assertTrue(replay['replayed'])
        with self.assertRaises(frappe.ValidationError):self.save_report(values={**values,'progress_notes':'different'},idempotency_key=key)
        detail=v1.detail('site-reports',first['name'],self.company,self.project)
        updated=self.save_report(name=first['name'],modified=str(detail['modified']),values={**values,'progress_notes':'updated'})
        self.assertEqual(updated['name'],first['name'])
        self.assertEqual(v1.detail('site-reports',first['name'],self.company,self.project)['values']['progress_notes'],'updated')
        with self.assertRaises(frappe.TimestampMismatchError):self.save_report(name=first['name'],modified='2000-01-01 00:00:00',values=values)

    def test_unsupported_fields_and_child_injection_rejected(self):
        self.as_role('Owner')
        for values in [[],{'owner':'Administrator'},{'company':self.foreign_company},{'project':self.other_project},{'docstatus':1}]:
            with self.subTest(values=values):
                with self.assertRaises(frappe.ValidationError):self.save_report(values=values)
        for lines in [[{'item_code':'x','project':self.other_project}],[{'doctype':'User'}],[{}]*501,'invalid']:
            with self.subTest(lines_type=type(lines).__name__):
                with self.assertRaises(frappe.ValidationError):v1.save('purchase-orders',self.company,self.project,{'supplier':'VORQ Test Supplier','items':lines},'qa-child-'+secrets.token_hex(12))

    def test_nonfinite_numeric_input_rejected(self):
        self.as_role('Owner')
        for amount in ['NaN','Infinity','-Infinity','abc']:
            with self.subTest(amount=amount):
                with self.assertRaises(frappe.ValidationError):v1.save('projects',self.company,'',{'project_name':'VORQ QA invalid','estimated_costing':amount},'qa-numeric-'+secrets.token_hex(12))

    def test_invalid_pagination_and_module_types_return_validation_errors(self):
        self.as_role()
        for start in ['bad', None, [], float('inf')]:
            with self.subTest(start=str(start)):
                with self.assertRaises(frappe.ValidationError):v1.records('projects',self.company,self.project,start=start)
        for module in [[], {}, None, 7]:
            with self.subTest(module=module):
                with self.assertRaises(frappe.ValidationError):v1.records(module,self.company,self.project)

    def test_invalid_idempotency_keys_rejected(self):
        self.as_role()
        for key in [None,'short','a'*129,42]:
            with self.subTest(key=key):
                with self.assertRaises(frappe.ValidationError):self.save_report(idempotency_key=key)

    def test_cross_project_link_rejected(self):
        self.as_role('Owner')
        with self.assertRaises(frappe.PermissionError):v1.save('labour',self.company,self.project,{'task':self.task,'attendance_date':frappe.utils.today()},'qa-linked-task-'+self.stamp)

    def test_unassigned_boq_and_unknown_lookup_do_not_leak(self):
        self.as_role()
        with self.assertRaises(frappe.PermissionError):v1.lookup('Task',self.company,self.other_project)
        with self.assertRaises(frappe.PermissionError):v1.lookup('User',self.company,self.project)
        self.assertNotIn(self.task,v1.lookup('Task',self.company,self.project))

    def test_boq_lifecycle_guards_and_stale_approval(self):
        self.as_role('Quantity Surveyor')
        doc=frappe.get_doc('BOQ',self.boq)
        with self.assertRaises(frappe.TimestampMismatchError):v1.transition('boqs',self.company,self.project,self.boq,'Submit','2000-01-01','qa-stale-boq-'+self.stamp)
        with self.assertRaises(frappe.ValidationError):v1.transition('boqs',self.company,self.project,self.boq,'Unknown',str(doc.modified),'qa-bad-action-'+self.stamp)
        self.as_role('Site Engineer')
        with self.assertRaises(frappe.PermissionError):v1.transition('boqs',self.company,self.project,self.boq,'Approve baseline',str(doc.modified),'qa-denied-approve-'+self.stamp)


def run():
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(ModularLiveTests)
    result=unittest.TextTestRunner(verbosity=2).run(suite)
    frappe.set_user('Administrator')
    frappe.db.rollback()
    assert not frappe.db.exists('User',ModularLiveTests.user), 'Transactional QA user was not rolled back'
    assert not frappe.db.exists('Company',ModularLiveTests.foreign_company), 'Transactional QA company was not rolled back'
    return {'fixtures_rollback_verified':True,'run':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'successful':result.wasSuccessful(),'fixture_policy':'All QA users, memberships and business records rolled back. No financial postings.'}
